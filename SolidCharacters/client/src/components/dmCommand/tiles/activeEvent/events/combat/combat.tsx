import { Component, For, Show, createMemo, createSignal, onMount } from "solid-js";
import { Button, TextArea } from "coles-solid-library";
import { useCombatants } from "../../../../hooks/combatants";
import { SectionLabel } from "../../../../shared/sectionLabel/sectionLabel";
import { CombatantRow } from "./combatantRow";
import { CombatAddRow } from "./combatAddRow";
import styles from './combat.module.scss';

interface CombatEventProps {
    eventId: string;
    isBoss: boolean;
}

const difficultyForCount = (count: number) => {
    if (count === 0) return 'Trivial';
    if (count <= 3) return 'Medium';
    return 'Deadly';
};

export const CombatEvent: Component<CombatEventProps> = (props) => {
    const { getState, seedDemo, nextTurn, setHp, addCombatant, removeCombatant, removeCondition } = useCombatants(props.eventId);
    const [legendaryNotes, setLegendaryNotes] = createSignal('');

    onMount(() => {
        // Boss fights start empty ("awaiting combatants"); regular demo combat is pre-seeded.
        if (!props.isBoss) seedDemo();
    });

    const activeTurnName = createMemo(() => getState().combatants[getState().turnIndex]?.name);
    const enemyCount = createMemo(() => getState().combatants.filter(c => !c.isAlly).length);

    return <div class={styles.combat}>
        <div class={styles.turnRow}>
            <Button transparent class={styles.nextTurnBtn} onClick={nextTurn}>
                Next turn ▶
            </Button>
            <span class={styles.roundInfo}>
                <span class={styles.roundLabel}>Round {getState().round}</span>
                <span class={styles.turnName}>
                    {activeTurnName() ? `${activeTurnName()}'s turn` : 'Awaiting combatants'}
                </span>
            </span>
            <span class={styles.turnSpacer} />
            <span class={styles.difficulty}>
                <span class={styles.difficultyLabel}>Difficulty</span>
                <span class={styles.difficultyPill}>{difficultyForCount(enemyCount())}</span>
            </span>
        </div>
        <div class={styles.columnHeads}>
            <span class={styles.headInit}>Init</span>
            <span class={styles.headName}>Combatant</span>
            <span class={styles.headHp}>Hit points</span>
            <span class={styles.headAc}>AC</span>
        </div>
        <div class={styles.rows}>
            <For each={getState().combatants}>{(combatant, i) =>
                <CombatantRow
                    combatant={combatant}
                    isTurn={i() === getState().turnIndex}
                    onHpChange={(hp) => setHp(combatant.id, hp)}
                    onRemove={() => removeCombatant(combatant.id)}
                    onRemoveCondition={(cond) => removeCondition(combatant.id, cond)} />
            }</For>
        </div>
        <CombatAddRow onAdd={addCombatant} />
        <Show when={props.isBoss}>
            <SectionLabel label="Legendary / Lair actions" />
            <TextArea
                class={styles.legendary}
                text={legendaryNotes}
                setText={setLegendaryNotes}
                placeholder="e.g. 1 action: Detect. 2 actions: Tail Attack. Lair (init 20): grasping roots, DC 13 Str..." />
        </Show>
    </div>;
};
