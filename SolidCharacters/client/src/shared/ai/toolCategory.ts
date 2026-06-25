/**
 * Tool categorization seam. Spark's tool calls fall into three execution paths:
 *
 * - "homebrew":    the existing create_* generation flow — buildPreview → pendingPreviews → the user
 *                  Saves/Rejects → resolveToolCall continues the turn.
 * - "compute":     deterministic math (dndMath.ts) run synchronously in-browser. The dispatcher returns
 *                  the answer as a tool_result immediately; there is NO card and NO user interaction.
 * - "interactive": ask_user / propose_plan — render a card and WAIT for the user, whose response becomes
 *                  the tool_result.
 *
 * This is a leaf module (no imports) so the orchestration store, the schema modules, and the dispatchers
 * can all share the mapping without import cycles. Mirrors homebrewKind.ts.
 */
export type ToolCategory = "homebrew" | "compute" | "interactive";

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

const COMPUTE = new Set<string>(COMPUTE_TOOL_NAMES);
const INTERACTIVE = new Set<string>(INTERACTIVE_TOOL_NAMES);

/**
 * The execution category for a tool name. Anything not explicitly registered as compute/interactive —
 * including create_* and genuinely unknown names — falls through to "homebrew", which preserves the
 * existing "Unknown tool" preview as a safety net rather than silently dropping the call.
 */
export function toolCategory(name: string): ToolCategory {
    if (COMPUTE.has(name)) return "compute";
    if (INTERACTIVE.has(name)) return "interactive";
    return "homebrew";
}
