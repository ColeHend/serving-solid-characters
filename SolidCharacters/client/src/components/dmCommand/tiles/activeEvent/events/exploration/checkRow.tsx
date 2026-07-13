import { Component } from "solid-js";
import { Button, Input, NumberInput } from "coles-solid-library";
import styles from './exploration.module.scss';

export interface SkillCheck {
    skill: string;
    dc: number;
}

interface CheckRowProps {
    check: SkillCheck;
    onRemove: () => void;
}

export const CheckRow: Component<CheckRowProps> = (props) => {
    return <div class={styles.checkRow}>
        <Input value={props.check.skill} placeholder="Skill" />
        <span class={styles.dcLabel}>DC</span>
        <span class={styles.dcInput}>
            <NumberInput hideSteppers value={props.check.dc} />
        </span>
        <Button transparent class={styles.removeBtn} onClick={props.onRemove}>✕</Button>
    </div>;
};
