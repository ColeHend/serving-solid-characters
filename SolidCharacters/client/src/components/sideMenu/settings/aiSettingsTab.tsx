import { Component, createSignal, Show } from "solid-js";
import { Select, Option, Input, Checkbox, Button, addSnackbar } from "coles-solid-library";
import { Clone } from "../../../shared/customHooks/utility/tools/Tools";
import getUserSettings, { refreshAiProviderStatus } from "../../../shared/customHooks/userSettings";
import {
    AiProviderKind, AiSettings, DEFAULT_AI_MAX_TOKENS, DEFAULT_AI_NUM_CTX,
    DEFAULT_AI_THINKING, DEFAULT_AI_THINKING_HOMEBREW, LocalApiKind,
} from "../../../models/userSettings";

const DEFAULT_AI: AiSettings = {
    provider: "local", model: "", localBaseUrl: "", enabled: false,
    maxTokens: DEFAULT_AI_MAX_TOKENS, localApi: "ollama", numCtx: DEFAULT_AI_NUM_CTX,
    thinking: DEFAULT_AI_THINKING, thinkingHomebrew: DEFAULT_AI_THINKING_HOMEBREW,
};

const MODEL_PLACEHOLDER: Record<AiProviderKind, string> = {
    local: "e.g. llama3.1",
    anthropic: "e.g. claude-opus-4-8",
    openai: "e.g. gpt-4o-mini",
};

/**
 * Settings tab for the Spark AI assistant. Provider/model/enabled are stored in UserSettings (and
 * persisted by the popup's "Save Settings" button). Cloud API keys are NOT stored here — they are
 * POSTed to the .NET backend (/api/ai/credentials) and held server-side.
 */
const AiSettingsTab: Component = () => {
    const [userSettings, setUserSettings] = getUserSettings();
    const ai = (): AiSettings => userSettings().ai ?? DEFAULT_AI;

    const [apiKey, setApiKey] = createSignal("");
    const [busy, setBusy] = createSignal(false);

    const updateAi = (patch: Partial<AiSettings>) =>
        setUserSettings(old => Clone({ ...old, ai: { ...(old.ai ?? DEFAULT_AI), ...patch } }));

    const isCloud = () => ai().provider !== "local";

    const saveKey = async () => {
        const key = apiKey().trim();
        if (!key) return;
        setBusy(true);
        try {
            const res = await fetch("/api/ai/credentials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ provider: ai().provider, apiKey: key }),
            });
            if (!res.ok) throw new Error(await res.text());
            setApiKey("");
            refreshAiProviderStatus();
            addSnackbar({ message: "API key saved", severity: "success" });
        } catch (e) {
            addSnackbar({ message: `Could not save key: ${String(e)}`, severity: "error" });
        } finally {
            setBusy(false);
        }
    };

    const clearKey = async () => {
        setBusy(true);
        try {
            await fetch(`/api/ai/credentials/${ai().provider}`, { method: "DELETE" });
            refreshAiProviderStatus();
            addSnackbar({ message: "API key cleared", severity: "success" });
        } catch (e) {
            addSnackbar({ message: `Could not clear key: ${String(e)}`, severity: "error" });
        } finally {
            setBusy(false);
        }
    };

    const testConnection = async () => {
        setBusy(true);
        try {
            let ok = false;
            let message = "";
            if (ai().provider === "local") {
                const base = ai().localBaseUrl.replace(/\/$/, "");
                const res = await fetch(`${base}/v1/models`);
                ok = res.ok;
                message = ok ? "Reached the local model server." : `Server returned ${res.status}.`;
            } else {
                const res = await fetch(`/api/ai/test?provider=${ai().provider}`);
                const data = await res.json().catch(() => ({ ok: res.ok, message: res.statusText }));
                ok = !!data.ok;
                message = data.message ?? (ok ? "Connected." : "Failed.");
            }
            addSnackbar({ message, severity: ok ? "success" : "error" });
        } catch (e) {
            addSnackbar({ message: `Test failed: ${String(e)}`, severity: "error" });
        } finally {
            setBusy(false);
        }
    };

    return (
        <div>
            <h3>AI (Spark)</h3>
            <p style={{ opacity: 0.75, "font-size": "var(--font-size-small)" }}>
                Configure the AI assistant. Cloud keys are stored on the server, never in your browser.
                Local models are called directly from this device.
            </p>

            <div>
                <label>Provider: {ai().provider}</label>
                <Select<string> value={ai().provider} onSelect={(e) => updateAi({ provider: e as AiProviderKind })}>
                    <Option value="local">Local (Ollama / LM Studio)</Option>
                    <Option value="anthropic">Anthropic</Option>
                    <Option value="openai">OpenAI</Option>
                </Select>
            </div>

            <div>
                <label for="ai-model">Model</label>
                <Input
                    id="ai-model"
                    value={ai().model}
                    placeholder={MODEL_PLACEHOLDER[ai().provider]}
                    onInput={(e) => updateAi({ model: e.currentTarget.value })}
                />
            </div>

            <Show when={ai().provider === "local"}>
                <div>
                    <label for="ai-base-url">Base URL</label>
                    <Input
                        id="ai-base-url"
                        value={ai().localBaseUrl}
                        placeholder="http://localhost:11434"
                        onInput={(e) => updateAi({ localBaseUrl: e.currentTarget.value })}
                    />
                </div>

                <div>
                    <label>Local API</label>
                    <Select<string> value={ai().localApi ?? "ollama"} onSelect={(e) => updateAi({ localApi: e as LocalApiKind })}>
                        <Option value="ollama">Ollama (native — context + thinking control)</Option>
                        <Option value="openai">OpenAI-compatible (LM Studio, llama.cpp)</Option>
                    </Select>
                </div>

                <Show when={(ai().localApi ?? "ollama") === "ollama"}>
                    <div>
                        <label for="ai-num-ctx">Context window (num_ctx)</label>
                        <Input
                            id="ai-num-ctx"
                            type="number"
                            value={String(ai().numCtx ?? DEFAULT_AI_NUM_CTX)}
                            placeholder={String(DEFAULT_AI_NUM_CTX)}
                            onInput={(e) => {
                                const n = parseInt(e.currentTarget.value, 10);
                                updateAi({ numCtx: Number.isFinite(n) && n > 0 ? n : undefined });
                            }}
                        />
                        <div style={{ opacity: 0.6, "font-size": "var(--font-size-small)" }}>
                            How much the model sees at once (prompt + tool definitions + response), default
                            {" "}{DEFAULT_AI_NUM_CTX}. Ollama's own default (~4096) is often too small for homebrew
                            generation and causes "cut off" responses — raise it (your model supports far more).
                        </div>
                    </div>
                </Show>
            </Show>

            <Show when={isCloud()}>
                <div>
                    <label for="ai-key">API Key (stored on the server)</label>
                    <Input id="ai-key" type="password" value={apiKey()} placeholder="Paste key to save…" onInput={(e) => setApiKey(e.currentTarget.value)} />
                    <div style={{ display: "flex", gap: "var(--spacing-1)", "margin-top": "var(--spacing-1)" }}>
                        <Button disabled={busy() || !apiKey().trim()} onClick={saveKey}>Save key</Button>
                        <Button transparent disabled={busy()} onClick={clearKey}>Clear key</Button>
                    </div>
                </div>
            </Show>

            <div>
                <label for="ai-max-tokens">Max response tokens</label>
                <Input
                    id="ai-max-tokens"
                    type="number"
                    value={String(ai().maxTokens ?? DEFAULT_AI_MAX_TOKENS)}
                    placeholder={String(DEFAULT_AI_MAX_TOKENS)}
                    onInput={(e) => {
                        const n = parseInt(e.currentTarget.value, 10);
                        updateAi({ maxTokens: Number.isFinite(n) && n > 0 ? n : undefined });
                    }}
                />
                <div style={{ opacity: 0.6, "font-size": "var(--font-size-small)" }}>
                    Caps the model's response length (default {DEFAULT_AI_MAX_TOKENS}). Higher allows longer
                    homebrew but is slower. For local models this must fit inside the server's context window
                    (Ollama <code>num_ctx</code>); some cloud models cap lower (e.g. gpt-4o-mini at 16384).
                </div>
            </div>

            <div style={{ "margin-top": "var(--spacing-2)" }}>
                <Checkbox
                    label="Enable model thinking (chat)"
                    checked={ai().thinking ?? DEFAULT_AI_THINKING}
                    onChange={(checked) => updateAi({ thinking: checked })}
                />
                <div style={{ opacity: 0.6, "font-size": "var(--font-size-small)" }}>
                    Lets the model reason before answering. Improves quality and encourages local models to
                    use more of their context window, but uses more tokens.
                </div>
            </div>

            <div style={{ "margin-top": "var(--spacing-2)" }}>
                <Checkbox
                    label="Enable thinking during Homebrew generation"
                    checked={ai().thinkingHomebrew ?? DEFAULT_AI_THINKING_HOMEBREW}
                    onChange={(checked) => updateAi({ thinkingHomebrew: checked })}
                />
                <div style={{ opacity: 0.6, "font-size": "var(--font-size-small)" }}>
                    Off by default: while generating homebrew, a reasoning model can spend its whole token
                    budget thinking and get "cut off" before producing the entity. If you turn this on and see
                    truncated results, use "Complete with AI" or raise max tokens / context window.
                </div>
            </div>

            <div style={{ "margin-top": "var(--spacing-2)" }}>
                <Checkbox label="Enable Spark assistant" checked={ai().enabled} onChange={(checked) => updateAi({ enabled: checked })} />
            </div>

            <div style={{ "margin-top": "var(--spacing-2)" }}>
                <Button transparent disabled={busy()} onClick={testConnection}>Test connection</Button>
            </div>
        </div>
    );
};

export default AiSettingsTab;
