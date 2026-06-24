
export type AiProviderKind = "local" | "anthropic" | "openai";

/** Which local API flavor to call: Ollama's native /api/chat (supports num_ctx + think) or OpenAI-compatible. */
export type LocalApiKind = "ollama" | "openai";

/** Default cap on the model's response length (output tokens) when the user hasn't set one. */
export const DEFAULT_AI_MAX_TOKENS = 16384;

/**
 * Default context window for local models. Ollama's own default is ~4096, which is too small to hold
 * the homebrew system prompt + tool schemas AND leave room to generate — so we raise it here.
 */
export const DEFAULT_AI_NUM_CTX = 8192;

/**
 * AI ("Spark") configuration. Only non-secret selection lives here / in IndexedDB —
 * cloud API keys are sent to the .NET backend and stored server-side, never persisted
 * in the browser. `localBaseUrl` only applies to the `local` provider (direct browser call).
 */
export interface AiSettings {
    provider: AiProviderKind;
    model: string;
    localBaseUrl: string;
    enabled: boolean;
    /** Cap on the model's response length (output tokens). Defaults to DEFAULT_AI_MAX_TOKENS. */
    maxTokens?: number;
    /** Local API flavor (local provider only). Defaults to "ollama". */
    localApi?: LocalApiKind;
    /** Context window for local models (Ollama only). Defaults to DEFAULT_AI_NUM_CTX. */
    numCtx?: number;
}

export interface UserSettings {
    userId: number;
    username: string;
    email: string;
    theme: string;
    dndSystem: 'both' | '2014' | '2024' | string;
    ai?: AiSettings;
}
