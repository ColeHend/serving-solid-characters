import { Component, For, Show, createMemo } from "solid-js";
import { Button, Option, Select } from "coles-solid-library";
import {
  ABILITY_FULL_NAMES,
  ABILITY_KEYS,
  AbilityBonusStyle,
  AbilityKey,
} from "../../rules/constants";
import { AbilityBonusPool, AbilityBonusToken, defaultSlots } from "../../rules/engine";
import { signed } from "../../../../../shared/customHooks/utility/tools/dndMath";
import { useCreate } from "../../state/createContext";
import styles from "./abilityBonusPanel.module.scss";

type BonusSource = "species" | "background";

/**
 * The unified ability-bonus assignment panel: one row per species/background bonus token,
 * each with an ability Select. Book defaults come prefilled (zero-click parity) but every
 * token is reassignable Tasha's-style; a +2/+1 pool offers the three-+1s alternative.
 */
export const AbilityBonusPanel: Component = () => {
  const { draft, actions, derived } = useCreate();

  const groups = createMemo(() =>
    [
      {
        source: "species" as BonusSource,
        label: `${draft.species || "Species"} bonuses`,
        pool: derived.speciesBonusPool(),
      },
      {
        source: "background" as BonusSource,
        label: `${draft.background || "Background"} bonuses`,
        pool: derived.backgroundBonusPool(),
      },
    ].filter((group) => group.pool.tokens.length > 0 || group.pool.all > 0));

  /** Allowed abilities for one row, minus those other rows of the same source already hold. */
  const optionsFor = (source: BonusSource, index: number, token: AbilityBonusToken): AbilityKey[] => {
    const slots = draft.abilityBonuses[source];
    const current = slots[index] ?? "";
    const used = new Set(slots.filter((slot, i) => i !== index && slot));
    const base = token.allowed.length > 0 ? token.allowed : ABILITY_KEYS;
    return base.filter((key) => key === current || !used.has(key));
  };

  const remaining = (source: BonusSource, pool: AbilityBonusPool): number => {
    const slots = draft.abilityBonuses[source];
    return pool.tokens.filter((_, i) => !(slots[i] ?? "")).length;
  };

  const setStyle = (source: BonusSource, style: AbilityBonusStyle) => {
    // Switching clears the slots for reseeding — don't wipe picks re-clicking the active pill.
    if (draft.abilityBonusStyle[source] !== style) actions.setAbilityBonusStyle(source, style);
  };

  return (
    <Show when={groups().length > 0}>
      <div class={styles.panel}>
        <For each={groups()}>
          {(group) => (
            <div class={styles.group}>
              <div class={styles.groupHead}>
                <h5 class={styles.groupLabel}>{group.label}</h5>
                <Show when={group.pool.canSpread}>
                  <div class={styles.styleToggle} role="group" aria-label="Bonus split">
                    <button
                      type="button"
                      class={styles.stylePill}
                      classList={{
                        [styles.stylePillActive]: draft.abilityBonusStyle[group.source] === "standard",
                      }}
                      onClick={() => setStyle(group.source, "standard")}
                    >
                      +2 / +1
                    </button>
                    <button
                      type="button"
                      class={styles.stylePill}
                      classList={{
                        [styles.stylePillActive]: draft.abilityBonusStyle[group.source] === "spread",
                      }}
                      onClick={() => setStyle(group.source, "spread")}
                    >
                      +1 / +1 / +1
                    </button>
                  </div>
                </Show>
              </div>

              <Show when={group.pool.all > 0}>
                <span class={styles.allNote}>{signed(group.pool.all)} to all abilities</span>
              </Show>

              <div class={styles.tokenRows}>
                <For each={group.pool.tokens}>
                  {(token, index) => (
                    <div class={styles.tokenRow}>
                      <span class={styles.valueChip}>{signed(token.value)}</span>
                      <Select
                        value={draft.abilityBonuses[group.source][index()] ?? ""}
                        onChange={(value: string) =>
                          actions.assignAbilityBonus(group.source, index(), value as AbilityKey | "")
                        }
                        placeholder="Choose an ability…"
                      >
                        <Option value="">—</Option>
                        <For each={optionsFor(group.source, index(), token)}>
                          {(key) => <Option value={key}>{ABILITY_FULL_NAMES[key]}</Option>}
                        </For>
                      </Select>
                    </div>
                  )}
                </For>
              </div>

              <div class={styles.groupFoot}>
                <Show when={remaining(group.source, group.pool) > 0}>
                  <span class={styles.remainingHint}>
                    {remaining(group.source, group.pool)} to assign
                  </span>
                </Show>
                <Show when={group.pool.tokens.length > 0}>
                  <Button
                    transparent
                    onClick={() =>
                      actions.resetAbilityBonusSlots(group.source, defaultSlots(group.pool))
                    }
                  >
                    {group.pool.tokens.some((token) => token.preset)
                      ? "Reset to book default"
                      : "Clear"}
                  </Button>
                </Show>
              </div>
            </div>
          )}
        </For>
      </div>
    </Show>
  );
};
