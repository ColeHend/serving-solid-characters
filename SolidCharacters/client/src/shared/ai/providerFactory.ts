import { AiSettings } from "../../models/userSettings";
import { AiProvider } from "./types";
import { LocalAdapter } from "./providers/localAdapter";
import { OllamaAdapter } from "./providers/ollamaAdapter";
import { ProxyAdapter } from "./providers/proxyAdapter";

/**
 * Builds the right provider for the current settings: local models are hit directly from the
 * browser; Anthropic/OpenAI go through the .NET proxy so the key stays server-side. Local defaults
 * to Ollama's native API (so num_ctx/think are controllable); set localApi: "openai" for LM Studio /
 * llama.cpp and other OpenAI-compatible servers.
 */
export function buildProvider(ai: AiSettings): AiProvider {
    if (ai.provider === "local") {
        return ai.localApi === "openai" ? new LocalAdapter(ai.localBaseUrl) : new OllamaAdapter(ai.localBaseUrl);
    }
    return new ProxyAdapter(ai.provider);
}
