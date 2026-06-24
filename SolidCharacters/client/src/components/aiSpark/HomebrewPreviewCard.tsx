import { Component, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { Button, Container, Icon } from "coles-solid-library";
import { Close } from "coles-solid-library/icons";
import { Markdown } from "../../shared/components/MarkDown/MarkDown";
import { aiAssistant } from "../../shared/customHooks/aiAssistant";
import { editorRouteFor } from "../../shared/ai/toolDispatcher";
import { HomebrewPreview, previewBody, previewSubtitle } from "./aiSpark.shared";
import styles from "./SparkSidebar.module.scss";

/** A generated homebrew entity awaiting the user's decision. Nothing is saved until Confirm. */
const HomebrewPreviewCard: Component<{ preview: HomebrewPreview }> = (props) => {
    const navigate = useNavigate();
    return (
        <Container theme="surface" class={styles.previewCard}>
            <div class={styles.previewHeader}>
                <div>
                    <strong>{props.preview.title}</strong>
                    <div class={styles.previewSubtitle}>{previewSubtitle(props.preview)}</div>
                </div>
            </div>
            <Show when={previewBody(props.preview)}>
                <div class={styles.previewBody}><Markdown text={previewBody(props.preview)} /></div>
            </Show>
            <Show when={!props.preview.valid}>
                <div class={styles.previewError}>{props.preview.errors.join(" ")}</div>
            </Show>
            <div class={styles.previewActions}>
                <Button
                    theme="primary"
                    disabled={!props.preview.valid}
                    onClick={() => aiAssistant.confirmPreview(props.preview.previewId)}
                >
                    Save
                </Button>
                <Button
                    transparent
                    title="Open in the homebrew editor"
                    onClick={() => { navigate(editorRouteFor(props.preview)); aiAssistant.close(); }}
                >
                    Open in editor
                </Button>
                <Button transparent title="Reject" onClick={() => aiAssistant.rejectPreview(props.preview.previewId)}>
                    <Icon icon={Close} size="small" /> Reject
                </Button>
            </div>
        </Container>
    );
};

export default HomebrewPreviewCard;
