/**
 * Tool categorization seam. Grimoire's tool calls fall into these execution paths:
 *
 * - "homebrew":    the existing create_* generation flow — buildPreview → pendingPreviews → the user
 *                  Saves/Rejects → resolveToolCall continues the turn.
 * - "compute":     deterministic math (dndMath.ts) run synchronously in-browser. The dispatcher returns
 *                  the answer as a tool_result immediately; there is NO card and NO user interaction.
 * - "interactive": ask_user / propose_plan — render a card and WAIT for the user, whose response becomes
 *                  the tool_result.
 * - "lookup":      lookup_srd / lookup_homebrew — read-only reference search run in-browser. Resolves
 *                  ASYNCHRONOUSLY (SRD rows may need a load) and feeds the result straight back; like
 *                  compute, there is NO card and NO user interaction.
 * - "edit":        edit_homebrew — a multi-field diff patch against an existing entity. Renders a diff
 *                  accept/reject card (like interactive) and does NOT go through the create-side
 *                  completeness / Low-Medium-High routing or save-as-new.
 * - "control":     switch_mode — changes the assistant's mode and auto-resolves so the continuation turn
 *                  re-derives its tool set. No card, no user interaction.
 * - "pipeline":    generate_* — a SEED that hands off to the standalone staged-generation orchestrator
 *                  (genPipeline/). finishTurn resolves the trigger immediately (no continuation turn) and
 *                  kicks off the orchestrator, which drives the model per step and renders its own card.
 *
 * This is a leaf module (no imports) so the orchestration store, the schema modules, and the dispatchers
 * can all share the mapping without import cycles. Mirrors homebrewKind.ts.
 */
export type ToolCategory = "homebrew" | "compute" | "interactive" | "lookup" | "edit" | "control" | "pipeline";

/** Deterministic math tools — auto-executed, no UI. Keep in sync with computeTools.ts. */
export const COMPUTE_TOOL_NAMES = [
    "calc_ability_modifier",
    "calc_proficiency_bonus",
    "calc_attack_dpr",
    "calc_save_dpr",
] as const;

/** Tools that render a card and wait for the user. Keep in sync with interactions.ts. */
export const INTERACTIVE_TOOL_NAMES = [
    "ask_user",
    "propose_plan",
] as const;

/**
 * Async, auto-resolved (no-UI) tools: read-only reference search (lookupTools.ts) and the research
 * delegate that offloads multi-step lookups to a fresh-context sub-agent (subAgent.ts). They share the
 * "lookup" path because both resolve asynchronously and feed a compact result straight back.
 */
export const LOOKUP_TOOL_NAMES = [
    "lookup_srd",
    "lookup_homebrew",
    "delegate_research",
] as const;

/** Diff-patch edit tools — render an accept/reject diff card. Keep in sync with editTools.ts. */
export const EDIT_TOOL_NAMES = [
    "edit_homebrew",
] as const;

/** Control tools that change session state (mode) and auto-resolve. Keep in sync with controlTools.ts. */
export const CONTROL_TOOL_NAMES = [
    "switch_mode",
] as const;

/** Seed tools that trigger the staged generation pipeline. Keep in sync with toolSchemas.ts (PIPELINE_TOOLS). */
export const PIPELINE_TOOL_NAMES = [
    "generate_class",
    "generate_character",
] as const;

const COMPUTE = new Set<string>(COMPUTE_TOOL_NAMES);
const INTERACTIVE = new Set<string>(INTERACTIVE_TOOL_NAMES);
const LOOKUP = new Set<string>(LOOKUP_TOOL_NAMES);
const EDIT = new Set<string>(EDIT_TOOL_NAMES);
const CONTROL = new Set<string>(CONTROL_TOOL_NAMES);
const PIPELINE = new Set<string>(PIPELINE_TOOL_NAMES);

/**
 * The execution category for a tool name. Anything not explicitly registered falls through to
 * "homebrew" — including create_* and genuinely unknown names — which preserves the existing
 * "Unknown tool" preview as a safety net rather than silently dropping the call.
 */
export function toolCategory(name: string): ToolCategory {
    if (COMPUTE.has(name)) return "compute";
    if (INTERACTIVE.has(name)) return "interactive";
    if (LOOKUP.has(name)) return "lookup";
    if (EDIT.has(name)) return "edit";
    if (CONTROL.has(name)) return "control";
    if (PIPELINE.has(name)) return "pipeline";
    return "homebrew";
}
