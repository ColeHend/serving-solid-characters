import { Component, For, Show } from "solid-js";
import { Checkbox, Input, Radio, RadioGroup, Slider, SliderStop, Switch } from "coles-solid-library";
import { SettingsField } from "../../../shared/components/settingsField/settingsField";
import { Clone } from "../../../shared/customHooks/utility/tools/Tools";
import getUserSettings from "../../../shared/customHooks/userSettings";
import {
    AiSettings, CreationPipelineLevel, DEFAULT_AI_ASK_TOOLS, DEFAULT_AI_COMMAND_GENERATION,
    DEFAULT_AI_MATH_TOOLS, DEFAULT_AI_PLAN_TOOLS, DEFAULT_CREATION_PIPELINE_LEVEL,
    DEFAULT_HIGH_MAX_SCHEMA_RETRIES, DEFAULT_MEDIUM_RETRIES, DEFAULT_REVIEW_SETTINGS,
    DEFAULT_TOOL_PERMISSIONS, DEFAULT_USAGE_LEVEL, MANDATORY_PASSES, OPTIONAL_PASSES, ReviewPassId,
    ReviewSettings, ReviewerModelMode, ToolPermissions, UsageControlLevel,
} from "../../../models/userSettings";
import { HOMEBREW_KINDS, HOMEBREW_KIND_LABELS, HomebrewKind } from "../../../shared/ai/refs/homebrewKind";
import ReviewAgentList from "../../aiSpark/reviewAgents/ReviewAgentList";

const DEFAULT_AI: Partial<AiSettings> = {
    usageLevel: DEFAULT_USAGE_LEVEL,
    creationPipelineLevel: DEFAULT_CREATION_PIPELINE_LEVEL,
    mediumRetries: DEFAULT_MEDIUM_RETRIES,
    toolPermissions: DEFAULT_TOOL_PERMISSIONS,
    review: DEFAULT_REVIEW_SETTINGS,
};

const hint = { opacity: 0.6, "font-size": "var(--font-size-small)" } as const;
const section = { "margin-top": "var(--spacing-3)" } as const;

// Ordinal Low→Medium→High ladders rendered as sliders. The per-stop blurb (formerly the radio
// label) is surfaced under the slider so no explanation is lost.
const USAGE_STOPS: SliderStop<UsageControlLevel>[] = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
];
const USAGE_HINTS: Record<UsageControlLevel, string> = {
    low: "Low — generate and preview (current behavior).",
    medium: "Medium — auto-retry a failed generation once before showing it.",
    high: "High — run a readiness review before handing content over.",
};
const CREATION_STOPS: SliderStop<CreationPipelineLevel>[] = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
];
const CREATION_HINTS: Record<CreationPipelineLevel, string> = {
    low: "Low — generate each piece in one step (fastest).",
    medium: "Medium — plan a concept first, then build it (more coherent).",
    high: "High — also validate & fix mechanical effects before saving (slowest).",
};

/**
 * "AI Behavior" settings: how much automated QC Grimoire applies (usage level), which content types it
 * may create (tool permissions), and the High-mode readiness pipeline (passes + reviewer model).
 * Reads/writes the same global UserSettings signal as aiSettingsTab; persisted by the popup's Save button.
 */
const AiReviewSettingsTab: Component = () => {
    const [userSettings, setUserSettings] = getUserSettings();
    const ai = (): AiSettings => userSettings().ai ?? (DEFAULT_AI as AiSettings);

    const updateAi = (patch: Partial<AiSettings>) =>
        setUserSettings(old => Clone({ ...old, ai: { ...(old.ai ?? {}), ...patch } as AiSettings }));

    const usageLevel = (): UsageControlLevel => ai().usageLevel ?? DEFAULT_USAGE_LEVEL;
    const creationLevel = (): CreationPipelineLevel => ai().creationPipelineLevel ?? DEFAULT_CREATION_PIPELINE_LEVEL;
    const commandGenOn = (): boolean => ai().commandGeneration ?? DEFAULT_AI_COMMAND_GENERATION;
    const perms = (): ToolPermissions => ai().toolPermissions ?? DEFAULT_TOOL_PERMISSIONS;
    const review = (): ReviewSettings => ai().review ?? DEFAULT_REVIEW_SETTINGS;

    const updatePerms = (patch: Partial<ToolPermissions>) =>
        updateAi({ toolPermissions: { ...perms(), ...patch } });
    const updateReview = (patch: Partial<ReviewSettings>) =>
        updateAi({ review: { ...review(), ...patch } });

    // ----- tool permissions: the per-kind checkbox list reflects allow/deny mode -----
    const kindChecked = (kind: HomebrewKind): boolean => {
        const p = perms();
        if (p.mode === "allow") return (p.allowed ?? []).includes(kind);
        if (p.mode === "deny") return !(p.denied ?? []).includes(kind);
        return true;
    };
    const toggleKind = (kind: HomebrewKind, checked: boolean) => {
        const p = perms();
        if (p.mode === "allow") {
            const set = new Set(p.allowed ?? []);
            checked ? set.add(kind) : set.delete(kind);
            updatePerms({ allowed: HOMEBREW_KINDS.filter(k => set.has(k)) });
        } else if (p.mode === "deny") {
            const set = new Set(p.denied ?? []);
            checked ? set.delete(kind) : set.add(kind);   // checked = NOT denied
            updatePerms({ denied: HOMEBREW_KINDS.filter(k => set.has(k)) });
        }
    };

    // ----- readiness passes: enabledPasses = the mandatory schema gate + the user's optional picks -----
    const passEnabled = (id: ReviewPassId): boolean =>
        (review().enabledPasses ?? DEFAULT_REVIEW_SETTINGS.enabledPasses).includes(id);
    const togglePass = (id: ReviewPassId, on: boolean) => {
        const current = new Set(review().enabledPasses ?? DEFAULT_REVIEW_SETTINGS.enabledPasses);
        on ? current.add(id) : current.delete(id);
        // Rebuild in a stable order: the mandatory schema gate always brackets the chosen optionals.
        const ordered: ReviewPassId[] = [
            MANDATORY_PASSES[0],
            ...OPTIONAL_PASSES.map(p => p.id).filter(p => current.has(p)),
            MANDATORY_PASSES[1],
        ];
        updateReview({ enabledPasses: ordered });
    };

    return (
        <div>
            <h3>AI Behavior</h3>
            <p style={hint}>
                Control how much automated quality-control Grimoire applies to homebrew it generates, and
                which content types it may create.
            </p>

            {/* ---------------- Usage level ---------------- */}
            <div style={section}>
                <label>Usage control level</label>
                <Slider
                    stops={USAGE_STOPS}
                    value={usageLevel()}
                    onChange={(v) => updateAi({ usageLevel: v })}
                    ariaLabel="Usage control level"
                />
                <div style={hint}>{USAGE_HINTS[usageLevel()]}</div>
            </div>

            {/* ---------------- Generation depth ---------------- */}
            <div style={section}>
                <label>Generation depth</label>
                <Slider
                    stops={CREATION_STOPS}
                    value={creationLevel()}
                    onChange={(v) => updateAi({ creationPipelineLevel: v })}
                    ariaLabel="Generation depth"
                />
                <div style={hint}>{CREATION_HINTS[creationLevel()]}</div>
                <div style={hint}>
                    How many passes Grimoire makes when generating content. Higher depth is more coherent and
                    mechanically correct but costs more model calls and time. This is separate from the
                    quality-control level above.
                </div>
                <Show when={creationLevel() === "high" && !commandGenOn()}>
                    <div style={hint}>
                        High's mechanical-effect validation only runs when “Auto-add mechanical effects”
                        (in the AI tab) is enabled — otherwise there are no effects to check.
                    </div>
                </Show>
            </div>

            <Show when={usageLevel() === "medium"}>
                <div style={section}>
                    <label for="ai-medium-retries">Auto-retries on a failed generation</label>
                    <Input
                        id="ai-medium-retries"
                        type="number"
                        value={String(ai().mediumRetries ?? DEFAULT_MEDIUM_RETRIES)}
                        placeholder={String(DEFAULT_MEDIUM_RETRIES)}
                        onInput={(e) => {
                            const n = parseInt(e.currentTarget.value, 10);
                            updateAi({ mediumRetries: Number.isFinite(n) && n >= 0 ? n : undefined });
                        }}
                    />
                    <div style={hint}>How many times to silently re-ask the model when its output fails schema/JSON parsing.</div>
                </div>
            </Show>

            {/* ---------------- Tool permissions ---------------- */}
            <div style={section}>
                <label>Allowed content types</label>
                <RadioGroup value={perms().mode} onChange={(v) => updatePerms({ mode: v as ToolPermissions["mode"] })}>
                    <Radio value="all" label="All — Grimoire may create any content type" />
                    <Radio value="allow" label="Only the types I pick" />
                    <Radio value="deny" label="All except the types I pick" />
                </RadioGroup>
                <Show when={perms().mode !== "all"}>
                    <div style={{ display: "grid", "grid-template-columns": "1fr 1fr", gap: "var(--spacing-1)", "margin-top": "var(--spacing-1)" }}>
                        <For each={HOMEBREW_KINDS}>{(kind) => (
                            <Checkbox
                                label={HOMEBREW_KIND_LABELS[kind]}
                                checked={kindChecked(kind)}
                                onChange={(checked) => toggleKind(kind, checked)}
                            />
                        )}</For>
                    </div>
                </Show>
            </div>

            {/* ---------------- Helper tools (both modes) ---------------- */}
            <div style={section}>
                <label>Helper tools</label>
                <div style={hint}>
                    Extra tools Grimoire can use in both Chat and Homebrew, independent of the content types above.
                </div>
                <div style={{ display: "flex", "flex-direction": "column", gap: "var(--spacing-1)", "margin-top": "var(--spacing-1)" }}>
                    <Switch
                        label="Math tools — exact D&D modifiers, proficiency, and damage-per-round"
                        checked={ai().mathTools ?? DEFAULT_AI_MATH_TOOLS}
                        onChange={(checked) => updateAi({ mathTools: checked })}
                    />
                    <Switch
                        label="Ask me questions — let Grimoire offer choices or ask for a direction inline"
                        checked={ai().askTools ?? DEFAULT_AI_ASK_TOOLS}
                        onChange={(checked) => updateAi({ askTools: checked })}
                    />
                    <Switch
                        label="Propose a plan — let Grimoire suggest a design goal/plan to approve before a big build"
                        checked={ai().planTools ?? DEFAULT_AI_PLAN_TOOLS}
                        onChange={(checked) => updateAi({ planTools: checked })}
                    />
                </div>
            </div>

            {/* ---------------- High-mode readiness pipeline ---------------- */}
            <Show when={usageLevel() === "high"}>
                <div style={section}>
                    <label>Readiness checks</label>
                    <div style={hint}>
                        Schema validation always runs. Enable additional checks below — those marked (LLM)
                        cost an extra model call each and add latency on local models.
                    </div>
                    <div style={{ "margin-top": "var(--spacing-1)" }}>
                        <For each={OPTIONAL_PASSES}>{(p) => (
                            <div style={{ "margin-top": "var(--spacing-1)" }}>
                                <Checkbox
                                    label={`${p.label}${p.llm ? " (LLM)" : ""}`}
                                    checked={passEnabled(p.id)}
                                    onChange={(checked) => togglePass(p.id, checked)}
                                />
                                <div style={hint}>{p.description}</div>
                            </div>
                        )}</For>
                    </div>
                </div>

                <div style={section}>
                    <label>Reviewer model</label>
                    <RadioGroup value={review().reviewerMode} onChange={(v) => updateReview({ reviewerMode: v as ReviewerModelMode })}>
                        <Radio value="primary" label="Use my main model for reviews" />
                        <Radio value="separate" label="Use a separate (smaller/faster) reviewer model" />
                    </RadioGroup>
                    <Show when={review().reviewerMode === "separate"}>
                        <SettingsField
                            label="Model name"
                            hint={<>e.g. <code>llama3.2:3b</code> — a small fast model keeps reviews quick while you generate with a larger one.</>}
                        >
                            <Input
                                id="ai-reviewer-model"
                                value={review().reviewerModel ?? ""}
                                placeholder="e.g. llama3.2:3b"
                                onInput={(e) => updateReview({ reviewerModel: e.currentTarget.value })}
                            />
                        </SettingsField>
                    </Show>
                </div>

                <div style={section}>
                    <label for="ai-max-schema-retries">Regenerations before asking you for direction</label>
                    <Input
                        id="ai-max-schema-retries"
                        type="number"
                        value={String(review().maxSchemaRetries ?? DEFAULT_HIGH_MAX_SCHEMA_RETRIES)}
                        placeholder={String(DEFAULT_HIGH_MAX_SCHEMA_RETRIES)}
                        onInput={(e) => {
                            const n = parseInt(e.currentTarget.value, 10);
                            updateReview({ maxSchemaRetries: Number.isFinite(n) && n >= 0 ? n : undefined });
                        }}
                    />
                    <div style={hint}>
                        If generated content keeps failing schema validation this many times, Grimoire stops
                        retrying and asks you how to proceed instead of looping.
                    </div>
                </div>

                <div style={section}>
                    <ReviewAgentList />
                </div>
            </Show>
        </div>
    );
};

export default AiReviewSettingsTab;
