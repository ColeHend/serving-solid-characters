import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AiSettings } from "../../models/userSettings";

/**
 * Covers the two cross-conversation features driven through the public API with a scripted provider and an
 * in-memory chatHistoryDB:
 *  1. Pending homebrew save-choice cards are persisted and RESTORED (detached) after a chat-history switch.
 *  2. editAndRewind() truncates history+messages back to an edited user prompt and re-runs from there.
 */

const h = vi.hoisted(() => ({
    settings: {} as { ai: AiSettings; dndSystem: string },
    turns: [] as Record<string, unknown>[][],
    calls: 0,
}));

// In-memory conversations table. Clone on read/write to mirror Dexie's structured-clone semantics (so the
// test never holds a live reference into the store, exactly like the real DB).
const db = vi.hoisted(() => ({ rows: new Map<string, Record<string, unknown>>() }));

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
vi.mock("./decisionLogManager", () => ({ logDecision: async () => {} }));
vi.mock("./utility/localDB/chatHistoryDB", () => ({
    default: {
        conversations: {
            put: async (row: Record<string, unknown>) => { db.rows.set(row.id as string, structuredClone(row)); },
            get: async (id: string) => { const r = db.rows.get(id); return r ? structuredClone(r) : undefined; },
            delete: async (id: string) => { db.rows.delete(id); },
            clear: async () => { db.rows.clear(); },
            update: async (id: string, patch: Record<string, unknown>) => {
                const r = db.rows.get(id); if (r) db.rows.set(id, { ...r, ...patch });
            },
            orderBy: () => ({ reverse: () => ({ toArray: async () => [...db.rows.values()].map(r => structuredClone(r)) }) }),
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

const baseAi: AiSettings = { provider: "local", model: "m", localBaseUrl: "x", enabled: true, commandGeneration: false };

function toolCall(args: string, name = "create_spell") {
    return [
        { type: "tool_call_start", index: 0, id: "tc1", name },
        { type: "tool_call_delta", index: 0, argsDelta: args },
        { type: "tool_call_done", index: 0 },
        { type: "message_done", stopReason: "tool_use" },
    ];
}
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
function textTurn(text: string) {
    return [{ type: "text_delta", text }, { type: "message_done", stopReason: "end_turn" }];
}

const validSpell = JSON.stringify({ name: "Ember Bolt", description: "Make a ranged spell attack; 1d10 fire damage.", level: 0, school: "Evocation", castingTime: "1 action", range: "60 feet", duration: "Instantaneous", concentration: false, ritual: false, isVerbal: true, isSomatic: true, isMaterial: false });

beforeEach(() => {
    h.calls = 0; h.turns = [];
    h.settings = { ai: { ...baseAi }, dndSystem: "both" };
    db.rows.clear();
    aiAssistant.newConversation();
    aiAssistant.setMode("homebrew");
});

describe("persisting & restoring save-choice cards", () => {
    it("restores a pending preview as a detached card after switching away and back", async () => {
        h.settings.ai.usageLevel = "low";
        h.turns = [toolCall(validSpell)];

        aiAssistant.send("make a fire cantrip");
        await vi.waitFor(() => expect(aiAssistant.pendingPreviews()).toHaveLength(1));

        const convId = [...db.rows.keys()][0];
        expect((db.rows.get(convId)!.pendingPreviews as unknown[])).toHaveLength(1);

        aiAssistant.newConversation();
        expect(aiAssistant.pendingPreviews()).toHaveLength(0);

        await aiAssistant.loadConversation(convId);
        const restored = aiAssistant.pendingPreviews();
        expect(restored).toHaveLength(1);
        expect(restored[0].detached).toBe(true);
        expect(restored[0].title).toBe("Ember Bolt");
        expect(restored[0].valid).toBe(true);
    });

    it("saves a detached card without starting a continuation turn, and persists the empty set", async () => {
        h.settings.ai.usageLevel = "low";
        h.turns = [toolCall(validSpell)];
        aiAssistant.send("make a fire cantrip");
        await vi.waitFor(() => expect(aiAssistant.pendingPreviews()).toHaveLength(1));
        const convId = [...db.rows.keys()][0];

        aiAssistant.newConversation();
        await aiAssistant.loadConversation(convId);
        const callsBefore = h.calls;

        await aiAssistant.confirmPreview(aiAssistant.pendingPreviews()[0].previewId);
        expect(aiAssistant.pendingPreviews()).toHaveLength(0);
        expect(h.calls).toBe(callsBefore);   // resolveToolCall no-ops (outstanding empty) → no model call

        // Switching back must NOT resurrect the saved card.
        await vi.waitFor(() => expect((db.rows.get(convId)!.pendingPreviews as unknown[])).toHaveLength(0));
        aiAssistant.newConversation();
        await aiAssistant.loadConversation(convId);
        expect(aiAssistant.pendingPreviews()).toHaveLength(0);
    });

    it("restores a reviewed card unblocked (reviewBlocked cleared, detached)", async () => {
        h.settings.ai.usageLevel = "high";
        h.settings.ai.review = { enabledPasses: ["schema_validate", "schema_validate_final"], reviewerMode: "primary" };
        h.turns = [toolCall(validSpell)];

        aiAssistant.send("make a fire cantrip");
        await vi.waitFor(() => {
            const p = aiAssistant.pendingPreviews();
            expect(p).toHaveLength(1);
            expect(p[0].reviewState).toBe("passed");
        });
        const convId = [...db.rows.keys()][0];

        aiAssistant.newConversation();
        await aiAssistant.loadConversation(convId);
        const r = aiAssistant.pendingPreviews()[0];
        expect(r.detached).toBe(true);
        expect(r.reviewState).toBe("passed");
        expect(r.reviewBlocked).toBe(false);
    });

    it("does NOT restore ask/plan interaction cards", async () => {
        aiAssistant.setMode("chat");
        h.turns = [multiCall([{ name: "ask_user", input: { prompt: "Pick", options: [{ label: "A" }] } }])];

        aiAssistant.send("help me choose");
        await vi.waitFor(() => expect(aiAssistant.pendingInteractions()).toHaveLength(1));
        const convId = [...db.rows.keys()][0];

        aiAssistant.newConversation();
        await aiAssistant.loadConversation(convId);
        expect(aiAssistant.pendingInteractions()).toHaveLength(0);
    });
});

describe("editAndRewind", () => {
    it("truncates to the edited prompt and re-runs from there", async () => {
        aiAssistant.setMode("chat");
        h.turns = [textTurn("First answer."), textTurn("Second answer."), textTurn("Edited answer.")];

        aiAssistant.send("first question");
        await vi.waitFor(() => expect(aiAssistant.messages().at(-1)!.text).toContain("First answer."));
        aiAssistant.send("second question");
        await vi.waitFor(() => expect(aiAssistant.messages().at(-1)!.text).toContain("Second answer."));

        const firstUser = aiAssistant.messages().find(m => m.role === "user")!;
        aiAssistant.editAndRewind(firstUser.id, "first question edited");

        await vi.waitFor(() => expect(aiAssistant.messages().at(-1)!.text).toContain("Edited answer."));
        const msgs = aiAssistant.messages();
        expect(msgs.filter(m => m.role === "user").map(m => m.text)).toEqual(["first question edited"]);
        expect(h.calls).toBe(3);
    });

    it("ignores an edit while a turn is streaming and an edit targeting a non-user bubble", async () => {
        aiAssistant.setMode("chat");
        h.turns = [textTurn("Answer.")];
        aiAssistant.send("q");
        await vi.waitFor(() => expect(aiAssistant.messages().at(-1)!.text).toContain("Answer."));

        const assistantMsg = aiAssistant.messages().find(m => m.role === "assistant")!;
        const before = aiAssistant.messages().length;
        aiAssistant.editAndRewind(assistantMsg.id, "nope");   // not a user bubble → no-op
        expect(aiAssistant.messages().length).toBe(before);
        expect(h.calls).toBe(1);
    });

    it("uses the Nth-user fallback for a conversation without stored historyIndex", async () => {
        db.rows.set("old1", {
            id: "old1", title: "Old", mode: "chat",
            history: [
                { role: "user", text: "q1" }, { role: "assistant", text: "a1" },
                { role: "user", text: "q2" }, { role: "assistant", text: "a2" },
            ],
            messages: [
                { id: "m1", role: "user", text: "q1" }, { id: "m2", role: "assistant", text: "a1" },
                { id: "m3", role: "user", text: "q2" }, { id: "m4", role: "assistant", text: "a2" },
            ],
            createdAt: 1, updatedAt: 1,
        });
        await aiAssistant.loadConversation("old1");
        h.calls = 0;
        h.turns = [textTurn("New a1.")];

        aiAssistant.editAndRewind("m1", "q1 edited");
        await vi.waitFor(() => expect(aiAssistant.messages().at(-1)!.text).toContain("New a1."));
        const msgs = aiAssistant.messages();
        expect(msgs.filter(m => m.role === "user").map(m => m.text)).toEqual(["q1 edited"]);
    });
});
