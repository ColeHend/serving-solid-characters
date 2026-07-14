import { Accessor, Component, For, Setter, createEffect, createSignal, runWithOwner } from "solid-js";
import { Button, Input, Modal, Select, Option } from "coles-solid-library";
import { isMobile } from "coles-solid-library/dist/tools/tools.js";
import { useActiveEvents } from "../hooks/activeEvents";
import { EVENT_TYPE_META, EventType } from "../shared/eventTypes.shared";
import styles from './eventChipBar.module.scss';

interface AddEventModalProps {
    show: [Accessor<boolean>, Setter<boolean>];
}

export const AddEventModal: Component<AddEventModalProps> = (props) => {
    const { addActiveEvent } = useActiveEvents();
    const [modalEl, setModalEl] = createSignal<Element>();
    const [name, setName] = createSignal('');
    const [type, setType] = createSignal<EventType>('combat');

    createEffect(() => {
        const modal = modalEl();
        if (modal) {
            modal.classList.add(`${styles.modal}`);
        }
    });

    const createEvent = () => {
        if (!name().trim()) return;
        addActiveEvent(name().trim(), type(), true);
        setName('');
        props.show[1](false);
    };

    return <Modal
        title="Add Event"
        show={props.show}
        width={isMobile() ? '' : '22vw'}
        height={'35vh'}
        ref={setModalEl}>
        <div class={styles.modalBody}>
            <Input
                placeholder="Event name"
                value={name()}
                onChange={(e) => setName(e.currentTarget.value)} />
            <Select
                placeholder="Event type"
                value={type()}
                onChange={(v) => runWithOwner(null, () => setType(v as EventType))}>
                <For each={Object.entries(EVENT_TYPE_META)}>{([key, meta]) =>
                    <Option value={key}>{meta.label}</Option>
                }</For>
            </Select>
            <Button onClick={createEvent}>Add</Button>
        </div>
    </Modal>;
};
