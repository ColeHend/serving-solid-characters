import { Component, For, Show } from "solid-js";
import { Button, Container, Icon } from "coles-solid-library";
import { Close } from "coles-solid-library/icons";
import { aiAssistant } from "../../shared/customHooks/aiAssistant";
import { computeFieldDiff, HomebrewPreview, previewSubtitle } from "./aiSpark.shared";
import styles from "./SparkSidebar.module.scss";

/**
 * An AI-proposed EDIT to existing homebrew, shown as a before→after diff the user accepts or rejects.
 * Nothing is changed until Accept (which calls updateX via saveHomebrew). Reuses the pendingPreviews
 * signal — an edit is a HomebrewPreview with mode:"edit".
 */
const HomebrewDiffCard: Component<{ preview: HomebrewPreview }> = (props) => {
    const p = () => props.preview;
    const diffs = () => computeFieldDiff(p());

    return (
        <Container theme="surface" class={styles.previewCard}>
            <div class={styles.previewHeader}>
                <div>
                    <strong>Edit {p().title}</strong>
                    <div class={styles.previewSubtitle}>{previewSubtitle(p())}</div>
                </div>
            </div>

            <Show
                when={p().valid}
                fallback={<div class={styles.previewError}>{p().errors.join(" ")}</div>}
            >
                <Show
                    when={diffs().length}
                    fallback={<div class={styles.previewPlaceholder}>No field changes were produced.</div>}
                >
                    <div class={styles.diffList}>
                        <For each={diffs()}>
                            {(d) => (
                                <div class={styles.diffRow}>
                                    <span class={styles.diffLabel}>{d.label}</span>
                                    <span class={styles.diffBefore}>{d.before}</span>
                                    <span class={styles.diffArrow}>→</span>
                                    <span class={styles.diffAfter}>{d.after}</span>
                                </div>
                            )}
                        </For>
                    </div>
                </Show>
            </Show>

            <Show when={(p().rejectedOps?.length ?? 0) > 0}>
                <div class={styles.previewWarning}>
                    Couldn't apply: {p().rejectedOps!.map(r => `${r.op.path} (${r.reason})`).join("; ")}
                </div>
            </Show>

            <div class={styles.previewActions}>
                <Button
                    theme="primary"
                    title="Apply this change to your homebrew"
                    disabled={!p().valid || diffs().length === 0}
                    onClick={() => aiAssistant.confirmPreview(p().previewId)}
                >
                    Accept
                </Button>
                <Button transparent title="Discard this change" onClick={() => aiAssistant.rejectPreview(p().previewId)}>
                    <Icon icon={Close} size="small" /> Reject
                </Button>
            </div>
        </Container>
    );
};

export default HomebrewDiffCard;
