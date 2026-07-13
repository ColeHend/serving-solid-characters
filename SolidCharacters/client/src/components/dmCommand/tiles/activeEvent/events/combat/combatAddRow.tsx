import { Component, createSignal } from "solid-js";
import { Button, Input, NumberInput } from "coles-solid-library";
import styles from './combat.module.scss';

interface CombatAddRowProps {
    onAdd: (name: string, init: number, maxHp: number, ac: number) => void;
}

export const CombatAddRow: Component<CombatAddRowProps> = (props) => {
    const [name, setName] = createSignal('');
    const [init, setInit] = createSignal(10);
    const [hp, setHp] = createSignal(10);
    const [ac, setAc] = createSignal(10);

    const add = () => {
        if (!name().trim()) return;
        props.onAdd(name(), init(), hp(), ac());
        setName('');
    };

    return <div class={styles.addRow}>
        <Input placeholder="Name" value={name()}
            onChange={(e) => setName(e.currentTarget.value)} />
        <span class={styles.addNum}>
            <NumberInput hideSteppers placeholder="Init" tooltip="Initiative" value={init()}
                onChange={(e) => setInit(Number(e.currentTarget.value) || 0)} />
        </span>
        <span class={styles.addNum}>
            <NumberInput hideSteppers placeholder="HP" tooltip="Hit points" value={hp()}
                onChange={(e) => setHp(Number(e.currentTarget.value) || 0)} />
        </span>
        <span class={styles.addNum}>
            <NumberInput hideSteppers placeholder="AC" tooltip="Armor class" value={ac()}
                onChange={(e) => setAc(Number(e.currentTarget.value) || 0)} />
        </span>
        <Button transparent class={styles.addBtn} onClick={add}>Add</Button>
    </div>;
};
