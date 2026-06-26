import { ReviewPassId, ReviewSeverity } from "../../../models/userSettings";
import { HOMEBREW_KIND_LABELS, HomebrewKind } from "../refs/homebrewKind";

/** A review pass the model performs: a label + the specific thing it should judge. */
export interface ReviewPassSpec {
    /** Built-in ReviewPassId or a custom review-agent id. */
    passId: string;
    label: string;
    /** What this pass judges, woven into the system prompt. */
    criteria: string;
    /** Severity cap for findings (custom agents set their own; built-ins default to "error"). */
    severity?: ReviewSeverity;
}

/** The built-in LLM judgment passes, keyed by ReviewPassId. Deterministic passes are NOT here. */
export const BUILTIN_LLM_PASSES: Partial<Record<ReviewPassId, ReviewPassSpec>> = {
    balance: {
        passId: "balance",
        label: "Balance",
        criteria: "Judge whether this content's power level matches official D&D 5e content of the same level, rarity, or tier. Flag it as over- or under-powered only when the gap is clear. If reference damage/DC figures are provided below, reason from those numbers.",
    },
    action_economy: {
        passId: "action_economy",
        label: "Action economy",
        criteria: "Check for action-economy problems: granting extra actions, free or unlimited reactions, bonus-action stacking, or effects that let a creature act far more often than the rules intend.",
    },
    exploit_loop: {
        passId: "exploit_loop",
        label: "Exploit / loop",
        criteria: "Look for ways this could be exploited: infinite loops, unbounded resource or value generation, or trivial combos that produce runaway power. Flag only concrete, reproducible exploits.",
    },
    dominant_option: {
        passId: "dominant_option",
        label: "Dominant option",
        criteria: "Decide whether this strictly dominates an existing official option — i.e. it is simply better with no trade-off, making the official choice pointless. Flag only clear cases of strict dominance.",
    },
};

function rulesetLabel(dndSystem: string): string {
    switch (dndSystem) {
        case "2014": return "D&D 5e (2014 rules)";
        case "2024": return "D&D 5e (2024 rules)";
        default: return "D&D 5e";
    }
}

/**
 * System prompt for a single review pass. Keeps the reviewer narrowly focused on its criteria and
 * forces the structured verdict via report_review. Deliberately conservative: it must not fail content
 * for stylistic nitpicks, only for real problems in its focus area.
 */
export function buildReviewSystemPrompt(spec: ReviewPassSpec, kind: HomebrewKind, dndSystem: string): string {
    const kindLabel = HOMEBREW_KIND_LABELS[kind];
    return `You are a meticulous ${rulesetLabel(dndSystem)} content reviewer. You are reviewing a homebrew ${kindLabel} for ONE thing only: ${spec.label}.

${spec.criteria}

Be conservative: pass content that is fine, and raise issues only for real, concrete problems in your focus area — never for wording, flavor, or matters outside ${spec.label}. When unsure, pass.

Respond by calling the report_review tool exactly once with your verdict. Do not write any prose.`;
}
