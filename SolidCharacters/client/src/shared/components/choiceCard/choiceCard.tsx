import { Component, createMemo } from "solid-js";
import styles from "./choiceCard.module.scss";

interface props {
    ChoiceKey: string;
    text: string;
}

export const ChoiceCard: Component<props> = (props) => {
    const key = createMemo(() => props.ChoiceKey);
    const text = createMemo(() => props.text);

    return <div class={`${styles.choiceCard}`}>
        <div class={`${styles.roundel}`}>
            {key()}
        </div>
        
        <div class={`${styles.text}`}>
            {text()}
        </div>
    </div>
}