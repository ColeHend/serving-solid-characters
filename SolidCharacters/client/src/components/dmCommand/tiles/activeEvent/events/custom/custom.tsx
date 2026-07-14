import { Component, createSignal } from "solid-js";
import { TextArea } from "coles-solid-library";
import { SectionLabel } from "../../../../shared/sectionLabel/sectionLabel";
import styles from './custom.module.scss';

/**
 * The renameable "Custom" event — a freeform panel the DM can shape however
 * they like. The rename input lives in the ActiveEvent tile header.
 */
export const CustomEvent: Component = () => {
    // TEMP demo text until events carry real data.
    const [notes, setNotes] = createSignal('');

    return <div class={styles.custom}>
        <span class={styles.hint}>Rename this event above — use it for anything the other types don't cover.</span>
        <SectionLabel label="Notes" />
        <TextArea class={styles.notes} text={notes} setText={setNotes}
            placeholder="Whatever you need..." />
    </div>;
};
