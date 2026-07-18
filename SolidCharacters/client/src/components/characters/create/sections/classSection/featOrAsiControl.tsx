import { Component, For, Show, createMemo } from "solid-js";
import { Option, Select } from "coles-solid-library";
import { Feat, PrerequisiteType } from "../../../../../models/generated";
import { featSelectorKey } from "../../../../../shared/customHooks/utility/tools/entityKey";
import {
  statChoiceKey,
  statChoiceOptions,
} from "../../../../../shared/customHooks/mads/useMadCharacters";
import { MadChoice } from "../../rules/applyMads";
import { ABILITY_FULL_NAMES, AbilityKey } from "../../rules/constants";
import { normalizeAbility } from "../../rules/engine";
import { useCreate } from "../../state/createContext";
import styles from "../../shell/madChoiceControl.module.scss";

/**
 * A class feat-or-ASI slot: a feat picker where the plain Ability Score Improvement is just
 * the first option. Choosing ASI reveals the classic ability dropdown; choosing a feat
 * applies it like any chosen feat (featsTaken + mads) and suppresses the slot's stat mad.
 */
export const FeatOrAsiControl: Component<{ choice: MadChoice }> = (props) => {
  const { draft, actions, derived, data } = useCreate();

  const slotKey = () => statChoiceKey(props.choice.feature);
  const slotValue = () => draft.featOrAsi[slotKey()] || "asi";

  /** Feats already taken elsewhere (feats section, origin feat, other ASI slots) stay out. */
  const takenElsewhere = createMemo(() => {
    const taken = new Set(draft.feats);
    Object.entries(draft.featOrAsi).forEach(([key, value]) => {
      if (key !== slotKey() && value && value !== "asi") taken.add(value);
    });
    if (draft.originFeatId) taken.add(draft.originFeatId);
    return taken;
  });

  const eligibleFeats = createMemo(() =>
    data
      .feats()
      .filter((feat) => {
        const key = featSelectorKey(feat);
        return key === slotValue() || !takenElsewhere().has(key);
      })
      .sort((a, b) => (a.details?.name ?? "").localeCompare(b.details?.name ?? "")));

  /** Ability-score prerequisites annotate as unmet; the pick is still allowed (table's call). */
  const prereqUnmet = (feat: Feat): boolean =>
    (feat.prerequisites ?? []).some((p) => {
      if (p.type !== PrerequisiteType.Stat) return false;
      const match = (p.value ?? "").match(/([A-Za-z]+)\D*(\d+)/);
      const key = match ? normalizeAbility(match[1]) : undefined;
      return key !== undefined && derived.effectiveScores()[key] < parseInt(match![2], 10);
    });

  const featLabel = (feat: Feat): string => {
    const name = feat.details?.name ?? "";
    const legacy = draft.edition === "both" && feat.legacy === true ? " (legacy)" : "";
    return `${name}${legacy}${prereqUnmet(feat) ? " — prerequisite not met" : ""}`;
  };

  const abilityLabel = (key: string) => ABILITY_FULL_NAMES[key as AbilityKey] ?? key;
  const pending = () => slotValue() === "asi" && !draft.madChoices.stats[slotKey()];

  return (
    <div class={styles.choiceRow}>
      <span class={styles.choiceName}>
        {props.choice.feature.name}
        <Show when={pending()}>
          <span class={styles.choicePending}>choice pending</span>
        </Show>
      </span>
      <Select value={slotValue()} onChange={(value: string) => actions.setFeatOrAsi(slotKey(), value)}>
        <Option value="asi">Ability Score Improvement</Option>
        <For each={eligibleFeats()}>
          {(feat) => <Option value={featSelectorKey(feat)}>{featLabel(feat)}</Option>}
        </For>
      </Select>
      <Show when={slotValue() === "asi"}>
        <Select
          value={draft.madChoices.stats[slotKey()] ?? ""}
          onChange={(value: string) => actions.setMadStatChoice(slotKey(), value)}
          placeholder="Choose an ability…"
        >
          <For each={statChoiceOptions(props.choice.mad)}>
            {(key) => <Option value={key}>{abilityLabel(key)}</Option>}
          </For>
        </Select>
      </Show>
    </div>
  );
};
