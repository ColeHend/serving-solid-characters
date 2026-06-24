import { Component, createSignal, Show } from "solid-js";
import { Select, Option, Input, Checkbox, Button, addSnackbar } from "coles-solid-library";
import { Clone } from "../../../shared/customHooks/utility/tools/Tools";
import getUserSettings, { refreshAiProviderStatus } from "../../../shared/customHooks/userSettings";
import { AiProviderKind, AiSettings } from "../../../models/userSettings";

const DEFAULT_AI: AiSettings = { provider: "local", model: "", localBaseUrl: "", enabled: false };

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
