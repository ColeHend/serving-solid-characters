import { describe, it, expect, vi, afterEach } from "vitest";
import { OllamaAdapter } from "./ollamaAdapter";
import { LocalAdapter } from "./localAdapter";
import { AiMessage, AiToolDef, StreamChatOpts } from "../types";

/**
 * Request-body contract for the structured-output / sampling opts (responseSchema, forceTool,
 * temperature, topP). These are what make grammar-constrained MADS turns possible, so the shape the
 * adapters put on the wire is load-bearing: format ↔ tools are mutually exclusive (a schema-constrained
 * reply can't also be a tool call), and tool_choice only exists on the OpenAI-compatible path.
 */

const TOOL: AiToolDef = {
    name: "attach_commands",
    description: "test tool",
    inputSchema: { type: "object", properties: { features: { type: "array" } }, required: ["features"] },
};
const SCHEMA = TOOL.inputSchema;
const MSGS: AiMessage[] = [{ role: "user", text: "hi" }];

/** Stub fetch to capture the request body; the response ends the stream immediately. */
function stubFetch(responseBody: string) {
    const fn = vi.fn().mockResolvedValue(new Response(responseBody, { status: 200 }));
    vi.stubGlobal("fetch", fn);
    return fn;
}

const sentBody = (fn: ReturnType<typeof vi.fn>): Record<string, any> =>
    JSON.parse((fn.mock.calls[0][1] as RequestInit).body as string);

async function drain(gen: AsyncGenerator<unknown, void, unknown>) {
    for await (const _ev of gen) { /* consume to completion */ }
}

afterEach(() => vi.unstubAllGlobals());

describe("OllamaAdapter — structured outputs & sampling", () => {
    const NDJSON_DONE = '{"done":true,"done_reason":"stop"}\n';
    const opts: StreamChatOpts = { model: "m", maxTokens: 100, numCtx: 8192 };

    it("sends format=<schema> and withholds tools when responseSchema is set", async () => {
        const fetchFn = stubFetch(NDJSON_DONE);
        await drain(new OllamaAdapter("http://localhost:11434").streamChat(MSGS, [TOOL], { ...opts, responseSchema: SCHEMA }));
        const body = sentBody(fetchFn);
        expect(body.format).toEqual(SCHEMA);
        expect(body.tools).toBeUndefined();
    });

    it("sends tools and no format when responseSchema is absent", async () => {
        const fetchFn = stubFetch(NDJSON_DONE);
        await drain(new OllamaAdapter("http://localhost:11434").streamChat(MSGS, [TOOL], opts));
        const body = sentBody(fetchFn);
        expect(body.format).toBeUndefined();
        expect(body.tools).toHaveLength(1);
        expect(body.tools[0].function.name).toBe("attach_commands");
    });

    it("threads temperature and top_p into options, omitting them when unset", async () => {
        let fetchFn = stubFetch(NDJSON_DONE);
        await drain(new OllamaAdapter("http://localhost:11434").streamChat(MSGS, undefined, { ...opts, temperature: 0.2, topP: 0.9 }));
        expect(sentBody(fetchFn).options).toMatchObject({ temperature: 0.2, top_p: 0.9 });

        vi.unstubAllGlobals();
        fetchFn = stubFetch(NDJSON_DONE);
        await drain(new OllamaAdapter("http://localhost:11434").streamChat(MSGS, undefined, opts));
        expect(sentBody(fetchFn).options.temperature).toBeUndefined();
        expect(sentBody(fetchFn).options.top_p).toBeUndefined();
    });
});

describe("LocalAdapter — structured outputs, tool_choice & sampling", () => {
    const SSE_DONE = "data: [DONE]\n\n";
    const opts: StreamChatOpts = { model: "m", maxTokens: 100 };

    it("sends response_format json_schema and withholds tools when responseSchema is set", async () => {
        const fetchFn = stubFetch(SSE_DONE);
        await drain(new LocalAdapter("http://localhost:11434").streamChat(MSGS, [TOOL], { ...opts, responseSchema: SCHEMA }));
        const body = sentBody(fetchFn);
        expect(body.response_format).toEqual({
            type: "json_schema",
            json_schema: { name: "output", schema: SCHEMA, strict: true },
        });
        expect(body.tools).toBeUndefined();
        expect(body.tool_choice).toBeUndefined();
    });

    it('sends tool_choice "required" when forceTool is set with tools', async () => {
        const fetchFn = stubFetch(SSE_DONE);
        await drain(new LocalAdapter("http://localhost:11434").streamChat(MSGS, [TOOL], { ...opts, forceTool: true }));
        const body = sentBody(fetchFn);
        expect(body.tools).toHaveLength(1);
        expect(body.tool_choice).toBe("required");
    });

    it('keeps tool_choice "auto" when forceTool is not set', async () => {
        const fetchFn = stubFetch(SSE_DONE);
        await drain(new LocalAdapter("http://localhost:11434").streamChat(MSGS, [TOOL], opts));
        expect(sentBody(fetchFn).tool_choice).toBe("auto");
    });

    it("threads temperature and top_p at the body top level", async () => {
        const fetchFn = stubFetch(SSE_DONE);
        await drain(new LocalAdapter("http://localhost:11434").streamChat(MSGS, undefined, { ...opts, temperature: 0.15, topP: 0.8 }));
        const body = sentBody(fetchFn);
        expect(body.temperature).toBe(0.15);
        expect(body.top_p).toBe(0.8);
    });
});
