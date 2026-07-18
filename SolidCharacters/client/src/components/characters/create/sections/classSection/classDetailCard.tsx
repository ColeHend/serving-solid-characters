import { Component, For, Show, createMemo } from "solid-js";
import { Option, Select } from "coles-solid-library";
import { Class5E, Subclass } from "../../../../../models/generated";
import { resolveSubclassSelection, subclassCandidates } from "../../../../../models/data/subclasses";
import { entitySelectorKey } from "../../../../../shared/customHooks/utility/tools/entityKey";
import { ABILITY_LABELS, MAX_TOTAL_LEVEL } from "../../rules/constants";
import {
  casterTypeLabel,
  classSkillChoiceSpec,
  normalizeAbility,
  subclassUnlockLevel,
  totalLevel,
} from "../../rules/engine";
import { InfoButton } from "../../shell/infoButton";
import { MadChoiceControl } from "../../shell/madChoiceControl";
import { Stepper } from "../../shell/stepper";
import { useCreate } from "../../state/createContext";
import { draftClassKey } from "../../state/draftStore";
import { DraftClass } from "../../state/types";
import choiceStyles from "../../shell/madChoiceControl.module.scss";
import styles from "./classSection.module.scss";

interface ClassDetailCardProps {
  entry: DraftClass;
  /** First class: saving throws come from it and it wears the INITIAL chip. */
  initial: boolean;
  onViewClass: (class5e: Class5E) => void;
  onViewSubclass: (subclass: Subclass) => void;
}

export const ClassDetailCard: Component<ClassDetailCardProps> = (props) => {
  const { draft, actions, derived, data } = useCreate();

  const cardKey = createMemo(() => draftClassKey(props.entry));
  const class5e = createMemo(() => derived.classByKey(props.entry));
  const subclasses = createMemo(() =>
    subclassCandidates(data.subclasses(), class5e(), props.entry.name));
  const chosenSubclass = createMemo(() => resolveSubclassSelection(subclasses(), props.entry));
  const unlockLevel = createMemo(() => subclassUnlockLevel(class5e(), subclasses()));
  const skillSpec = createMemo(() => classSkillChoiceSpec(class5e()));

  /** Choice-form MADS on this class's (and its chosen subclass's) features. */
  const cardChoices = createMemo(() =>
    derived.madChoices().filter((c) => c.source === "class" && c.sourceKey === cardKey()));

  const metaLine = createMemo(() => {
    const saves = (class5e()?.savingThrows ?? [])
      .map((save) => {
        const key = normalizeAbility(save);
        return key ? ABILITY_LABELS[key] : save;
      })
      .join(", ");
    return [class5e()?.hitDie, saves, casterTypeLabel(class5e())].filter(Boolean).join(" · ");
  });

  /** This class's multiclass prerequisite (13+ primary abilities) isn't met — advisory only. */
  const prereqUnmet = createMemo(() => {
    if (draft.classes.length < 2) return false;
    return (class5e()?.primaryAbility ?? "")
      .split(",")
      .map(normalizeAbility)
      .some((key) => key !== undefined && derived.effectiveScores()[key] < 13);
  });

  /** Class + chosen-subclass features gained at the levels this class actually has. */
  const featuresByLevel = createMemo(() => {
    const subclass = chosenSubclass();
    const byLevel = new Map<number, string[]>();
    const gather = (features: Record<number, { name?: string }[]> | undefined) => {
      Object.entries(features ?? {}).forEach(([levelKey, list]) => {
        const level = Number(levelKey);
        if (!Number.isFinite(level) || level < 1 || level > props.entry.level) return;
        const names = (list ?? []).map((f) => f.name ?? "").filter(Boolean);
        if (names.length > 0) byLevel.set(level, [...(byLevel.get(level) ?? []), ...names]);
      });
    };
    gather(class5e()?.features);
    gather(subclass?.features);
    return [...byLevel.entries()].sort(([a], [b]) => a - b);
  });

  const proficiencyLine = (list: string[] | undefined) =>
    list?.length ? list.join(", ") : "None";

  return (
    <div class={styles.detailCard}>
      <div class={styles.detailHeader}>
        <h4 class={styles.detailName}>{props.entry.name}</h4>
        <Show when={class5e()}>
          {(current) => (
            <InfoButton label={`View ${props.entry.name} details`} onClick={() => props.onViewClass(current())} />
          )}
        </Show>
        <Show when={props.initial}>
          <span class={styles.initialChip}>Initial</span>
        </Show>
        <Show when={prereqUnmet()}>
          <span
            class={styles.prereqWarn}
            title="Multiclassing normally needs 13+ in this class's primary abilities."
          >
            below 13
          </span>
        </Show>
        <span class={styles.detailMeta}>{metaLine()}</span>
        <span class={styles.detailControls}>
          <Stepper
            label={`Lv ${props.entry.level}`}
            onDecrement={() => actions.setClassLevel(cardKey(), props.entry.level - 1)}
            onIncrement={() => actions.setClassLevel(cardKey(), props.entry.level + 1)}
            decrementDisabled={props.entry.level <= 1}
            incrementDisabled={totalLevel(draft.classes) >= MAX_TOTAL_LEVEL}
          />
          <button
            type="button"
            class={styles.removeButton}
            onClick={() => actions.removeClass(cardKey())}
            title={`Remove ${props.entry.name}`}
          >
            ×
          </button>
        </span>
      </div>

      <div class={styles.detailBody}>
        <div class={styles.detailColumn}>
          <p class={styles.profLine}>
            <span class={styles.profLabel}>Weapons</span> — {proficiencyLine(class5e()?.proficiencies?.weapons)}
          </p>
          <p class={styles.profLine}>
            <span class={styles.profLabel}>Armor</span> — {proficiencyLine(class5e()?.proficiencies?.armor)}
          </p>
          <p class={styles.profLine}>
            <span class={styles.profLabel}>Tools</span> — {proficiencyLine(class5e()?.proficiencies?.tools)}
          </p>

          <h5 class={styles.blockLabel}>Features at your levels</h5>
          <Show
            when={featuresByLevel().length > 0}
            fallback={<p class={styles.unlockHint}>None recorded in this edition's data.</p>}
          >
            <ul class={styles.featureList}>
              <For each={featuresByLevel()}>
                {([level, names]) => (
                  <li>
                    <span class={styles.featureLevel}>Lv {level}</span> {names.join(", ")}
                  </li>
                )}
              </For>
            </ul>
            <p class={styles.unlockHint}>Open ⓘ beside the class name for full descriptions.</p>
          </Show>

          <h5 class={styles.blockLabel}>
            {props.entry.name} subclass
            <Show when={chosenSubclass()}>
              {(chosen) => (
                <InfoButton
                  label={`View ${props.entry.subclass} details`}
                  onClick={() => props.onViewSubclass(chosen())}
                />
              )}
            </Show>
          </h5>
          <Show
            when={props.entry.level >= unlockLevel()}
            fallback={<p class={styles.unlockHint}>Unlocks at level {unlockLevel()}.</p>}
          >
            <Show
              when={subclasses().length > 0}
              fallback={<p class={styles.unlockHint}>No subclasses in this edition's data.</p>}
            >
              <Select
                value={chosenSubclass() ? entitySelectorKey(chosenSubclass()!) : ""}
                onChange={(value: string) => {
                  const sub = subclasses().find((s) => entitySelectorKey(s) === value);
                  actions.setSubclass(cardKey(), sub?.name ?? "", sub ? value : undefined);
                }}
                placeholder="Choose a subclass…"
              >
                <For each={subclasses()}>
                  {(sub) => <Option value={entitySelectorKey(sub)}>{sub.name}</Option>}
                </For>
              </Select>
            </Show>
          </Show>

          <Show when={cardChoices().length > 0}>
            <h5 class={styles.blockLabel}>Feature choices</h5>
            <div class={choiceStyles.choicesList}>
              <For each={cardChoices()}>{(choice) => <MadChoiceControl choice={choice} />}</For>
            </div>
          </Show>
        </div>

        <div class={styles.detailColumn}>
          <div class={styles.skillsHeader}>
            <h5 class={styles.blockLabel}>Class skills — choose {skillSpec().amount}</h5>
            <span class={styles.skillCounter}>
              {props.entry.skillChoices.length}/{skillSpec().amount}
            </span>
          </div>
          <div class={styles.skillPills}>
            <For each={skillSpec().options}>
              {(skill) => (
                <button
                  type="button"
                  class={styles.skillPill}
                  classList={{ [styles.skillPillActive]: props.entry.skillChoices.includes(skill) }}
                  onClick={() => actions.toggleClassSkill(cardKey(), skill, skillSpec().amount)}
                >
                  {skill}
                </button>
              )}
            </For>
          </div>
        </div>
      </div>
    </div>
  );
};
