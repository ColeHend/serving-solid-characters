import { Component, For, createSignal } from "solid-js";
import { Button, NumberInput } from "coles-solid-library";
import { SectionLabel } from "../../shared/sectionLabel/sectionLabel";
import { StatBox } from "../../shared/statBox/statBox";
import styles from './lootXp.module.scss';

const PARTY_SIZE = 4;

export const LootXpTile: Component = () => {
    // TEMP demo tallies until sessions persist loot.
    const [gold, setGold] = createSignal(180);
    const [xp, setXp] = createSignal(1450);
    const [goldToAdd, setGoldToAdd] = createSignal(0);
    const [xpToAdd, setXpToAdd] = createSignal(0);
    const [items, setItems] = createSignal<string[]>(['Boots of Elvenkind', 'Potion of Healing']);

    const addGold = () => {
        setGold((g) => g + goldToAdd());
        setGoldToAdd(0);
    };
    const addXp = () => {
        setXp((x) => x + xpToAdd());
        setXpToAdd(0);
    };
    const removeItem = (index: number) => {
        setItems((old) => old.filter((_, i) => i !== index));
    };

    return <div class={styles.tile}>
        <SectionLabel label="Loot & XP" />
        <div class={styles.statRow}>
            <StatBox label="Gold" value={gold()} subtext={`${Math.floor(gold() / PARTY_SIZE)} each`} />
            <StatBox label="XP" value={xp()} subtext={`${Math.floor(xp() / PARTY_SIZE)} each`} />
        </div>
        <div class={styles.addRow}>
            <NumberInput hideSteppers placeholder="+ gold" value={goldToAdd() || undefined}
                onChange={(e) => setGoldToAdd(Number(e.currentTarget.value) || 0)} />
            <Button transparent class={styles.addBtn} onClick={addGold}>Add</Button>
        </div>
        <div class={styles.addRow}>
            <NumberInput hideSteppers placeholder="+ xp" value={xpToAdd() || undefined}
                onChange={(e) => setXpToAdd(Number(e.currentTarget.value) || 0)} />
            <Button transparent class={styles.addBtn} onClick={addXp}>Add</Button>
        </div>
        <div class={styles.items}>
            <For each={items()}>{(item, i) =>
                <div class={styles.itemRow}>
                    <span class={styles.itemName}>{item}</span>
                    <Button transparent class={styles.removeBtn} onClick={() => removeItem(i())}>✕</Button>
                </div>
            }</For>
        </div>
    </div>;
};
