import { Component, createSignal } from "solid-js";
import { Button } from "coles-solid-library";
import { AddEventModal } from "../../eventChipBar/addEventModal";
import styles from './activeEvent.module.scss';

/** Shown when the DM navigates past the last event — create the next one or wrap up. */
export const EndOfTimeline: Component = () => {
    const [showAdd, setShowAdd] = createSignal(false);
    return <div class={styles.endState}>
        <span class={styles.endTitle}>End of the timeline</span>
        <span class={styles.endText}>Every prepared event is behind you. What happens next?</span>
        <div class={styles.endActions}>
            <Button transparent class={styles.endBtn} onClick={() => setShowAdd(true)}>
                + Create event
            </Button>
            <Button transparent class={`${styles.endBtn} ${styles.endBtnAccent}`}>
                Start next session
            </Button>
        </div>
        <AddEventModal show={[showAdd, setShowAdd]} />
    </div>;
};
