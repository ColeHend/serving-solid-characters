import { Component, Show, createSignal, runWithOwner } from "solid-js";
import { Button, Input, NumberInput, Select, Option, TextArea } from "coles-solid-library";
import { SectionLabel } from "../../../../shared/sectionLabel/sectionLabel";
import styles from './travel.module.scss';

export const TravelEvent: Component = () => {
    // TEMP demo travel-leg state until events carry real data.
    const [distance, setDistance] = createSignal('24 miles');
    const [pace, setPace] = createSignal('normal');
    const [encounterChance, setEncounterChance] = createSignal(25);
    const [notes, setNotes] = createSignal('Two days from Neverwinter toward Phandalin.');
    const [lastRoll, setLastRoll] = createSignal<number>();

    const rollEncounter = () => {
        setLastRoll(Math.floor(Math.random() * 100) + 1);
    };

    return <div class={styles.travel}>
        <div class={styles.fieldsRow}>
            <label class={styles.field}>
                <span class={styles.fieldLabel}>Distance</span>
                <Input value={distance()} onChange={(e) => setDistance(e.currentTarget.value)} />
            </label>
            <label class={styles.field}>
                <span class={styles.fieldLabel}>Pace</span>
                <Select value={pace()} onChange={(v) => runWithOwner(null, () => setPace(v))}>
                    <Option value="slow">Slow</Option>
                    <Option value="normal">Normal</Option>
                    <Option value="fast">Fast</Option>
                </Select>
            </label>
            <label class={styles.field}>
                <span class={styles.fieldLabel}>Encounter chance</span>
                <span class={styles.chanceWrap}>
                    <NumberInput hideSteppers value={encounterChance()}
                        onChange={(e) => setEncounterChance(Number(e.currentTarget.value) || 0)} />
                    <span class={styles.percent}>%</span>
                </span>
            </label>
            <span class={styles.rollWrap}>
                <Button transparent class={styles.rollBtn} onClick={rollEncounter}>Roll encounter</Button>
                <Show when={lastRoll() !== undefined}>
                    <span class={`${styles.rollResult} ${lastRoll()! <= encounterChance() ? styles.rollHit : ''}`}>
                        {lastRoll()} — {lastRoll()! <= encounterChance() ? 'Encounter!' : 'All clear'}
                    </span>
                </Show>
            </span>
        </div>
        <SectionLabel label="Notes" />
        <TextArea class={styles.notes} text={notes} setText={setNotes} placeholder="Route, weather, omens..." />
    </div>;
};
