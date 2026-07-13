import { Component, For, createMemo, createSignal } from "solid-js";
import { Input } from "coles-solid-library";
import { SectionLabel } from "../../shared/sectionLabel/sectionLabel";
import { DEMO_MONSTERS } from "./bestiary.shared";
import { MonsterRow } from "./monsterRow";
import styles from './bestiary.module.scss';

export const BestiaryTile: Component = () => {
    const [search, setSearch] = createSignal('');
    const filtered = createMemo(() => {
        const term = search().trim().toLowerCase();
        if (!term) return DEMO_MONSTERS;
        return DEMO_MONSTERS.filter((m) => m.name.toLowerCase().includes(term));
    });

    return <div class={styles.tile}>
        <SectionLabel label="Bestiary" />
        <Input style={{color: 'color: var(--text-color)'}} placeholder="Search monsters..." value={search()}
            onChange={(e) => setSearch(e.currentTarget.value)} />
        <span class={styles.hint}>Open a Combat event to drop these into initiative.</span>
        <div class={styles.rows}>
            <For each={filtered()}>{(monster) =>
                <MonsterRow monster={monster} />
            }</For>
        </div>
    </div>;
};
