import { AiMessage, AiProvider, AiProviderKind, AiToolDef, ChatStreamEvent, StreamChatOpts } from "../types";
import { DEFAULT_AI_MAX_TOKENS } from "../../../models/userSettings";
import { parseSse } from "./sse";

/**
 * Cloud adapter. Sends a normalized request to the .NET backend (POST /api/ai/chat), which injects
 * the server-held key, forwards to Anthropic/OpenAI, and re-emits a normalized SSE stream where each
 * `data:` line is a JSON ChatStreamEvent. We just parse and yield those straight through, so the
 * browser never holds an API key and Anthropic's browser-CORS header is never needed.
 */
export class ProxyAdapter implements AiProvider {
    constructor(readonly kind: AiProviderKind) {}

    async *streamChat(
        messages: AiMessage[],
        tools: AiToolDef[] | undefined,
        opts: StreamChatOpts,
    ): AsyncGenerator<ChatStreamEvent, void, unknown> {
        const body = {
            provider: this.kind,
            model: opts.model,
            system: opts.system,
            maxTokens: opts.maxTokens ?? DEFAULT_AI_MAX_TOKENS,
            messages,
            tools,
            // Structured-output/sampling hints. The .NET service maps what its upstream supports and
            // ignores the rest, so threading them is always safe.
            responseSchema: opts.responseSchema,
            forceTool: opts.forceTool,
            temperature: opts.temperature,
            topP: opts.topP,
        };

        let res: Response;
        try {
            res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
                body: JSON.stringify(body),
                signal: opts.signal,
            });
        } catch (e) {
            yield { type: "error", error: `Could not reach the AI service. (${String(e)})` };
            yield { type: "message_done", stopReason: "error" };
            return;
        }
        if (!res.ok || !res.body) {
            const detail = await res.text().catch(() => "");
            yield { type: "error", error: `AI service returned ${res.status}${detail ? `: ${detail}` : ""}` };
            yield { type: "message_done", stopReason: "error" };
            return;
        }

        let doneEmitted = false;
        for await (const ev of parseSse(res.body, opts.signal)) {
            const data = ev.data.trim();
            if (!data || data === "[DONE]") continue;
            let parsed: ChatStreamEvent;
            try { parsed = JSON.parse(data) as ChatStreamEvent; } catch { continue; }
            yield parsed;
            if (parsed.type === "message_done") doneEmitted = true;
        }
        if (!doneEmitted) yield { type: "message_done", stopReason: "end_turn" };
    }
}
