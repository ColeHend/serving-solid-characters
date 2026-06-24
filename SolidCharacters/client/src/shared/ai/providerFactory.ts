import { AiSettings } from "../../models/userSettings";
import { AiProvider } from "./types";
import { LocalAdapter } from "./providers/localAdapter";
import { ProxyAdapter } from "./providers/proxyAdapter";

/**
 * Builds the right provider for the current settings: local models are hit directly from the
 * browser; Anthropic/OpenAI go through the .NET proxy so the key stays server-side.
 */
export function buildProvider(ai: AiSettings): AiProvider {
    if (ai.provider === "local") return new LocalAdapter(ai.localBaseUrl);
    return new ProxyAdapter(ai.provider);
}
