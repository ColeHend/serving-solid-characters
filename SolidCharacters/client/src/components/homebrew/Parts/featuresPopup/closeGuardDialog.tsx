import { Accessor, Component, Setter, Show } from "solid-js";
import { Button, Modal } from "coles-solid-library";
import styles from "./closeGuardDialog.module.scss";

export type PendingClose = "save" | "cancel" | null;

interface CloseGuardDialogProps {
    /** Which close action is awaiting confirmation; null = hidden. */
    pending: Accessor<PendingClose>;
    unsetCount: Accessor<number>;
    onKeepEditing: () => void;
    /** Runs the close action that was intercepted (save without unset rows, or discard). */
    onConfirm: () => void;
}

/**
 * Confirmation shown when the feature dialog is closing with unset effects
 * (no category or no value) — they'd silently do nothing on the sheet.
 */
export const CloseGuardDialog: Component<CloseGuardDialogProps> = (props) => {
    const effectNoun = () => props.unsetCount() === 1 ? "effect" : "effects";
    return <Modal
        noHeader
        title="Unset effects"
        show={[
            () => props.pending() !== null,
            ((value: boolean) => { if (!value) props.onKeepEditing(); }) as Setter<boolean>,
        ]}
        width="min(420px, 92vw)"
    >
        <div class={styles.guard}>
            <h3 class={styles.guardTitle}>
                {`${props.unsetCount()} ${effectNoun()} without a value`}
            </h3>
            <p class={styles.guardBody}>
                <Show
                    when={props.pending() === "save"}
                    fallback="Closing discards your changes, including the unset effects."
                >
                    Unset {effectNoun()} {props.unsetCount() === 1 ? "does" : "do"} nothing on the
                    character sheet and won't be saved.
                </Show>
            </p>
            <div class={styles.guardButtons}>
                <Button onClick={() => props.onKeepEditing()}>Keep editing</Button>
                <Button theme="primary" onClick={() => props.onConfirm()}>
                    {props.pending() === "save" ? "Save anyway" : "Discard"}
                </Button>
            </div>
        </div>
    </Modal>
}
