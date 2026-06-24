import { Component, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { Button, Container, Icon } from "coles-solid-library";
import { Close } from "coles-solid-library/icons";
import { Markdown } from "../../shared/components/MarkDown/MarkDown";
import { aiAssistant } from "../../shared/customHooks/aiAssistant";
import { editorRouteFor } from "../../shared/ai/toolDispatcher";
import { HomebrewPreview, previewBody, previewSubtitle } from "./aiSpark.shared";
import HomebrewCompleteness from "./HomebrewCompleteness";
import styles from "./SparkSidebar.module.scss";

/** A generated homebrew entity awaiting the user's decision. Nothing is saved until Save. */
const HomebrewPreviewCard: Component<{ preview: HomebrewPreview }> = (props) => {
    const navigate = useNavigate();
    // The AI can fill gaps once per entity (hard cap), and only when there's actually something missing.
    const canComplete = () =>
        ((props.preview.warnings?.length ?? 0) > 0 || props.preview.truncated) &&
        (props.preview.repairAttempts ?? 0) < 1;
    return (
        <Container theme="surface" class={styles.previewCard}>
            <div class={styles.previewHeader}>
                <div>
                    <strong>{props.preview.title}</strong>
                    <div class={styles.previewSubtitle}>{previewSubtitle(props.preview)}</div>
                </div>
            </div>
            {/* Always render the body so an empty description is visible (not silently hidden). */}
            <div class={styles.previewBody}>
                <Show
                    when={previewBody(props.preview)}
                    fallback={<span class={styles.previewPlaceholder}>No description provided.</span>}
                >
                    <Markdown text={previewBody(props.preview)} />
                </Show>
            </div>
            <Show when={!props.preview.valid}>
                <div class={styles.previewError}>{props.preview.errors.join(" ")}</div>
            </Show>
            <HomebrewCompleteness preview={props.preview} />
            <div class={styles.previewActions}>
                <Button
                    theme="primary"
                    disabled={!props.preview.valid}
                    onClick={() => aiAssistant.confirmPreview(props.preview.previewId)}
                >
                    Save
                </Button>
                <Show when={canComplete()}>
                    <Button
                        transparent
                        title="Ask the AI to fill in the missing fields"
                        disabled={aiAssistant.status() === "streaming"}
                        onClick={() => aiAssistant.completePreview(props.preview.previewId)}
                    >
                        Complete with AI
                    </Button>
                </Show>
                <Button
                    transparent
                    title="Open in the homebrew editor to finish by hand"
                    onClick={() => { navigate(editorRouteFor(props.preview)); aiAssistant.close(); }}
                >
                    Edit manually
                </Button>
                <Button transparent title="Reject" onClick={() => aiAssistant.rejectPreview(props.preview.previewId)}>
                    <Icon icon={Close} size="small" /> Reject
                </Button>
            </div>
        </Container>
    );
};

export default HomebrewPreviewCard;
