import { Component, For, Index, Match, Show, Switch, createSignal } from "solid-js";
import { Option, Select } from "coles-solid-library";
import { Spell } from "../../../../models/generated";
import { filterSpellsForChoice } from "../../../../shared/customHooks/mads/spellChoiceFilters";
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
import { csvPicks, toggleCsv } from "./madChoiceControl.shared";
import { OptionChoiceControl } from "./optionChoiceControl";
import styles from "./madChoiceControl.module.scss";

/** MadChoiceKind → the equipment-proficiency kind it wraps (undefined for stat/proficiency/spell). */
const EQUIP_KIND: Partial<Record<MadChoiceKind, EquipProfKind>> = {
  armorProf: "armor",
  weaponProf: "weapon",
  toolProf: "tool",
};

/** Spell pools bigger than this swap the pill grid for a searchable list. */
const SPELL_PILL_LIMIT = 15;
/** Rows shown in the searchable list before asking the player to refine the search. */
const SPELL_LIST_CAP = 150;

type SpellPoolEntry = { id: string; label: string; detail?: string };

const spellPoolDetail = (spell: Spell): string =>
  `${spell.level === "0" ? "Cantrip" : `Level ${spell.level}`} · ${spell.school}`;

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

  // ── Spell-choice pool (only evaluated by the spell branch) ──
  const [spellSearch, setSpellSearch] = createSignal("");

  const spellKey = () => spellChoiceKey(props.choice.feature, props.choice.mad);
  const spellPicks = () => csvPicks(draft.madChoices.spells[spellKey()]);
  const toggleSpellPick = (id: string) => {
    const next = toggleCsv(draft.madChoices.spells[spellKey()], id, spellChoiceCount(props.choice.mad));
    if (next !== null) actions.setMadSpellChoice(spellKey(), next);
  };

  /** Union of the command's explicit option ids and its filter matches. Explicit ids missing
   *  from the catalog still show (by raw id) so a stale options CSV can't hide the choice. */
  const spellPool = (): SpellPoolEntry[] => {
    const all = data.spells();
    const byLc = new Map(all.map((s) => [(s.id ?? "").toLowerCase(), s]));
    const pool = new Map<string, SpellPoolEntry>();
    for (const id of spellChoiceOptions(props.choice.mad)) {
      const spell = byLc.get(id.toLowerCase());
      pool.set(id.toLowerCase(), { id, label: spell?.name ?? id, detail: spell && spellPoolDetail(spell) });
    }
    for (const spell of filterSpellsForChoice(all, props.choice.mad.value)) {
      const lc = (spell.id ?? "").toLowerCase();
      if (!pool.has(lc)) pool.set(lc, { id: spell.id, label: spell.name, detail: spellPoolDetail(spell) });
    }
    return [...pool.values()];
  };

  const searchedSpellPool = () => {
    const term = spellSearch().trim().toLowerCase();
    const pool = spellPool();
    return term ? pool.filter((e) => e.label.toLowerCase().includes(term)) : pool;
  };

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
          {/* One dropdown per pick slot; the same ability may be picked in more than one slot (+1 twice = +2). */}
          <Index
            each={statChoicePicks(
              draft.madChoices.stats[statChoiceKey(props.choice.feature)],
              statChoiceCount(props.choice.mad),
            )}
          >
            {(pick, i) => {
              const key = () => statChoiceKey(props.choice.feature);
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
                  <For each={statChoiceOptions(props.choice.mad)}>
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
        <Match when={props.choice.kind === "options"}>
          {/* Named sub-option picker (Invocations, Maneuvers…): cards with descriptions + prereqs. */}
          <OptionChoiceControl choice={props.choice} />
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
          <Show
            when={spellPool().length > SPELL_PILL_LIMIT}
            fallback={
              <div class={styles.choicePills}>
                <For each={spellPool()}>
                  {(entry) => (
                    <button
                      type="button"
                      class={styles.choicePill}
                      classList={{ [styles.choicePillActive]: spellPicks().includes(entry.id) }}
                      onClick={() => toggleSpellPick(entry.id)}
                    >
                      {entry.label}
                    </button>
                  )}
                </For>
              </div>
            }
          >
            <div class={styles.spellPicker}>
              <Show when={spellPicks().length}>
                <div class={styles.choicePills}>
                  <For each={spellPicks()}>
                    {(id) => (
                      <button
                        type="button"
                        class={`${styles.choicePill} ${styles.choicePillActive}`}
                        onClick={() => toggleSpellPick(id)}
                      >
                        {spellName(id)}
                      </button>
                    )}
                  </For>
                </div>
              </Show>
              <div class={styles.spellSearchRow}>
                <input
                  class={styles.spellSearch}
                  placeholder="Search the allowed spells..."
                  value={spellSearch()}
                  onInput={(e) => setSpellSearch(e.currentTarget.value)}
                />
                <span class={styles.choiceHint}>
                  {spellPicks().length}/{spellChoiceCount(props.choice.mad)} chosen
                </span>
              </div>
              <div class={styles.spellPickerList}>
                <For each={searchedSpellPool().slice(0, SPELL_LIST_CAP)}>
                  {(entry) => (
                    <button
                      type="button"
                      class={styles.spellPickerRow}
                      classList={{ [styles.spellPickerRowActive]: spellPicks().includes(entry.id) }}
                      onClick={() => toggleSpellPick(entry.id)}
                    >
                      <span>{entry.label}</span>
                      <Show when={entry.detail}>
                        <span class={styles.spellPickerDetail}>{entry.detail}</span>
                      </Show>
                    </button>
                  )}
                </For>
                <Show when={searchedSpellPool().length > SPELL_LIST_CAP}>
                  <span class={styles.spellPickerMore}>
                    {searchedSpellPool().length - SPELL_LIST_CAP} more — refine the search
                  </span>
                </Show>
              </div>
            </div>
          </Show>
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
