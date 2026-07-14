import { Component, createSignal } from "solid-js";
import { AddEventModal } from "./addEventModal";
import styles from './eventChipBar.module.scss';

export const AddEventChip: Component = () => {
    const [showModal, setShowModal] = createSignal(false);
    return <>
        <button type="button" class={styles.addChip} onClick={() => setShowModal(true)}>
            + Event
        </button>
        <AddEventModal show={[showModal, setShowModal]} />
    </>;
};
