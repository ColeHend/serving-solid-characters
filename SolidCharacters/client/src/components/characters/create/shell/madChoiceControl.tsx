import { Component, For, Match, Show, Switch } from "solid-js";
import { Option, Select } from "coles-solid-library";
import {
  proficiencyChoiceCount,
  proficiencyChoiceOptions,
  spellChoiceCount,
  spellChoiceKey,
  spellChoiceOptions,
  statChoiceKey,
  statChoiceOptions,
} from "../../../../shared/customHooks/mads/useMadCharacters";
import {
  EquipProfKind,
  equipProfChoiceCount,
  equipProfChoiceKey,
  equipProfChoiceOptions,
} from "../../../../shared/customHooks/mads/equipmentProficiencies";
import { MadChoice, MadChoiceKind } from "../rules/applyMads";
import { ABILITY_FULL_NAMES, AbilityKey } from "../rules/constants";
import { useCreate } from "../state/createContext";
import styles from "./madChoiceControl.module.scss";

const csvPicks = (raw: string | undefined): string[] =>
  (raw ?? "").split(",").map((s) => s.trim()).filter(Boolean);

/** Toggle `value` in a CSV pick list capped at `max`; null = at the cap, ignore. */
const toggleCsv = (raw: string | undefined, value: string, max: number): string | null => {
  const picks = csvPicks(raw);
  if (picks.includes(value)) return picks.filter((p) => p !== value).join(",");
  if (picks.length >= max) return null;
  return [...picks, value].join(",");
};

/** MadChoiceKind → the equipment-proficiency kind it wraps (undefined for stat/proficiency/spell). */
const EQUIP_KIND: Partial<Record<MadChoiceKind, EquipProfKind>> = {
  armorProf: "armor",
  weaponProf: "weapon",
  toolProf: "tool",
};

/**
 * One choice-form MADS picker row — ability increases, skill/armor/weapon/tool proficiencies,
 * and granted-spell choices. Picks land in draft.madChoices and resolve live through
 * applyCreatorMads (equipment-proficiency picks resolve at PDF export instead). Rendered by
 * the class detail cards, the species section, and the feats section, each filtered to the
 * choices its own source granted.
 */
export const MadChoiceControl: Component<{ choice: MadChoice }> = (props) => {
  const { draft, actions, data } = useCreate();

  const spellName = (id: string) =>
    data.spells().find((s) => (s.id ?? "").toLowerCase() === id.toLowerCase())?.name ?? id;

  const abilityLabel = (key: string) => ABILITY_FULL_NAMES[key as AbilityKey] ?? key;

  return (
    <div class={styles.choiceRow}>
      <span class={styles.choiceName}>
        {props.choice.feature.name}
        <Show when={props.choice.pending}>
          <span class={styles.choicePending}>choice pending</span>
        </Show>
      </span>
      <Switch>
        <Match when={props.choice.kind === "stat"}>
          <Select
            value={draft.madChoices.stats[statChoiceKey(props.choice.feature)] ?? ""}
            onChange={(value: string) =>
              actions.setMadStatChoice(statChoiceKey(props.choice.feature), value)
            }
            placeholder="Choose an ability…"
          >
            <For each={statChoiceOptions(props.choice.mad)}>
              {(key) => <Option value={key}>{abilityLabel(key)}</Option>}
            </For>
          </Select>
        </Match>
        <Match when={props.choice.kind === "proficiency"}>
          <span class={styles.choiceHint}>
            Choose {proficiencyChoiceCount(props.choice.mad)}:
          </span>
          <div class={styles.choicePills}>
            <For each={proficiencyChoiceOptions(props.choice.mad)}>
              {(skill) => {
                const key = statChoiceKey(props.choice.feature);
                return (
                  <button
                    type="button"
                    class={styles.choicePill}
                    classList={{
                      [styles.choicePillActive]: csvPicks(
                        draft.madChoices.proficiencies[key],
                      ).includes(skill),
                    }}
                    onClick={() => {
                      const next = toggleCsv(
                        draft.madChoices.proficiencies[key],
                        skill,
                        proficiencyChoiceCount(props.choice.mad),
                      );
                      if (next !== null) actions.setMadProficiencyChoice(key, next);
                    }}
                  >
                    {skill}
                  </button>
                );
              }}
            </For>
          </div>
        </Match>
        <Match when={EQUIP_KIND[props.choice.kind]}>
          {(equipKind) => {
            const key = () => equipProfChoiceKey(equipKind(), props.choice.feature);
            return (
              <>
                <span class={styles.choiceHint}>
                  Choose {equipProfChoiceCount(props.choice.mad)}:
                </span>
                <div class={styles.choicePills}>
                  <For each={equipProfChoiceOptions(props.choice.mad)}>
                    {(option) => (
                      <button
                        type="button"
                        class={styles.choicePill}
                        classList={{
                          [styles.choicePillActive]: csvPicks(
                            draft.madChoices.proficiencies[key()],
                          ).includes(option),
                        }}
                        onClick={() => {
                          const next = toggleCsv(
                            draft.madChoices.proficiencies[key()],
                            option,
                            equipProfChoiceCount(props.choice.mad),
                          );
                          if (next !== null) actions.setMadProficiencyChoice(key(), next);
                        }}
                      >
                        {option}
                      </button>
                    )}
                  </For>
                </div>
              </>
            );
          }}
        </Match>
        <Match when={props.choice.kind === "spell"}>
          <span class={styles.choiceHint}>Choose {spellChoiceCount(props.choice.mad)}:</span>
          <div class={styles.choicePills}>
            <For each={spellChoiceOptions(props.choice.mad)}>
              {(id) => {
                const key = spellChoiceKey(props.choice.feature, props.choice.mad);
                return (
                  <button
                    type="button"
                    class={styles.choicePill}
                    classList={{
                      [styles.choicePillActive]: csvPicks(
                        draft.madChoices.spells[key],
                      ).includes(id),
                    }}
                    onClick={() => {
                      const next = toggleCsv(
                        draft.madChoices.spells[key],
                        id,
                        spellChoiceCount(props.choice.mad),
                      );
                      if (next !== null) actions.setMadSpellChoice(key, next);
                    }}
                  >
                    {spellName(id)}
                  </button>
                );
              }}
            </For>
          </div>
        </Match>
      </Switch>
    </div>
  );
};
