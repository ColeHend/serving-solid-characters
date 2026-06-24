import { AiMessage, AiProvider, AiToolDef, ChatStreamEvent, StreamChatOpts } from "../types";
import { parseSse } from "../sse";

/**
 * Direct browser adapter for local OpenAI-compatible servers (Ollama, LM Studio, llama.cpp, ...).
 * Calls {baseUrl}/v1/chat/completions directly — the .NET proxy can't reach the user's localhost,
 * and there's no key to hide. Emits the same normalized ChatStreamEvent stream as the proxy adapter.
 */
export class LocalAdapter implements AiProvider {
    readonly kind = "local" as const;

    constructor(
        private readonly baseUrl: string,
        private readonly apiKey?: string,
    ) {}

    async *streamChat(
        messages: AiMessage[],
        tools: AiToolDef[] | undefined,
        opts: StreamChatOpts,
    ): AsyncGenerator<ChatStreamEvent, void, unknown> {
        const url = `${this.baseUrl.replace(/\/$/, "")}/v1/chat/completions`;
        const body: Record<string, unknown> = {
            model: opts.model,
            stream: true,
            max_tokens: opts.maxTokens ?? 4096,
            messages: toOpenAiMessages(messages, opts.system),
        };
        // Reasoning/"thinking" toggle, resolved per-mode by the caller. On homebrew tool turns this is
        // off by default because reasoning models (e.g. gemma3/gemma4 on Ollama) otherwise spend the
        // whole token budget thinking out loud and hit max_tokens before emitting the create_* call.
        // Ollama honors `think`; other OpenAI-compatible local servers ignore the extra field.
        if (opts.think !== undefined) body.think = opts.think;
        if (tools?.length) {
            body.tools = tools.map(t => ({
                type: "function",
                function: { name: t.name, description: t.description, parameters: t.inputSchema },
            }));
            body.tool_choice = "auto";
        }

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;

        let res: Response;
        try {
            res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: opts.signal });
        } catch (e) {
            yield { type: "error", error: `Could not reach local model at ${this.baseUrl}. Is the server running and CORS enabled? (${String(e)})` };
            yield { type: "message_done", stopReason: "error" };
            return;
        }
        if (!res.ok || !res.body) {
            yield { type: "error", error: `Local model returned ${res.status} ${res.statusText}` };
            yield { type: "message_done", stopReason: "error" };
            return;
        }

        const started = new Set<number>();
        let doneEmitted = false;
        for await (const ev of parseSse(res.body, opts.signal)) {
            const data = ev.data.trim();
            if (!data) continue;
            if (data === "[DONE]") break;
            let chunk: any;
            try { chunk = JSON.parse(data); } catch { continue; }
            const choice = chunk?.choices?.[0];
            if (!choice) continue;

            const delta = choice.delta ?? {};
            // Reasoning ("thinking") models surface their chain-of-thought separately from the answer.
            // Ollama uses `reasoning`; some OpenAI-compatible servers use `reasoning_content`. Stream
            // either as a thinking_delta so the UI can show it in a collapsible block.
            const reasoning = delta.reasoning ?? delta.reasoning_content;
            if (typeof reasoning === "string" && reasoning.length) {
                yield { type: "thinking_delta", text: reasoning };
            }
            if (typeof delta.content === "string" && delta.content.length) {
                yield { type: "text_delta", text: delta.content };
            }
            if (Array.isArray(delta.tool_calls)) {
                for (const tc of delta.tool_calls) {
                    const index: number = tc.index ?? 0;
                    if (!started.has(index)) {
                        started.add(index);
                        yield { type: "tool_call_start", index, id: tc.id ?? `call_${index}`, name: tc.function?.name ?? "" };
                    }
                    const argsFragment = tc.function?.arguments;
                    if (typeof argsFragment === "string" && argsFragment.length) {
                        yield { type: "tool_call_delta", index, argsDelta: argsFragment };
                    }
                }
            }
            if (choice.finish_reason) {
                for (const index of started) yield { type: "tool_call_done", index };
                yield { type: "message_done", stopReason: mapFinishReason(choice.finish_reason) };
                doneEmitted = true;
            }
        }
        if (!doneEmitted) {
            for (const index of started) yield { type: "tool_call_done", index };
            yield { type: "message_done", stopReason: started.size ? "tool_use" : "end_turn" };
        }
    }
}

function mapFinishReason(reason: string): "end_turn" | "tool_use" | "max_tokens" {
    if (reason === "tool_calls") return "tool_use";
    if (reason === "length") return "max_tokens";
    return "end_turn";
}

function toOpenAiMessages(messages: AiMessage[], system?: string): Record<string, unknown>[] {
    const out: Record<string, unknown>[] = [];
    if (system?.trim()) out.push({ role: "system", content: system });
    for (const m of messages) {
        if (m.role === "tool") {
            for (const r of m.toolResults ?? []) {
                out.push({ role: "tool", tool_call_id: r.toolCallId, content: r.content });
            }
        } else if (m.role === "assistant") {
            const msg: Record<string, unknown> = { role: "assistant", content: m.text ?? "" };
            if (m.toolCalls?.length) {
                msg.tool_calls = m.toolCalls.map(tc => ({
                    id: tc.id,
                    type: "function",
                    function: { name: tc.name, arguments: JSON.stringify(tc.input ?? {}) },
                }));
            }
            out.push(msg);
        } else {
            out.push({ role: "user", content: m.text ?? "" });
        }
    }
    return out;
}
