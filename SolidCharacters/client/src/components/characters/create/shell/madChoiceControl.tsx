import { Component, For, Index, Match, Show, Switch } from "solid-js";
import { Option, Select } from "coles-solid-library";
import {
  expertiseChoiceCount,
  expertiseChoiceKey,
  expertiseChoiceOptions,
  featureGroupOptions,
  groupChoiceKey,
  itemChoiceCount,
  itemChoiceKey,
  itemChoiceOptions,
  languageChoiceCount,
  languageChoiceKey,
  languageChoiceOptions,
  proficiencyChoiceCount,
  proficiencyChoiceOptions,
  resistanceChoiceCount,
  resistanceChoiceKey,
  resistanceChoiceOptions,
  setStatPickAt,
  spellChoiceCount,
  spellChoiceKey,
  spellChoiceOptions,
  statChoiceCount,
  statChoiceKey,
  statChoiceOptions,
  statChoicePicks,
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
  const { draft, actions, data, derived } = useCreate();

  /** Expertise requires existing proficiency — offer only the allowed skills the character is trained in. */
  const proficientOptions = () => {
    const skills = derived.madCharacter().proficiencies?.skills ?? {};
    const allowed = expertiseChoiceOptions(props.choice.mad).filter((skill) => skills[skill]?.proficient);
    // Keep an already-made pick visible even if its proficiency source was later removed.
    const picked = csvPicks(draft.madChoices.proficiencies[expertiseChoiceKey(props.choice.feature)]);
    return [...new Set([...allowed, ...picked])];
  };

  const spellName = (id: string) =>
    data.spells().find((s) => (s.id ?? "").toLowerCase() === id.toLowerCase())?.name ?? id;

  const itemName = (id: string) =>
    data.items().find((i) => (i.id ?? "").toLowerCase() === id.toLowerCase())?.name ?? id;

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
          {/* One dropdown per pick slot; a slot's options hide the OTHER slots' picks (distinct abilities). */}
          <Index
            each={statChoicePicks(
              draft.madChoices.stats[statChoiceKey(props.choice.feature)],
              statChoiceCount(props.choice.mad),
            )}
          >
            {(pick, i) => {
              const key = () => statChoiceKey(props.choice.feature);
              const picks = () =>
                statChoicePicks(draft.madChoices.stats[key()], statChoiceCount(props.choice.mad));
              return (
                <Select
                  value={pick()}
                  onChange={(value: string) => {
                    if (value === pick()) return;
                    actions.setMadStatChoice(
                      key(),
                      setStatPickAt(draft.madChoices.stats[key()], i, value, statChoiceCount(props.choice.mad)),
                    );
                  }}
                  placeholder="Choose an ability…"
                >
                  <For each={statChoiceOptions(props.choice.mad).filter((k) => k === pick() || !picks().includes(k))}>
                    {(k) => <Option value={k}>{abilityLabel(k)}</Option>}
                  </For>
                </Select>
              );
            }}
          </Index>
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
        <Match when={props.choice.kind === "group"}>
          {/* Branch picker ("choose your lineage"): exactly one group takes effect. */}
          <span class={styles.choiceHint}>Choose 1:</span>
          <div class={styles.choicePills}>
            <For each={featureGroupOptions(props.choice.feature)}>
              {(option) => {
                const key = groupChoiceKey(props.choice.feature);
                return (
                  <button
                    type="button"
                    class={styles.choicePill}
                    classList={{
                      [styles.choicePillActive]:
                        (draft.madChoices.proficiencies[key] ?? "").trim() === String(option.group),
                    }}
                    onClick={() => actions.setMadProficiencyChoice(key, String(option.group))}
                  >
                    {option.label}
                  </button>
                );
              }}
            </For>
          </div>
        </Match>
        <Match when={props.choice.kind === "expertise"}>
          <span class={styles.choiceHint}>
            Choose {expertiseChoiceCount(props.choice.mad)} (skills you're proficient in):
          </span>
          <div class={styles.choicePills}>
            <For each={proficientOptions()}>
              {(skill) => {
                const key = expertiseChoiceKey(props.choice.feature);
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
                        expertiseChoiceCount(props.choice.mad),
                      );
                      if (next !== null) actions.setMadProficiencyChoice(key, next);
                    }}
                  >
                    {skill}
                  </button>
                );
              }}
            </For>
            <Show when={proficientOptions().length === 0}>
              <span class={styles.choiceHint}>No eligible proficient skills yet</span>
            </Show>
          </div>
        </Match>
        <Match when={props.choice.kind === "resistance"}>
          <span class={styles.choiceHint}>Choose {resistanceChoiceCount(props.choice.mad)}:</span>
          <div class={styles.choicePills}>
            <For each={resistanceChoiceOptions(props.choice.mad)}>
              {(damageType) => {
                const key = resistanceChoiceKey(props.choice.feature);
                return (
                  <button
                    type="button"
                    class={styles.choicePill}
                    classList={{
                      [styles.choicePillActive]: csvPicks(
                        draft.madChoices.proficiencies[key],
                      ).includes(damageType),
                    }}
                    onClick={() => {
                      const next = toggleCsv(
                        draft.madChoices.proficiencies[key],
                        damageType,
                        resistanceChoiceCount(props.choice.mad),
                      );
                      if (next !== null) actions.setMadProficiencyChoice(key, next);
                    }}
                  >
                    {damageType}
                  </button>
                );
              }}
            </For>
          </div>
        </Match>
        <Match when={props.choice.kind === "language"}>
          <span class={styles.choiceHint}>Choose {languageChoiceCount(props.choice.mad)}:</span>
          <div class={styles.choicePills}>
            <For each={languageChoiceOptions(props.choice.mad)}>
              {(language) => {
                const key = languageChoiceKey(props.choice.feature);
                return (
                  <button
                    type="button"
                    class={styles.choicePill}
                    classList={{
                      [styles.choicePillActive]: csvPicks(
                        draft.madChoices.proficiencies[key],
                      ).includes(language),
                    }}
                    onClick={() => {
                      const next = toggleCsv(
                        draft.madChoices.proficiencies[key],
                        language,
                        languageChoiceCount(props.choice.mad),
                      );
                      if (next !== null) actions.setMadProficiencyChoice(key, next);
                    }}
                  >
                    {language}
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
        <Match when={props.choice.kind === "item"}>
          <span class={styles.choiceHint}>Choose {itemChoiceCount(props.choice.mad)}:</span>
          <div class={styles.choicePills}>
            <For each={itemChoiceOptions(props.choice.mad)}>
              {(id) => {
                const key = itemChoiceKey(props.choice.feature, props.choice.mad);
                return (
                  <button
                    type="button"
                    class={styles.choicePill}
                    classList={{
                      [styles.choicePillActive]: csvPicks(
                        draft.madChoices.items[key],
                      ).includes(id),
                    }}
                    onClick={() => {
                      const next = toggleCsv(
                        draft.madChoices.items[key],
                        id,
                        itemChoiceCount(props.choice.mad),
                      );
                      if (next !== null) actions.setMadItemChoice(key, next);
                    }}
                  >
                    {itemName(id)}
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
