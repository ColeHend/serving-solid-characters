import { Component, For } from "solid-js";
import { useActiveEvents } from "../hooks/activeEvents";
import { EventChip } from "./eventChip";
import { AddEventChip } from "./addEventChip";
import styles from './eventChipBar.module.scss';

export const EventChipBar: Component = () => {
    const { getActiveEvents, selectActiveEvent } = useActiveEvents();
    return <div class={styles.bar}>
        <For each={getActiveEvents()}>{(event) =>
            <EventChip event={event} onSelect={selectActiveEvent} />
        }</For>
        <AddEventChip />
    </div>;
};
