import { Accessor, Component, createMemo, For } from "solid-js";
import { signed } from "../../../../../../shared/customHooks/utility/tools/dndMath"
import { Character } from "../../../../../../models/character.model";
import { SheetDerived } from "../../useSheetDerived";
import styles from "../../sheet.module.scss";

interface props {
    displayCharacter: Accessor<Character | undefined>;
    statLabels: Record<string, string>;
    derived: Accessor<SheetDerived>;
}

export const AbilityColumn: Component<props> = (props) => {
    const STAT_LABELS = createMemo(()=> props.statLabels);
    const d = createMemo(() => props.derived());

    return <>
        <div class={styles.abilityGrid}>
            <For each={["str", "dex", "con", "int", "wis", "cha"] as const}>
            {(key) => (
                <div class={styles.abilityCard}>
                <span class={styles.abilityName}>{STAT_LABELS()[key]}</span>
                <span class={styles.abilityMod}>{signed(d().abilityMods[key])}</span>
                <span class={styles.abilityScore}>{props.displayCharacter()?.stats?.[key] ?? 0}</span>
                </div>
            )}
            </For>
        </div>
        <div class={styles.abilityMetaRow}>
            <div class={styles.abilityMetaTile}>
            <span class={styles.metaBadge}>{signed(d().profBonus)}</span>
            <span class={styles.metaLabel}>Proficiency</span>
            </div>
            <div class={styles.abilityMetaTile}>
            <span class={styles.metaBadge}>{d().passivePerception}</span>
            <span class={styles.metaLabel}>Passive Perception</span>
            </div>
        </div>
    </>
}