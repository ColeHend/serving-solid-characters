import { Component, createSignal } from "solid-js";
import { Button, TextArea } from "coles-solid-library";
import { SectionLabel } from "../../../../shared/sectionLabel/sectionLabel";
import { StatBox } from "../../../../shared/statBox/statBox";
import styles from './puzzle.module.scss';

export const PuzzleEvent: Component = () => {
    // TEMP demo puzzle state until events carry real data.
    const [solution, setSolution] = createSignal('Press runes spelling BURGLE in Dwarvish');
    const [description, setDescription] = createSignal('Dwarven door, glowing runes.');
    const [revealed, setRevealed] = createSignal(false);
    const [solved, setSolved] = createSignal(false);

    return <div class={styles.puzzle}>
        <div class={styles.statRow}>
            <StatBox label="Detect DC" value={15} />
            <StatBox label="Disarm / Solve DC" value={17} />
            <span class={styles.spacer} />
            <Button transparent
                class={`${styles.solveBtn} ${solved() ? styles.solved : ''}`}
                onClick={() => setSolved((s) => !s)}>
                {solved() ? 'Solved ✓' : 'Mark solved'}
            </Button>
        </div>
        <SectionLabel label="Solution"
            action={<Button transparent class={styles.revealBtn}
                onClick={() => setRevealed((r) => !r)}>
                {revealed() ? 'Hide' : 'Reveal'}
            </Button>} />
        <div class={`${styles.solutionWrap} ${revealed() ? '' : styles.hidden}`}>
            <TextArea class={styles.textArea} text={solution} setText={setSolution}
                placeholder="How the puzzle is beaten..." />
        </div>
        <SectionLabel label="Description" />
        <TextArea class={styles.textArea} text={description} setText={setDescription}
            placeholder="What the party sees..." />
    </div>;
};
