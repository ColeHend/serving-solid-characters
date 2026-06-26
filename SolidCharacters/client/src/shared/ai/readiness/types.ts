import type { AiSettings, ReviewSeverity } from "../../../models/userSettings";

export type { ReviewSeverity };

/** Everything an LLM review pass needs beyond the preview itself. */
export interface ReviewContext {
    ai: AiSettings;
    dndSystem: string;
    /** Aborts in-flight reviewer calls (tied to the turn). */
    signal?: AbortSignal;
}

/** The lifecycle of a preview while/after the High-mode readiness pipeline runs over it. */
export type ReviewState =
    | "reviewing"              // passes are running; Save is disabled
    | "passed"                 // every enabled pass approved it
    | "issues"                 // findings exist (Save allowed unless a blocking-severity issue)
    | "review_unavailable"     // a pass threw — review couldn't complete; Save allowed but NOT marked "Reviewed"
    | "needs_user_direction";  // schema kept failing past the retry cap — the user must decide

/** One concrete problem found by a pass. */
export interface ReviewIssue {
    severity: ReviewSeverity;
    message: string;
    /** Raw tool-input field the issue concerns, if applicable. */
    field?: string;
    /** A concrete fix, if the reviewer offered one (feeds "Apply fix with AI"). */
    suggestedFix?: string;
}

/** The result of a single pass (built-in or custom review agent). */
export interface ReviewVerdict {
    /** Built-in ReviewPassId, or a custom review-agent id. */
    passId: string;
    /** Display label, e.g. "Balance", "Broken references", or the custom agent's name. */
    label: string;
    /** True if the pass found nothing worth blocking/flagging. */
    pass: boolean;
    issues: ReviewIssue[];
}

/** Severity ordering for "blocks Save at/above" comparisons. */
const SEVERITY_RANK: Record<ReviewSeverity, number> = { info: 0, warning: 1, error: 2 };
export const severityRank = (s: ReviewSeverity): number => SEVERITY_RANK[s] ?? 0;

/** The worst severity across a set of verdicts, or null if there are no issues. */
export function worstSeverity(verdicts: ReviewVerdict[]): ReviewSeverity | null {
    let worst: ReviewSeverity | null = null;
    for (const v of verdicts) {
        for (const i of v.issues) {
            if (!worst || severityRank(i.severity) > severityRank(worst)) worst = i.severity;
        }
    }
    return worst;
}

/** True if any verdict carries an issue at/above the blocking threshold (so Save should be disabled). */
export function isBlocked(verdicts: ReviewVerdict[], blockingSeverity: ReviewSeverity): boolean {
    const threshold = severityRank(blockingSeverity);
    return verdicts.some(v => v.issues.some(i => severityRank(i.severity) >= threshold));
}
