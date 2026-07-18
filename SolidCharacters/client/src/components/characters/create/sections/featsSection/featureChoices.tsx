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
} from "../../../../../shared/customHooks/mads/useMadCharacters";
import { MadChoice } from "../../rules/applyMads";
import { ABILITY_FULL_NAMES, AbilityKey } from "../../rules/constants";
import { useCreate } from "../../state/createContext";
import styles from "./featsSection.module.scss";

const csvPicks = (raw: string | undefined): string[] =>
  (raw ?? "").split(",").map((s) => s.trim()).filter(Boolean);

/** Toggle `value` in a CSV pick list capped at `max`; null = at the cap, ignore. */
const toggleCsv = (raw: string | undefined, value: string, max: number): string | null => {
  const picks = csvPicks(raw);
  if (picks.includes(value)) return picks.filter((p) => p !== value).join(",");
  if (picks.length >= max) return null;
  return [...picks, value].join(",");
};

/**
 * Pickers for choice-form MADS commands carried by picked feats, species traits, and
 * class features — ability increases, skill proficiencies, and granted-spell choices.
 * Picks land in draft.madChoices and resolve live through applyCreatorMads.
 */
export const FeatureChoices: Component = () => {
  const { draft, actions, derived, data } = useCreate();

  const spellName = (id: string) =>
    data.spells().find((s) => (s.id ?? "").toLowerCase() === id.toLowerCase())?.name ?? id;

  const abilityLabel = (key: string) => ABILITY_FULL_NAMES[key as AbilityKey] ?? key;

  return (
    <Show when={derived.madChoices().length > 0}>
      <h5 class={styles.choicesLabel}>Feature choices</h5>
      <div class={styles.choicesList}>
        <For each={derived.madChoices()}>
          {(choice: MadChoice) => (
            <div class={styles.choiceRow}>
              <span class={styles.choiceName}>
                {choice.feature.name}
                <Show when={choice.pending}>
                  <span class={styles.choicePending}>choice pending</span>
                </Show>
              </span>
              <Switch>
                <Match when={choice.kind === "stat"}>
                  <Select
                    value={draft.madChoices.stats[statChoiceKey(choice.feature)] ?? ""}
                    onChange={(value: string) =>
                      actions.setMadStatChoice(statChoiceKey(choice.feature), value)
                    }
                    placeholder="Choose an ability…"
                  >
                    <For each={statChoiceOptions(choice.mad)}>
                      {(key) => <Option value={key}>{abilityLabel(key)}</Option>}
                    </For>
                  </Select>
                </Match>
                <Match when={choice.kind === "proficiency"}>
                  <span class={styles.choiceHint}>
                    Choose {proficiencyChoiceCount(choice.mad)}:
                  </span>
                  <div class={styles.choicePills}>
                    <For each={proficiencyChoiceOptions(choice.mad)}>
                      {(skill) => {
                        const key = statChoiceKey(choice.feature);
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
                                proficiencyChoiceCount(choice.mad),
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
                <Match when={choice.kind === "spell"}>
                  <span class={styles.choiceHint}>Choose {spellChoiceCount(choice.mad)}:</span>
                  <div class={styles.choicePills}>
                    <For each={spellChoiceOptions(choice.mad)}>
                      {(id) => {
                        const key = spellChoiceKey(choice.feature, choice.mad);
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
                                spellChoiceCount(choice.mad),
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
          )}
        </For>
      </div>
    </Show>
  );
};
