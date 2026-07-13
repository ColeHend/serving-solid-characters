import { Accessor, Component, For, Setter, Show, createEffect, createSignal } from "solid-js";
import { Modal } from "coles-solid-library";
import { isMobile } from "coles-solid-library/dist/tools/tools.js";
import { useActiveEvents } from "../../hooks/activeEvents";
import { eventTypeMeta } from "../../shared/eventTypes.shared";
import styles from './activeEvent.module.scss';

interface TimelineModalProps {
    show: [Accessor<boolean>, Setter<boolean>];
}

export const TimelineModal: Component<TimelineModalProps> = (props) => {
    const { getActiveEvents, selectActiveEvent } = useActiveEvents();
    const [modalEl, setModalEl] = createSignal<Element>();

    createEffect(() => {
        const modal = modalEl();
        if (modal) {
            modal.classList.add(`${styles.modal}`);
        }
    });

    const jumpTo = (id: string) => {
        selectActiveEvent(id);
        props.show[1](false);
    };

    return <Modal
        title="Timeline"
        show={props.show}
        width={isMobile() ? '' : '26vw'}
        height={'50vh'}
        ref={setModalEl}>
        <div class={styles.timelineList}>
            <For each={getActiveEvents()}>{(event, i) =>
                <button
                    type="button"
                    class={`${styles.timelineRow} ${event.isActive ? styles.timelineRowActive : ''}`}
                    style={{ '--row-color': eventTypeMeta(event.type).color }}
                    onClick={() => jumpTo(event.id)}>
                    <span class={styles.timelineIndex}>{i() + 1}</span>
                    <span class={styles.timelineDot} />
                    <span class={styles.timelineType}>{eventTypeMeta(event.type).label}</span>
                    <span class={styles.timelineName}>{event.name}</span>
                    <Show when={event.resolved}>
                        <span class={styles.timelineCheck}>✓</span>
                    </Show>
                </button>
            }</For>
        </div>
    </Modal>;
};
