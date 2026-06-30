import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AiSettings } from "../../models/userSettings";

/**
 * Integration test for the usage-level orchestration in AiAssistant.finishTurn, driven through the
 * public send() entry point with a scripted provider. Verifies Medium auto-retry and the High readiness
 * pipeline's state transitions without any real model/DB.
 */

// Mutable settings + a scripted, per-turn provider stream.
const h = vi.hoisted(() => ({
    settings: {} as { ai: AiSettings; dndSystem: string },
    turns: [] as Record<string, unknown>[][],   // events to yield on each successive streamChat call
    calls: 0,
}));

vi.mock("./userSettings", () => ({
    default: () => [() => h.settings, () => {}],
    getUserSettings: () => [() => h.settings, () => {}],
    saveUserSettings: () => {},
}));
vi.mock("../ai/providers/providerFactory", () => ({
    buildProvider: () => ({
        kind: "local",
        async *streamChat() {
            const idx = Math.min(h.calls, h.turns.length - 1);
            h.calls++;
            for (const e of h.turns[idx] ?? []) yield e;
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
        addSpell: async () => {},
    },
}));

import { aiAssistant } from "./aiAssistant";

// commandGeneration is OFF here so these usage-level/readiness tests can assert exact provider-call
// counts without the post-generation command sub-agent firing its own model call per feature-bearing entity.
const baseAi: AiSettings = { provider: "local", model: "m", localBaseUrl: "x", enabled: true, commandGeneration: false };

/** A streamed tool call carrying the given (possibly malformed) argument string. */
function toolCall(args: string, name = "create_spell") {
    return [
        { type: "tool_call_start", index: 0, id: "tc1", name },
        { type: "tool_call_delta", index: 0, argsDelta: args },
        { type: "tool_call_done", index: 0 },
        { type: "message_done", stopReason: "tool_use" },
    ];
}

const validSpell = JSON.stringify({ name: "Ember Bolt", description: "Make a ranged spell attack; 1d10 fire damage.", level: 0, school: "Evocation", castingTime: "1 action", range: "60 feet", duration: "Instantaneous", concentration: false, ritual: false, isVerbal: true, isSomatic: true, isMaterial: false });
const validSpell2 = JSON.stringify({ name: "Frost Bite", description: "Make a ranged spell attack; 1d10 cold damage.", level: 0, school: "Evocation", castingTime: "1 action", range: "60 feet", duration: "Instantaneous", concentration: false, ritual: false, isVerbal: true, isSomatic: true, isMaterial: false });
const noDescSpell = JSON.stringify({ name: "Ember Bolt", level: 0, school: "Evocation", castingTime: "1 action", range: "60 feet", duration: "Instantaneous", concentration: false, ritual: false, isVerbal: true, isSomatic: true, isMaterial: false });
const subclassFeatures = [{ level: 3, name: "Cinder Step", description: "When you cast a fire spell you can teleport 10 feet." }];
const badSubclass = JSON.stringify({ name: "Path of Cinders", parentClass: "Wizardd", description: "Cinder-wreathed casters who burn their foes.", features: subclassFeatures });
const goodSubclass = JSON.stringify({ name: "Path of Cinders", parentClass: "Wizard", description: "Cinder-wreathed casters who burn their foes.", features: subclassFeatures });

beforeEach(() => {
    h.calls = 0; h.turns = [];
    h.settings = { ai: { ...baseAi }, dndSystem: "both" };
    aiAssistant.newConversation();
    aiAssistant.setMode("homebrew");
});

describe("Medium auto-retry", () => {
    it("silently regenerates a parse failure once, then surfaces the result", async () => {
        h.settings.ai.usageLevel = "medium";
        h.settings.ai.mediumRetries = 1;
        h.turns = [toolCall("{ this is not json"), toolCall("{ still broken")];

        aiAssistant.send("make a fire cantrip");

        await vi.waitFor(() => expect(h.calls).toBe(2));               // retried exactly once
        await vi.waitFor(() => expect(aiAssistant.status()).toBe("idle"));
        const previews = aiAssistant.pendingPreviews();
        expect(previews).toHaveLength(1);
        expect(previews[0].truncated).toBe(true);                      // surfaced with the cut-off warning
    });

    it("does not retry when the first generation is valid", async () => {
        h.settings.ai.usageLevel = "medium";
        h.turns = [toolCall(validSpell)];

        aiAssistant.send("make a fire cantrip");

        await vi.waitFor(() => expect(aiAssistant.pendingPreviews()).toHaveLength(1));
        expect(h.calls).toBe(1);
        expect(aiAssistant.pendingPreviews()[0].valid).toBe(true);
    });

    it("regenerates a spell that came back with no description, then surfaces the fixed one", async () => {
        h.settings.ai.usageLevel = "medium";
        h.settings.ai.mediumRetries = 1;
        h.turns = [toolCall(noDescSpell), toolCall(validSpell)];   // missing description → hard failure → retry

        aiAssistant.send("make a fire cantrip");

        await vi.waitFor(() => expect(aiAssistant.pendingPreviews()).toHaveLength(1));
        expect(h.calls).toBe(2);
        const p = aiAssistant.pendingPreviews()[0];
        expect(p.valid).toBe(true);
        expect((p.entity as { description?: string }).description?.length).toBeGreaterThan(0);
    });
});

describe("High readiness pipeline", () => {
    it("reviews a valid entity and marks it passed (no LLM passes enabled)", async () => {
        h.settings.ai.usageLevel = "high";
        // Only deterministic gates → no extra model calls; the entity is clean.
        h.settings.ai.review = { enabledPasses: ["schema_validate", "schema_validate_final"], reviewerMode: "primary" };
        h.turns = [toolCall(validSpell)];

        aiAssistant.send("make a fire cantrip");

        await vi.waitFor(() => {
            const p = aiAssistant.pendingPreviews();
            expect(p).toHaveLength(1);
            expect(p[0].reviewState).toBe("passed");
        });
        expect(h.calls).toBe(1);   // deterministic-only review made no extra model call
    });

    it("auto-fixes a blocking review finding, then marks it passed", async () => {
        h.settings.ai.usageLevel = "high";
        h.settings.ai.review = { enabledPasses: ["schema_validate", "broken_reference", "schema_validate_final"], reviewerMode: "primary", maxSchemaRetries: 1 };
        // Turn 1's subclass names an unknown parent class (broken reference → error → blocks); turn 2 fixes it.
        h.turns = [toolCall(badSubclass, "create_subclass"), toolCall(goodSubclass, "create_subclass")];

        aiAssistant.send("make a wizard subclass");

        await vi.waitFor(() => {
            const p = aiAssistant.pendingPreviews();
            expect(p).toHaveLength(1);
            expect(p[0].reviewState).toBe("passed");
        });
        expect(h.calls).toBe(2);   // generated once, auto-fixed once
    });

    it("asks for user direction after the schema-retry cap is exhausted", async () => {
        h.settings.ai.usageLevel = "high";
        h.settings.ai.review = { enabledPasses: ["schema_validate"], reviewerMode: "primary", maxSchemaRetries: 1 };
        // Every generation fails to parse → 1 retry, then "needs direction".
        h.turns = [toolCall("{ broken"), toolCall("{ broken again")];

        aiAssistant.send("make a broken spell");

        await vi.waitFor(() => {
            const p = aiAssistant.pendingPreviews();
            expect(p).toHaveLength(1);
            expect(p[0].reviewState).toBe("needs_user_direction");
        });
        expect(h.calls).toBe(2);   // one generation + one retry
    });
});

/** A plain assistant text turn that ends the conversation. */
function textTurn(text: string) {
    return [
        { type: "text_delta", text },
        { type: "message_done", stopReason: "end_turn" },
    ];
}
/** One assistant turn that emits the given tool calls (one per index) then stops for tool_use. */
function multiCall(specs: { name: string; input: Record<string, unknown> }[]) {
    const events: Record<string, unknown>[] = [];
    specs.forEach((s, i) => {
        events.push({ type: "tool_call_start", index: i, id: `tc${i}`, name: s.name });
        events.push({ type: "tool_call_delta", index: i, argsDelta: JSON.stringify(s.input) });
        events.push({ type: "tool_call_done", index: i });
    });
    events.push({ type: "message_done", stopReason: "tool_use" });
    return events;
}

describe("compute + interactive routing", () => {
    it("auto-executes a compute tool and continues the turn with no card", async () => {
        aiAssistant.setMode("chat");
        h.turns = [multiCall([{ name: "calc_ability_modifier", input: { score: 16 } }]), textTurn("The modifier is +3.")];

        aiAssistant.send("modifier for 16?");

        await vi.waitFor(() => expect(h.calls).toBe(2));               // compute resolved → continuation turn ran
        await vi.waitFor(() => expect(aiAssistant.status()).toBe("idle"));
        const msgs = aiAssistant.messages();
        expect(msgs[msgs.length - 1].text).toContain("+3");
        expect(aiAssistant.pendingPreviews()).toHaveLength(0);
        expect(aiAssistant.pendingInteractions()).toHaveLength(0);
    });

    it("renders an ask_user card, waits, then continues when answered", async () => {
        aiAssistant.setMode("chat");
        h.turns = [
            multiCall([{ name: "ask_user", input: { prompt: "Pick one", options: [{ label: "A" }, { label: "B" }] } }]),
            textTurn("Going with A."),
        ];

        aiAssistant.send("help me choose");

        await vi.waitFor(() => expect(aiAssistant.pendingInteractions()).toHaveLength(1));
        expect(h.calls).toBe(1);                                       // no continuation until the user answers
        expect(aiAssistant.status()).toBe("idle");

        const card = aiAssistant.pendingInteractions()[0];
        aiAssistant.answerInteraction(card.interactionId, { type: "option", optionId: "opt-0", label: "A" });

        await vi.waitFor(() => {
            const msgs = aiAssistant.messages();
            expect(msgs[msgs.length - 1].text).toContain("Going with A.");   // continuation turn replied
        });
        expect(h.calls).toBe(2);
        expect(aiAssistant.pendingInteractions()).toHaveLength(0);
    });

    it("buffers a compute result while an interactive card waits, then continues together", async () => {
        aiAssistant.setMode("chat");
        h.turns = [
            multiCall([
                { name: "calc_proficiency_bonus", input: { level: 5 } },
                { name: "ask_user", input: { prompt: "Which?", options: [{ label: "X" }] } },
            ]),
            textTurn("Done."),
        ];

        aiAssistant.send("mixed turn");

        await vi.waitFor(() => expect(aiAssistant.pendingInteractions()).toHaveLength(1));
        expect(h.calls).toBe(1);                                       // compute resolved but the turn waits on the card

        const card = aiAssistant.pendingInteractions()[0];
        aiAssistant.answerInteraction(card.interactionId, { type: "option", optionId: "opt-0", label: "X" });

        await vi.waitFor(() => expect(h.calls).toBe(2));
        expect(aiAssistant.pendingInteractions()).toHaveLength(0);
    });
});

/** A provider that errors out (e.g. server unreachable) then ends the turn. */
function errorTurn(message = "boom") {
    return [
        { type: "error", error: message },
        { type: "message_done", stopReason: "error" },
    ];
}

describe("error handling & recovery", () => {
    it("surfaces a provider error as status=error, and retryLast re-runs the turn", async () => {
        aiAssistant.setMode("chat");
        h.turns = [errorTurn("server unreachable"), textTurn("Here's your answer.")];

        aiAssistant.send("hello");

        await vi.waitFor(() => expect(aiAssistant.status()).toBe("error"));
        const errMsg = aiAssistant.messages().at(-1)!;
        expect(errMsg.kind).toBe("system");

        aiAssistant.retryLast();
        await vi.waitFor(() => {
            const last = aiAssistant.messages().at(-1)!;
            expect(last.text).toContain("Here's your answer.");
            expect(last.kind).not.toBe("system");   // the system error bubble was dropped before retrying
        });
        expect(aiAssistant.status()).toBe("idle");
        expect(h.calls).toBe(2);
    });

    it("records a refusal as a system notice and settles idle", async () => {
        aiAssistant.setMode("chat");
        h.turns = [[{ type: "text_delta", text: "I can't help with that." }, { type: "message_done", stopReason: "refusal" }]];

        aiAssistant.send("disallowed request");

        await vi.waitFor(() => expect(aiAssistant.status()).toBe("idle"));
        const last = aiAssistant.messages().at(-1)!;
        expect(last.kind).toBe("system");
        expect(last.text).toContain("⚠️");
    });
});

describe("switch_mode control tool", () => {
    it("flips the mode and continues the turn", async () => {
        aiAssistant.setMode("chat");
        h.settings.ai.autoSwitch = true;
        h.turns = [multiCall([{ name: "switch_mode", input: { mode: "homebrew" } }]), textTurn("Switched and ready.")];

        aiAssistant.send("make me a spell");

        await vi.waitFor(() => expect(aiAssistant.mode()).toBe("homebrew"));
        await vi.waitFor(() => expect(h.calls).toBe(2));   // mode flipped → continuation turn ran
    });

    it("short-circuits a no-op switch to the already-active mode", async () => {
        aiAssistant.setMode("chat");
        h.settings.ai.autoSwitch = true;
        h.turns = [multiCall([{ name: "switch_mode", input: { mode: "chat" } }]), textTurn("Already here.")];

        aiAssistant.send("switch to chat");

        await vi.waitFor(() => expect(h.calls).toBe(2));   // resolved as a no-op, continuation ran
        expect(aiAssistant.mode()).toBe("chat");
    });
});

describe("confirmPreview save flow", () => {
    it("saves a confirmed preview, leaves a 'saved' confirmation card, and continues the turn", async () => {
        h.settings.ai.usageLevel = "low";
        h.turns = [toolCall(validSpell), textTurn("Saved it.")];

        aiAssistant.send("make a fire cantrip");

        await vi.waitFor(() => expect(aiAssistant.pendingPreviews()).toHaveLength(1));
        const preview = aiAssistant.pendingPreviews()[0];
        await aiAssistant.confirmPreview(preview.previewId);

        // The card is NOT removed — it transforms into a "Saved" confirmation the user can dismiss.
        expect(aiAssistant.pendingPreviews()).toHaveLength(1);
        expect(aiAssistant.pendingPreviews()[0].saved).toBe(true);
        // The save is announced in the chat by name — a durable, in-flow record for the user AND the model.
        expect(aiAssistant.messages().some(m => /Saved/.test(m.text) && /Ember Bolt/.test(m.text))).toBe(true);
        // …and the card is anchored to that announcement so it renders inline, not adrift at the bottom.
        const savedCard = aiAssistant.pendingPreviews()[0];
        expect(savedCard.anchorId).toBeTruthy();
        expect(aiAssistant.messages().some(m => m.id === savedCard.anchorId && /Saved/.test(m.text))).toBe(true);
        await vi.waitFor(() => expect(h.calls).toBe(2));         // tool_result resolved → continuation turn ran
        await vi.waitFor(() => expect(aiAssistant.messages().at(-1)!.text).toContain("Saved it."));

        // Dismissing the saved card clears it.
        aiAssistant.dismissPreview(preview.previewId);
        expect(aiAssistant.pendingPreviews()).toHaveLength(0);
    });

    it("keeps a 'saved' card on screen when the user sends the next message (flushOutstanding must not wipe it)", async () => {
        h.settings.ai.usageLevel = "low";
        // One turn drafts TWO spells; saving one leaves the other still outstanding, so the next send()'s
        // flushOutstanding() does NOT early-return — exactly the path that used to wipe the saved card too.
        h.turns = [
            multiCall([
                { name: "create_spell", input: JSON.parse(validSpell) },
                { name: "create_spell", input: JSON.parse(validSpell2) },
            ]),
            textTurn("Okay."),
        ];

        aiAssistant.send("make two fire cantrips");
        await vi.waitFor(() => expect(aiAssistant.pendingPreviews()).toHaveLength(2));

        const first = aiAssistant.pendingPreviews()[0];
        await aiAssistant.confirmPreview(first.previewId);
        expect(aiAssistant.pendingPreviews().find(p => p.previewId === first.previewId)?.saved).toBe(true);

        aiAssistant.send("change it");   // flushOutstanding runs here, before the new turn

        // The saved confirmation survives; only the un-acted draft is flushed.
        const survivors = aiAssistant.pendingPreviews();
        expect(survivors).toHaveLength(1);
        expect(survivors[0].previewId).toBe(first.previewId);
        expect(survivors[0].saved).toBe(true);
    });

    it("auto-corrects a wrong edit name: no dead-end card, the turn continues so the model can retry", async () => {
        // backgrounds() is empty in the mock → edit_homebrew can't find "Journalist" and must self-correct.
        h.turns = [
            multiCall([{ name: "edit_homebrew", input: { kind: "background", name: "Journalist", changes: [] } }]),
            textTurn("Let me look those up."),
        ];

        aiAssistant.send("add equipment to my journalist background");

        await vi.waitFor(() => expect(h.calls).toBe(2));         // missing-target edit resolved back → continuation ran
        expect(aiAssistant.pendingPreviews()).toHaveLength(0);   // no dead-end card was surfaced
        await vi.waitFor(() => expect(aiAssistant.messages().at(-1)!.text).toContain("Let me look those up."));
    });
});

// A valid-but-minimal background (only name+desc are required); used as a "Complete with AI" target.
const sparseBackground = JSON.stringify({ name: "Dusty Nomad", desc: "A wanderer of the trackless wastes who reads the dunes like a map." });

describe("Complete with AI repair (completePreview / cancelRepair)", () => {
    it("does not strand the 'Improving…' card when a Medium-depth repair routes into the mini-pipeline", async () => {
        h.settings.ai.usageLevel = "low";   // initial gen at default (Low) depth → a normal one-shot preview card
        h.turns = [toolCall(sparseBackground, "create_background")];

        aiAssistant.send("make a wanderer background");
        await vi.waitFor(() => expect(aiAssistant.pendingPreviews()).toHaveLength(1));
        const id = aiAssistant.pendingPreviews()[0].previewId;

        // The user raises generation depth, then asks the AI to complete the card. background supports the
        // mini-pipeline, so the repair turn's create_background routes into it — the collapsed card must NOT
        // be left behind showing "Improving with AI…" forever (regression for the early-return bug).
        h.settings.ai.creationPipelineLevel = "medium";
        aiAssistant.completePreview(id);
        expect(aiAssistant.pendingPreviews().find(p => p.previewId === id)?.repairing).toBe(true);   // collapsed now

        await vi.waitFor(() => expect(aiAssistant.pendingPreviews().some(p => p.repairing)).toBe(false));
    });

    it("Dismiss aborts the completion turn and restores the previous card (re-enabling Complete with AI)", async () => {
        h.settings.ai.usageLevel = "low";
        h.turns = [toolCall(sparseBackground, "create_background")];

        aiAssistant.send("make a wanderer background");
        await vi.waitFor(() => expect(aiAssistant.pendingPreviews()).toHaveLength(1));
        const id = aiAssistant.pendingPreviews()[0].previewId;

        aiAssistant.completePreview(id);
        expect(aiAssistant.pendingPreviews().find(p => p.previewId === id)?.repairing).toBe(true);
        expect(aiAssistant.status()).toBe("streaming");

        aiAssistant.cancelRepair(id);

        // The card is RESTORED (not deleted), un-collapsed, and the in-flight turn is aborted.
        const restored = aiAssistant.pendingPreviews().find(p => p.previewId === id);
        expect(restored).toBeTruthy();
        expect(restored!.repairing).toBeFalsy();
        expect(aiAssistant.status()).not.toBe("streaming");

        await vi.waitFor(() => expect(h.calls).toBe(2));   // let the aborted repair turn fully settle (epoch-guarded no-op)
        const callsBefore = h.calls;

        // Complete with AI works again: re-clicking collapses the card AND starts a fresh turn — proving the
        // tool call was re-opened, not left spent (which would re-strand it on "Improving with AI…").
        aiAssistant.completePreview(id);
        expect(aiAssistant.pendingPreviews().find(p => p.previewId === id)?.repairing).toBe(true);
        await vi.waitFor(() => expect(h.calls).toBe(callsBefore + 1));
    });
});
