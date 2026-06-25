import { AiMessage, AiProvider, AiToolDef, ChatStreamEvent, StreamChatOpts } from "../types";
import { RESERVED_PROMPT_TOKENS } from "../../../models/userSettings";
import { createNewId } from "../../customHooks/utility/tools/idGen";

/**
 * Direct browser adapter for Ollama's NATIVE API ({baseUrl}/api/chat). Unlike the OpenAI-compatible
 * endpoint, the native API honors `options.num_ctx` (context window) and `think`, both of which matter
 * for local models: a small default num_ctx can't hold the homebrew system prompt + tool schemas AND
 * leave room to generate, so the model gets cut off before it emits the tool call. Emits the same
 * normalized ChatStreamEvent stream as the other adapters (NDJSON in, normalized events out).
 */
export class OllamaAdapter implements AiProvider {
    readonly kind = "local" as const;

    constructor(private readonly baseUrl: string) {}

    async *streamChat(
        messages: AiMessage[],
        tools: AiToolDef[] | undefined,
        opts: StreamChatOpts,
    ): AsyncGenerator<ChatStreamEvent, void, unknown> {
        const url = `${this.baseUrl.replace(/\/$/, "")}/api/chat`;
        // For Ollama, output tokens come OUT of num_ctx, so an output cap larger than the window is
        // impossible. Clamp num_predict to (num_ctx − reserved prompt) so a misconfigured maxTokens
        // can't promise more generation room than the window actually has.
        const numCtx = opts.numCtx && opts.numCtx > 0 ? opts.numCtx : undefined;
        let numPredict = opts.maxTokens ?? 4096;
        if (numCtx) numPredict = Math.min(numPredict, Math.max(512, numCtx - RESERVED_PROMPT_TOKENS));
        const options: Record<string, unknown> = { num_predict: numPredict };
        if (numCtx) options.num_ctx = numCtx;
        const body: Record<string, unknown> = {
            model: opts.model,
            stream: true,
            messages: toOllamaMessages(messages, opts.system),
            options,
        };
        // Native API honors a top-level `think`; false suppresses message.thinking entirely. Resolved
        // per-mode by the caller (chat on by default, homebrew off by default).
        if (opts.think !== undefined) body.think = opts.think;
        if (tools?.length) {
            body.tools = tools.map(t => ({
                type: "function",
                function: { name: t.name, description: t.description, parameters: t.inputSchema },
            }));
        }

        let res: Response;
        try {
            res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
                signal: opts.signal,
            });
        } catch (e) {
            yield { type: "error", error: `Could not reach Ollama at ${this.baseUrl}. Is it running? (${String(e)})` };
            yield { type: "message_done", stopReason: "error" };
            return;
        }
        if (!res.ok || !res.body) {
            const detail = await res.text().catch(() => "");
            yield { type: "error", error: `Ollama returned ${res.status} ${res.statusText}${detail ? `: ${detail}` : ""}` };
            yield { type: "message_done", stopReason: "error" };
            return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let toolIndex = 0;
        let sawTool = false;
        let doneEmitted = false;

        try {
            for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                let nl: number;
                // Native API streams newline-delimited JSON, one object per line.
                while ((nl = buffer.indexOf("\n")) >= 0) {
                    const line = buffer.slice(0, nl).trim();
                    buffer = buffer.slice(nl + 1);
                    if (!line) continue;
                    let chunk: any;
                    try { chunk = JSON.parse(line); } catch { continue; }

                    const msg = chunk?.message;
                    if (msg) {
                        if (typeof msg.thinking === "string" && msg.thinking.length) {
                            yield { type: "thinking_delta", text: msg.thinking };
                        }
                        if (typeof msg.content === "string" && msg.content.length) {
                            yield { type: "text_delta", text: msg.content };
                        }
                        if (Array.isArray(msg.tool_calls)) {
                            // Ollama emits a full tool call in one chunk (arguments already an object),
                            // not streamed token-by-token, so emit start+delta+done together.
                            for (const tc of msg.tool_calls) {
                                const index = toolIndex++;
                                sawTool = true;
                                yield { type: "tool_call_start", index, id: `ollama_${createNewId()}`, name: tc?.function?.name ?? "" };
                                const args = tc?.function?.arguments;
                                yield { type: "tool_call_delta", index, argsDelta: typeof args === "string" ? args : JSON.stringify(args ?? {}) };
                                yield { type: "tool_call_done", index };
                            }
                        }
                    }

                    if (chunk?.done) {
                        const reason = chunk.done_reason === "length" ? "max_tokens" : (sawTool ? "tool_use" : "end_turn");
                        yield { type: "message_done", stopReason: reason };
                        doneEmitted = true;
                    }
                }
            }
        } catch (e) {
            if (opts.signal?.aborted) return;
            yield { type: "error", error: `Lost connection to Ollama. (${String(e)})` };
        }

        if (!doneEmitted) yield { type: "message_done", stopReason: sawTool ? "tool_use" : "end_turn" };
    }
}

/** Map the provider-agnostic history to Ollama's native message format (tool results keyed by name). */
function toOllamaMessages(messages: AiMessage[], system?: string): Record<string, unknown>[] {
    const out: Record<string, unknown>[] = [];
    if (system?.trim()) out.push({ role: "system", content: system });

    // Native tool results reference the tool by NAME, not id — resolve from prior assistant tool calls.
    const idToName = new Map<string, string>();
    for (const m of messages) {
        if (m.role === "assistant") for (const tc of m.toolCalls ?? []) idToName.set(tc.id, tc.name);
    }

    for (const m of messages) {
        if (m.role === "tool") {
            for (const r of m.toolResults ?? []) {
                const msg: Record<string, unknown> = { role: "tool", content: r.content };
                const name = idToName.get(r.toolCallId);
                if (name) msg.tool_name = name;
                out.push(msg);
            }
        } else if (m.role === "assistant") {
            const msg: Record<string, unknown> = { role: "assistant", content: m.text ?? "" };
            if (m.toolCalls?.length) {
                msg.tool_calls = m.toolCalls.map(tc => ({ function: { name: tc.name, arguments: tc.input ?? {} } }));
            }
            out.push(msg);
        } else {
            out.push({ role: "user", content: m.text ?? "" });
        }
    }
    return out;
}
