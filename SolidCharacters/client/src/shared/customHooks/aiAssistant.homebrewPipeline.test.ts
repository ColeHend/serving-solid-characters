import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AiSettings } from "../../models/userSettings";

/**
 * Generation-depth routing (driven through the public send() entry point): at depth ≥ Medium a one-shot
 * create_* call is upgraded to the concept → creation mini-pipeline (so the model is asked for a
 * concept_brief and then re-builds the entity); at Low it still one-shots (regression). The model steps are
 * scripted through the same mocked provider as the other aiAssistant tests, routed by which tool each turn
 * is forced to call. Per-tool call counts on the hoisted handle distinguish the two paths.
 */

const h = vi.hoisted(() => ({ settings: {} as { ai: AiSettings; dndSystem: string }, counts: {} as Record<string, number> }));

const briefInput = {
    concept: "A mote of captured ember", tone: "warm, quick", power_tier: "on par with Fire Bolt",
    motifs: ["drifting ember", "scorched air"], themes: ["spark"], naming_style: "fire words",
    fits_concept: "A small dart of fire.",
};
const spellInput = {
    name: "Emberlet", description: "You hurl a mote of fire at a creature within range, dealing 1d6 fire damage on a hit.",
    level: 0, school: "Evocation", castingTime: "1 action", range: "60 feet", duration: "Instantaneous",
    concentration: false, ritual: false, isVerbal: true, isSomatic: true, isMaterial: false, fits_concept: "ember dart",
};

const toolCallEvents = (name: string, input: unknown) => [
    { type: "tool_call_start", index: 0, id: name, name },
    { type: "tool_call_delta", index: 0, argsDelta: JSON.stringify(input) },
    { type: "tool_call_done", index: 0 },
    { type: "message_done", stopReason: "tool_use" },
];

vi.mock("./userSettings", () => ({
    default: () => [() => h.settings, () => {}],
    getUserSettings: () => [() => h.settings, () => {}],
    saveUserSettings: () => {},
}));
vi.mock("../ai/providers/providerFactory", () => ({
    buildProvider: () => ({
        kind: "local",
        async *streamChat(_messages: unknown, tools: { name: string }[] | undefined) {
            const names = (tools ?? []).map(t => t.name);
            const bump = (t: string) => { h.counts[t] = (h.counts[t] ?? 0) + 1; };
            let events;
            if (names.includes("concept_brief")) { bump("concept_brief"); events = toolCallEvents("concept_brief", briefInput); }
            // The creation step forces ONLY create_spell; the main turn carries create_spell among many tools.
            else if (names.includes("create_spell")) { bump("create_spell"); events = toolCallEvents("create_spell", spellInput); }
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

import { aiAssistant } from "./aiAssistant";

const baseAi: AiSettings = { provider: "local", model: "m", localBaseUrl: "x", enabled: true, commandGeneration: false };

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

describe("Generation depth — homebrew mini-pipeline routing", () => {
    it("Medium upgrades a create_spell into a concept → creation mini-pipeline", async () => {
        h.settings.ai.creationPipelineLevel = "medium";
        aiAssistant.send("make a fire spell");

        await waitFor(() => aiAssistant.pendingPreviews().length > 0);
        const previews = aiAssistant.pendingPreviews();
        expect(previews).toHaveLength(1);
        expect(previews[0].kind).toBe("spell");
        expect(previews[0].valid).toBe(true);
        // The mini-pipeline ran a concept step, then re-built the spell — so create_spell was called twice.
        expect(h.counts.concept_brief).toBe(1);
        expect(h.counts.create_spell).toBe(2);
        expect(aiAssistant.pipelineRun()).toBeNull();   // handed off to the preview card
    });

    it("Low one-shots a create_spell (no concept step) — regression", async () => {
        h.settings.ai.creationPipelineLevel = "low";
        aiAssistant.send("make a fire spell");

        await waitFor(() => aiAssistant.pendingPreviews().length > 0);
        const previews = aiAssistant.pendingPreviews();
        expect(previews).toHaveLength(1);
        expect(previews[0].kind).toBe("spell");
        expect(previews[0].valid).toBe(true);
        expect(h.counts.concept_brief).toBeUndefined();   // no concept step
        expect(h.counts.create_spell).toBe(1);            // one-shot
    });
});
