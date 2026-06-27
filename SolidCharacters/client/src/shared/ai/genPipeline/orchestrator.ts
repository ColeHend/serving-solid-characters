import { AiSettings, UsageControlLevel } from "../../../models/userSettings";
import type { Character } from "../../../models/character.model";
import type { HomebrewPreview } from "../tools/toolDispatcher";
import type { StepModelRunner } from "./stepWorker";
import type { ClassReviewer } from "./critic";
import type { SkeletonPlan } from "./skeleton";
import type { ConceptBrief, PipelineRun, WorkingCharacter, WorkingClass } from "./types";

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
    /** Tunes per-step repair budget + whether the Phase-F critic runs (plan §8). Defaults to "low" when omitted. */
    usageLevel?: UsageControlLevel;
    /** Test seam: a scripted model runner. Production omits it and the real `runSubAgent` is used. */
    runner?: StepModelRunner;
    /**
     * The Phase-F critic's reviewer (plan §6.F). Runs ONLY at the "high" usage level; omit it (or run at
     * Low/Medium) to skip the critic entirely. Production passes `buildClassReviewer`; tests inject a stub.
     */
    reviewer?: ClassReviewer;

    /** Push the latest reactive run state to the UI (GenPipelineCard / StatusTicker). Called on every transition. */
    onProgress: (run: PipelineRun) => void;
    /** Surface the skeleton and WAIT for the user's verdict. Resolving continues (or stops) the run. */
    ratifySkeleton: (plan: SkeletonPlan) => Promise<RatifyDecision>;
    /** Persist a checkpoint after a phase (best-effort; resume is built in a later milestone). Optional. */
    onCheckpoint?: (phaseIndex: number, working: WorkingClass, brief?: ConceptBrief) => void;
    /**
     * Terminal success: the assembled, savable previews — the class first, then one per subclass. The host
     * surfaces each as an ordinary preview card. (Always non-empty; the class preview is index 0.)
     */
    onComplete: (previews: HomebrewPreview[]) => void;
    /** Terminal failure: a short, user-facing reason. The host surfaces it (e.g. a system bubble). */
    onError: (message: string) => void;
}

/**
 * The Character pipeline's host (plan §7). Mirrors {@link PipelineHost} but for the net-new character
 * surface: there is NO ratification gate (the character phases 1–7 have none) and NO Phase-F LLM critic
 * (`balanceFacts` has no character branch and a character is not a homebrew preview — plan §12 risk #5), so
 * those fields are absent. On success it hands back the assembled `Character`; the host persists it via
 * `characterManager.createCharacter` (the pipeline stays free of DB/Solid concerns). Same injectable
 * `runner` + spy callbacks, so the driver is unit-testable without a provider.
 */
export interface CharacterPipelineHost {
    ai: AiSettings;
    dndSystem: string;
    signal: AbortSignal;
    usageLevel?: UsageControlLevel;
    runner?: StepModelRunner;

    /** Push the latest reactive run state to the UI (GenPipelineCard / StatusTicker). Called on every transition. */
    onProgress: (run: PipelineRun) => void;
    /** Persist a checkpoint after a phase (best-effort). Optional. */
    onCheckpoint?: (phaseIndex: number, working: WorkingCharacter, brief?: ConceptBrief) => void;
    /** Terminal success: the assembled character. The host saves it and surfaces a confirmation. */
    onComplete: (character: Character) => void;
    /** Terminal failure: a short, user-facing reason. */
    onError: (message: string) => void;
}

/** Per-step model re-tries by usage level (plan §8). The Phase-F critic + auto-fix loop run only at High. */
export function repairBudgetFor(level: UsageControlLevel | undefined): number {
    switch (level) {
        case "medium": return 2;
        case "high": return 2;
        case "low":
        default: return 1;
    }
}
