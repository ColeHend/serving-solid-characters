import { Component, For, Show } from "solid-js";
import { Button, Container, Icon } from "coles-solid-library";
import { Bolt, Close, Refresh } from "coles-solid-library/icons";
import { aiAssistant } from "../../../shared/customHooks/aiAssistant";
import { PipelinePhase, type PipelineStatus } from "../../../shared/ai/genPipeline/types";
import { CLASS_PIPELINE_PHASES } from "../../../shared/ai/genPipeline/classPipeline";
import { CHARACTER_PIPELINE_PHASES } from "../../../shared/ai/genPipeline/characterPipeline";
import { HOMEBREW_PIPELINE_PHASES } from "../../../shared/ai/genPipeline/homebrewPipeline";
import type { HomebrewPreview } from "../aiSpark.shared";
import ReviewVerdicts from "../homebrew/ReviewVerdicts";
import styles from "../SparkSidebar.module.scss";

/**
 * Progress card for the staged-generation pipeline (plan §10). Renders the current run's phase strip and
 * status, and offers Abort while running / Dismiss + Restart once it ends in error or abort. The
 * ratification gate itself is a separate propose_plan InteractionCard (the orchestrator surfaces it), and on
 * success the assembled class hands off to an ordinary HomebrewPreviewCard — so this card only owns progress.
 */

/** Short label per phase (the class pipeline walks DesignBrief → Skeleton → Chassis → Features → Subclasses → Assemble). */
const PHASE_LABEL: Record<PipelinePhase, string> = {
    [PipelinePhase.DesignBrief]: "Brief",
    [PipelinePhase.Skeleton]: "Skeleton",
    [PipelinePhase.Chassis]: "Chassis",
    [PipelinePhase.Assemble]: "Assemble",
    // character phases (built in M5) — labelled here so the card never shows a blank step
    [PipelinePhase.Concept]: "Concept",
    [PipelinePhase.Foundation]: "Foundation",
    [PipelinePhase.TrainedIn]: "Trained-in",
    [PipelinePhase.Capabilities]: "Capabilities",
    [PipelinePhase.Loadout]: "Loadout",
    [PipelinePhase.Narrative]: "Narrative",
    [PipelinePhase.Compute]: "Compute",
    [PipelinePhase.Features]: "Features",
    [PipelinePhase.Subclasses]: "Subclasses",
    [PipelinePhase.Balance]: "Balance",
    // post-completion mechanics step (class + homebrew) — attaching/reviewing the "mads" commands
    [PipelinePhase.MadsReview]: "Mechanics",
};

/**
 * In-character flavor shown in the working line while a phase runs, when the orchestrator hasn't given a
 * more specific note (e.g. "Feature 3 of 12"). Keeps the long, mostly-silent pipeline phases from all
 * reading the same generic "Building your class…" (plan §10, M6 status flavor text).
 */
const PHASE_FLAVOR: Record<PipelinePhase, string> = {
    [PipelinePhase.DesignBrief]: "Sketching the concept…",
    [PipelinePhase.Skeleton]: "Laying down the bones…",
    [PipelinePhase.Chassis]: "Forging the chassis…",
    [PipelinePhase.Features]: "Inscribing features…",
    [PipelinePhase.Subclasses]: "Branching the subclasses…",
    [PipelinePhase.Balance]: "Weighing the balance…",
    [PipelinePhase.Assemble]: "Binding it all together…",
    [PipelinePhase.Concept]: "Anchoring the concept…",
    [PipelinePhase.Foundation]: "Laying the foundation…",
    [PipelinePhase.TrainedIn]: "Drilling skills & saves…",
    [PipelinePhase.Capabilities]: "Granting capabilities…",
    [PipelinePhase.Loadout]: "Packing the loadout…",
    [PipelinePhase.Narrative]: "Spinning the tale…",
    [PipelinePhase.Compute]: "Tallying the numbers…",
    [PipelinePhase.MadsReview]: "Refining mechanics…",
};

const SUBTITLE: Record<PipelineStatus, string> = {
    idle: "Starting…",
    running: "Working…",
    awaiting_user: "Awaiting your approval",
    completed: "Done",
    aborted: "Stopped",
    error: "Couldn't finish",
};

const GenPipelineCard: Component = () => {
    const run = () => aiAssistant.pipelineRun();
    const isLive = () => { const s = run()?.status; return s === "running" || s === "awaiting_user" || s === "idle"; };
    const isTerminalBad = () => { const s = run()?.status; return s === "error" || s === "aborted"; };
    const isCharacter = () => run()?.pipelineType === "character";
    const isHomebrew = () => run()?.pipelineType === "homebrew";
    /** The phase strip + headings switch on which pipeline is running. */
    const phases = () => (isHomebrew() ? HOMEBREW_PIPELINE_PHASES : isCharacter() ? CHARACTER_PIPELINE_PHASES : CLASS_PIPELINE_PHASES);
    const title = () => (isHomebrew() ? "Generating homebrew" : isCharacter() ? "Generating character" : "Generating class");
    const workingLabel = () => (isHomebrew() ? "Building your homebrew…" : isCharacter() ? "Building your character…" : "Building your class…");
    /** The live working line: a precise orchestrator note if present, else phase-appropriate flavor. */
    const workingMessage = () => { const r = run(); return r?.note?.trim() || (r ? PHASE_FLAVOR[r.phase] : "") || workingLabel(); };

    /** The strip state for the phase at index `i`, given the run's current phase + status. */
    const stepClass = (i: number) => {
        const r = run();
        if (!r) return styles.pipelineStep;
        if (i < r.phaseIndex) return `${styles.pipelineStep} ${styles.pipelineStepDone}`;
        if (i === r.phaseIndex) {
            if (r.status === "completed") return `${styles.pipelineStep} ${styles.pipelineStepDone}`;
            if (r.status === "error" || r.status === "aborted") return `${styles.pipelineStep} ${styles.pipelineStepError}`;
            return `${styles.pipelineStep} ${styles.pipelineStepActive}`;
        }
        return styles.pipelineStep;
    };

    return (
        <Show when={run()}>
            {(r) => (
                <Container theme="surface" class={styles.previewCard}>
                    <div class={styles.previewHeader}>
                        <div>
                            <strong>{title()}</strong>
                            <div class={styles.previewSubtitle}>
                                Phase {Math.min(r().phaseIndex + 1, r().totalPhases)} of {r().totalPhases} — {SUBTITLE[r().status]}
                            </div>
                        </div>
                        <Icon icon={Bolt} size="small" />
                    </div>

                    <div class={styles.pipelineStrip}>
                        <For each={phases()}>{(phase, i) => (
                            <span class={stepClass(i())}>{PHASE_LABEL[phase]}</span>
                        )}</For>
                    </div>

                    <Show when={isLive()}>
                        <div class={`${styles.pipelineWorking} ${styles.pulse}`}>
                            <Icon icon={Bolt} size="small" />
                            {r().status === "awaiting_user"
                                ? "Review the skeleton below to continue."
                                : workingMessage()}
                        </div>
                    </Show>

                    <Show when={isTerminalBad() && r().error}>
                        <div class={styles.previewError}>{r().error}</div>
                    </Show>

                    {/* Phase-F critic findings (High usage). ReviewVerdicts only reads verdicts/reviewBlocked. */}
                    <Show when={(r().verdicts ?? []).some(v => v.issues.length)}>
                        <ReviewVerdicts preview={{ verdicts: r().verdicts, reviewBlocked: false } as unknown as HomebrewPreview} />
                    </Show>

                    <div class={styles.previewActions}>
                        <Show when={isLive()}>
                            <Button transparent title="Stop generating" onClick={() => aiAssistant.abortPipeline()}>
                                <Icon icon={Close} size="small" /> Abort
                            </Button>
                        </Show>
                        <Show when={isTerminalBad()}>
                            {/* The homebrew mini-pipeline doesn't support Restart (no remembered seed) — just Dismiss. */}
                            <Show when={!isHomebrew()}>
                                <Button transparent title="Start this generation over from the beginning" onClick={() => aiAssistant.restartPipeline()}>
                                    <Icon icon={Refresh} size="small" /> Restart
                                </Button>
                            </Show>
                            <Button transparent title="Dismiss" onClick={() => aiAssistant.dismissPipeline()}>
                                <Icon icon={Close} size="small" /> Dismiss
                            </Button>
                        </Show>
                    </div>
                </Container>
            )}
        </Show>
    );
};

export default GenPipelineCard;
