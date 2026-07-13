import { Component, createMemo } from "solid-js";
import { eventTypeMeta } from "../eventTypes.shared";
import styles from './typeBadge.module.scss';

interface TypeBadgeProps {
    type: string;
}

export const TypeBadge: Component<TypeBadgeProps> = (props) => {
    const meta = createMemo(() => eventTypeMeta(props.type));
    return <span
        class={styles.badge}
        style={{ '--badge-color': meta().color }}>
        {meta().label}
    </span>;
};
