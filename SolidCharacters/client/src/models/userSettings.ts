
export type AiProviderKind = "local" | "anthropic" | "openai";

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
}

export interface UserSettings {
    userId: number;
    username: string;
    email: string;
    theme: string;
    dndSystem: 'both' | '2014' | '2024' | string;
    ai?: AiSettings;
}
