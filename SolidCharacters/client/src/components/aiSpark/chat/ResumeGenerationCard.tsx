import { Component, Show } from "solid-js";
import { Button, Container, Icon } from "coles-solid-library";
import { Bolt, Close } from "coles-solid-library/icons";
import { aiAssistant } from "../../../shared/customHooks/aiAssistant";
import { CLASS_PIPELINE_PHASES } from "../../../shared/ai/genPipeline/classPipeline";
import { CHARACTER_PIPELINE_PHASES } from "../../../shared/ai/genPipeline/characterPipeline";
import styles from "../SparkSidebar.module.scss";

/**
 * "Resume generation" affordance (plan §9, §10 — M6). The staged pipeline checkpoints after every step, so
 * reloading a conversation whose build was interrupted finds a saved checkpoint; this card offers to pick it
 * up where it left off or discard it. It shows ONLY when a resume offer stands and no run is live (a live
 * run owns the progress card instead). Resume re-enters the orchestrator, which skips every decided phase.
 */
const ResumeGenerationCard: Component = () => {
    const cp = () => aiAssistant.resumableCheckpoint();
    /** Hide while a run is live — the GenPipelineCard owns progress then; the offer is for the idle, post-reload state. */
    const show = () => !!cp() && !aiAssistant.pipelineRun();

    const isCharacter = () => cp()?.pipelineType === "character";
    const noun = () => (isCharacter() ? "character" : "class");
    const total = () => (isCharacter() ? CHARACTER_PIPELINE_PHASES : CLASS_PIPELINE_PHASES).length;
    /** 1-based step the build had reached, clamped so a stale checkpoint can't read past the end. */
    const step = () => Math.min((cp()?.currentPhaseIndex ?? 0) + 1, total());

    return (
        <Show when={show()}>
            <Container theme="surface" class={styles.previewCard}>
                <div class={styles.previewHeader}>
                    <div>
                        <strong>Resume {noun()} generation?</strong>
                        <div class={styles.previewSubtitle}>
                            An earlier build was interrupted at step {step()} of {total()}.
                        </div>
                    </div>
                    <Icon icon={Bolt} size="small" />
                </div>

                <div class={styles.previewActions}>
                    <Button theme="primary" title={`Continue the ${noun()} build from where it stopped`} onClick={() => aiAssistant.resumePipeline()}>
                        <Icon icon={Bolt} size="small" /> Resume
                    </Button>
                    <Button transparent title="Discard the interrupted build" onClick={() => aiAssistant.discardResumable()}>
                        <Icon icon={Close} size="small" /> Discard
                    </Button>
                </div>
            </Container>
        </Show>
    );
};

export default ResumeGenerationCard;
