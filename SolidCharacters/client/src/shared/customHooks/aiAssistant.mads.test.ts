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

// Whole-entity MADS reply: covers Ember Body, deliberately leaves the (mechanical) Sure Step without a
// command so it surfaces as inert. The per-feature repair reply then fills exactly that gap.
const wholeEntityMads =
    '{"features":[{"name":"Ember Body","commands":[{"type":"Add","category":"Resistances","value":{"damageType":"Fire"}}]}]}';
const singleFeatureMads =
    '{"features":[{"name":"Sure Step","commands":[{"type":"Add","category":"Speed","value":{"speed":"10"}}]}]}';

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
            if (names.includes("create_race")) { bump("create_race"); events = toolCallEvents("create_race", raceInput); }
            else if (opts.responseSchema) {
                // A structured MADS turn: whole-entity vs the focused per-feature repair pass.
                const single = messages.some(m => m.text?.includes("ONE feature"));
                bump(single ? "mads_single" : "mads_whole");
                events = textEvents(single ? singleFeatureMads : wholeEntityMads);
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

const baseAi: AiSettings = { provider: "local", model: "m", localBaseUrl: "x", enabled: true, commandGeneration: true };

async function waitFor(cond: () => boolean, attempts = 4000): Promise<void> {
    for (let i = 0; i < attempts && !cond(); i++) await new Promise(r => setTimeout(r, 0));
    if (!cond()) throw new Error("waitFor: condition never met");
}

beforeEach(() => {
    h.settings = { ai: { ...baseAi }, dndSystem: "both" };
    h.counts = {};
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
