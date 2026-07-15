import { Component, For, createMemo, createSignal } from "solid-js";
import { FormField, Input } from "coles-solid-library";
import { SectionLabel } from "../../shared/sectionLabel/sectionLabel";
import { MonsterRow } from "./monsterRow";
import styles from './bestiary.module.scss';
import { useGetSrdMonsters } from "../../../../shared/customHooks/dndInfo/info/srd/monsters";
import { getUserSettings } from "../../../../shared";

export const BestiaryTile: Component = () => {
    const [search, setSearch] = createSignal('');
    const [userSettings] = getUserSettings();
    const getMonsters = createMemo(() => {
        const systemMonsters = useGetSrdMonsters(userSettings().dndSystem);
        return systemMonsters();
    })
    const filtered = createMemo(() => {
        const term = search().trim().toLowerCase();
        if (!term) return getMonsters();
        return getMonsters().filter((m) => m.name.toLowerCase().includes(term));
    });

    return <div class={styles.tile}>
        <SectionLabel label="Bestiary" />
        <FormField name="Search Monsters.." variant="standard" dynamicErrorBar={true}>
            <Input placeholder="Search monsters..." value={search()}
                onChange={(e) => setSearch(e.currentTarget.value)} />
        </FormField>
        <span class={styles.hint}>Open a Combat event to drop these into initiative.</span>
        <div class={styles.rows}>
            <For each={filtered()}>{(monster) =>
                <MonsterRow monster={monster} />
            }</For>
        </div>
    </div>;
};
