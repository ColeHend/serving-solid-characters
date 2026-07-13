import { Component, For, createSignal } from "solid-js";
import { Button, NumberInput, TextArea } from "coles-solid-library";
import { SectionLabel } from "../../../../shared/sectionLabel/sectionLabel";
import { NpcCard, Npc } from "./npcCard";
import styles from './social.module.scss';

interface Secret {
    state: 'Reveal' | 'Shown';
    text: string;
}

interface SkillDc {
    skill: string;
    dc: number;
}

export const SocialEvent: Component = () => {
    // TEMP demo social-scene state until events carry real data.
    const [npcs] = createSignal<Npc[]>([
        { name: 'Sildar Hallwinter', disposition: 'Friendly', goal: 'Find Gundren & reach Phandalin', personality: 'Weary, grateful, honorable' },
    ]);
    const [secrets, setSecrets] = createSignal<Secret[]>([
        { state: 'Reveal', text: 'Iarno "Glasstaff" leads the Redbrands' },
        { state: 'Shown', text: 'Offers 50 gp to escort him' },
    ]);
    const [skillDcs] = createSignal<SkillDc[]>([
        { skill: 'Insight', dc: 12 },
        { skill: 'Persuasion', dc: 14 },
    ]);
    const [outcome, setOutcome] = createSignal('');

    const removeSecret = (index: number) => {
        setSecrets((old) => old.filter((_, i) => i !== index));
    };

    return <div class={styles.social}>
        <SectionLabel label="NPCs"
            action={<Button transparent class={styles.ghostAdd}>+ NPC</Button>} />
        <For each={npcs()}>{(npc) => <NpcCard npc={npc} />}</For>
        <SectionLabel label="Secrets & key dialogue"
            action={<Button transparent class={styles.ghostAdd}>+ Secret</Button>} />
        <div class={styles.secrets}>
            <For each={secrets()}>{(secret, i) =>
                <div class={styles.secretRow}>
                    <span class={`${styles.secretTag} ${secret.state === 'Shown' ? styles.secretShown : ''}`}>
                        {secret.state}
                    </span>
                    <span class={styles.secretText}>{secret.text}</span>
                    <Button transparent class={styles.removeBtn} onClick={() => removeSecret(i())}>✕</Button>
                </div>
            }</For>
        </div>
        <div class={styles.bottomSplit}>
            <div class={styles.dcColumn}>
                <SectionLabel label="Skill DCs" />
                <For each={skillDcs()}>{(row) =>
                    <div class={styles.dcRow}>
                        <span class={styles.dcSkill}>{row.skill}</span>
                        <span class={styles.dcLabel}>DC</span>
                        <span class={styles.dcInput}>
                            <NumberInput hideSteppers value={row.dc} />
                        </span>
                    </div>
                }</For>
            </div>
            <div class={styles.outcomeColumn}>
                <SectionLabel label="Outcome" />
                <TextArea class={styles.outcome} text={outcome} setText={setOutcome}
                    placeholder="What did the party learn / decide?" />
            </div>
        </div>
    </div>;
};
