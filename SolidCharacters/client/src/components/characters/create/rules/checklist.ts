import { AbilityGenMethod } from "../../../../models/character.model";
import { Stats } from "../../../../shared/customHooks/dndInfo/useCharacters";
import { ABILITY_KEYS, POINT_BUY_BUDGET, POINT_BUY_COSTS } from "./constants";

export type ChecklistStatus = "done" | "todo" | "warn";

export interface ChecklistItem {
  id: string;
  label: string;
  /** "todo" rows block saving; "warn" rows are advisory. */
  status: ChecklistStatus;
  detail?: string;
  /** DOM id of the codex section this row jumps to. */
  sectionId?: string;
}

export interface ChecklistClassInput {
  name: string;
  level: number;
  subclass: string;
  skillChoicesCount: number;
  skillChoiceAmount: number;
  subclassUnlockLevel: number;
  hasSubclasses: boolean;
}

export interface ChecklistInputs {
  name: string;
  classes: ChecklistClassInput[];
  species: string;
  /** 2014-style species selected and it has lineages to pick from. */
  lineageExpected: boolean;
  lineage: string;
  background: string;
  abilityMethod: AbilityGenMethod;
  baseScores: Stats;
  rolledPool: number[];
  /** Background grants ability boosts (2024) that haven't been assigned yet. */
  boostsExpected: boolean;
  boostsApplied: boolean;
  /** At least one class has spellcasting. */
  isCaster: boolean;
  spellsKnown: number;
  /** Choice-form MADS commands (ASI picks, skill/spell choices) still waiting on the player. */
  pendingFeatureChoices: number;
  /** Species abilityBonusChoice progress; omit when the species has none (or it doesn't apply). */
  raceAbilityChoice?: { picked: number; amount: number };
  /** Species languageChoice progress; omit when the species has none. */
  raceLanguageChoice?: { picked: number; amount: number };
}

/** Pure completeness report for the Review section (plain values in, rows out). */
export function buildChecklist(inputs: ChecklistInputs): ChecklistItem[] {
  const rows: ChecklistItem[] = [];

  rows.push({
    id: "name",
    label: "Character name",
    status: inputs.name.trim().length >= 3 ? "done" : "todo",
    detail: inputs.name.trim().length >= 3 ? inputs.name : "At least 3 characters — required to save.",
    sectionId: "codex-review",
  });

  rows.push({
    id: "class",
    label: "Class",
    status: inputs.classes.length > 0 ? "done" : "todo",
    detail:
      inputs.classes.length > 0
        ? inputs.classes.map((c) => `${c.name} ${c.level}`).join(" / ")
        : "Pick at least one class — required to save.",
    sectionId: "codex-class",
  });

  rows.push({
    id: "species",
    label: "Species",
    status: inputs.species ? "done" : "todo",
    detail: inputs.species || "Choose a species.",
    sectionId: "codex-species",
  });

  if (inputs.lineageExpected) {
    rows.push({
      id: "lineage",
      label: "Lineage",
      status: inputs.lineage ? "done" : "warn",
      detail: inputs.lineage || `${inputs.species} has lineages to choose from.`,
      sectionId: "codex-species",
    });
  }

  rows.push({
    id: "background",
    label: "Background",
    status: inputs.background ? "done" : "todo",
    detail: inputs.background || "Choose a background.",
    sectionId: "codex-background",
  });

  rows.push(abilitiesRow(inputs));

  if (inputs.boostsExpected) {
    rows.push({
      id: "boosts",
      label: "Background ability boosts",
      status: inputs.boostsApplied ? "done" : "warn",
      detail: inputs.boostsApplied ? "Applied" : "Assign +2/+1 or three +1s in Abilities.",
      sectionId: "codex-abilities",
    });
  }

  const incompleteSkills = inputs.classes.filter((c) => c.skillChoicesCount < c.skillChoiceAmount);
  if (inputs.classes.length > 0) {
    rows.push({
      id: "classSkills",
      label: "Class skill picks",
      status: incompleteSkills.length === 0 ? "done" : "warn",
      detail:
        incompleteSkills.length === 0
          ? "All chosen"
          : incompleteSkills
            .map((c) => `${c.name} ${c.skillChoicesCount}/${c.skillChoiceAmount}`)
            .join(", "),
      sectionId: "codex-class",
    });
  }

  const missingSubclass = inputs.classes.filter(
    (c) => c.hasSubclasses && c.level >= c.subclassUnlockLevel && !c.subclass,
  );
  if (missingSubclass.length > 0) {
    rows.push({
      id: "subclass",
      label: "Subclass",
      status: "warn",
      detail: `${missingSubclass.map((c) => c.name).join(", ")} unlocked a subclass choice.`,
      sectionId: "codex-class",
    });
  }

  if (inputs.isCaster) {
    rows.push({
      id: "spells",
      label: "Spells",
      status: inputs.spellsKnown > 0 ? "done" : "warn",
      detail: inputs.spellsKnown > 0 ? `${inputs.spellsKnown} inscribed` : "A caster with an empty grimoire.",
      sectionId: "codex-spells",
    });
  }

  if (inputs.raceAbilityChoice) {
    const { picked, amount } = inputs.raceAbilityChoice;
    rows.push({
      id: "raceAbilityChoice",
      label: "Species ability choice",
      status: picked >= amount ? "done" : "warn",
      detail: `${picked} of ${amount} picked`,
      sectionId: "codex-species",
    });
  }

  if (inputs.raceLanguageChoice) {
    const { picked, amount } = inputs.raceLanguageChoice;
    rows.push({
      id: "raceLanguageChoice",
      label: "Species language choice",
      status: picked >= amount ? "done" : "warn",
      detail: `${picked} of ${amount} picked`,
      sectionId: "codex-species",
    });
  }

  if (inputs.pendingFeatureChoices > 0) {
    rows.push({
      id: "featureChoices",
      label: "Feature choices",
      status: "warn",
      detail: `${inputs.pendingFeatureChoices} pending — pick them in their Class, Species, or Feats section.`,
      sectionId: "codex-feats",
    });
  }

  return rows;
}

function abilitiesRow(inputs: ChecklistInputs): ChecklistItem {
  const base = { id: "abilities", label: "Ability scores", sectionId: "codex-abilities" };
  const unassigned = ABILITY_KEYS.filter((key) => inputs.baseScores[key] === 0).length;

  if (inputs.abilityMethod === "roll" && inputs.rolledPool.length === 0) {
    return { ...base, status: "todo", detail: "Roll your 4d6 pool." };
  }
  if (inputs.abilityMethod === "pointbuy") {
    const spent = ABILITY_KEYS.reduce(
      (sum, key) => sum + (POINT_BUY_COSTS[inputs.baseScores[key]] ?? 0),
      0,
    );
    return spent >= POINT_BUY_BUDGET
      ? { ...base, status: "done", detail: `${POINT_BUY_BUDGET} points spent` }
      : { ...base, status: "warn", detail: `${POINT_BUY_BUDGET - spent} points unspent.` };
  }
  if (unassigned > 0) {
    return { ...base, status: "todo", detail: `${unassigned} score${unassigned > 1 ? "s" : ""} unassigned.` };
  }
  return { ...base, status: "done", detail: "All assigned" };
}

/** True when every blocking row is complete (mirrors the Save button's own gate). */
export function checklistReady(rows: ChecklistItem[]): boolean {
  return rows.every((row) => row.status !== "todo");
}
