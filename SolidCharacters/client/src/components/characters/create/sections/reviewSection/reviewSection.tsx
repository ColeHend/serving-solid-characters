import { Component, For, createMemo } from "solid-js";
import { Button } from "coles-solid-library";
import { resolveSubclassSelection, subclassCandidates } from "../../../../../models/data/subclasses";
import { ChecklistItem, buildChecklist, checklistReady } from "../../rules/checklist";
import { classSkillChoiceSpec, subclassUnlockLevel } from "../../rules/engine";
import { useCreate } from "../../state/createContext";
import styles from "./reviewSection.module.scss";

interface ReviewSectionProps {
  onSave: () => void;
  onCreateSheet: () => void;
  saveDisabled: boolean;
  /** True when editing an already-saved character (button reads Update). */
  editing: boolean;
}

const STATUS_GLYPH: Record<ChecklistItem["status"], string> = {
  done: "✓",
  warn: "!",
  todo: "○",
};

export const ReviewSection: Component<ReviewSectionProps> = (props) => {
  const { draft, derived, data } = useCreate();

  const rows = createMemo(() =>
    buildChecklist({
      name: draft.name,
      classes: draft.classes.map((entry) => {
        const class5e = derived.classByKey(entry);
        const subclasses = subclassCandidates(data.subclasses(), class5e, entry.name);
        return {
          name: entry.name,
          level: entry.level,
          subclass: entry.subclass,
          skillChoicesCount: entry.skillChoices.length,
          skillChoiceAmount: classSkillChoiceSpec(class5e).amount,
          subclassUnlockLevel: subclassUnlockLevel(class5e, subclasses),
          hasSubclasses: subclasses.length > 0,
          subclassUnresolved:
            !!(entry.subclass || entry.subclassId) &&
            !resolveSubclassSelection(subclasses, entry),
        };
      }),
      species: draft.species,
      lineageExpected:
        (draft.edition === "2014" ||
          (draft.edition === "both" && derived.selectedRace()?.legacy === true)) &&
        !!draft.species &&
        data.subraces().some((sub) =>
          (derived.selectedRace()?.id && sub.parentRace === derived.selectedRace()?.id) ||
          sub.parentRace?.toLowerCase() === draft.species.toLowerCase()),
      lineage: draft.lineage,
      background: draft.background,
      abilityMethod: draft.abilityMethod,
      baseScores: draft.baseScores,
      rolledPool: draft.rolledPool,
      boostsExpected: derived.backgroundBonusPool().tokens.length > 0,
      boostsApplied:
        derived.backgroundBonusPool().tokens.length > 0 &&
        draft.abilityBonuses.background.length === derived.backgroundBonusPool().tokens.length &&
        draft.abilityBonuses.background.every((slot) => slot !== ""),
      isCaster: derived.spellcasting().length > 0,
      spellsKnown: draft.spells.length,
      pendingFeatureChoices: derived.madChoices().filter((choice) => choice.pending).length,
      raceAbilityChoice:
        derived.speciesBonusPool().tokens.length > 0
          ? {
            picked: draft.abilityBonuses.species.filter((slot) => slot !== "").length,
            amount: derived.speciesBonusPool().tokens.length,
          }
          : undefined,
      raceLanguageChoice: derived.selectedRace()?.languageChoice
        ? {
          picked: draft.raceLanguageChoices.length,
          amount: derived.selectedRace()!.languageChoice!.amount,
        }
        : undefined,
    }));

  const jumpTo = (row: ChecklistItem) => {
    if (!row.sectionId) return;
    document.getElementById(row.sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      <ul class={styles.checklist}>
        <For each={rows()}>
          {(row) => (
            <li>
              <button type="button" class={styles.row} onClick={() => jumpTo(row)}>
                <span class={styles.glyph} classList={{ [styles[row.status]]: true }}>
                  {STATUS_GLYPH[row.status]}
                </span>
                <span class={styles.label}>{row.label}</span>
                <span class={styles.detail}>{row.detail}</span>
              </button>
            </li>
          )}
        </For>
      </ul>

      <p class={styles.readyLine}>
        {checklistReady(rows())
          ? "Every required step is complete — inscribe your hero."
          : "Rows marked ○ are required before saving; ! rows are worth a look."}
      </p>

      <div class={styles.actions}>
        <Button onClick={props.onSave} disabled={props.saveDisabled}>
          {props.editing ? "Update character" : "Save character"}
        </Button>
        <Button transparent onClick={props.onCreateSheet} title="Export a PDF sheet">
          Generate PDF
        </Button>
      </div>
    </div>
  );
};
