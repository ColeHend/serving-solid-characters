import { Component, createSignal } from "solid-js";
import { Button, TextArea } from "coles-solid-library";
import { SectionLabel } from "../../../../shared/sectionLabel/sectionLabel";
import styles from './rest.module.scss';

export const RestEvent: Component = () => {
    // TEMP demo rest state until events carry real data.
    const [restType, setRestType] = createSignal<'short' | 'long'>('long');
    const [notes, setNotes] = createSignal('Safe camp beneath the cliffs. Watches: Thorne, Lia.');

    return <div class={styles.rest}>
        <div class={styles.typeRow}>
            <Button transparent
                class={`${styles.typeBtn} ${restType() === 'short' ? styles.typeActive : ''}`}
                onClick={() => setRestType('short')}>Short rest</Button>
            <Button transparent
                class={`${styles.typeBtn} ${restType() === 'long' ? styles.typeActive : ''}`}
                onClick={() => setRestType('long')}>Long rest</Button>
            <span class={styles.hint}>
                {restType() === 'long'
                    ? 'Regain all HP, half hit dice, reset abilities.'
                    : 'Spend hit dice to recover; some abilities recharge.'}
            </span>
        </div>
        <SectionLabel label="Notes" />
        <TextArea class={styles.notes} text={notes} setText={setNotes}
            placeholder="Camp, watches, interruptions..." />
    </div>;
};
