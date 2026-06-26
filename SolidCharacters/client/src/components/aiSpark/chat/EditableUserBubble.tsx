import { Component, Show, createSignal } from "solid-js";
import { Button, Icon, TextArea } from "coles-solid-library";
import { Check, Close, Edit } from "coles-solid-library/icons";
import { aiAssistant } from "../../../shared/customHooks/aiAssistant";
import { ChatMessage } from "../aiSpark.shared";
import styles from "../SparkSidebar.module.scss";

/**
 * A user prompt bubble with an inline "edit & rewind" affordance. A pencil (revealed on hover/focus, hidden
 * while a turn is streaming) turns the bubble into an editable TextArea; Save asks for a one-tap inline
 * confirm — rewinding discards every later message and regenerates from here (already-saved homebrew is
 * kept) — then calls aiAssistant.editAndRewind(). Uses an inline confirm rather than a portaled Modal,
 * which would render behind the z-index:1200 sidebar (see ConversationMenu).
 */
const EditableUserBubble: Component<{ message: ChatMessage }> = (props) => {
    const [editing, setEditing] = createSignal(false);
    const [confirming, setConfirming] = createSignal(false);
    const [text, setText] = createSignal(props.message.text);
    const streaming = () => aiAssistant.status() === "streaming";
    const unchanged = () => text().trim() === props.message.text.trim();

    const startEdit = () => { setText(props.message.text); setConfirming(false); setEditing(true); };
    const cancel = () => { setEditing(false); setConfirming(false); };
    const requestSave = () => {
        if (!text().trim() || unchanged()) { cancel(); return; }   // nothing to do → just close the editor
        setConfirming(true);
    };
    const confirmSave = () => {
        aiAssistant.editAndRewind(props.message.id, text());
        cancel();
    };

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); requestSave(); }
        if (e.key === "Escape") { e.preventDefault(); cancel(); }
    };

    return (
        <div class={`${styles.bubbleRow} ${styles.bubbleRowUser}`}>
            <Show
                when={editing()}
                fallback={
                    <div class={styles.userBubbleWrap}>
                        <Show when={!streaming()}>
                            <Button transparent class={styles.editPrompt} title="Edit & rewind from here" aria-label="Edit message" onClick={startEdit}>
                                <Icon icon={Edit} size="small" />
                            </Button>
                        </Show>
                        <div class={`${styles.bubble} ${styles.bubbleUser}`}>{props.message.text}</div>
                    </div>
                }
            >
                <div class={styles.editPromptBox}>
                    <TextArea text={text} setText={setText} rows={2} onKeyDown={onKeyDown} />
                    <Show
                        when={confirming()}
                        fallback={
                            <div class={styles.editPromptActions}>
                                <Button transparent title="Cancel" aria-label="Cancel edit" onClick={cancel}>
                                    <Icon icon={Close} size="small" /> Cancel
                                </Button>
                                <Button theme="primary" title="Save & rewind" disabled={!text().trim()} onClick={requestSave}>
                                    Save
                                </Button>
                            </div>
                        }
                    >
                        <div class={styles.editPromptConfirm}>
                            <span class={styles.editPromptConfirmText}>
                                This removes all later messages and regenerates from here. Saved homebrew stays in your collection.
                            </span>
                            <div class={styles.editPromptActions}>
                                <Button transparent title="Keep the conversation as it is" aria-label="Cancel rewind" onClick={() => setConfirming(false)}>
                                    <Icon icon={Close} size="small" /> Cancel
                                </Button>
                                <Button theme="primary" title="Discard later messages and regenerate" aria-label="Confirm rewind" onClick={confirmSave}>
                                    <Icon icon={Check} size="small" /> Confirm
                                </Button>
                            </div>
                        </div>
                    </Show>
                </div>
            </Show>
        </div>
    );
};

export default EditableUserBubble;
