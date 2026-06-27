import type { HomebrewKind } from "../shared/ai/refs/homebrewKind";

export type AiProviderKind = "local" | "anthropic" | "openai";

/** Which local API flavor to call: Ollama's native /api/chat (supports num_ctx + think) or OpenAI-compatible. */
export type LocalApiKind = "ollama" | "openai";

/**
 * How much automated quality-control Grimoire applies to generated homebrew before handing it over.
 * - "low":    current behavior — generate → preview → the user confirms.
 * - "medium": on a schema/parse failure, auto-retry the generation at least once before surfacing it.
 * - "high":   run each entity through a readiness pipeline (deterministic + LLM review passes) and,
 *             after repeated schema failures, ask the user for direction.
 */
export type UsageControlLevel = "low" | "medium" | "high";
export const DEFAULT_USAGE_LEVEL: UsageControlLevel = "low";

/** Medium-mode auto-retry budget on a schema/parse failure ("at least once"). */
export const DEFAULT_MEDIUM_RETRIES = 1;

/** High-mode schema-gate failures tolerated (regenerations) before we stop and ask the user. */
export const DEFAULT_HIGH_MAX_SCHEMA_RETRIES = 2;

/** Severity of a review issue; also the threshold at/above which a finding blocks Save. */
export type ReviewSeverity = "info" | "warning" | "error";

/** Stable identifiers for the built-in readiness passes, in canonical pipeline order. */
export type ReviewPassId =
    | "schema_validate"        // deterministic (always blocks)
    | "broken_reference"       // deterministic (always blocks)
    | "linter"                 // deterministic terminology/placeholder lint
    | "balance"                // LLM judgment
    | "action_economy"         // LLM judgment
    | "exploit_loop"           // LLM judgment
    | "dominant_option"        // LLM judgment
    | "schema_validate_final"; // deterministic re-check (always blocks)

/**
 * Curated default set for High mode: the two free deterministic gates + the single highest-value LLM
 * pass (balance) + a final schema re-check. Action-economy/exploit/dominant-option/LLM-linter are
 * opt-in (each individually toggleable) so default High stays ~one extra LLM call on local models.
 */
export const DEFAULT_HIGH_PASSES: ReviewPassId[] = [
    "schema_validate", "broken_reference", "linter", "balance", "schema_validate_final",
];

/** The schema gate always runs in High mode (before handoff + a final re-check); not user-toggleable. */
export const MANDATORY_PASSES: ReviewPassId[] = ["schema_validate", "schema_validate_final"];

/** User-toggleable readiness passes, with UI metadata. `llm` passes cost an extra model call. */
export const OPTIONAL_PASSES: { id: ReviewPassId; label: string; description: string; llm: boolean }[] = [
    { id: "broken_reference", label: "Broken-reference check", description: "Flags references to classes, spells or feats that don't exist (deterministic — free).", llm: false },
    { id: "linter", label: "Terminology lint", description: "Catches non-5e wording and placeholder text like TODO/lorem (deterministic — free).", llm: false },
    { id: "balance", label: "Balance review", description: "Judges whether power matches the level/rarity/tier of official content (LLM).", llm: true },
    { id: "action_economy", label: "Action-economy review", description: "Checks for extra actions, free reactions or bonus-action stacking (LLM).", llm: true },
    { id: "exploit_loop", label: "Exploit / loop detector", description: "Looks for infinite combos or unbounded value (LLM).", llm: true },
    { id: "dominant_option", label: "Dominant-option detector", description: "Checks whether it strictly dominates an existing official option (LLM).", llm: true },
];

/** Where the review LLM calls run: reuse the primary model, or a separately-configured reviewer. */
export type ReviewerModelMode = "primary" | "separate";

/**
 * Allow/deny which create_* tools (homebrew kinds) the model may use. Independent of usageLevel.
 * - "all":  every kind (default).
 * - "allow": only kinds in `allowed`.
 * - "deny":  every kind except those in `denied`.
 */
export interface ToolPermissions {
    mode: "all" | "allow" | "deny";
    allowed?: HomebrewKind[];
    denied?: HomebrewKind[];
}
export const DEFAULT_TOOL_PERMISSIONS: ToolPermissions = { mode: "all" };

/** High-mode readiness-pipeline configuration. */
export interface ReviewSettings {
    /** Which passes run, by id. Defaults to DEFAULT_HIGH_PASSES. */
    enabledPasses: ReviewPassId[];
    /** Reuse the primary model for reviews, or a separate (e.g. smaller/faster) one. Default "primary". */
    reviewerMode: ReviewerModelMode;
    /** Model name for reviews when reviewerMode === "separate". */
    reviewerModel?: string;
    /** Optional context window for the reviewer (local Ollama). Falls back to the primary numCtx. */
    reviewerNumCtx?: number;
    /** Schema-gate regenerations tolerated before asking the user. Defaults to DEFAULT_HIGH_MAX_SCHEMA_RETRIES. */
    maxSchemaRetries?: number;
    /** Severity at/above which a finding disables Save. Defaults to "error". */
    blockingSeverity?: ReviewSeverity;
}

export const DEFAULT_REVIEW_SETTINGS: ReviewSettings = {
    enabledPasses: DEFAULT_HIGH_PASSES,
    reviewerMode: "primary",
    maxSchemaRetries: DEFAULT_HIGH_MAX_SCHEMA_RETRIES,
    blockingSeverity: "error",
};

/** Default cap on the model's response length (output tokens) when the user hasn't set one. */
export const DEFAULT_AI_MAX_TOKENS = 16384;

/**
 * Default context window for local models. Ollama's own default is ~4096, which is too small to hold
 * the homebrew system prompt + tool schemas AND leave room to generate. The homebrew tool surface +
 * system prompt is measured at ~5-6k tokens, so 8192 left almost no room for the conversation history
 * or the generated tool call (truncated/empty previews). Raised so a create-class/race/subclass turn —
 * and the upcoming lookup/edit tools — have real generation headroom. gemma-12B handles this comfortably.
 */
export const DEFAULT_AI_NUM_CTX = 16384;

/**
 * Tokens to hold back from the context window for the system prompt + tool schemas + history when
 * computing the local model's effective output cap (num_predict). For Ollama, output tokens come OUT of
 * num_ctx, so an output cap larger than (num_ctx − this reserve) is impossible; the adapter clamps to it.
 */
export const RESERVED_PROMPT_TOKENS = 4096;

/**
 * Default for model "thinking"/reasoning in plain chat. On by default: reasoning improves answer
 * quality and encourages local models to use more of their context window.
 */
export const DEFAULT_AI_THINKING = true;

/**
 * Default for thinking during HOMEBREW generation. Off by default: on a tool turn a reasoning model
 * tends to spend its whole token budget thinking out loud and hit max_tokens before emitting the
 * create_* tool call, producing an empty/truncated preview. The user can opt in per-setting.
 */
export const DEFAULT_AI_THINKING_HOMEBREW = false;

/**
 * Default for SHOWING the model's raw reasoning in chat (display only; separate from `thinking`,
 * which requests reasoning). Off by default — the rotating status ticker is shown instead.
 */
export const DEFAULT_AI_SHOW_THINKING = false;

/**
 * Defaults for the utility tools available in BOTH chat and homebrew modes (independent of usageLevel
 * and toolPermissions, which only gate homebrew create_* tools). All default ON — they're low-risk and
 * a bad compute call is self-correcting — but each can be turned off if a local model abuses it.
 */
export const DEFAULT_AI_MATH_TOOLS = true;   // calc_* deterministic D&D math
export const DEFAULT_AI_ASK_TOOLS = true;    // ask_user (questions / pick a direction)
export const DEFAULT_AI_PLAN_TOOLS = true;   // propose_plan (design goal / plan)
/** lookup_srd / lookup_homebrew (read-only reference search) + the research delegate. Default ON. */
export const DEFAULT_AI_LOOKUP_TOOLS = true;
/** Let the model switch its own mode (switch_mode) when it needs a tool the current mode lacks. Default ON. */
export const DEFAULT_AI_AUTO_SWITCH = true;
/**
 * After generating feature-bearing homebrew (race/class/subclass/background/feat), run a sub-agent that
 * attaches the matching "mads" character-change commands so the content affects the sheet. Default ON;
 * runs at every usage level (independent of the High-mode readiness pipeline). See shared/ai/commands.
 */
export const DEFAULT_AI_COMMAND_GENERATION = true;

/**
 * Offer to resume an interrupted staged generation (class/character pipeline) when a conversation with an
 * in-flight checkpoint is reloaded (plan §9, M6). Default ON: the pipeline checkpoints after every step, so
 * a reload mid-build can pick up where it left off instead of starting over. Turn off to always start fresh.
 */
export const DEFAULT_AI_RESUME_GENERATION = true;

/**
 * How much of the in-character Grimoire (sentient-spellbook) persona to apply — chosen by the user for
 * ANY model, not tied to local-vs-cloud. A monotonic ladder:
 * - "off":  name only, no flavor (the kill switch if persona bleeds into stat blocks).
 * - "min":  skeletal — one identity sentence + "rules stay plain" reminder. Safest on small local models.
 * - "low":  richer identity + warmth in greetings/transitions; no decline flavor or save flourish.
 * - "full": the complete voice — warmth, in-character declines, and a save flourish.
 * - "auto": resolve by model size (min on small local models, full on cloud) — the smart default.
 * The persona is confined to streamed prose + app UI copy; it never enters tool/review/research/title prompts.
 */
export type PersonaStrength = "auto" | "off" | "min" | "low" | "full";
/** Default: "auto" picks a light persona on small local models and the full voice on cloud. */
export const DEFAULT_AI_PERSONA_STRENGTH: PersonaStrength = "auto";

/**
 * AI ("Grimoire") configuration. Only non-secret selection lives here / in IndexedDB —
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
    /** Request model reasoning/"thinking" in plain chat. Defaults to DEFAULT_AI_THINKING. */
    thinking?: boolean;
    /** Request thinking during homebrew generation (tool turns). Defaults to DEFAULT_AI_THINKING_HOMEBREW. */
    thinkingHomebrew?: boolean;
    /** Show the model's raw reasoning text in chat. Display-only; defaults to DEFAULT_AI_SHOW_THINKING. */
    showThinking?: boolean;
    /** How much automated QC to apply to generated homebrew. Defaults to DEFAULT_USAGE_LEVEL. */
    usageLevel?: UsageControlLevel;
    /** Medium-mode auto-retry budget per entity. Defaults to DEFAULT_MEDIUM_RETRIES. */
    mediumRetries?: number;
    /** Which create_* tools the model may use. Defaults to DEFAULT_TOOL_PERMISSIONS. */
    toolPermissions?: ToolPermissions;
    /** High-mode readiness-pipeline config. Defaults to DEFAULT_REVIEW_SETTINGS. */
    review?: ReviewSettings;
    /** Expose deterministic D&D math tools (modifiers, DPR). Defaults to DEFAULT_AI_MATH_TOOLS. */
    mathTools?: boolean;
    /** Allow the model to ask the user questions / offer directions inline. Defaults to DEFAULT_AI_ASK_TOOLS. */
    askTools?: boolean;
    /** Allow the model to propose a structured plan for approval. Defaults to DEFAULT_AI_PLAN_TOOLS. */
    planTools?: boolean;
    /** Expose read-only lookup tools (SRD + homebrew) and the research delegate. Defaults to DEFAULT_AI_LOOKUP_TOOLS. */
    lookupTools?: boolean;
    /** Let the model switch its own mode when it needs a tool the current mode lacks. Defaults to DEFAULT_AI_AUTO_SWITCH. */
    autoSwitch?: boolean;
    /** Auto-attach mechanical "mads" commands to generated feature-bearing homebrew. Defaults to DEFAULT_AI_COMMAND_GENERATION. */
    commandGeneration?: boolean;
    /** Offer to resume an interrupted staged generation when its conversation is reloaded. Defaults to DEFAULT_AI_RESUME_GENERATION. */
    resumeGeneration?: boolean;
    /** How much in-character Grimoire persona to apply (any model). Defaults to DEFAULT_AI_PERSONA_STRENGTH. */
    personaStrength?: PersonaStrength;
}

export interface UserSettings {
    userId: number;
    username: string;
    email: string;
    theme: string;
    dndSystem: 'both' | '2014' | '2024' | string;
    ai?: AiSettings;
}
