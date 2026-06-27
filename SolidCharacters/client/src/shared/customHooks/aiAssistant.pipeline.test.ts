import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AiSettings } from "../../models/userSettings";
import type { Class5E } from "../../models/generated";

/**
 * M1 + M2 acceptance (plan §13): driven through the public send() entry point, a `generate_class` tool call
 * starts the staged-generation pipeline, which walks brief → skeleton → (ratify) → chassis → features →
 * subclasses → assemble and surfaces savable previews (the class plus one per subclass) — an end-to-end
 * class build with a working ratification gate. The model steps are scripted through the same mocked
 * provider as the orchestration test (routed by which tool each turn is forced to call), so no real model/DB
 * is involved. The loop steps (class_feature, subclass_brief) get DISTINCT input per call so the duplicate
 * gates pass and the loops accumulate.
 */

const h = vi.hoisted(() => ({ settings: {} as { ai: AiSettings; dndSystem: string }, counts: {} as Record<string, number> }));

const briefInput = {
    concept: "A knight who borrows strength from a bound storm", tone: "grim, martial",
    power_tier: "on par with the Fighter", motifs: ["chained lightning", "iron gauntlet"],
    themes: ["debt"], naming_style: "weather + martial terms", fits_concept: "A storm bound in armour.",
};
const skeletonInput = {
    name: "Stormwarden", primary_ability: "STR", hit_die: "d10",
    core_mechanic: "Builds Charge by taking or dealing damage, spent on thunderous strikes.",
    caster_type: "none", subclass_count: 3, subclass_level: 3, fits_concept: "Charge fuels the storm.",
};
const chassisInput = {
    saving_throws: ["STR", "CON"], skills: ["Athletics", "Intimidation", "Perception"],
    armor: ["Light armor", "Medium armor", "Shields"], weapons: ["Simple weapons", "Martial weapons"], tools: [],
    starting_equipment: ["A martial weapon", "Leather armor"],
    features: [{ level: 1, name: "Storm's Charge", description: "Gain 1 Charge when you take damage; spend on a hit for +1d6 thunder." }],
    fits_concept: "The chassis carries the charge.",
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
// Route the scripted provider by which tool the turn is forced to call: the step workers each pass a
// single step tool; the main turn carries generate_class among the create_* tools.
// Distinct content per loop call (a per-tool counter on the hoisted handle, reset each test) so the
// duplicate-name gates pass and the feature/subclass loops actually accumulate.
const nextFeature = () => {
    const n = (h.counts.class_feature = (h.counts.class_feature ?? 0) + 1);
    return { name: `Feature ${n}`, description: `Rules text for feature ${n} with concrete numbers and scaling.`, fits_concept: "extends the charge" };
};
const nextSubclassBrief = () => {
    const n = (h.counts.subclass_brief = (h.counts.subclass_brief ?? 0) + 1);
    return { name: `Tempest ${n}`, brief: `A distinct subclass variation ${n} on the core charge mechanic.`, fits_concept: "varies the charge" };
};

vi.mock("../ai/providers/providerFactory", () => ({
    buildProvider: () => ({
        kind: "local",
        async *streamChat(_messages: unknown, tools: { name: string }[] | undefined) {
            const names = (tools ?? []).map(t => t.name);
            const events =
                names.includes("concept_brief") ? toolCallEvents("concept_brief", briefInput)
                    : names.includes("skeleton_plan") ? toolCallEvents("skeleton_plan", skeletonInput)
                        : names.includes("class_chassis") ? toolCallEvents("class_chassis", chassisInput)
                            : names.includes("class_feature") ? toolCallEvents("class_feature", nextFeature())
                                : names.includes("subclass_brief") ? toolCallEvents("subclass_brief", nextSubclassBrief())
                                    : names.includes("generate_class") ? toolCallEvents("generate_class", { concept: "a storm knight" })
                                        : [{ type: "message_done", stopReason: "end_turn" }];
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
        addClass: async () => {},
    },
}));

import { aiAssistant } from "./aiAssistant";

const baseAi: AiSettings = { provider: "local", model: "m", localBaseUrl: "x", enabled: true, commandGeneration: false };

/** Poll the microtask/timer queue until `cond` holds or the attempt budget runs out. */
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

describe("generate_class → staged pipeline (M1 + M2 end-to-end)", () => {
    it("pauses on the skeleton gate, then assembles a savable class and its subclasses on approval", async () => {
        aiAssistant.send("make a storm knight class");

        // The pipeline runs to the ratification gate: the chat turn itself is idle (no continuation).
        await waitFor(() => aiAssistant.pipelineRun()?.status === "awaiting_user");
        expect(aiAssistant.status()).toBe("idle");
        const card = aiAssistant.pendingInteractions().find(i => i.kind === "plan");
        expect(card).toBeTruthy();
        expect(card!.title).toContain("Stormwarden");
        expect(aiAssistant.pendingPreviews()).toHaveLength(0);   // nothing assembled yet

        // Approve the skeleton → chassis + feature loop + subclass loop + assemble run → previews surface.
        aiAssistant.answerInteraction(card!.interactionId, { type: "plan_accept" });
        await waitFor(() => aiAssistant.pendingPreviews().length > 0);

        expect(aiAssistant.pipelineRun()).toBeNull();
        expect(aiAssistant.pendingInteractions()).toHaveLength(0);
        // The class preview is first; the skeleton promised three subclasses, each surfaced too.
        const previews = aiAssistant.pendingPreviews();
        expect(previews[0].kind).toBe("class");
        expect(previews[0].valid).toBe(true);
        const klass = previews[0].entity as Class5E;
        expect(klass.name).toBe("Stormwarden");
        expect(Object.keys(klass.features ?? {}).length).toBeGreaterThan(8);   // a full 1–20 spread, not just level 1
        expect(previews.filter(p => p.kind === "subclass")).toHaveLength(3);
    });

    it("stops the run when the skeleton is rejected", async () => {
        aiAssistant.send("make a storm knight class");
        await waitFor(() => aiAssistant.pipelineRun()?.status === "awaiting_user");
        const card = aiAssistant.pendingInteractions().find(i => i.kind === "plan")!;

        aiAssistant.answerInteraction(card.interactionId, { type: "plan_reject" });
        await waitFor(() => aiAssistant.pipelineRun()?.status === "aborted");

        expect(aiAssistant.pendingPreviews()).toHaveLength(0);
        expect(aiAssistant.pendingInteractions()).toHaveLength(0);
    });

    it("abortPipeline stops an in-flight run and clears its card", async () => {
        aiAssistant.send("make a storm knight class");
        await waitFor(() => aiAssistant.pipelineRun()?.status === "awaiting_user");

        aiAssistant.abortPipeline();
        expect(aiAssistant.pipelineRun()).toBeNull();
        expect(aiAssistant.pendingInteractions()).toHaveLength(0);
        // The orchestrator's trailing "aborted" emit must not flash the card back after an explicit abort.
        await new Promise(r => setTimeout(r, 0));
        expect(aiAssistant.pipelineRun()).toBeNull();
    });
});
