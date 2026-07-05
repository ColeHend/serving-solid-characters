import { Component, createSignal, Match, Show, Switch as SolidSwitch, runWithOwner } from "solid-js";
import { Select, Option, Input, Button, addSnackbar, Slider, SliderStop, Switch } from "coles-solid-library";
import { SettingsField } from "../../../shared/components/settingsField/settingsField";
import { Clone } from "../../../shared/customHooks/utility/tools/Tools";
import getUserSettings, { refreshAiProviderStatus } from "../../../shared/customHooks/userSettings";
import {
    AiProviderKind, AiSettings, DEFAULT_AI_COMMAND_GENERATION, DEFAULT_AI_MAX_AUDIO_SECONDS, DEFAULT_AI_MAX_TOKENS,
    DEFAULT_AI_NUM_CTX, DEFAULT_AI_PERSONA_STRENGTH, DEFAULT_AI_RESUME_GENERATION, DEFAULT_AI_SHOW_THINKING,
    DEFAULT_AI_THINKING, DEFAULT_AI_THINKING_HOMEBREW, DEFAULT_AI_TOKEN_CAP, LocalApiKind, PersonaStrength,
} from "../../../models/userSettings";
import { diagnoseLocalEndpoint, normalizeBaseUrl, probeLocalEndpoint } from "../../../shared/ai/localEndpoint";
import { combinedUsed, ensureOverallUsageLoaded, overallUsage, resetOverall } from "../../../shared/ai/overallUsage";
import { fmtExact } from "../../aiSpark/aiSpark.shared";

const DEFAULT_AI: AiSettings = {
    provider: "local", model: "", localBaseUrl: "", enabled: false,
    maxTokens: DEFAULT_AI_MAX_TOKENS, localApi: "ollama", numCtx: DEFAULT_AI_NUM_CTX,
    thinking: DEFAULT_AI_THINKING, thinkingHomebrew: DEFAULT_AI_THINKING_HOMEBREW,
    showThinking: DEFAULT_AI_SHOW_THINKING,
};

const MODEL_PLACEHOLDER: Record<AiProviderKind, string> = {
    local: "e.g. llama3.1",
    anthropic: "e.g. claude-opus-4-8",
    openai: "e.g. gpt-4o-mini",
};

// The persona ladder minus "auto" — "auto" is surfaced as its own switch above the slider.
type PersonaLevel = Exclude<PersonaStrength, "auto">;
const PERSONA_STOPS: SliderStop<PersonaLevel>[] = [
    { value: "off", label: "Off" },
    { value: "min", label: "Minimal" },
    { value: "low", label: "Low" },
    { value: "full", label: "Full" },
];

/**
 * Settings tab for the Grimoire AI assistant. Provider/model/enabled are stored in UserSettings (and
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

    // In-character voice: "auto" is a mode (a switch); the Off→Full ladder is the slider.
    const persona = (): PersonaStrength => ai().personaStrength ?? DEFAULT_AI_PERSONA_STRENGTH;
    const isAutoPersona = (): boolean => persona() === "auto";
    // When auto is on the slider is disabled; show it at a neutral position rather than snapping to Off.
    const personaLevel = (): PersonaLevel => {
        const current = persona();
        return current === "auto" ? "full" : current;
    };

    // Load the persisted overall token total so the "Overall used" readout is accurate on first open.
    void ensureOverallUsageLoaded();

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
                const verdict = await probeLocalEndpoint(ai().localBaseUrl, { localApi: ai().localApi ?? "ollama" });
                switch (verdict.kind) {
                    case "reachable":
                        ok = true;
                        message = "Reached the local model server.";
                        break;
                    case "blocked-cors":
                        message = "Server is up but the browser blocked the request — set OLLAMA_ORIGINS on the server to allow this site's origin.";
                        break;
                    case "mixed-content":
                        message = "Your HTTPS site can't call an HTTP endpoint (mixed content). See the note under the Base URL field.";
                        break;
                    case "down":
                        message = `No response from ${normalizeBaseUrl(ai().localBaseUrl)} — is the server running and reachable from this device?`;
                        break;
                    case "invalid-url":
                    case "empty":
                        message = "Enter a valid Base URL, e.g. http://192.168.1.50:11434";
                        break;
                }
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
        <div style={{width: "99%"}}>
            <h3>AI (Grimoire)</h3>
            <p style={{ opacity: 0.75, "font-size": "var(--font-size-small)" }}>
                Configure the AI assistant. Cloud keys are stored on the server, never in your browser.
                Local models are called directly from this device.
            </p>

            <SettingsField label="Provider">
                <Select<string>
                    value={ai().provider}
                    onChange={(v) => {
                        if (v === ai().provider) return;   // skip the coles Select mount/echo write
                        runWithOwner(null, () => updateAi({ provider: v as AiProviderKind }));
                    }}
                >
                    <Option value="local">Local (Ollama / LM Studio)</Option>
                    <Option value="anthropic">Anthropic</Option>
                    <Option value="openai">OpenAI</Option>
                </Select>
            </SettingsField>

            <SettingsField label="Model" hint={MODEL_PLACEHOLDER[ai().provider]}>
                <Input
                    id="ai-model"
                    value={ai().model}
                    placeholder={MODEL_PLACEHOLDER[ai().provider]}
                    onChange={(e) => updateAi({ model: e.currentTarget.value })}
                />
            </SettingsField>

            <Show when={ai().provider === "local"}>
                <SettingsField label="Base URL" hint="e.g. http://localhost:11434">
                    <Input
                        id="ai-base-url"
                        value={ai().localBaseUrl}
                        placeholder="http://localhost:11434"
                        onChange={(e) => updateAi({ localBaseUrl: e.currentTarget.value })}
                    />
                </SettingsField>

                <Show when={diagnoseLocalEndpoint(ai().localBaseUrl).kind === "mixed-content"}>
                    <div style={{
                        "margin-top": "var(--spacing-1)", padding: "var(--spacing-2)",
                        "border-radius": "var(--spacing-1)", background: "var(--surface-color)",
                        "font-size": "var(--font-size-small)",
                    }}>
                        ⚠️ This site is HTTPS but the endpoint is HTTP on a LAN address — browsers block that
                        (mixed content). A <code>localhost</code> address would be fine; a routable IP like
                        192.168.x.x is not. To connect, choose <b>one</b>:
                        <ul style={{ margin: "var(--spacing-1) 0", "padding-left": "var(--spacing-3)" }}>
                            <li><b>Same machine:</b> if the model runs where this browser does, use <code>http://localhost:11434</code> — localhost is exempt from the block (you may still need <code>OLLAMA_ORIGINS</code> for CORS).</li>
                            <li><b>Quick:</b> allow "Insecure content" for this site in your browser's site settings, and set <code>OLLAMA_ORIGINS</code> on the server to include this site's origin (or <code>*</code>).</li>
                            <li><b>Robust:</b> put the model behind HTTPS (Cloudflare Tunnel or a TLS reverse proxy), use that <code>https://</code> URL, and set <code>OLLAMA_ORIGINS</code> to this origin.</li>
                        </ul>
                    </div>
                </Show>

                <SettingsField label="Local API">
                    <Select<string>
                        value={ai().localApi ?? "ollama"}
                        onChange={(v) => {
                            if (v === (ai().localApi ?? "ollama")) return;   // skip the coles Select mount/echo write
                            runWithOwner(null, () => updateAi({ localApi: v as LocalApiKind }));
                        }}
                    >
                        <Option value="ollama">Ollama (native — context + thinking control)</Option>
                        <Option value="openai">OpenAI-compatible (LM Studio, llama.cpp)</Option>
                    </Select>
                </SettingsField>

                <Show when={(ai().localApi ?? "ollama") === "ollama"}>
                    <div>
                        <label for="ai-num-ctx">Context window (num_ctx)</label>
                        <Input
                            id="ai-num-ctx"
                            type="number"
                            value={String(ai().numCtx ?? DEFAULT_AI_NUM_CTX)}
                            placeholder={String(DEFAULT_AI_NUM_CTX)}
                            onChange={(e) => {
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

                <div>
                    <label for="ai-max-audio">Max mic recording length (seconds)</label>
                    <Input
                        id="ai-max-audio"
                        type="number"
                        value={String(ai().maxAudioSeconds ?? DEFAULT_AI_MAX_AUDIO_SECONDS)}
                        placeholder={String(DEFAULT_AI_MAX_AUDIO_SECONDS)}
                        onChange={(e) => {
                            const n = parseInt(e.currentTarget.value, 10);
                            updateAi({ maxAudioSeconds: Number.isFinite(n) && n > 0 ? n : undefined });
                        }}
                    />
                    <div style={{ opacity: 0.6, "font-size": "var(--font-size-small)" }}>
                        How long a microphone clip can be, default {DEFAULT_AI_MAX_AUDIO_SECONDS}s. Gemma's hard
                        audio limit is 30s; longer clips are truncated by the model.
                    </div>
                </div>
            </Show>

            <Show when={isCloud()}>
                <SettingsField label="API Key (stored on the server)" hint="Paste a key and press Save; it's sent to the server, never kept in your browser.">
                    <Input id="ai-key" type="password" value={apiKey()} placeholder="Paste key to save…" onChange={(e) => setApiKey(e.currentTarget.value)} />
                </SettingsField>
                <div style={{ display: "flex", gap: "var(--spacing-1)", "margin-top": "var(--spacing-1)" }}>
                    <Button disabled={busy() || !apiKey().trim()} onClick={saveKey}>Save key</Button>
                    <Button transparent disabled={busy()} onClick={clearKey}>Clear key</Button>
                </div>
            </Show>

            <div>
                <label for="ai-max-tokens">Max response tokens</label>
                <Input
                    id="ai-max-tokens"
                    type="number"
                    value={String(ai().maxTokens ?? DEFAULT_AI_MAX_TOKENS)}
                    placeholder={String(DEFAULT_AI_MAX_TOKENS)}
                    onChange={(e) => {
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
                <label for="ai-token-cap">Token budget cap (0 = unlimited)</label>
                <Input
                    id="ai-token-cap"
                    type="number"
                    value={String(ai().tokenCap ?? DEFAULT_AI_TOKEN_CAP)}
                    placeholder={String(DEFAULT_AI_TOKEN_CAP)}
                    onChange={(e) => {
                        const n = parseInt(e.currentTarget.value, 10);
                        // Guard admits 0 (the meaningful "unlimited" value), unlike maxTokens/numCtx which reject it.
                        updateAi({ tokenCap: Number.isFinite(n) && n >= 0 ? n : undefined });
                    }}
                />
                {/* The "overall used / limit" readout with a Reset button, right next to the cap it applies to. */}
                <div style={{ display: "flex", "align-items": "center", gap: "var(--spacing-2)", "margin-top": "var(--spacing-1)" }}>
                    <span style={{ "font-variant-numeric": "tabular-nums" }}>
                        Overall used: <strong>{overallUsage().estimated ? "~" : ""}{fmtExact(combinedUsed(overallUsage()))}</strong>
                        {(ai().tokenCap ?? DEFAULT_AI_TOKEN_CAP) > 0 ? ` / ${fmtExact(ai().tokenCap ?? DEFAULT_AI_TOKEN_CAP)}` : " (unlimited)"}
                    </span>
                    <Button transparent title="Reset the overall token total to zero" onClick={() => resetOverall()}>Reset</Button>
                </div>
                <div style={{ opacity: 0.6, "font-size": "var(--font-size-small)" }}>
                    Total input + output tokens Grimoire may spend before it stops starting new turns. <b>0 = unlimited</b>
                    {" "}(the default). Counts every model call across all chats — replies, homebrew generation, titles, and
                    reviews. This is a cumulative <em>budget</em>, distinct from <em>Max response tokens</em> above (which caps a
                    single reply's length). A turn already running is allowed to finish, so usage may overshoot slightly.
                </div>
            </div>

            <div style={{ "margin-top": "var(--spacing-2)" }}>
                <Switch
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
                <Switch
                    label="Show AI thoughts in chat"
                    checked={ai().showThinking ?? DEFAULT_AI_SHOW_THINKING}
                    onChange={(checked) => updateAi({ showThinking: checked })}
                />
                <div style={{ opacity: 0.6, "font-size": "var(--font-size-small)" }}>
                    Off by default: Grimoire shows a short status while it works instead of its raw reasoning.
                    Turn on to reveal the collapsible "Thoughts" block on each reply.
                </div>
            </div>

            <div style={{ "margin-top": "var(--spacing-2)" }}>
                <Switch
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
                <Switch
                    label="Auto-add mechanical effects to generated homebrew"
                    checked={ai().commandGeneration ?? DEFAULT_AI_COMMAND_GENERATION}
                    onChange={(checked) => updateAi({ commandGeneration: checked })}
                />
                <div style={{ opacity: 0.6, "font-size": "var(--font-size-small)" }}>
                    On by default: after generating a race, class, subclass, background, or feat, a helper reads
                    each feature and attaches the matching character-sheet effects (resistances, ability changes,
                    proficiencies, speed, etc.) so the content actually works on the sheet. Adds one short model
                    call per generated entity.
                </div>
            </div>

            <div style={{ "margin-top": "var(--spacing-2)" }}>
                <Switch
                    label="Resume interrupted generations on reload"
                    checked={ai().resumeGeneration ?? DEFAULT_AI_RESUME_GENERATION}
                    onChange={(checked) => updateAi({ resumeGeneration: checked })}
                />
                <div style={{ opacity: 0.6, "font-size": "var(--font-size-small)" }}>
                    On by default: staged class/character generation checkpoints after every step, so reloading
                    a chat whose build was interrupted offers to pick it up where it left off. Turn off to
                    always start such builds fresh.
                </div>
            </div>

            <div style={{ "margin-top": "var(--spacing-2)" }}>
                <Switch label="Enable Grimoire assistant" checked={ai().enabled} onChange={(checked) => updateAi({ enabled: checked })} />
            </div>

            <div style={{ "margin-top": "var(--spacing-2)" }}>
                <label>In-character voice</label>
                <div style={{ "margin-top": "var(--spacing-1)", "margin-bottom": "var(--spacing-2)" }}>
                    <Switch
                        label="Match the model (Auto)"
                        checked={isAutoPersona()}
                        onChange={(on) => updateAi({ personaStrength: on ? "auto" : "full" })}
                    />
                </div>
                <Slider
                    stops={PERSONA_STOPS}
                    value={personaLevel()}
                    onChange={(v) => updateAi({ personaStrength: v })}
                    disabled={isAutoPersona()}
                    ariaLabel="In-character voice level"
                />
                <div style={{ opacity: 0.6, "font-size": "var(--font-size-small)", "margin-top": "var(--spacing-1)" }}>
                    <span>
                        How much Grimoire speaks as a sentient spellbook. Substance — rules, numbers, stat blocks —
                    stays plain at every level.
                    </span>
                    <br />
                    <span>
                        <SolidSwitch>
                            <Match when={persona() === 'auto'}>
                                "Auto" keeps it minimal on local models and full on cloud;
                            </Match>
                            <Match when={persona() === 'off'}>
                                "Off" is a neutral, mechanical voice;
                            </Match>
                            <Match when={persona() === 'min'}>
                                "Minimal" adds a touch of warmth and personality;
                            </Match>
                            <Match when={persona() === 'low'}>
                                "Low" adds a bit more character and flair;
                            </Match>
                            <Match when={persona() === 'full'}>
                                "Full" is a rich, lively voice with lots of character.
                            </Match>
                        </SolidSwitch>
                    </span>
                </div>
            </div>

            <div style={{ "margin-top": "var(--spacing-2)" }}>
                <Button transparent disabled={busy()} onClick={testConnection}>Test connection</Button>
            </div>
        </div>
    );
};

export default AiSettingsTab;
