import { Component, For, Show } from "solid-js";
import { Button, Chip } from "coles-solid-library";
import { Combatant } from "../../../../hooks/combatants";
import { HpStepper } from "../../../../shared/hpStepper/hpStepper";
import styles from './combat.module.scss';

interface CombatantRowProps {
    combatant: Combatant;
    isTurn: boolean;
    onHpChange: (hp: number) => void;
    onRemove: () => void;
    onRemoveCondition: (condition: string) => void;
}

export const CombatantRow: Component<CombatantRowProps> = (props) => {
    return <div class={`${styles.row} ${props.isTurn ? styles.rowTurn : ''}`}>
        <span class={styles.init}>{props.combatant.init}</span>
        <span class={styles.nameCol}>
            <span class={styles.nameLine}>
                <span class={styles.name}>{props.combatant.name}</span>
                <Show when={props.combatant.isAlly}>
                    <span class={styles.allyTag}>Ally</span>
                </Show>
            </span>
            <Show when={props.combatant.conditions.length > 0}>
                <span class={styles.conditions}>
                    <For each={props.combatant.conditions}>{(condition) =>
                        <Chip value={condition} remove={() => props.onRemoveCondition(condition)} />
                    }</For>
                </span>
            </Show>
        </span>
        <HpStepper
            current={props.combatant.hp}
            max={props.combatant.maxHp}
            onChange={props.onHpChange} />
        <span class={styles.ac}>{props.combatant.ac}</span>
        <Button transparent class={styles.removeBtn} onClick={props.onRemove}>✕</Button>
    </div>;
};
