import {
  AbilityScores,
  Background,
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
import {
  detectSubclassFeatureLevels,
  isSubclassMarkerFeature,
  SUBCLASS_FEATURE_NAME_2024,
} from "../../../../shared/ai/refs/classProgression";
import { ABILITY_KEYS, AbilityBonusStyle, AbilityKey, AbilitySlot, SKILLS, SPELL_ABILITY } from "./constants";

export type { AbilityBonusStyle, AbilitySlot };

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

/** Display form of any hit-die shape ("12" | "d12" | 12 → "d12"); "" when absent/unparseable. */
export function hitDieLabel(hitDie: string | number | undefined | null): string {
  const sides = hitDieSides(hitDie);
  return sides > 0 ? `d${sides}` : "";
}

/** "Strength" | "STR" | "str." → 'str'; unknown → undefined. */
export function normalizeAbility(name: string | undefined | null): AbilityKey | undefined {
  const key = (name ?? "").trim().slice(0, 3).toLowerCase();
  return (ABILITY_KEYS as string[]).includes(key) ? (key as AbilityKey) : undefined;
}

// ---- ability score bonuses (assignable token pools) ----

export interface AbilityBonusToken {
  value: number;
  /** Book-default stat prefilled into the slot; '' for tokens the player must place. */
  preset: AbilitySlot;
  /** Stats this token may be assigned to; empty = any of the six. */
  allowed: AbilityKey[];
}

export interface AbilityBonusPool {
  tokens: AbilityBonusToken[];
  /** Flat bonus to every ability (2014 Human) — fixed, never assigned. */
  all: number;
  /** True when the pool is exactly +2/+1 and may alternatively be taken as three +1s. */
  canSpread: boolean;
}

const EMPTY_POOL: AbilityBonusPool = { tokens: [], all: 0, canSpread: false };

/**
 * The race+subrace ability bonuses as an assignable token pool (Tasha's-style: the book's
 * stats prefill via `preset`, but any token may be reassigned). Empty unless the species
 * grants bonuses in this edition (2014, or a legacy species in both-mode) — 2024 species
 * leave ability increases to the background. AbilityScores.ALL bonuses (2014 Human) fold
 * into `all`. abilityBonusChoice entries become preset-less tokens restricted to the
 * choice's stats (Half-Elf's two +1s, CHA excluded). style "spread" swaps a +2/+1 pool
 * for three floating +1s.
 */
export function speciesBonusPool(
  edition: "2014" | "2024" | "both",
  race?: Race,
  subrace?: Subrace,
  style: AbilityBonusStyle = "standard",
): AbilityBonusPool {
  const raceGrantsBonuses = edition === "2014" || (edition === "both" && race?.legacy === true);
  if (!raceGrantsBonuses) return EMPTY_POOL;

  const tokens: AbilityBonusToken[] = [];
  let all = 0;
  [race, subrace].forEach((source) => {
    source?.abilityBonuses?.forEach((bonus) => {
      if (bonus.stat === AbilityScores.ALL) {
        all += bonus.value;
        return;
      }
      // CHOICE-stat entries resolve through abilityBonusChoice tokens instead.
      const key = normalizeAbility(AbilityScores[bonus.stat]);
      if (key) tokens.push({ value: bonus.value, preset: key, allowed: [] });
    });
    const choice = source?.abilityBonusChoice;
    if (choice && choice.amount > 0) {
      const allowed = (choice.choices ?? [])
        .map((c) => normalizeAbility(AbilityScores[c.stat]))
        .filter((key): key is AbilityKey => key !== undefined);
      const value = choice.choices?.[0]?.value ?? 1;
      for (let i = 0; i < choice.amount; i++) tokens.push({ value, preset: "", allowed });
    }
  });

  const values = tokens.map((t) => t.value).sort((a, b) => b - a);
  const canSpread = all === 0 && values.length === 2 && values[0] === 2 && values[1] === 1;
  if (canSpread && style === "spread") {
    return {
      tokens: [1, 1, 1].map((value) => ({ value, preset: "" as AbilitySlot, allowed: [] })),
      all,
      canSpread,
    };
  }
  return { tokens, all, canSpread };
}

/**
 * The 2024-style background ability boosts (+2/+1 by default, three +1s in "spread" style)
 * as an assignable token pool over the background's abilityOptions. Empty for 2014 — that
 * edition's backgrounds carry no abilityOptions, and both-mode stays data-driven the same way.
 */
export function backgroundBonusPool(
  edition: "2014" | "2024" | "both",
  background?: Background,
  style: AbilityBonusStyle = "standard",
): AbilityBonusPool {
  if (edition === "2014") return EMPTY_POOL;
  const allowed = (background?.abilityOptions ?? [])
    .map(normalizeAbility)
    .filter((key): key is AbilityKey => key !== undefined);
  if (allowed.length === 0) return EMPTY_POOL;
  const values = style === "spread" ? [1, 1, 1] : [2, 1];
  return {
    tokens: values.map((value) => ({ value, preset: "" as AbilitySlot, allowed })),
    all: 0,
    canSpread: true,
  };
}

/** Each token's book-default slot ('' where the player must choose). */
export function defaultSlots(pool: AbilityBonusPool): AbilitySlot[] {
  return pool.tokens.map((token) => token.preset);
}

/**
 * The per-ability bonus map a pool + the player's slot assignments produce. `all` applies
 * to every ability; unassigned ('') or off-allowed slots contribute nothing (the checklist
 * surfaces them as pending instead of guessing).
 */
export function sumBonusPool(
  pool: AbilityBonusPool,
  slots: AbilitySlot[],
): Partial<Record<AbilityKey, number>> {
  // An empty slot list means "never assigned" (a draft built outside the provider's
  // default-seeding) — fall back to the book defaults so pure consumers keep zero-click parity.
  const effective = slots.length === 0 && pool.tokens.length > 0 ? defaultSlots(pool) : slots;
  const out: Partial<Record<AbilityKey, number>> = {};
  if (pool.all) ABILITY_KEYS.forEach((k) => (out[k] = (out[k] ?? 0) + pool.all));
  pool.tokens.forEach((token, i) => {
    const slot = effective[i] ?? "";
    if (!slot) return;
    if (token.allowed.length > 0 && !token.allowed.includes(slot)) return;
    out[slot] = (out[slot] ?? 0) + token.value;
  });
  return out;
}

/** Both sources' assigned bonus maps in one call — the mapper and the derived layer share it. */
export function resolveAbilityBonuses(
  edition: "2014" | "2024" | "both",
  race: Race | undefined,
  subrace: Subrace | undefined,
  background: Background | undefined,
  slots: { species: AbilitySlot[]; background: AbilitySlot[] },
  style: { species: AbilityBonusStyle; background: AbilityBonusStyle },
): { species: Partial<Record<AbilityKey, number>>; background: Partial<Record<AbilityKey, number>> } {
  return {
    species: sumBonusPool(speciesBonusPool(edition, race, subrace, style.species), slots.species),
    background: sumBonusPool(backgroundBonusPool(edition, background, style.background), slots.background),
  };
}

/** Final ability scores: player-entered base + manual bonus + assigned species/background bonuses. */
export function computeFinalScores(
  base: Stats,
  bonus: Stats,
  speciesBonuses: Partial<Record<AbilityKey, number>>,
  backgroundBonuses: Partial<Record<AbilityKey, number>>,
): Stats {
  const out = {} as Stats;
  ABILITY_KEYS.forEach((k) => {
    out[k] =
      (base[k] ?? 0) +
      (bonus[k] ?? 0) +
      (speciesBonuses[k] ?? 0) +
      (backgroundBonuses[k] ?? 0);
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

export interface LevelFeatureRow {
  level: number;
  /** Display names; empty for kind "empty". */
  names: string[];
  /** "subclass" = a generic subclass-slot placeholder row (no subclass chosen yet). */
  kind: "features" | "subclass" | "empty";
}

/**
 * One row per level 1..maxLevel for the class card's feature list — dense, so dead levels render
 * as "no new features" instead of vanishing. With no subclass chosen, subclass-slot markers pass
 * through as kind:"subclass" (`subclassLevelHints` — the union of candidate subclasses' feature
 * levels — synthesizes the slot for sparse homebrew classes that never keyed it). Once a subclass
 * IS chosen, generic markers never show: only real class + subclass features remain. Returns []
 * when the class has no named feature data at all, so the card's fallback line still fires.
 */
export function featureRowsByLevel(
  class5e: Class5E | undefined,
  subclass: Subclass | undefined,
  maxLevel: number,
  subclassLevelHints: number[] = [],
): LevelFeatureRow[] {
  const classFeatures = class5e?.features ?? {};
  const hasAnyData = Object.values(classFeatures).some((list) => (list ?? []).some((f) => f?.name));
  if (!hasAnyData || maxLevel < 1) return [];

  const subFeatures = subclass?.features ?? {};
  const hints = new Set(subclassLevelHints.filter((lvl) => Number.isFinite(lvl) && lvl > 0));
  const rows: LevelFeatureRow[] = [];
  for (let level = 1; level <= maxLevel; level++) {
    const realNames: string[] = [];
    const markerNames: string[] = [];
    for (const feature of (classFeatures[level] ?? []).filter((f) => f?.name)) {
      (isSubclassMarkerFeature(class5e?.name, feature) ? markerNames : realNames).push(feature.name ?? "");
    }

    if (subclass) {
      const subNames = (subFeatures[level] ?? []).map((f) => f?.name ?? "").filter(Boolean);
      const names = [...realNames, ...subNames];
      rows.push(names.length > 0 ? { level, names, kind: "features" } : { level, names: [], kind: "empty" });
    } else if (realNames.length > 0 || markerNames.length > 0) {
      rows.push({ level, names: [...realNames, ...markerNames], kind: realNames.length > 0 ? "features" : "subclass" });
    } else if (hints.has(level)) {
      rows.push({ level, names: [SUBCLASS_FEATURE_NAME_2024], kind: "subclass" });
    } else {
      rows.push({ level, names: [], kind: "empty" });
    }
  }
  return rows;
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
