import { AiProviderKind } from "../../models/userSettings";

export type { AiProviderKind };

export type AiRole = "user" | "assistant" | "tool";

export interface AiToolCall {
    id: string;
    name: string;
    input: Record<string, unknown>;
}

export interface AiToolResult {
    toolCallId: string;
    content: string;
    isError?: boolean;
}

/** A user-attached image. `data` is raw base64 (no "data:...;base64," prefix). */
export interface AiImage {
    data: string;
    mediaType: string;   // e.g. "image/png", "image/jpeg"
}

/** A user-attached audio clip. `data` is raw base64 (no "data:...;base64," prefix). */
export interface AiAudio {
    data: string;
    mediaType: string;   // e.g. "audio/wav", "audio/mpeg"
}

/**
 * Provider-agnostic message. `toolCalls` appear on assistant turns; `toolResults` on tool turns.
 * This is the shape the client sends to /api/ai/chat and the shape the local adapter translates
 * to the OpenAI wire format.
 */
export interface AiMessage {
    role: AiRole;
    text?: string;
    /** User-attached images, sent to vision-capable local models. Present only on user turns. */
    images?: AiImage[];
    /** User-attached audio clips, sent to audio-capable local models (e.g. Gemma). Present only on user turns. */
    audio?: AiAudio[];
    toolCalls?: AiToolCall[];
    toolResults?: AiToolResult[];
}

export interface AiToolDef {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
}

export type AiStopReason = "end_turn" | "tool_use" | "max_tokens" | "refusal" | "error";

/**
 * Normalized streaming event. Both adapters (local-direct and cloud-via-.NET-proxy) produce this
 * exact shape, so the store and UI never branch on provider. Tool-call arguments stream as partial
 * JSON across `tool_call_delta` events — accumulate by `index`, JSON.parse only after `tool_call_done`.
 */
export type ChatStreamEvent =
    | { type: "text_delta"; text: string }
    | { type: "thinking_delta"; text: string }
    | { type: "tool_call_start"; index: number; id: string; name: string }
    | { type: "tool_call_delta"; index: number; argsDelta: string }
    | { type: "tool_call_done"; index: number }
    | { type: "message_done"; stopReason: AiStopReason }
    | { type: "error"; error: string };

export interface StreamChatOpts {
    signal?: AbortSignal;
    model: string;
    system?: string;
    maxTokens?: number;
    /** Context window for local models (Ollama native only). */
    numCtx?: number;
    /**
     * Whether to ask the model for reasoning/"thinking" output. Maps to the local servers' `think`
     * field (Ollama native + OpenAI-compatible reasoning models). The caller resolves this per-mode
     * before calling, so adapters just forward it. Undefined leaves the server default untouched.
     */
    think?: boolean;
    /**
     * JSON schema to constrain the model's TEXT output to (native structured outputs: Ollama `format`,
     * OpenAI-compatible `response_format`). When set, adapters MUST NOT send tools — the two modes
     * conflict on local servers — and the caller parses the JSON out of the text stream instead of
     * reading a tool call. Undefined leaves output unconstrained (the tool-call path).
     */
    responseSchema?: Record<string, unknown>;
    /**
     * Ask the server to force a tool call (OpenAI-compatible `tool_choice: "required"`). Ollama's
     * native API has no equivalent and ignores it; meaningless without tools. Used by forced-single-
     * tool pipeline steps so cloud/compat models can't answer in prose instead of calling the tool.
     */
    forceTool?: boolean;
    /**
     * Sampling temperature. Structured/tool-JSON turns pass a low value (~0.2) because the server
     * default (0.8 on Ollama) is tuned for prose, not for emitting exact enum keys and legal JSON.
     * Undefined leaves the server default untouched — chat/narrative turns stay creative.
     */
    temperature?: number;
    /** Nucleus sampling cap. Forwarded verbatim; undefined leaves the server default untouched. */
    topP?: number;
}

export interface AiProvider {
    readonly kind: AiProviderKind;
    streamChat(
        messages: AiMessage[],
        tools: AiToolDef[] | undefined,
        opts: StreamChatOpts,
    ): AsyncGenerator<ChatStreamEvent, void, unknown>;
}
