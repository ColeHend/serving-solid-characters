import { Component, For, Index, createSignal } from "solid-js";
import { Button, TextArea } from "coles-solid-library";
import { SectionLabel } from "../../../../shared/sectionLabel/sectionLabel";
import { CheckRow, SkillCheck } from "./checkRow";
import styles from './exploration.module.scss';

const MAX_TICKS = 3;

export const ExplorationEvent: Component = () => {
    // TEMP demo skill-challenge state until events carry real data.
    const [successes, setSuccesses] = createSignal(1);
    const [failures, setFailures] = createSignal(0);
    const [notes, setNotes] = createSignal('Stream-mouth cave, slippery rocks.');
    const [checks, setChecks] = createSignal<SkillCheck[]>([
        { skill: 'Perception', dc: 14 },
        { skill: 'Survival', dc: 12 },
        { skill: 'Stealth', dc: 13 },
    ]);

    const clampTicks = (v: number) => Math.max(0, Math.min(MAX_TICKS, v));
    const status = () => {
        if (successes() >= MAX_TICKS) return 'Overcome';
        if (failures() >= MAX_TICKS) return 'Failed';
        return 'In progress';
    };

    const removeCheck = (index: number) => {
        setChecks((old) => old.filter((_, i) => i !== index));
    };
    const addCheck = () => {
        setChecks((old) => [...old, { skill: 'New check', dc: 10 }]);
    };

    return <div class={styles.exploration}>
        <div class={styles.countersRow}>
            <div class={styles.counter}>
                <span class={styles.counterLabel}>Successes</span>
                <span class={styles.counterControls}>
                    <Button transparent class={styles.tickBtn}
                        onClick={() => setSuccesses((s) => clampTicks(s - 1))}>−</Button>
                    <Index each={Array.from({ length: MAX_TICKS })}>{(_, i) =>
                        <span class={`${styles.tick} ${i < successes() ? styles.tickSuccess : ''}`} />
                    }</Index>
                    <Button transparent class={styles.tickBtn}
                        onClick={() => setSuccesses((s) => clampTicks(s + 1))}>+</Button>
                </span>
            </div>
            <div class={styles.counter}>
                <span class={styles.counterLabel}>Failures</span>
                <span class={styles.counterControls}>
                    <Button transparent class={styles.tickBtn}
                        onClick={() => setFailures((f) => clampTicks(f - 1))}>−</Button>
                    <Index each={Array.from({ length: MAX_TICKS })}>{(_, i) =>
                        <span class={`${styles.tick} ${i < failures() ? styles.tickFailure : ''}`} />
                    }</Index>
                    <Button transparent class={styles.tickBtn}
                        onClick={() => setFailures((f) => clampTicks(f + 1))}>+</Button>
                </span>
            </div>
            <span class={styles.spacer} />
            <span class={styles.statusPill}>{status()}</span>
        </div>
        <SectionLabel label="Available checks"
            action={<Button transparent class={styles.addCheckBtn} onClick={addCheck}>+ Check</Button>} />
        <div class={styles.checks}>
            <For each={checks()}>{(check, i) =>
                <CheckRow check={check} onRemove={() => removeCheck(i())} />
            }</For>
        </div>
        <SectionLabel label="Notes" />
        <TextArea class={styles.notes} text={notes} setText={setNotes} placeholder="What the party finds..." />
    </div>;
};
