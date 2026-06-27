import { Component, For, Show } from "solid-js";
import { Button, Container, Icon } from "coles-solid-library";
import { Bolt, Close } from "coles-solid-library/icons";
import { aiAssistant } from "../../../shared/customHooks/aiAssistant";
import { PipelinePhase, type PipelineStatus } from "../../../shared/ai/genPipeline/types";
import type { HomebrewPreview } from "../aiSpark.shared";
import ReviewVerdicts from "../homebrew/ReviewVerdicts";
import styles from "../SparkSidebar.module.scss";

/**
 * Progress card for the staged-generation pipeline (plan §10). Renders the current run's phase strip and
 * status, and offers Abort while running / Dismiss once it ends in error or abort. The ratification gate
 * itself is a separate propose_plan InteractionCard (the orchestrator surfaces it), and on success the
 * assembled class hands off to an ordinary HomebrewPreviewCard — so this card only owns live progress.
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
};

/** The ordered phases shown in the strip for the class pipeline (mirrors classPipeline.PHASES). */
const CLASS_PHASES = [
    PipelinePhase.DesignBrief, PipelinePhase.Skeleton, PipelinePhase.Chassis,
    PipelinePhase.Features, PipelinePhase.Subclasses, PipelinePhase.Balance, PipelinePhase.Assemble,
];

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
                            <strong>Generating class</strong>
                            <div class={styles.previewSubtitle}>
                                Phase {Math.min(r().phaseIndex + 1, r().totalPhases)} of {r().totalPhases} — {SUBTITLE[r().status]}
                            </div>
                        </div>
                        <Icon icon={Bolt} size="small" />
                    </div>

                    <div class={styles.pipelineStrip}>
                        <For each={CLASS_PHASES}>{(phase, i) => (
                            <span class={stepClass(i())}>{PHASE_LABEL[phase]}</span>
                        )}</For>
                    </div>

                    <Show when={isLive()}>
                        <div class={`${styles.pipelineWorking} ${styles.pulse}`}>
                            <Icon icon={Bolt} size="small" />
                            {r().status === "awaiting_user"
                                ? "Review the skeleton below to continue."
                                : (r().note?.trim() || "Building your class…")}
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
