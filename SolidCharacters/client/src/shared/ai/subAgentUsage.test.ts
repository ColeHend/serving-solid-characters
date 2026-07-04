import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AiMessage, AiToolDef, ChatStreamEvent, StreamChatOpts, TokenUsage } from "./types";
import type { AiSettings } from "../../models/userSettings";

/** streamOnce surfaces message_done.usage on the SubAgentResult; runSubAgent sums it across its loop. */

let scriptedUsage: TokenUsage | undefined;
const streamChat = vi.fn(async function* (_m: AiMessage[], _t: AiToolDef[] | undefined, _o: StreamChatOpts): AsyncGenerator<ChatStreamEvent, void, unknown> {
    yield { type: "text_delta", text: "ok" };
    yield { type: "message_done", stopReason: "end_turn", usage: scriptedUsage };
});

vi.mock("./providers/providerFactory", () => ({ buildProvider: () => ({ kind: "local", streamChat }) }));

const { runSubAgent } = await import("./subAgent");

const AI = { provider: "local", model: "test", localBaseUrl: "", enabled: true } as AiSettings;
const SPEC = { id: "s", name: "s", system: "sys", tools: [] as AiToolDef[] };

beforeEach(() => { streamChat.mockClear(); scriptedUsage = undefined; });

describe("runSubAgent — usage forwarding", () => {
    it("returns the turn's usage on the result", async () => {
        scriptedUsage = { inputTokens: 30, outputTokens: 12 };
        const res = await runSubAgent(SPEC, "task", AI);
        expect(res.ok).toBe(true);
        expect(res.usage).toEqual({ inputTokens: 30, outputTokens: 12 });
    });

    it("leaves usage undefined when the provider reports none (no crash)", async () => {
        scriptedUsage = undefined;
        const res = await runSubAgent(SPEC, "task", AI);
        expect(res.ok).toBe(true);
        expect(res.usage).toBeUndefined();
    });
});
