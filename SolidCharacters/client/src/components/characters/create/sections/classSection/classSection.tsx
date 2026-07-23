import { Component, For, Show, createEffect, createMemo, createSignal } from "solid-js";
import { addSnackbar } from "coles-solid-library";
import { Class5E, Subclass } from "../../../../../models/generated";
import ClassModal from "../../../../../shared/components/modals/classModal/classModal.component";
import SubclassView from "../../../../../shared/components/modals/subclassView/subclassView";
import { entitySelectorKey } from "../../../../../shared/customHooks/utility/tools/entityKey";
import { ABILITY_LABELS } from "../../rules/constants";
import { hitDieLabel, normalizeAbility } from "../../rules/engine";
import { InfoButton } from "../../shell/infoButton";
import { LegacyBadge } from "../../shell/legacyBadge";
import { useCreate } from "../../state/createContext";
import { draftClassKey } from "../../state/draftStore";
import { ClassDetailCard } from "./classDetailCard";
import styles from "./classSection.module.scss";

/** "Strength, Dexterity" → "STR & DEX" for the class cards. */
export function abilityAbbreviations(names: string | undefined): string {
  return (names ?? "")
    .split(",")
    .map((name) => {
      const key = normalizeAbility(name);
      return key ? ABILITY_LABELS[key] : name.trim();
    })
    .filter(Boolean)
    .join(" & ");
}

export const ClassSection: Component = () => {
  const { draft, actions, derived, data } = useCreate();

  const [viewedClass, setViewedClass] = createSignal<Class5E>();
  const [showClassView, setShowClassView] = createSignal(false);
  const [viewedSubclass, setViewedSubclass] = createSignal<Subclass>();
  const [showSubclassView, setShowSubclassView] = createSignal(false);
  createEffect(()=>{
    console.log(viewedSubclass());
    
  })
  const viewClass = (class5e: Class5E) => {
    setViewedClass(class5e);
    setShowClassView(true);
  };
  const viewSubclass = (subclass: Subclass) => {
    setViewedSubclass(subclass);
    setShowSubclassView(true);
  };

  const isSelected = (class5e: Class5E) =>
    draft.classes.some((c) => draftClassKey(c) === entitySelectorKey(class5e));

  /** Multiclassing needs 13+ in a class's primary abilities (5e rule, warned not enforced). */
  const meetsPrerequisite = (class5e: Class5E) =>
    (class5e.primaryAbility ?? "")
      .split(",")
      .map(normalizeAbility)
      .every((key) => !key || derived.effectiveScores()[key] >= 13);

  const toggleClass = (class5e: Class5E) => {
    if (isSelected(class5e)) {
      actions.removeClass(entitySelectorKey(class5e));
      return;
    }
    if (draft.classes.length > 0) {
      // The rule checks both directions: the class you multiclass INTO and the one you
      // multiclass OUT OF. Warn but never block — plenty of tables waive it.
      const unmet = [class5e, derived.classByKey(draft.classes[0])]
        .filter((c): c is Class5E => !!c)
        .filter((c) => !meetsPrerequisite(c));
      if (unmet.length > 0) {
        addSnackbar({
          message: `Added anyway — multiclassing normally needs 13+ ${unmet
            .map((c) => `${abilityAbbreviations(c.primaryAbility)} (${c.name})`)
            .join(" and ")}`,
          severity: "warning",
        });
      }
    }
    actions.addClass(class5e.name, entitySelectorKey(class5e));
  };

  const sortedClasses = createMemo(() => [...data.classes()].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")));

  return (
    <div>
      <div class={styles.cardGrid}>
        <For each={sortedClasses()}>
          {(class5e) => (
            <button
              type="button"
              class={styles.card}
              classList={{ [styles.cardSelected]: isSelected(class5e) }}
              onClick={() => toggleClass(class5e)}
            >
              <span class={styles.cardTitleRow}>
                <span class={styles.cardName}>{class5e.name}</span>
                <Show when={draft.edition === "both" && class5e.legacy === true}>
                  <LegacyBadge />
                </Show>
                <InfoButton label={`View ${class5e.name} details`} onClick={() => viewClass(class5e)} />
                <span class={styles.cardDie}>{hitDieLabel(class5e.hitDie)}</span>
              </span>
              <span class={styles.cardMeta}>{abilityAbbreviations(class5e.primaryAbility)}</span>
            </button>
          )}
        </For>
      </div>

      <div class={styles.detailList}>
        <For each={draft.classes}>
          {(entry, index) => (
            <ClassDetailCard
              entry={entry}
              initial={index() === 0}
              onViewClass={viewClass}
              onViewSubclass={viewSubclass}
            />
          )}
        </For>
      </div>

      <Show when={viewedClass()} keyed>
        {(class5e) => (
          <ClassModal
            currentClass={() => class5e}
            boolean={showClassView}
            booleanSetter={setShowClassView}
            subclasses={data.subclasses}
          />
        )}
      </Show>
      <Show when={viewedSubclass()} keyed>
        {(subclass) => <SubclassView subclass={() => subclass} show={[showSubclassView, setShowSubclassView]} />}
      </Show>
    </div>
  );
};
