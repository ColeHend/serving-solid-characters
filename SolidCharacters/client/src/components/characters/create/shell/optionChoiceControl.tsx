import { Component, For, Show, createSignal } from "solid-js";
import { FeatureOption } from "../../../../shared/customHooks/mads/madModels";
import {
  featureOptions,
  featureOptionsConfig,
  optionChoiceKey,
  optionCount,
  optionPrereqMet,
} from "../../../../shared/customHooks/mads/useMadCharacters";
import { MadChoice } from "../rules/applyMads";
import { useCreate } from "../state/createContext";
import { csvPicks, toggleCsv } from "./madChoiceControl.shared";
import styles from "./optionChoiceControl.module.scss";

/** Option lists longer than this get a search box above the cards. */
const OPTION_SEARCH_THRESHOLD = 8;

/**
 * The picker body for the "options" MadChoice kind — features that carry named sub-options
 * (Eldritch Invocations, Battle Master Maneuvers, Metamagic…). Each option renders as a card
 * with its description; unmet prerequisites disable the card with the reason shown. Picks are
 * a CSV of option names under proficiencyChoices' `::options` key, capped at the level-scaled
 * optionCount. A stored pick whose prerequisite lapsed stays visible (marked invalid) so the
 * player can swap it out.
 */
export const OptionChoiceControl: Component<{ choice: MadChoice }> = (props) => {
  const { draft, actions, derived } = useCreate();
  const [search, setSearch] = createSignal("");

  const character = () => derived.draftCharacter();
  const options = () => featureOptions(props.choice.feature);
  const count = () => optionCount(character(), props.choice.feature);
  const label = () => (featureOptionsConfig(props.choice.feature).label ?? "").trim() || "option";
  const key = () => optionChoiceKey(props.choice.feature);
  const picks = () => csvPicks(draft.madChoices.proficiencies[key()]);
  const isPicked = (option: FeatureOption) =>
    picks().some((p) => p.toLowerCase() === option.name.trim().toLowerCase());

  const prereqMet = (option: FeatureOption) => optionPrereqMet(character(), props.choice.feature, option);

  /** Human-readable prerequisite line: authored text first, else composed from the fields. */
  const prereqLabel = (option: FeatureOption): string => {
    const prereq = option.prerequisites;
    if (!prereq) return "";
    if ((prereq.text ?? "").trim()) return prereq.text!.trim();
    const parts: string[] = [];
    if (prereq.minLevel) parts.push(`Level ${prereq.minLevel}+`);
    if ((prereq.requiredFeature ?? "").trim()) parts.push(`Requires ${prereq.requiredFeature!.trim()}`);
    return parts.join(" · ");
  };

  const toggle = (option: FeatureOption) => {
    const next = toggleCsv(draft.madChoices.proficiencies[key()], option.name.trim(), count());
    if (next !== null) actions.setMadProficiencyChoice(key(), next);
  };

  const searched = () => {
    const term = search().trim().toLowerCase();
    if (!term) return options();
    return options().filter(
      (o) => o.name.toLowerCase().includes(term) || (o.description ?? "").toLowerCase().includes(term),
    );
  };

  return (
    <div class={styles.optionPicker}>
      <div class={styles.optionHeader}>
        <span class={styles.optionHint}>
          {picks().length}/{count()} {label()}{count() === 1 ? "" : "s"} chosen
        </span>
        <Show when={options().length > OPTION_SEARCH_THRESHOLD}>
          <input
            class={styles.optionSearch}
            placeholder={`Search ${label()}s...`}
            value={search()}
            onInput={(e) => setSearch(e.currentTarget.value)}
          />
        </Show>
      </div>
      <Show when={count() > 0} fallback={<span class={styles.optionHint}>No picks available at this level yet</span>}>
        <div class={styles.optionList}>
          <For each={searched()}>
            {(option) => {
              const met = () => prereqMet(option);
              const picked = () => isPicked(option);
              // A pick with a lapsed prerequisite stays clickable so it can be removed.
              const disabled = () => !met() && !picked();
              return (
                <button
                  type="button"
                  class={styles.optionCard}
                  classList={{
                    [styles.optionCardActive]: picked(),
                    [styles.optionCardDisabled]: disabled(),
                    [styles.optionCardInvalid]: picked() && !met(),
                  }}
                  disabled={disabled()}
                  onClick={() => toggle(option)}
                >
                  <span class={styles.optionCardTitle}>
                    {option.name}
                    <Show when={prereqLabel(option)}>
                      <span
                        class={styles.optionPrereq}
                        classList={{ [styles.optionPrereqUnmet]: !met() }}
                      >
                        {prereqLabel(option)}
                      </span>
                    </Show>
                    <Show when={picked() && !met()}>
                      <span class={styles.optionPrereqUnmet}>prerequisite not met</span>
                    </Show>
                  </span>
                  <Show when={(option.description ?? "").trim()}>
                    <span class={styles.optionCardDescription}>{option.description}</span>
                  </Show>
                </button>
              );
            }}
          </For>
          <Show when={searched().length === 0}>
            <span class={styles.optionHint}>No {label()}s match the search</span>
          </Show>
        </div>
      </Show>
    </div>
  );
};
