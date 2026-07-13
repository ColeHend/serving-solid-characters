import { Component, JSX, Show } from "solid-js";
import styles from './sectionLabel.module.scss';

interface SectionLabelProps {
    label: string;
    /** Optional right-aligned action slot (e.g. a "+ NPC" button). */
    action?: JSX.Element;
}

export const SectionLabel: Component<SectionLabelProps> = (props) => {
    return <div class={styles.row}>
        <span class={styles.label}>{props.label}</span>
        <Show when={props.action}>
            <span class={styles.action}>{props.action}</span>
        </Show>
    </div>;
};
