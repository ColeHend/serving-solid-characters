import { Component, createSignal } from "solid-js";
import { TextArea } from "coles-solid-library";
import { SectionLabel } from "../../shared/sectionLabel/sectionLabel";
import styles from './notes.module.scss';

export const SessionNotesTile: Component = () => {
    // TEMP demo note until sessions persist notes.
    const [notes, setNotes] = createSignal(
        'Redbrands harass Phandalin. Glasstaff hides beneath Tresendar Manor. Sister Garaele wants a favor.'
    );

    return <div class={styles.tile}>
        <SectionLabel label="Session notes" />
        <TextArea class={styles.notes} text={notes} setText={setNotes}
            placeholder="Everything worth remembering..." />
    </div>;
};
