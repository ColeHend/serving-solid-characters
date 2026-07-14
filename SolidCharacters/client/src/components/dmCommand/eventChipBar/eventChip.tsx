import { Component, Show, createMemo } from "solid-js";
import { ActiveEvent } from "../hooks/activeEvents";
import { eventTypeMeta } from "../shared/eventTypes.shared";
import styles from './eventChipBar.module.scss';

interface EventChipProps {
    event: ActiveEvent;
    onSelect: (id: string) => void;
}

export const EventChip: Component<EventChipProps> = (props) => {
    const meta = createMemo(() => eventTypeMeta(props.event.type));
    return <button
        type="button"
        class={`${styles.chip} ${props.event.isActive ? styles.chipActive : ''}`}
        style={{ '--chip-color': meta().color }}
        onClick={() => props.onSelect(props.event.id)}>
        <span class={styles.chipType}>
            <span class={styles.chipDot} />
            {meta().label}
            <Show when={props.event.resolved}>
                <span class={styles.chipCheck}>✓</span>
            </Show>
        </span>
        <span class={styles.chipName}>{props.event.name}</span>
    </button>;
};
