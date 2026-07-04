import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AiMessage, AiToolDef, ChatStreamEvent, StreamChatOpts } from "./types";
import type { AiSettings } from "../../models/userSettings";

/**
 * `runSubAgent` must forward `SubAgentSpec.responseSchema` through to `StreamChatOpts.responseSchema` so the
 * pipeline's structured-output steps actually get grammar-constrained decoding. `structuredOutput.test.ts`
 * locks the adapter wire contract (format ↔ tools); this closes the spec → opts link one layer up.
 */

// Capture the opts every streamChat call receives; the stream ends immediately (one text delta + done).
const captured: StreamChatOpts[] = [];
const streamChat = vi.fn(async function* (_m: AiMessage[], _t: AiToolDef[] | undefined, opts: StreamChatOpts): AsyncGenerator<ChatStreamEvent, void, unknown> {
    captured.push(opts);
    yield { type: "message_done" } as ChatStreamEvent;
});

vi.mock("./providers/providerFactory", () => ({
    buildProvider: () => ({ kind: "local", streamChat }),
}));

const { runSubAgent } = await import("./subAgent");

const TOOL: AiToolDef = {
    name: "fill_it",
    description: "test tool",
    inputSchema: { type: "object", additionalProperties: false, properties: { n: { type: "number" } }, required: ["n"] },
};
const AI = { provider: "local", model: "test", localBaseUrl: "", enabled: true } as AiSettings;

beforeEach(() => { captured.length = 0; streamChat.mockClear(); });

describe("runSubAgent — responseSchema threading", () => {
    it("forwards spec.responseSchema into StreamChatOpts.responseSchema", async () => {
        await runSubAgent({ id: "s", name: "s", system: "sys", tools: [TOOL], responseSchema: TOOL.inputSchema }, "task", AI);
        expect(captured).toHaveLength(1);
        expect(captured[0].responseSchema).toEqual(TOOL.inputSchema);
    });

    it("leaves responseSchema undefined when the spec omits it (tool-call path)", async () => {
        await runSubAgent({ id: "s", name: "s", system: "sys", tools: [TOOL], forceTool: true }, "task", AI);
        expect(captured).toHaveLength(1);
        expect(captured[0].responseSchema).toBeUndefined();
        expect(captured[0].forceTool).toBe(true);
    });
});
