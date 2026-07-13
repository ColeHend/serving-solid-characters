import { Component, createSignal } from "solid-js";
import { TextArea } from "coles-solid-library";
import { SectionLabel } from "../../../../shared/sectionLabel/sectionLabel";
import styles from './scene.module.scss';

export const SceneEvent: Component = () => {
    // TEMP demo scene text until events carry real data.
    const [readAloud, setReadAloud] = createSignal('');

    return <div class={styles.scene}>
        <SectionLabel label="Read-aloud / scene notes" />
        <TextArea class={styles.readAloud} text={readAloud} setText={setReadAloud}
            placeholder="Set the scene..." />
    </div>;
};
