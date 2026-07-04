import { describe, it, expect, vi, afterEach } from "vitest";
import { OllamaAdapter } from "./ollamaAdapter";
import { LocalAdapter } from "./localAdapter";
import type { AiMessage, ChatStreamEvent, StreamChatOpts } from "../types";

/**
 * Token-usage capture at the adapter boundary: real counts where the provider reports them (Ollama's
 * done chunk, OpenAI-compat's trailing usage chunk), a char/4 estimate flagged `estimated` otherwise, and
 * exactly ONE message_done per turn (the local path must defer it past the usage chunk).
 */

const MSGS: AiMessage[] = [{ role: "user", text: "hi there" }];

function stubFetch(responseBody: string) {
    const fn = vi.fn().mockResolvedValue(new Response(responseBody, { status: 200 }));
    vi.stubGlobal("fetch", fn);
    return fn;
}
const sentBody = (fn: ReturnType<typeof vi.fn>): Record<string, any> =>
    JSON.parse((fn.mock.calls[0][1] as RequestInit).body as string);

async function collect(gen: AsyncGenerator<ChatStreamEvent, void, unknown>): Promise<ChatStreamEvent[]> {
    const out: ChatStreamEvent[] = [];
    for await (const ev of gen) out.push(ev);
    return out;
}
const doneOf = (evs: ChatStreamEvent[]) => evs.filter(e => e.type === "message_done") as Extract<ChatStreamEvent, { type: "message_done" }>[];

afterEach(() => vi.unstubAllGlobals());

describe("OllamaAdapter — usage capture", () => {
    const opts: StreamChatOpts = { model: "m", numCtx: 8192 };

    it("maps prompt_eval_count/eval_count to real usage", async () => {
        stubFetch('{"message":{"content":"hi"}}\n{"done":true,"done_reason":"stop","prompt_eval_count":123,"eval_count":45}\n');
        const dones = doneOf(await collect(new OllamaAdapter("http://localhost:11434").streamChat(MSGS, undefined, opts)));
        expect(dones).toHaveLength(1);
        expect(dones[0].usage).toEqual({ inputTokens: 123, outputTokens: 45 });
        expect(dones[0].usage?.estimated).toBeFalsy();
    });

    it("estimates the INPUT side only when prompt_eval_count is cached-away, keeping the real eval_count", async () => {
        stubFetch('{"message":{"content":"hi"}}\n{"done":true,"done_reason":"stop","eval_count":45}\n');
        const done = doneOf(await collect(new OllamaAdapter("http://localhost:11434").streamChat(MSGS, undefined, opts)))[0];
        expect(done.usage?.estimated).toBe(true);
        expect(done.usage?.outputTokens).toBe(45);            // real output preserved
        expect(done.usage?.inputTokens).toBeGreaterThan(0);   // estimated input
    });

    it("still carries usage on a length (max_tokens) stop", async () => {
        stubFetch('{"done":true,"done_reason":"length","prompt_eval_count":10,"eval_count":20}\n');
        const done = doneOf(await collect(new OllamaAdapter("http://localhost:11434").streamChat(MSGS, undefined, opts)))[0];
        expect(done.stopReason).toBe("max_tokens");
        expect(done.usage).toEqual({ inputTokens: 10, outputTokens: 20 });
    });
});

describe("LocalAdapter — usage capture", () => {
    const opts: StreamChatOpts = { model: "m", maxTokens: 100 };

    it("requests stream_options.include_usage", async () => {
        const fn = stubFetch("data: [DONE]\n\n");
        await collect(new LocalAdapter("http://localhost:1234").streamChat(MSGS, undefined, opts));
        expect(sentBody(fn).stream_options).toEqual({ include_usage: true });
    });

    it("captures the trailing usage chunk (after finish_reason) and emits exactly one message_done", async () => {
        stubFetch(
            'data: {"choices":[{"delta":{"content":"hi"},"finish_reason":null}]}\n\n' +
            'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\n' +
            'data: {"choices":[],"usage":{"prompt_tokens":80,"completion_tokens":20}}\n\n' +
            "data: [DONE]\n\n",
        );
        const evs = await collect(new LocalAdapter("http://localhost:1234").streamChat(MSGS, undefined, opts));
        const dones = doneOf(evs);
        expect(dones).toHaveLength(1);
        expect(dones[0].usage).toEqual({ inputTokens: 80, outputTokens: 20 });
        expect(dones[0].usage?.estimated).toBeFalsy();
    });

    it("falls back to an estimate when the server omits the usage chunk", async () => {
        stubFetch(
            'data: {"choices":[{"delta":{"content":"hello"},"finish_reason":null}]}\n\n' +
            'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\n' +
            "data: [DONE]\n\n",
        );
        const done = doneOf(await collect(new LocalAdapter("http://localhost:1234").streamChat(MSGS, undefined, opts)))[0];
        expect(done.usage?.estimated).toBe(true);
        expect(done.usage?.inputTokens).toBeGreaterThan(0);
        expect(done.usage?.outputTokens).toBeGreaterThan(0);
    });
});
