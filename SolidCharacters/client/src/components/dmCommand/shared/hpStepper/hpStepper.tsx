import { Component } from "solid-js";
import { Button, NumberInput } from "coles-solid-library";
import { HpBar } from "../hpBar/hpBar";
import styles from './hpStepper.module.scss';

interface HpStepperProps {
    current: number;
    max: number;
    onChange: (next: number) => void;
}

export const HpStepper: Component<HpStepperProps> = (props) => {
    const clamp = (v: number) => Math.max(0, Math.min(props.max, v));
    return <div class={styles.stepper}>
        <div class={styles.controls}>
            <Button transparent class={`${styles.stepBtn} ${styles.minus}`}
                onClick={() => props.onChange(clamp(props.current - 1))}>−</Button>
            <span class={styles.valueWrap}>
                <NumberInput
                    hideSteppers
                    class={styles.value}
                    value={props.current}
                    onChange={(e) => props.onChange(clamp(Number(e.currentTarget.value) || 0))} />
            </span>
            <span class={styles.max}>/ {props.max}</span>
            <Button transparent class={`${styles.stepBtn} ${styles.plus}`}
                onClick={() => props.onChange(clamp(props.current + 1))}>+</Button>
        </div>
        <HpBar current={props.current} max={props.max} />
    </div>;
};
