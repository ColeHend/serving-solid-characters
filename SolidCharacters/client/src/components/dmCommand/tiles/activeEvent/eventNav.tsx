import { Component } from "solid-js";
import { Button } from "coles-solid-library";
import { useActiveEvents } from "../../hooks/activeEvents";
import styles from './activeEvent.module.scss';

interface EventNavProps {
    onOpenTimeline: () => void;
}

export const EventNav: Component<EventNavProps> = (props) => {
    const { getActiveEvents, activeIndex, stepActiveEvent } = useActiveEvents();
    const position = () => {
        const idx = activeIndex();
        const total = getActiveEvents().length;
        return idx === -1 ? `End · ${total}` : `${idx + 1} / ${total}`;
    };
    return <div class={styles.nav}>
        <Button transparent class={styles.navBtn}
            disabled={activeIndex() === 0}
            onClick={() => stepActiveEvent(-1)}>◀</Button>
        <Button transparent class={styles.navPosition} onClick={props.onOpenTimeline}>
            {position()}
        </Button>
        <Button transparent class={styles.navBtn}
            disabled={activeIndex() === -1}
            onClick={() => stepActiveEvent(1)}>▶</Button>
    </div>;
};
