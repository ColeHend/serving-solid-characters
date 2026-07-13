import { Component, createSignal, onCleanup, onMount } from "solid-js";
import styles from './dmHeader.module.scss';

const formatElapsed = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${`${seconds}`.padStart(2, '0')}`;
};

export const SessionTimePill: Component = () => {
    // TEMP demo clock — counts from page load until sessions track real start times.
    const [elapsed, setElapsed] = createSignal(0);
    onMount(() => {
        const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
        onCleanup(() => clearInterval(timer));
    });
    return <span class={styles.timePill}>
        <span class={styles.timeDot} />
        <span class={styles.timeLabel}>Session time</span>
        <span class={styles.timeValue}>{formatElapsed(elapsed())}</span>
    </span>;
};
