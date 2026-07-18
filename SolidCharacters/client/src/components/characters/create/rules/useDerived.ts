import { Accessor, createMemo } from "solid-js";
import {
  Background,
  Class5E,
  Feat,
  Race,
  Spell,
  Subclass,
  Subrace,
} from "../../../../models/generated";
import { Character } from "../../../../models/character.model";
import { srdItem } from "../../../../models/data/generated";
import { Stats } from "../../../../shared/customHooks/dndInfo/useCharacters";
import {
  editionSideOf,
  filterPool,
  preferCurrent,
  resolveVariant,
  withVariantFirst,
} from "../state/bothMode";
import { draftToCharacter } from "../state/draftMapper";
import { CharacterDraft } from "../state/types";
import { MadChoice, applyCreatorMads, draftMadChoices } from "./applyMads";
import {
  SaveRow,
  SkillRow,
  SpellcastingInfo,
  computeAc,
  computeFinalScores,
  computeInitiative,
  computePassivePerception,
  computeSavingThrows,
  computeSkillRows,
  computeSpellcasting,
  getAbilityModifier,
  getProficiencyBonus,
  totalLevel,
} from "./engine";
import { ABILITY_KEYS, AbilityKey } from "./constants";

/**
 * Edition-driven data accessors the whole creator shares (SRD + homebrew). The plain lists
 * are deduped by name in both-mode; the `*Raw` lists keep every edition variant so the
 * species↔background pairing can resolve and surface the edition-correct row.
 */
export interface CreateData {
  classes: Accessor<Class5E[]>;
  subclasses: Accessor<Subclass[]>;
  races: Accessor<Race[]>;
  racesRaw: Accessor<Race[]>;
  subraces: Accessor<Subrace[]>;
  backgrounds: Accessor<Background[]>;
  backgroundsRaw: Accessor<Background[]>;
  feats: Accessor<Feat[]>;
  spells: Accessor<Spell[]>;
  items: Accessor<srdItem[]>;
}

/** Both-mode species↔background edition pairing: which side is locked, and by which pick. */
export interface PairingState {
  /** true = legacy (2014), false = current (2024), undefined = unconstrained. */
  side: boolean | undefined;
  anchor: "species" | "background" | null;
}

export interface Derived {
  totalLevel: Accessor<number>;
  profBonus: Accessor<number>;
  selectedRace: Accessor<Race | undefined>;
  selectedSubrace: Accessor<Subrace | undefined>;
  selectedBackground: Accessor<Background | undefined>;
  classByName: (name: string) => Class5E | undefined;
  finalScores: Accessor<Stats>;
  abilityMods: Accessor<Record<AbilityKey, number>>;
  maxHp: Accessor<number>;
  ac: Accessor<number>;
  initiative: Accessor<number>;
  speed: Accessor<number>;
  skillRows: Accessor<SkillRow[]>;
  passivePerception: Accessor<number>;
  savingThrows: Accessor<SaveRow[]>;
  spellcasting: Accessor<SpellcastingInfo[]>;
  /** Species list, sorted; both-mode narrows it when the background anchors an edition side. */
  speciesPool: Accessor<Race[]>;
  /** Background list, sorted; both-mode narrows it when the species anchors an edition side. */
  backgroundPool: Accessor<Background[]>;
  pairing: Accessor<PairingState>;
  /** The draft mapped to a Character (pre-MADS) — exactly what Save persists. */
  draftCharacter: Accessor<Character>;
  /** The draft with MADS feature effects applied — same display contract as the view page. */
  madCharacter: Accessor<Character>;
  /** Ability scores after MADS ASIs (feats etc.). */
  effectiveScores: Accessor<Stats>;
  effectiveMods: Accessor<Record<AbilityKey, number>>;
  /** Languages including MADS-granted ones (Common first). */
  languages: Accessor<string[]>;
  /** MADS/species senses as [name, range-in-feet] entries. */
  senses: Accessor<[string, number][]>;
  defenses: Accessor<{ resistances: string[]; immunities: string[]; vulnerabilities: string[] }>;
  /** Spell names granted by MADS commands beyond the draft's own picks. */
  grantedSpells: Accessor<string[]>;
  /** Choice-form MADS commands on the character's features, with pending state. */
  madChoices: Accessor<MadChoice[]>;
  /** The background's origin feat name, '' when none. */
  backgroundFeat: Accessor<string>;
  /** Every feat on the sheet: origin feat + chosen. */
  allFeatNames: Accessor<string[]>;
  /** "Barbarian 1 / Sorcerer 3" for the top bar and living sheet. */
  classSummary: Accessor<string>;
  /** "2024 Rules · Human · Barbarian 1 / Sorcerer 3 · Soldier · True Neutral". */
  summaryLine: Accessor<string>;
}

export function useDerived(draft: CharacterDraft, data: CreateData): Derived {
  // Merged both-mode lists can hold a legacy AND a current row per name — the current
  // one wins for name-keyed class lookups.
  const classByName = (name: string) =>
    preferCurrent(data.classes().filter((c) => c.name?.toLowerCase() === name.toLowerCase()));

  const pairing = createMemo<PairingState>(() => {
    if (draft.edition !== "both") return { side: undefined, anchor: null };
    const speciesSide = editionSideOf(data.racesRaw(), draft.species);
    if (speciesSide !== undefined) return { side: speciesSide, anchor: "species" };
    const backgroundSide = editionSideOf(data.backgroundsRaw(), draft.background);
    if (backgroundSide !== undefined) return { side: backgroundSide, anchor: "background" };
    return { side: undefined, anchor: null };
  });

  const sortByName = <T extends { name?: string }>(rows: T[]): T[] =>
    [...rows].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));

  // Each pool narrows only when the OTHER pick anchors a side, so the anchoring list
  // itself stays complete and switching the anchor remains possible.
  const speciesPool = createMemo(() =>
    sortByName(
      pairing().anchor === "background"
        ? filterPool(data.racesRaw(), pairing().side)
        : data.races(),
    ));
  const backgroundPool = createMemo(() =>
    sortByName(
      pairing().anchor === "species"
        ? filterPool(data.backgroundsRaw(), pairing().side)
        : data.backgrounds(),
    ));

  const selectedRace = createMemo(() =>
    resolveVariant(data.racesRaw(), draft.species, pairing().side));
  const selectedSubrace = createMemo(() =>
    draft.lineage
      ? preferCurrent(
        data.subraces().filter((r) => r.name?.toLowerCase() === draft.lineage.toLowerCase()),
      )
      : undefined);
  const selectedBackground = createMemo(() =>
    resolveVariant(data.backgroundsRaw(), draft.background, pairing().side));

  const level = createMemo(() => totalLevel(draft.classes));
  const profBonus = createMemo(() => getProficiencyBonus(level()));

  const finalScores = createMemo(() =>
    computeFinalScores(
      draft.edition,
      draft.baseScores,
      draft.bonusScores,
      draft.backgroundBoosts,
      selectedRace(),
      selectedSubrace(),
      draft.raceAbilityChoices,
    ));
  const abilityMods = createMemo(() => {
    const scores = finalScores();
    return Object.fromEntries(
      ABILITY_KEYS.map((key) => [key, getAbilityModifier(scores[key])]),
    ) as Record<AbilityKey, number>;
  });

  const backgroundFeat = createMemo(() =>
    selectedBackground() ? draft.originFeat || (selectedBackground()?.feat ?? "") : "");
  const allFeatNames = createMemo(() => [
    ...(backgroundFeat() ? [backgroundFeat()] : []),
    ...draft.feats,
  ]);

  // The MADS layer mirrors the view page: map the draft to a Character, apply the feature
  // commands to a clone at display time, and never persist the applied result.
  const draftCharacter = createMemo(() =>
    draftToCharacter(draft, {
      classes: data.classes(),
      subclasses: data.subclasses(),
      races: withVariantFirst(data.races(), selectedRace()),
      subraces: data.subraces(),
      backgrounds: withVariantFirst(data.backgrounds(), selectedBackground()),
      feats: data.feats(),
    }));
  const madCharacter = createMemo(() => applyCreatorMads(draftCharacter()));
  const madChoices = createMemo(() => draftMadChoices(draftCharacter()));

  const effectiveScores = createMemo(() => madCharacter().stats ?? finalScores());
  const effectiveMods = createMemo(() => {
    const scores = effectiveScores();
    return Object.fromEntries(
      ABILITY_KEYS.map((key) => [key, getAbilityModifier(scores[key])]),
    ) as Record<AbilityKey, number>;
  });

  const spellNameById = createMemo(
    () => new Map(data.spells().map((s) => [(s.id ?? "").toLowerCase(), s.name])));
  const grantedSpells = createMemo(() => {
    const known = new Set(draft.spells.map((name) => name.toLowerCase()));
    return (madCharacter().spells ?? [])
      .map((s) => s.name)
      .filter((name) => name && !known.has(name.toLowerCase()))
      .map((name) => spellNameById().get(name.toLowerCase()) ?? name);
  });

  const skillRows = createMemo(() =>
    computeSkillRows({
      classSkills: draft.classes.flatMap((c) => c.skillChoices),
      backgroundSkills: selectedBackground()?.proficiencies?.skills ?? [],
      overrides: draft.skillOverrides,
      finalScores: effectiveScores(),
      profBonus: profBonus(),
    }));

  const classSummary = createMemo(() =>
    draft.classes.map((c) => `${c.name} ${c.level}`).join(" / "));

  const summaryLine = createMemo(() =>
    [
      `${draft.edition} Rules`,
      draft.species,
      classSummary(),
      draft.background,
      draft.alignment,
    ]
      .filter(Boolean)
      .join(" · "));

  return {
    totalLevel: level,
    profBonus,
    selectedRace,
    selectedSubrace,
    selectedBackground,
    classByName,
    finalScores,
    abilityMods,
    maxHp: createMemo(() => madCharacter().health?.max ?? 0),
    ac: createMemo(() => madCharacter().ArmorClass ?? computeAc(abilityMods().dex)),
    initiative: createMemo(() => computeInitiative(effectiveMods().dex, allFeatNames(), profBonus())),
    speed: createMemo(() => madCharacter().Speed ?? 0),
    skillRows,
    passivePerception: createMemo(() => computePassivePerception(skillRows())),
    savingThrows: createMemo(() =>
      computeSavingThrows(classByName(draft.classes[0]?.name ?? ""), effectiveScores(), profBonus())),
    spellcasting: createMemo(() =>
      computeSpellcasting(draft.classes, classByName, effectiveScores(), profBonus())),
    speciesPool,
    backgroundPool,
    pairing,
    draftCharacter,
    madCharacter,
    effectiveScores,
    effectiveMods,
    languages: createMemo(() => madCharacter().languages ?? []),
    senses: createMemo(() => Object.entries(madCharacter().senses ?? {}) as [string, number][]),
    defenses: createMemo(() => ({
      resistances: (madCharacter().resistances ?? []).map((r) => r.type),
      immunities: (madCharacter().immunities ?? []).map((r) => r.type),
      vulnerabilities: (madCharacter().vulnerabilities ?? []).map((r) => r.type),
    })),
    grantedSpells,
    madChoices,
    backgroundFeat,
    allFeatNames,
    classSummary,
    summaryLine,
  };
}
