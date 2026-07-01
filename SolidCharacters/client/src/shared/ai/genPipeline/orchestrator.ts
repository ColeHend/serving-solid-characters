import { AiSettings, CreationPipelineLevel, UsageControlLevel } from "../../../models/userSettings";
import type { Character } from "../../../models/character.model";
import type { HomebrewKind } from "../refs/homebrewKind";
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
    /** Generation depth (carried for completeness; the High MADS step runs in the host's enrichment, not here). */
    creationPipelineLevel?: CreationPipelineLevel;
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
    /** Generation depth (carried for completeness; characters are never MADS-enriched). */
    creationPipelineLevel?: CreationPipelineLevel;
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

/**
 * The Homebrew mini-pipeline's host (Generation depth ≥ Medium). The 7 non-class/character create_* kinds
 * (spell/item/magic_item/feat/background/race/subclass) run a tiny 2-step concept → creation pipeline
 * instead of a single one-shot call. Like the others it is a STANDALONE driver behind injectable callbacks
 * (no chat machinery): there is NO ratification gate and NO critic. On success it hands back ONE assembled
 * `HomebrewPreview`, which the host surfaces and enriches exactly like a one-shot result (so the High MADS
 * step is reached for free via the host's command enrichment). No checkpoint — the run is only two steps.
 */
export interface HomebrewPipelineHost {
    ai: AiSettings;
    dndSystem: string;
    signal: AbortSignal;
    /** Tunes per-step repair budget (plan §8). Defaults to "low" when omitted. */
    usageLevel?: UsageControlLevel;
    /** Generation depth that launched this run ("medium" or "high"); carried for observability. */
    creationPipelineLevel?: CreationPipelineLevel;
    /** Which create_* kind this run is building. */
    kind: HomebrewKind;
    /** Test seam: a scripted model runner. Production omits it and the real `runSubAgent` is used. */
    runner?: StepModelRunner;

    /** Push the latest reactive run state to the UI (GenPipelineCard / StatusTicker). Called on every transition. */
    onProgress: (run: PipelineRun) => void;
    /** Terminal success: the single assembled, savable preview. The host surfaces + enriches it. */
    onComplete: (previews: HomebrewPreview[]) => void;
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
