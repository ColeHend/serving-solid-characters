import { Container } from "coles-solid-library";
import { Accessor, Component, createMemo, Setter } from "solid-js";
import { AbilityScores, StatBonus } from "../../../../../models/data";
import styles from "./statBox.module.scss";

interface boxProps {
    statName: string;
    score: Accessor<number>;
    modifier: Accessor<number>;
}

export const StatBox:Component<boxProps> = (props) => {
    const statName = createMemo(()=>props.statName);
    
    const currentScore = createMemo(()=>props.score());
    const getModifer = createMemo(()=>props.modifier());
    
    return <Container theme="surface" class={`${styles.StatBox}`}>
        <div class={`${styles.statHeader}`}>
            <h3>{statName()} - {currentScore() + getModifer()}</h3>
        </div>
        <div class={styles.divider} />
        <div class={`${styles.statView}`}>
            <strong>Base Score </strong>
            <span>{currentScore()}</span>
        </div>
        <div class={`${styles.statView}`}>
            <strong>Modifier </strong>
            <span>+{getModifer()}</span>
        </div>
    </Container>
}