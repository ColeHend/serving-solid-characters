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

/**
 * Provider-agnostic message. `toolCalls` appear on assistant turns; `toolResults` on tool turns.
 * This is the shape the client sends to /api/ai/chat and the shape the local adapter translates
 * to the OpenAI wire format.
 */
export interface AiMessage {
    role: AiRole;
    text?: string;
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
}

export interface AiProvider {
    readonly kind: AiProviderKind;
    streamChat(
        messages: AiMessage[],
        tools: AiToolDef[] | undefined,
        opts: StreamChatOpts,
    ): AsyncGenerator<ChatStreamEvent, void, unknown>;
}
