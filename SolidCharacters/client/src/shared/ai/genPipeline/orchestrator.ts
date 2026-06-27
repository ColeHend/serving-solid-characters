import { AiSettings, UsageControlLevel } from "../../../models/userSettings";
import type { HomebrewPreview } from "../tools/toolDispatcher";
import type { StepModelRunner } from "./stepWorker";
import type { SkeletonPlan } from "./skeleton";
import type { ConceptBrief, PipelineRun, WorkingClass } from "./types";

/**
 * The orchestrator contract (plan §2.2). A pipeline run is a STANDALONE driver — it does not touch the
 * `runTurn`/`outstanding` chat machinery. Instead the host (AiAssistant) hands it everything it needs and
 * receives callbacks: progress to drive the reactive run state, a ratification hook that PAUSES the run on
 * a human gate, a checkpoint hook, and the terminal complete/error callbacks. Keeping the driver behind
 * this interface means it can be unit-tested with a scripted model runner and plain spy callbacks — no DB,
 * no Solid signals, no provider.
 */

/** The user's verdict on a ratification gate (Phase B skeleton). */
export type RatifyDecision =
    | { type: "approve" }
    | { type: "refine"; text: string }
    | { type: "reject" };

export interface PipelineHost {
    ai: AiSettings;
    dndSystem: string;
    /** Aborts the whole run (session swap / user abort). Checked between phases and inside the step worker. */
    signal: AbortSignal;
    /** Tunes per-step repair budget (plan §8). Defaults to "low" when omitted. */
    usageLevel?: UsageControlLevel;
    /** Test seam: a scripted model runner. Production omits it and the real `runSubAgent` is used. */
    runner?: StepModelRunner;

    /** Push the latest reactive run state to the UI (GenPipelineCard / StatusTicker). Called on every transition. */
    onProgress: (run: PipelineRun) => void;
    /** Surface the skeleton and WAIT for the user's verdict. Resolving continues (or stops) the run. */
    ratifySkeleton: (plan: SkeletonPlan) => Promise<RatifyDecision>;
    /** Persist a checkpoint after a phase (best-effort; resume is built in a later milestone). Optional. */
    onCheckpoint?: (phaseIndex: number, working: WorkingClass, brief?: ConceptBrief) => void;
    /** Terminal success: the assembled, savable preview. The host surfaces it as an ordinary preview card. */
    onComplete: (preview: HomebrewPreview) => void;
    /** Terminal failure: a short, user-facing reason. The host surfaces it (e.g. a system bubble). */
    onError: (message: string) => void;
}

/** Per-step model re-tries by usage level (plan §8). Critic/auto-fix loops land in M3. */
export function repairBudgetFor(level: UsageControlLevel | undefined): number {
    switch (level) {
        case "medium": return 2;
        case "high": return 2;
        case "low":
        default: return 1;
    }
}
