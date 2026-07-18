import { Component, For, Show } from "solid-js";
import { NumberInput } from "coles-solid-library";
import { signed } from "../../../../../shared/customHooks/utility/tools/dndMath";
import { useCreate } from "../../state/createContext";
import styles from "./hpSection.module.scss";

/** Blank/unparseable input clears the manual value (falls back to auto). */
const parseHp = (raw: string): number | undefined => {
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? undefined : Math.max(0, parsed);
};

/**
 * Hit-point breakdown with manual overrides. Max HP auto-computes from the class hit dice
 * (1st level = max die, later levels = average, +CON each level); typing a Max/Current
 * value overrides the auto figure, clearing the box returns to auto.
 */
export const HpSection: Component = () => {
  const { draft, actions, derived } = useCreate();

  const conMod = () => derived.abilityMods().con;

  return (
    <div>
      <Show
        when={draft.classes.length > 0}
        fallback={<p class={styles.emptyHint}>Pick a class first — hit dice come from it.</p>}
      >
        <div class={styles.breakdown}>
          <For each={draft.classes}>
            {(entry) => (
              <span class={styles.dieLine}>
                {entry.name} — {entry.level} × <span class={styles.dieBadge}>{derived.classByKey(entry)?.hitDie ?? "?"}</span>
              </span>
            )}
          </For>
        </div>
        <p class={styles.ruleHint}>
          1st level takes the full die; every level after adds the die's average. Constitution
          adds {signed(conMod())} per level.
        </p>
        <p class={styles.autoLine}>
          Auto max HP: <strong>{derived.autoMaxHp()}</strong>
        </p>
      </Show>

      <div class={styles.fields}>
        <label class={styles.field}>
          <span class={styles.fieldLabel}>Max HP</span>
          <NumberInput
            min={0}
            value={draft.hp.maxOverride ?? ""}
            placeholder={`${derived.autoMaxHp()}`}
            onInput={(e) => actions.setHpMaxOverride(parseHp(e.currentTarget.value))}
          />
          <span class={styles.fieldHint}>Blank = auto</span>
        </label>
        <label class={styles.field}>
          <span class={styles.fieldLabel}>Current HP</span>
          <NumberInput
            min={0}
            value={draft.hp.current ?? ""}
            placeholder={`${derived.maxHp()}`}
            onInput={(e) => actions.setHpCurrent(parseHp(e.currentTarget.value))}
          />
          <span class={styles.fieldHint}>Blank = full</span>
        </label>
        <label class={styles.field}>
          <span class={styles.fieldLabel}>Temp HP</span>
          <NumberInput
            min={0}
            value={draft.hp.temp}
            onInput={(e) => actions.setHpTemp(parseHp(e.currentTarget.value) ?? 0)}
          />
        </label>
      </div>
    </div>
  );
};
