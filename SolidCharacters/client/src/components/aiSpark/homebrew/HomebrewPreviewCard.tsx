import { Component, Match, Show, Switch } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { Button, Container, Icon } from "coles-solid-library";
import { Bolt, Close, Verified } from "coles-solid-library/icons";
import { Markdown } from "../../../shared/components/MarkDown/MarkDown";
import { aiAssistant } from "../../../shared/customHooks/aiAssistant";
import { editorRouteFor } from "../../../shared/ai/tools/toolDispatcher";
import { setEditHandoff } from "../../../shared/ai/editHandoff";
import { HomebrewPreview, previewBody, previewSubtitle } from "../aiSpark.shared";
import HomebrewCompleteness from "./HomebrewCompleteness";
import ReviewVerdicts from "./ReviewVerdicts";
import styles from "../SparkSidebar.module.scss";

/** A generated homebrew entity awaiting the user's decision. Nothing is saved until Save. */
const HomebrewPreviewCard: Component<{ preview: HomebrewPreview }> = (props) => {
    const navigate = useNavigate();
    const p = () => props.preview;
    const reviewState = () => p().reviewState;
    const hasIssues = () => (p().verdicts ?? []).some(v => v.issues.length > 0);
    // The AI can fill gaps once per entity (hard cap), when something's missing OR a hard failure
    // (e.g. an empty description) is fixable by regenerating.
    const canComplete = () =>
        ((p().warnings?.length ?? 0) > 0 || p().truncated || !p().valid) &&
        (p().repairAttempts ?? 0) < 1 && !hasIssues();
    // Save is gated by schema validity AND any blocking-severity review finding (or an in-flight review).
    const saveDisabled = () => !p().valid || !!p().reviewBlocked || reviewState() === "reviewing";

    const editManually = () => {
        setEditHandoff(p());
        navigate(editorRouteFor(p()));
        aiAssistant.close();
    };

    // While a "Complete with AI" repair is in flight, collapse the card to a compact progress state.
    return (
        <Show when={!p().repairing} fallback={
            <Container theme="surface" class={`${styles.previewCard} ${styles.previewRepairing}`}>
                <strong>{p().title}</strong>
                <div class={`${styles.repairingLabel} ${styles.pulse}`}>
                    <Icon icon={Bolt} size="small" /> Improving with AI…
                </div>
                <div class={styles.previewActions}>
                    <Button transparent title="Cancel" onClick={() => aiAssistant.cancelRepair(p().previewId)}>
                        <Icon icon={Close} size="small" /> Cancel
                    </Button>
                </div>
            </Container>
        }>
            <Switch fallback={
                /* ----- normal card (no review, passed, or issues) ----- */
                <Container theme="surface" class={styles.previewCard}>
                    <div class={styles.previewHeader}>
                        <div>
                            <strong>{p().title}</strong>
                            <div class={styles.previewSubtitle}>{previewSubtitle(p())}</div>
                        </div>
                        <Show when={reviewState() === "passed"}>
                            <span class={styles.reviewedChip}><Icon icon={Verified} size="small" /> Reviewed</span>
                        </Show>
                        <Show when={reviewState() === "review_unavailable"}>
                            <span class={styles.reviewUnavailableChip} title="The readiness review couldn't run — this entity wasn't checked.">Review unavailable</span>
                        </Show>
                    </div>
                    {/* Always render the body so an empty description is visible (not silently hidden). */}
                    <div class={styles.previewBody}>
                        <Show
                            when={previewBody(p())}
                            fallback={<span class={styles.previewPlaceholder}>No description provided.</span>}
                        >
                            <Markdown text={previewBody(p())} />
                        </Show>
                    </div>
                    <Show when={!p().valid}>
                        <div class={styles.previewError}>{p().errors.join(" ")}</div>
                    </Show>
                    <HomebrewCompleteness preview={p()} />
                    <ReviewVerdicts preview={p()} />
                    <div class={styles.previewActions}>
                        <Button
                            theme="primary"
                            title={p().reviewBlocked ? "A blocking review issue must be resolved before saving" : "Save to your homebrew"}
                            disabled={saveDisabled()}
                            onClick={() => aiAssistant.confirmPreview(p().previewId)}
                        >
                            Save
                        </Button>
                        <Show when={hasIssues()}>
                            <Button
                                transparent
                                title="Ask the AI to fix the issues the review found"
                                disabled={aiAssistant.status() === "streaming"}
                                onClick={() => aiAssistant.applyReviewFixes(p().previewId)}
                            >
                                Improve with AI
                            </Button>
                        </Show>
                        <Show when={canComplete()}>
                            <Button
                                transparent
                                title="Ask the AI to fill in the missing fields"
                                disabled={aiAssistant.status() === "streaming"}
                                onClick={() => aiAssistant.completePreview(p().previewId)}
                            >
                                Complete with AI
                            </Button>
                        </Show>
                        <Button transparent title="Open in the homebrew editor to finish by hand" onClick={editManually}>
                            Edit manually
                        </Button>
                        <Button transparent title="Reject" onClick={() => aiAssistant.rejectPreview(p().previewId)}>
                            <Icon icon={Close} size="small" /> Reject
                        </Button>
                    </div>
                </Container>
            }>
                {/* ----- reviewing: collapsed progress with a cancel ----- */}
                <Match when={reviewState() === "reviewing"}>
                    <Container theme="surface" class={`${styles.previewCard} ${styles.previewRepairing}`}>
                        <strong>{p().title}</strong>
                        <div class={`${styles.reviewingLabel} ${styles.pulse}`}>
                            <Icon icon={Verified} size="small" /> Reviewing…
                        </div>
                        <div class={styles.previewActions}>
                            <Button transparent title="Stop the review and decide for yourself" onClick={() => aiAssistant.cancelReview()}>
                                <Icon icon={Close} size="small" /> Stop review
                            </Button>
                        </div>
                    </Container>
                </Match>

                {/* ----- needs user direction: schema kept failing past the retry cap ----- */}
                <Match when={reviewState() === "needs_user_direction"}>
                    <Container theme="surface" class={styles.previewCard}>
                        <div class={styles.previewHeader}>
                            <div>
                                <strong>{p().title}</strong>
                                <div class={styles.previewSubtitle}>{previewSubtitle(p())}</div>
                            </div>
                        </div>
                        <div class={styles.directionNote}>
                            Spark couldn't get this to pass validation. {p().errors.join(" ")} How would you like to proceed?
                        </div>
                        <div class={styles.previewBody}>
                            <Show when={previewBody(p())} fallback={<span class={styles.previewPlaceholder}>No description provided.</span>}>
                                <Markdown text={previewBody(p())} />
                            </Show>
                        </div>
                        <div class={styles.previewActions}>
                            <Button
                                theme="primary"
                                title="Have the AI try generating this again"
                                disabled={aiAssistant.status() === "streaming"}
                                onClick={() => aiAssistant.regeneratePreview(p().previewId)}
                            >
                                Try again
                            </Button>
                            <Show when={p().valid}>
                                <Button transparent title="Save it as-is anyway" onClick={() => aiAssistant.confirmPreview(p().previewId)}>
                                    Save anyway
                                </Button>
                            </Show>
                            <Button transparent title="Open in the homebrew editor to finish by hand" onClick={editManually}>
                                Edit manually
                            </Button>
                            <Button transparent title="Reject" onClick={() => aiAssistant.rejectPreview(p().previewId)}>
                                <Icon icon={Close} size="small" /> Reject
                            </Button>
                        </div>
                    </Container>
                </Match>
            </Switch>
        </Show>
    );
};

export default HomebrewPreviewCard;
