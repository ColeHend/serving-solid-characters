import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AiSettings } from "../../models/userSettings";

/**
 * MADS enrichment surface (driven through the public send() entry point): after the command pass, a
 * mechanical feature that got no command is listed on the preview's `inertFeatures` (the "no sheet
 * effect" warning), and the user-initiated regenerateCommands() re-runs the focused per-feature pass
 * to fill exactly those gaps — without a chat turn or repair budget.
 *
 * The provider mock routes by turn shape: the main homebrew turn (create_* among many tools) emits the
 * race; the MADS turns run in structured mode (no tools, responseSchema set) and are told apart by the
 * per-feature marker text ("ONE feature") in the user message.
 */

const h = vi.hoisted(() => ({
    settings: {} as { ai: AiSettings; dndSystem: string },
    counts: {} as Record<string, number>,
    /** When set, MADS turns await this before replying — lets a test observe the mid-enrichment state. */
    gate: null as Promise<void> | null,
}));

const raceInput = {
    name: "Emberkin",
    description: "A folk of banked coals and drifting sparks.",
    size: "Medium",
    speed: 30,
    traits: [
        { name: "Ember Body", description: "You have resistance to fire damage." },
        { name: "Sure Step", description: "Your walking speed increases by 10 feet." },
    ],
};

// Concept brief for the medium-depth mini-pipeline (concept → creation) route.
const briefInput = {
    concept: "A folk of banked coals", tone: "warm", power_tier: "on par with official races",
    motifs: ["banked coal", "drifting spark"], themes: ["endurance"], naming_style: "ember words",
    fits_concept: "Coals that endure.",
};

// Whole-entity MADS reply: covers Ember Body, deliberately leaves the (mechanical) Sure Step without a
// command so it surfaces as inert. The per-feature replies are routed by which feature the turn shows.
const wholeEntityMads =
    '{"features":[{"name":"Ember Body","commands":[{"type":"Add","category":"Resistances","value":{"damageType":"Fire"}}]}]}';
const singleFeatureMads =
    '{"features":[{"name":"Sure Step","commands":[{"type":"Add","category":"Speed","value":{"speed":"10"}}]}]}';
const emberSingleMads =
    '{"features":[{"name":"Ember Body","commands":[{"type":"Add","category":"Resistances","value":{"damageType":"Fire"}}]}]}';

const toolCallEvents = (name: string, input: unknown) => [
    { type: "tool_call_start", index: 0, id: name, name },
    { type: "tool_call_delta", index: 0, argsDelta: JSON.stringify(input) },
    { type: "tool_call_done", index: 0 },
    { type: "message_done", stopReason: "tool_use" },
];
const textEvents = (text: string) => [
    { type: "text_delta", text },
    { type: "message_done", stopReason: "end_turn" },
];

vi.mock("./userSettings", () => ({
    default: () => [() => h.settings, () => {}],
    getUserSettings: () => [() => h.settings, () => {}],
    saveUserSettings: () => {},
}));
vi.mock("../ai/providers/providerFactory", () => ({
    buildProvider: () => ({
        kind: "local",
        async *streamChat(messages: { text?: string }[], tools: { name: string }[] | undefined, opts: Record<string, unknown>) {
            const names = (tools ?? []).map(t => t.name);
            const bump = (t: string) => { h.counts[t] = (h.counts[t] ?? 0) + 1; };
            let events;
            if (names.includes("concept_brief")) { bump("concept_brief"); events = toolCallEvents("concept_brief", briefInput); }
            else if (names.includes("create_race")) { bump("create_race"); events = toolCallEvents("create_race", raceInput); }
            else if (opts.responseSchema) {
                // A structured MADS turn: whole-entity vs a focused per-feature pass (routed by the
                // feature the turn actually shows). Gated when a test wants to observe mid-enrichment.
                if (h.gate) await h.gate;
                const single = messages.some(m => m.text?.includes("ONE feature"));
                if (!single) { bump("mads_whole"); events = textEvents(wholeEntityMads); }
                else if (messages.some(m => m.text?.includes("Ember Body"))) { bump("mads_single_ember"); events = textEvents(emberSingleMads); }
                else { bump("mads_single"); events = textEvents(singleFeatureMads); }
            }
            else events = [{ type: "message_done", stopReason: "end_turn" }];
            for (const e of events) yield e;
        },
    }),
}));
vi.mock("../ai/prompt/generateTitle", () => ({ generateConversationTitle: async () => null }));
vi.mock("./reviewAgentManager", () => ({ ensureReviewAgentsLoaded: async () => {}, reviewAgents: () => [] }));
vi.mock("./utility/localDB/chatHistoryDB", () => ({
    default: {
        conversations: {
            put: async () => {}, get: async () => undefined, delete: async () => {}, clear: async () => {},
            orderBy: () => ({ reverse: () => ({ toArray: async () => [] }) }),
        },
    },
}));
vi.mock("./homebrewManager", () => ({
    homebrewManager: {
        spells: () => [], items: () => [], magicItems: () => [], feats: () => [], backgrounds: () => [],
        races: () => [], classes: () => [], subclasses: () => [], findSubclass: () => undefined,
    },
}));
vi.mock("./dndInfo/info/all/spells", () => ({ useDnDSpells: () => () => [] }));
vi.mock("./dndInfo/info/all/items", () => ({ useDnDItems: () => () => [] }));
vi.mock("./dndInfo/info/all/feats", () => ({ useDnDFeats: () => () => [] }));
vi.mock("./dndInfo/useDndFeatures", () => ({ useDndFeature: () => ({ allFeatures: () => [] }) }));

import { aiAssistant } from "./aiAssistant";
import { featuresOf } from "../ai/commands/commandAgent";
import { PipelinePhase } from "../ai/genPipeline/types";

const baseAi: AiSettings = { provider: "local", model: "m", localBaseUrl: "x", enabled: true, commandGeneration: true };

async function waitFor(cond: () => boolean, attempts = 4000): Promise<void> {
    for (let i = 0; i < attempts && !cond(); i++) await new Promise(r => setTimeout(r, 0));
    if (!cond()) throw new Error("waitFor: condition never met");
}

beforeEach(() => {
    h.settings = { ai: { ...baseAi }, dndSystem: "both" };
    h.counts = {};
    h.gate = null;
    aiAssistant.newConversation();
    aiAssistant.setMode("homebrew");
});

describe("MADS enrichment — inert-feature surface & user repair", () => {
    it("lists command-less mechanical features on inertFeatures after enrichment", async () => {
        aiAssistant.send("make an ember race");

        await waitFor(() => (aiAssistant.pendingPreviews()[0]?.inertFeatures ?? []).length > 0);
        const p = aiAssistant.pendingPreviews()[0];
        expect(p.kind).toBe("race");
        expect(p.enriching).toBeFalsy();
        // Ember Body got its command; the (mechanical) Sure Step didn't → flagged, only it.
        const ember = featuresOf("race", p.entity).find(f => f.name === "Ember Body");
        expect(ember?.metadata?.mads?.map(m => m.command)).toEqual(["AddResistances"]);
        expect(p.inertFeatures).toEqual(["Sure Step"]);
        expect(h.counts.mads_whole).toBe(1);
        expect(h.counts.mads_single).toBeUndefined();   // Low depth: no gap-fill turns
    });

    it("regenerateCommands fills the flagged gap via the per-feature pass and clears the warning", async () => {
        aiAssistant.send("make an ember race");
        await waitFor(() => (aiAssistant.pendingPreviews()[0]?.inertFeatures ?? []).length > 0);

        const previewId = aiAssistant.pendingPreviews()[0].previewId;
        await aiAssistant.regenerateCommands(previewId);

        const p = aiAssistant.pendingPreviews()[0];
        expect(h.counts.mads_single).toBe(1);   // exactly one focused turn (one inert feature)
        const step = featuresOf("race", p.entity).find(f => f.name === "Sure Step");
        expect(step?.metadata?.mads?.map(m => m.command)).toEqual(["AddSpeed"]);
        expect(p.inertFeatures).toEqual([]);
        expect(p.enriching).toBeFalsy();
    });
});

describe("Pipeline hand-off — cards held back until the MADS phase finishes (medium depth)", () => {
    it("defers the preview while commands generate (MadsReview status showing), then surfaces it enriched", async () => {
        let release!: () => void;
        h.gate = new Promise<void>(r => { release = r; });
        h.settings.ai.creationPipelineLevel = "medium";

        aiAssistant.send("make an ember race");

        // The mini-pipeline finished (concept → creation) and recorded the card, but the gated MADS turn
        // is still running: the card is held back and the progress card carries the status line.
        await waitFor(() => aiAssistant.pendingPreviews().length > 0);
        expect(aiAssistant.pendingPreviews()[0].deferred).toBe(true);
        await waitFor(() => aiAssistant.pipelineRun()?.phase === PipelinePhase.MadsReview);
        expect(aiAssistant.pipelineRun()?.note).toMatch(/mechanics/i);

        release();
        await waitFor(() => aiAssistant.pendingPreviews()[0]?.deferred === false);

        // Hand-off: the progress card is gone and the surfaced card is already fully enriched — at medium
        // depth the per-feature pass covered BOTH mechanical traits, so nothing is inert.
        expect(aiAssistant.pipelineRun()).toBeNull();
        const p = aiAssistant.pendingPreviews()[0];
        const feats = featuresOf("race", p.entity);
        expect(feats.find(f => f.name === "Ember Body")?.metadata?.mads?.map(m => m.command)).toEqual(["AddResistances"]);
        expect(feats.find(f => f.name === "Sure Step")?.metadata?.mads?.map(m => m.command)).toEqual(["AddSpeed"]);
        expect(p.inertFeatures).toEqual([]);
        expect(h.counts.concept_brief).toBe(1);
        expect(h.counts.mads_whole).toBeUndefined();   // medium: per-feature primary, no whole-entity pass
    });
});
