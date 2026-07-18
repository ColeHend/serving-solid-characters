import {
  AbilityScores,
  CasterType,
  Class5E,
  Feat,
  Race,
  Spell,
  Subclass,
  Subrace,
} from "../../../../models/generated";
import { Stats } from "../../../../shared/customHooks/dndInfo/useCharacters";
import {
  CharacterSkillProficiency,
  RollBonus,
  SkillOverrideState,
} from "../../../../models/character.model";
import { rollBonusAmount } from "../../../../shared/customHooks/mads/commands/useRollBonusFeature";
import {
  getAbilityModifier,
  getProficiencyBonus,
} from "../../../../shared/customHooks/utility/tools/dndMath";
import { detectSubclassFeatureLevels } from "../../../../shared/ai/refs/classProgression";
import { ABILITY_KEYS, AbilityKey, SKILLS, SPELL_ABILITY } from "./constants";

export { getAbilityModifier, getProficiencyBonus };

export interface LeveledClass {
  name: string;
  /** Selector key of the class when known — resolvers should prefer it over the name. */
  classId?: string;
  level: number;
}

export function totalLevel(classes: LeveledClass[]): number {
  return classes.reduce((sum, c) => sum + (c.level || 0), 0);
}

/** "d12" (2024) | "12" (2014, numeric in the file) | 12 → 12; unparseable → 0. */
export function hitDieSides(hitDie: string | number | undefined | null): number {
  if (typeof hitDie === "number") return Number.isFinite(hitDie) ? hitDie : 0;
  if (!hitDie) return 0;
  const parsed = parseInt(hitDie.replace(/^d/i, ""), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** "Strength" | "STR" | "str." → 'str'; unknown → undefined. */
export function normalizeAbility(name: string | undefined | null): AbilityKey | undefined {
  const key = (name ?? "").trim().slice(0, 3).toLowerCase();
  return (ABILITY_KEYS as string[]).includes(key) ? (key as AbilityKey) : undefined;
}

function raceBonuses(race: Race | Subrace | undefined): Partial<Record<AbilityKey, number>> {
  const out: Partial<Record<AbilityKey, number>> = {};
  race?.abilityBonuses?.forEach((bonus) => {
    if (bonus.stat === AbilityScores.ALL) {
      ABILITY_KEYS.forEach((k) => (out[k] = (out[k] ?? 0) + bonus.value));
      return;
    }
    // CHOICE-stat entries resolve through abilityBonusChoice + the player's picks instead.
    const key = normalizeAbility(AbilityScores[bonus.stat]);
    if (key) out[key] = (out[key] ?? 0) + bonus.value;
  });
  return out;
}

/** The race's abilityBonusChoice applied to the player's picked abilities. */
function raceChoiceBonuses(
  race: Race | undefined,
  picks: AbilityKey[],
): Partial<Record<AbilityKey, number>> {
  const out: Partial<Record<AbilityKey, number>> = {};
  if (!race?.abilityBonusChoice || picks.length === 0) return out;
  const capped = picks.slice(0, race.abilityBonusChoice.amount);
  race.abilityBonusChoice.choices?.forEach((bonus) => {
    const key = normalizeAbility(AbilityScores[bonus.stat]);
    if (key && capped.includes(key)) out[key] = (out[key] ?? 0) + bonus.value;
  });
  return out;
}

/**
 * Final ability scores. 2024: species grant nothing — base + manual bonus + background boosts.
 * 2014: ability increases come from race/subrace instead and apply automatically.
 * Both: the species' edition decides — a legacy species grants its own bonuses, a current
 * one leaves the increases to the (edition-paired) background's boosts.
 */
export function computeFinalScores(
  edition: "2014" | "2024" | "both",
  base: Stats,
  bonus: Stats,
  backgroundBoosts: Partial<Record<AbilityKey, number>>,
  race?: Race,
  subrace?: Subrace,
  raceAbilityChoices: AbilityKey[] = [],
): Stats {
  const out = {} as Stats;
  const raceGrantsBonuses = edition === "2014" || (edition === "both" && race?.legacy === true);
  const fromRace = raceGrantsBonuses ? raceBonuses(race) : {};
  const fromSubrace = raceGrantsBonuses ? raceBonuses(subrace) : {};
  const fromChoice = raceGrantsBonuses ? raceChoiceBonuses(race, raceAbilityChoices) : {};
  const boosts = edition !== "2014" ? backgroundBoosts : {};
  ABILITY_KEYS.forEach((k) => {
    out[k] =
      (base[k] ?? 0) +
      (bonus[k] ?? 0) +
      (boosts[k] ?? 0) +
      (fromRace[k] ?? 0) +
      (fromSubrace[k] ?? 0) +
      (fromChoice[k] ?? 0);
  });
  return out;
}

/** Union of Common, species/lineage languages, species language picks, and manual picks. */
export function collectLanguages(
  manualLanguages: string[],
  raceLanguageChoices: string[],
  race?: Race,
  subrace?: Subrace,
): string[] {
  const out: string[] = [];
  const push = (language: string | undefined) => {
    const name = (language ?? "").trim();
    if (name && !out.some((l) => l.toLowerCase() === name.toLowerCase())) out.push(name);
  };
  push("Common");
  race?.languages?.forEach(push);
  subrace?.languages?.forEach(push);
  raceLanguageChoices.forEach(push);
  manualLanguages.forEach(push);
  return out;
}

/**
 * Max HP: the initial class's first level gives the die maximum; every other level (including the
 * rest of the initial class) gives the die average (sides/2 + 1). CON mod applies per level, with
 * each level contributing at least 1 HP. Classes missing a hit die (bad homebrew) count as d0.
 */
export function computeMaxHp(
  classes: LeveledClass[],
  resolveClass: (entry: LeveledClass) => Class5E | undefined,
  conMod: number,
): number {
  let hp = 0;
  classes.forEach((entry, classIndex) => {
    const sides = hitDieSides(resolveClass(entry)?.hitDie);
    for (let lvl = 1; lvl <= (entry.level || 0); lvl++) {
      const die = classIndex === 0 && lvl === 1 ? sides : Math.floor(sides / 2) + 1;
      hp += Math.max(1, die + conMod);
    }
  });
  return hp;
}

/** Unarmored baseline; armor/shield handling stays on the sheet side. */
export function computeAc(dexMod: number): number {
  return 10 + dexMod;
}

/**
 * DEX mod plus every Initiative RollBonus the character's mads granted — 2024 Alert (Full PB)
 * and 2014 Alert (flat +5) both flow through generically.
 */
export function computeInitiative(
  dexMod: number,
  rollBonuses: RollBonus[],
  profBonus: number,
  stats: Stats,
): number {
  return (
    dexMod +
    rollBonuses
      .filter((b) => b.rollType === "Initiative")
      .reduce((sum, b) => sum + rollBonusAmount(b, profBonus, stats), 0)
  );
}

export interface SkillRow {
  name: string;
  ability: AbilityKey;
  state: SkillOverrideState;
  /** Where the current state came from; null when the skill is untrained. */
  source: "class" | "background" | "manual" | "feature" | null;
  /** True when a feature mad grants the state — the pill isn't player-toggleable. */
  locked: boolean;
  mod: number;
}

export interface SkillInputs {
  /** Union of every selected class's picked skills. */
  classSkills: string[];
  backgroundSkills: string[];
  /** Explicit pill overrides; these win over derived class/background states. */
  overrides: Record<string, SkillOverrideState>;
  finalScores: Stats;
  profBonus: number;
}

/** Skill-state → proficiency-bonus multiplier (the one place the ranking lives). */
const stateRank = (state: SkillOverrideState) =>
  state === "expertise" ? 2 : state === "proficient" ? 1 : 0;

export function computeSkillRows(inputs: SkillInputs): SkillRow[] {
  const classSet = new Set(inputs.classSkills.map((s) => s.toLowerCase()));
  const backgroundSet = new Set(inputs.backgroundSkills.map((s) => s.toLowerCase()));
  return SKILLS.map((skill) => {
    const lower = skill.name.toLowerCase();
    const override = inputs.overrides[skill.name];
    let state: SkillOverrideState = "none";
    let source: SkillRow["source"] = null;
    if (override !== undefined) {
      state = override;
      source = "manual";
    } else if (classSet.has(lower)) {
      state = "proficient";
      source = "class";
    } else if (backgroundSet.has(lower)) {
      state = "proficient";
      source = "background";
    }
    const mod =
      getAbilityModifier(inputs.finalScores[skill.ability] ?? 10) +
      inputs.profBonus * stateRank(state);
    return { name: skill.name, ability: skill.ability, state, source, locked: false, mod };
  });
}

/** Character.proficiencies.skills storage key — one legacy-cased entry differs from the display name. */
export const skillStorageKey = (name: string) =>
  name === "Sleight of Hand" ? "Sleight Of Hand" : name;
export const skillDisplayName = (key: string) =>
  key === "Sleight Of Hand" ? "Sleight of Hand" : key;

/**
 * Overlay mads-driven skill changes onto the base rows (display only — the save path keeps
 * the raw rows). A feature GRANT beats a lower base state, including a manual "none"
 * (features are hard grants); a feature REMOVE — detected as the applied state dropping
 * below the pre-mads base state — downgrades the row the same way. Touched rows come back
 * `locked` with source "feature". Mods are always recomputed from `scores` — the mad
 * handlers leave `.value` stale — plus the applied-vs-base `.value` delta, which carries
 * AllProficiencies-style PB-fraction bumps (Jack of All Trades) that state alone can't express.
 */
export function mergeMadSkillRows(
  rows: SkillRow[],
  baseSkills: Record<string, CharacterSkillProficiency>,
  madSkills: Record<string, CharacterSkillProficiency>,
  scores: Stats,
  profBonus: number,
): SkillRow[] {
  const lookup = (skills: Record<string, CharacterSkillProficiency>, name: string) =>
    skills[name] ?? skills[skillStorageKey(name)];
  const entryState = (entry: CharacterSkillProficiency | undefined): SkillOverrideState =>
    entry?.expertise ? "expertise" : entry?.proficient ? "proficient" : "none";
  return rows.map((row) => {
    const mad = lookup(madSkills, row.name);
    const madState = entryState(mad);
    const baseState = entryState(lookup(baseSkills, row.name));
    const granted = stateRank(madState) > stateRank(row.state);
    const removed = stateRank(madState) < stateRank(baseState);
    const touched = granted || removed;
    const state = touched ? madState : row.state;
    const allProfBump = (mad?.value ?? 0) - (lookup(baseSkills, row.name)?.value ?? 0);
    const mod =
      getAbilityModifier(scores[row.ability] ?? 10) +
      profBonus * stateRank(state) +
      (touched ? 0 : allProfBump);
    return {
      ...row,
      state,
      source: touched ? ("feature" as const) : row.source,
      locked: touched,
      mod,
    };
  });
}

export function computePassivePerception(skillRows: SkillRow[]): number {
  const perception = skillRows.find((row) => row.name === "Perception");
  return 10 + (perception?.mod ?? 0);
}

export interface SaveRow {
  key: AbilityKey;
  mod: number;
  proficient: boolean;
}

/** Saving-throw proficiencies come from the initial class only (multiclass rule). */
export function computeSavingThrows(
  initialClass: Class5E | undefined,
  finalScores: Stats,
  profBonus: number,
): SaveRow[] {
  const proficient = new Set(
    (initialClass?.savingThrows ?? [])
      .map(normalizeAbility)
      .filter((k): k is AbilityKey => k !== undefined),
  );
  return ABILITY_KEYS.map((key) => ({
    key,
    proficient: proficient.has(key),
    mod: getAbilityModifier(finalScores[key] ?? 10) + (proficient.has(key) ? profBonus : 0),
  }));
}

export interface SpellcastingInfo {
  className: string;
  ability: AbilityKey;
  saveDc: number;
  attack: number;
}

export function computeSpellcasting(
  classes: LeveledClass[],
  resolveClass: (entry: LeveledClass) => Class5E | undefined,
  finalScores: Stats,
  profBonus: number,
): SpellcastingInfo[] {
  return classes
    .map((entry) => ({ entry, class5e: resolveClass(entry) }))
    .filter(({ class5e }) => !!class5e?.spellcasting)
    .map(({ entry, class5e }) => {
      const ability =
        normalizeAbility(class5e?.spellcasting?.spellsKnownCalc?.stat) ??
        SPELL_ABILITY[entry.name.toLowerCase()] ??
        "cha";
      const mod = getAbilityModifier(finalScores[ability] ?? 10);
      return {
        className: entry.name,
        ability,
        saveDc: 8 + profBonus + mod,
        attack: profBonus + mod,
      };
    });
}

/** "d12 · STR, CON · Martial"-style caster label for the class detail card. */
export function casterTypeLabel(class5e: Class5E | undefined): string {
  switch (class5e?.spellcasting?.metadata?.casterType) {
    case CasterType.Full:
      return "Full caster";
    case CasterType.Half:
      return "Half caster";
    case CasterType.Third:
      return "Third caster";
    case CasterType.Pact:
      return "Pact caster";
    default:
      return "Martial";
  }
}

/**
 * Level a subclass unlocks: the class's own subclass-marker features, else the earliest feature
 * level across its subclasses, else the 5e-conventional 3.
 */
export function subclassUnlockLevel(
  class5e: Class5E | undefined,
  subclassesOfClass: Subclass[],
): number {
  const detected = detectSubclassFeatureLevels(class5e);
  if (detected.length > 0) return detected[0];
  const featureLevels = subclassesOfClass
    .flatMap((sub) => Object.keys(sub.features ?? {}).map(Number))
    .filter((lvl) => Number.isFinite(lvl) && lvl > 0);
  return featureLevels.length > 0 ? Math.min(...featureLevels) : 3;
}

export interface SkillChoiceSpec {
  options: string[];
  amount: number;
}

/** Class skill picks; empty options in the data (2024 Bard) mean "any skill". */
export function classSkillChoiceSpec(class5e: Class5E | undefined): SkillChoiceSpec {
  const choice = class5e?.choices?.["skills"];
  const options = choice?.options?.length
    ? choice.options
    : class5e?.proficiencies?.skills?.length
      ? class5e.proficiencies.skills
      : SKILLS.map((s) => s.name);
  return { options, amount: choice?.amount || 2 };
}

/** ✦ marker — the spell is on none of the character's class lists. */
export function isOffList(spell: Spell, classNames: string[]): boolean {
  const owned = new Set(classNames.map((n) => n.toLowerCase()));
  return !(spell.classes ?? []).some((c) => owned.has(c.toLowerCase()));
}

/** First sentence of a rules description, markdown stripped, ≤90 chars. */
export function summarize(text: string | undefined | null): string {
  const plain = (text ?? "")
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const sentence = plain.split(/(?<=[.!?])\s/)[0] ?? "";
  return sentence.length > 90 ? `${sentence.slice(0, 89).trimEnd()}…` : sentence;
}

/** One-line grimoire flavor for a spell row. */
export function spellFlavor(spell: Spell): string {
  return summarize(spell.description);
}

export type FeatCategory = "Origin" | "General" | "Other";

/**
 * Normalized feat category from the data ("Origin Feat"/"General Feat"); data without a category
 * (2014) falls back to the app's existing zero-prerequisites heuristic for origin feats.
 */
export function featCategory(feat: Feat): FeatCategory {
  const category = feat.details?.metadata?.category?.toLowerCase() ?? "";
  if (category.includes("origin")) return "Origin";
  if (category.includes("general")) return "General";
  if (category) return "Other";
  return (feat.prerequisites?.length ?? 0) === 0 ? "Origin" : "General";
}

/** Combined caster level for multiclass slot tables (full + half/2 + third/3, rounded down). */
export function multiclassCasterLevel(
  classes: LeveledClass[],
  resolveClass: (entry: LeveledClass) => Class5E | undefined,
): number {
  return classes.reduce((sum, entry) => {
    switch (resolveClass(entry)?.spellcasting?.metadata?.casterType) {
      case CasterType.Full:
      case CasterType.Pact:
        return sum + entry.level;
      case CasterType.Half:
        return sum + Math.floor(entry.level / 2);
      case CasterType.Third:
        return sum + Math.floor(entry.level / 3);
      default:
        return sum;
    }
  }, 0);
}

/** Parse a darkvision range out of species trait text, e.g. "…Darkvision with a range of 60 feet…". */
export function darkvisionRange(traits: { details?: { name?: string; description?: string } }[]): number | undefined {
  for (const trait of traits ?? []) {
    const text = `${trait.details?.name ?? ""} ${trait.details?.description ?? ""}`;
    if (!/darkvision/i.test(text)) continue;
    const match = text.match(/(\d+)\s*(?:feet|foot|ft)/i);
    if (match) return parseInt(match[1], 10);
  }
  return undefined;
}
