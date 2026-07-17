import {
  Character,
  CharacterFeatTaken,
  CharacterLevel,
  RulesetSelection,
} from "../../../../models/character.model";
import {
  Background,
  Class5E,
  Feat,
  FeatureDetail,
  Race,
  Subclass,
  Subrace,
} from "../../../../models/generated";
import {
  collectLanguages,
  computeAc,
  computeFinalScores,
  computeMaxHp,
  computeSavingThrows,
  computeSkillRows,
  darkvisionRange,
  getAbilityModifier,
  getProficiencyBonus,
  hitDieSides,
  normalizeAbility,
  totalLevel,
} from "../rules/engine";
import { CharacterDraft, DraftClass, emptyDraft, zeroScores } from "./types";

export interface SrdLookups {
  classes: Class5E[];
  subclasses: Subclass[];
  races: Race[];
  subraces: Subrace[];
  backgrounds: Background[];
  feats: Feat[];
}

// Both-mode lists can hold a legacy AND a current row per name; the current one wins by
// default (the pairing-resolved variant is prepended by the caller when it should win).
const byName = <T extends { name?: string; legacy?: boolean }>(
  list: T[],
  name: string | undefined,
): T | undefined => {
  if (!name) return undefined;
  const matches = list.filter((entry) => entry.name?.toLowerCase() === name.toLowerCase());
  return matches.find((entry) => entry.legacy !== true) ?? matches[0];
};

/**
 * `character.proficiencies.skills` has always been keyed with "Sleight Of Hand" (capital Of),
 * and the view page indexes it case-sensitively — keep the legacy storage key while the UI
 * shows the correct "Sleight of Hand".
 */
const storageSkillKey = (name: string) => (name === "Sleight of Hand" ? "Sleight Of Hand" : name);
const displaySkillName = (key: string) => (key === "Sleight Of Hand" ? "Sleight of Hand" : key);

/** Feat lookup with the old mapper's "Magic Initiate (Cleric)" → "Magic Initiate" normalization. */
function findFeat(feats: Feat[], name: string): Feat | undefined {
  const wanted = name.toLowerCase().includes("magic initiate") ? "magic initiate" : name.toLowerCase();
  const matches = feats.filter((f) => f.details?.name?.toLowerCase() === wanted);
  return matches.find((f) => f.legacy !== true) ?? matches[0];
}

/**
 * The character's origin feat: the player's override when set, else the background's
 * recommended feat. Empty without a background.
 */
export function backgroundFeatName(
  draft: Pick<CharacterDraft, "background"> & Partial<Pick<CharacterDraft, "originFeat">>,
  backgrounds: Background[],
): string {
  const background = byName(backgrounds, draft.background);
  if (!background) return "";
  return draft.originFeat || (background.feat ?? "");
}

function featDetail(feats: Feat[], name: string): FeatureDetail {
  const found = findFeat(feats, name);
  return found?.details ?? { id: "", name, description: "" };
}

export function draftToCharacter(draft: CharacterDraft, lookups: SrdLookups): Character {
  const classByName = (name: string) => byName(lookups.classes, name);
  const race = byName(lookups.races, draft.species);
  const subrace = draft.lineage ? byName(lookups.subraces, draft.lineage) : undefined;
  const background = byName(lookups.backgrounds, draft.background);

  const finalScores = computeFinalScores(
    draft.edition,
    draft.baseScores,
    draft.bonusScores,
    draft.backgroundBoosts,
    race,
    subrace,
    draft.raceAbilityChoices,
  );
  const profBonus = getProficiencyBonus(totalLevel(draft.classes));
  const conMod = getAbilityModifier(finalScores.con);
  const maxHp = computeMaxHp(draft.classes, classByName, conMod);

  const levels: CharacterLevel[] = [];
  let running = 1;
  draft.classes.forEach((entry) => {
    const class5e = classByName(entry.name);
    for (let classLevel = 1; classLevel <= entry.level; classLevel++) {
      levels.push({
        class: entry.name,
        subclass: entry.subclass,
        level: running++,
        hitDie: hitDieSides(class5e?.hitDie),
        features: [...(class5e?.features?.[classLevel] ?? [])],
      });
    }
  });

  const skillRows = computeSkillRows({
    classSkills: draft.classes.flatMap((c) => c.skillChoices),
    backgroundSkills: background?.proficiencies?.skills ?? [],
    overrides: draft.skillOverrides,
    finalScores,
    profBonus,
  });

  const originFeat = backgroundFeatName(draft, lookups.backgrounds);
  const featsTaken: CharacterFeatTaken[] = [
    ...(originFeat ? [{ name: originFeat, source: "background" as const }] : []),
    ...draft.feats.map((name) => ({ name, source: "chosen" as const })),
  ];

  const chosenTraits = (race?.traitChoice?.choices ?? []).filter((trait) =>
    draft.raceTraitChoices.includes(trait.details?.name ?? ""));
  const raceTraits = [...(race?.traits ?? []), ...(subrace?.traits ?? []), ...chosenTraits];
  const darkvision = darkvisionRange(raceTraits);

  const character = new Character();
  character.name = draft.name.trim();
  character.edition = draft.edition;
  character.levels = levels;
  character.className = draft.classes.map((c) => c.name).join(",");
  character.subclass = draft.classes.map((c) => c.subclass).filter(Boolean);
  character.race = {
    species: race?.name ?? draft.species,
    subrace: draft.lineage || undefined,
    age: "",
    size: race?.size ?? "",
    speed: race ? `${race.speed}ft` : "",
    features: raceTraits.flatMap((t) => t.details ?? []),
  };
  character.background = draft.background;
  character.alignment = draft.alignment;
  character.languages = collectLanguages(draft.languages, draft.raceLanguageChoices, race, subrace);
  character.spells = draft.spells.map((name) => ({ name, prepared: false }));
  character.features = featsTaken.map((feat) => featDetail(lookups.feats, feat.name));
  character.featsTaken = featsTaken;
  character.proficiencies = {
    skills: Object.fromEntries(
      skillRows.map((row) => [
        storageSkillKey(row.name),
        {
          stat: row.ability,
          value: row.mod,
          proficient: row.state !== "none",
          expertise: row.state === "expertise",
        },
      ]),
    ),
    other: {},
  };
  character.savingThrows = computeSavingThrows(classByName(draft.classes[0]?.name ?? ""), finalScores, profBonus)
    .map((save) => ({ stat: save.key, proficient: save.proficient }));
  // Choice-form MADS picks travel on the Character contract fields so both the live
  // creator (applyCreatorMads) and the view page resolve them the same way.
  character.statChoices = { ...draft.madChoices.stats };
  character.proficiencyChoices = { ...draft.madChoices.proficiencies };
  character.spellChoices = { ...draft.madChoices.spells };
  character.ArmorClass = computeAc(getAbilityModifier(finalScores.dex));
  character.Speed = (subrace?.speed || race?.speed) ?? 0;
  if (darkvision) character.senses = { darkvision };
  character.health = { max: maxHp, current: maxHp, temp: 0 };
  character.stats = finalScores;
  character.statsInclusive = true;
  character.details = { ...draft.details };
  character.builder = {
    abilityMethod: draft.abilityMethod,
    baseScores: { ...draft.baseScores },
    bonusScores: { ...draft.bonusScores },
    backgroundBoosts: { ...draft.backgroundBoosts },
    skillOverrides: { ...draft.skillOverrides },
    classSkillChoices: Object.fromEntries(draft.classes.map((c) => [c.name, [...c.skillChoices]])),
    rolledPool: [...draft.rolledPool],
    raceAbilityChoices: [...draft.raceAbilityChoices],
    raceLanguageChoices: [...draft.raceLanguageChoices],
    raceTraitChoices: [...draft.raceTraitChoices],
    originFeat: draft.originFeat,
  };
  character.items = {
    inventory: [...draft.items.inventory],
    equipped: [...draft.items.equipped],
    attuned: [...draft.items.attuned],
    currency: {
      platinumPieces: draft.items.currency.pp,
      goldPieces: draft.items.currency.gp,
      electrumPieces: draft.items.currency.ep,
      sliverPieces: draft.items.currency.sp,
      copperPieces: draft.items.currency.cp,
    },
  };
  return character;
}

/** Group saved level rows back into per-class entries, first-seen order. */
function classesFromLevels(character: Character): DraftClass[] {
  const grouped = new Map<string, DraftClass>();
  (character.levels ?? []).forEach((row) => {
    if (!row.class) return;
    const existing = grouped.get(row.class);
    if (existing) {
      existing.level += 1;
      if (!existing.subclass && row.subclass) existing.subclass = row.subclass;
    } else {
      grouped.set(row.class, {
        name: row.class,
        level: 1,
        subclass: row.subclass ?? "",
        skillChoices: [],
      });
    }
  });
  if (grouped.size === 0) {
    // Pre-rebuild characters could have a broken levels array; fall back to the className CSV.
    (character.className ?? "")
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .forEach((name, index) => {
        grouped.set(name, {
          name,
          level: 1,
          subclass: character.subclass?.[index] ?? "",
          skillChoices: [],
        });
      });
  }
  return [...grouped.values()];
}

/**
 * Rebuild a draft from a saved character for edit mode. Characters saved by this creator restore
 * their builder state verbatim; pre-rebuild characters get conservative defaults (manual scores,
 * proficiencies as explicit overrides).
 */
export function characterToDraft(
  character: Character,
  lookups: SrdLookups,
  fallbackEdition: RulesetSelection,
): CharacterDraft {
  const builder = character.builder;
  const classes = classesFromLevels(character);
  classes.forEach((entry) => {
    entry.skillChoices = builder?.classSkillChoices?.[entry.name] ?? [];
  });

  const skillOverrides = builder
    ? { ...builder.skillOverrides }
    : Object.fromEntries(
      Object.entries(character.proficiencies?.skills ?? {})
        .filter(([, skill]) => skill.proficient || skill.expertise)
        .map(([name, skill]) => [
          displaySkillName(name),
          skill.expertise ? ("expertise" as const) : ("proficient" as const),
        ]),
    );

  const originFeat = backgroundFeatName({ background: character.background ?? "" }, lookups.backgrounds);
  const chosenFeats = character.featsTaken
    ? character.featsTaken.filter((f) => f.source === "chosen").map((f) => f.name)
    : (character.features ?? [])
      .map((f) => f.name)
      .filter((name) => name && name.toLowerCase() !== originFeat.toLowerCase());

  // Saved languages include species grants + species picks; only manual/background picks
  // go back into draft.languages (the mapper re-adds the rest on save).
  const race = byName(lookups.races, character.race?.species);
  const subrace = character.race?.subrace ? byName(lookups.subraces, character.race.subrace) : undefined;
  const raceLanguageChoices = builder?.raceLanguageChoices ?? [];
  const raceGrantedLanguages = new Set(
    [...(race?.languages ?? []), ...(subrace?.languages ?? []), ...raceLanguageChoices].map((l) =>
      l.toLowerCase()),
  );

  return emptyDraft(character.edition ?? fallbackEdition, {
    name: character.name ?? "",
    alignment: character.alignment || "true neutral",
    classes,
    species: character.race?.species ?? "",
    lineage: character.race?.subrace ?? "",
    background: character.background ?? "",
    originFeat: builder?.originFeat ?? "",
    languages: (character.languages ?? []).filter(
      (l) => l.toLowerCase() !== "common" && !raceGrantedLanguages.has(l.toLowerCase()),
    ),
    raceAbilityChoices: (builder?.raceAbilityChoices ?? [])
      .map(normalizeAbility)
      .filter((key): key is NonNullable<typeof key> => key !== undefined),
    raceLanguageChoices,
    raceTraitChoices: builder?.raceTraitChoices ?? [],
    abilityMethod: builder?.abilityMethod ?? "manual",
    baseScores: builder ? { ...builder.baseScores } : { ...(character.stats ?? zeroScores()) },
    bonusScores: builder ? { ...builder.bonusScores } : zeroScores(),
    backgroundBoosts: builder ? { ...builder.backgroundBoosts } : {},
    rolledPool: builder ? [...builder.rolledPool] : [],
    skillOverrides,
    feats: chosenFeats,
    madChoices: {
      stats: { ...(character.statChoices ?? {}) },
      proficiencies: { ...(character.proficiencyChoices ?? {}) },
      spells: { ...(character.spellChoices ?? {}) },
    },
    spells: (character.spells ?? []).map((s) => s.name).filter(Boolean),
    details: { ...(character.details ?? {}) },
    items: {
      inventory: [...(character.items?.inventory ?? [])],
      equipped: [...(character.items?.equipped ?? [])],
      attuned: [...(character.items?.attuned ?? [])],
      currency: {
        pp: character.items?.currency?.platinumPieces ?? 0,
        gp: character.items?.currency?.goldPieces ?? 0,
        ep: character.items?.currency?.electrumPieces ?? 0,
        sp: character.items?.currency?.sliverPieces ?? 0,
        cp: character.items?.currency?.copperPieces ?? 0,
      },
      classItemChoices: {},
      backgroundItemChoice: null,
      classGold: 0,
      backgroundGold: 0,
    },
  });
}
