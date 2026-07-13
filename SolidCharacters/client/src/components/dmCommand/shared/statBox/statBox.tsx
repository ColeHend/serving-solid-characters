import { Component, Show } from "solid-js";
import styles from './statBox.module.scss';

interface StatBoxProps {
    label: string;
    value: string | number;
    subtext?: string;
}

export const StatBox: Component<StatBoxProps> = (props) => {
    return <div class={styles.box}>
        <span class={styles.label}>{props.label}</span>
        <span class={styles.value}>{props.value}</span>
        <Show when={props.subtext}>
            <span class={styles.subtext}>{props.subtext}</span>
        </Show>
    </div>;
};
