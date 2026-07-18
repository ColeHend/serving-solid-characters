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
  Spell,
  Subclass,
  Subrace,
} from "../../../../models/generated";
import { subclassBelongsTo } from "../../../../models/data/subclasses";
import { entitySelectorKey } from "../../../../shared/customHooks/utility/tools/entityKey";
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
  skillDisplayName,
  skillStorageKey,
  totalLevel,
} from "../rules/engine";
import { draftClassKey } from "./draftStore";
import { CharacterDraft, DraftClass, emptyDraft, zeroScores } from "./types";

export interface SrdLookups {
  classes: Class5E[];
  subclasses: Subclass[];
  races: Race[];
  subraces: Subrace[];
  backgrounds: Background[];
  feats: Feat[];
  spells: Spell[];
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

/** Exact selector-key lookup; undefined when no key is stored (legacy saves fall back to byName). */
const byId = <T extends { id?: string; name?: string }>(
  list: T[],
  key: string | undefined,
): T | undefined => {
  if (!key) return undefined;
  return list.find((entry) => entitySelectorKey({ id: entry.id, name: entry.name ?? "" }) === key);
};

/** Selector key of a feat — its display name lives in details, not at the top level. */
const featKey = (feat: Feat | undefined): string | undefined =>
  feat ? entitySelectorKey({ id: feat.id, name: feat.details?.name ?? "" }) : undefined;

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
  const classFor = (entry: DraftClass) => byId(lookups.classes, entry.classId) ?? classByName(entry.name);
  const race = byId(lookups.races, draft.speciesId) ?? byName(lookups.races, draft.species);
  const subrace = draft.lineage
    ? byId(lookups.subraces, draft.lineageId) ?? byName(lookups.subraces, draft.lineage)
    : undefined;
  const background = byId(lookups.backgrounds, draft.backgroundId) ?? byName(lookups.backgrounds, draft.background);

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
  const autoMaxHp = computeMaxHp(draft.classes, classFor, conMod);
  const maxHp = draft.hp?.maxOverride ?? autoMaxHp;

  const levels: CharacterLevel[] = [];
  let running = 1;
  draft.classes.forEach((entry) => {
    const class5e = classFor(entry);
    // Chosen-subclass features bake into the level rows so the saved character (and every
    // MADS consumer) sees them exactly like class features.
    const subclass5e = entry.subclass || entry.subclassId
      ? lookups.subclasses.find((sub) =>
        subclassBelongsTo(sub, class5e) &&
          (entry.subclassId
            ? entitySelectorKey(sub) === entry.subclassId
            : sub.name?.toLowerCase() === entry.subclass.toLowerCase()))
      : undefined;
    for (let classLevel = 1; classLevel <= entry.level; classLevel++) {
      levels.push({
        class: entry.name,
        classId: entry.classId,
        subclass: entry.subclass,
        subclassId: entry.subclassId,
        level: running++,
        hitDie: hitDieSides(class5e?.hitDie),
        features: [
          ...(class5e?.features?.[classLevel] ?? []),
          ...(subclass5e?.features?.[classLevel] ?? []),
        ],
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
  const originFeatKey = (draft.originFeat && draft.originFeatId) || featKey(findFeat(lookups.feats, originFeat));
  const featsTaken: CharacterFeatTaken[] = [
    ...(originFeat ? [{ name: originFeat, source: "background" as const, id: originFeatKey }] : []),
    ...draft.feats.map((name) => ({
      name,
      source: "chosen" as const,
      id: featKey(findFeat(lookups.feats, name)),
    })),
  ];

  const chosenTraits = (race?.traitChoice?.choices ?? []).filter((trait) =>
    draft.raceTraitChoices.includes(trait.details?.name ?? ""));
  const raceTraits = [...(race?.traits ?? []), ...(subrace?.traits ?? []), ...chosenTraits];
  const darkvision = darkvisionRange(raceTraits);

  const character = new Character();
  character.id = draft.characterId ?? "";
  character.name = draft.name.trim();
  character.edition = draft.edition;
  character.levels = levels;
  character.className = draft.classes.map((c) => c.name).join(",");
  character.subclass = draft.classes.map((c) => c.subclass).filter(Boolean);
  character.race = {
    species: race?.name ?? draft.species,
    speciesId: race ? entitySelectorKey(race) : draft.speciesId,
    subrace: draft.lineage || undefined,
    subraceId: draft.lineage ? (subrace ? entitySelectorKey(subrace) : draft.lineageId) : undefined,
    age: "",
    size: race?.size ?? "",
    speed: race ? `${race.speed}ft` : "",
    features: raceTraits.flatMap((t) => t.details ?? []),
  };
  character.background = draft.background;
  character.backgroundId = background ? entitySelectorKey(background) : draft.backgroundId;
  // Raw (unapplied) — a mads source like race.features; re-derived from the catalog each save.
  if (background?.features?.length) character.backgroundFeatures = background.features;
  character.alignment = draft.alignment;
  character.languages = collectLanguages(draft.languages, draft.raceLanguageChoices, race, subrace);
  character.spells = draft.spells.map((name) => {
    const spell = byName(lookups.spells, name);
    return { name: spell?.name ?? name, prepared: false, id: spell?.id || undefined };
  });
  character.features = featsTaken.map((feat) => featDetail(lookups.feats, feat.name));
  character.featsTaken = featsTaken;
  character.proficiencies = {
    skills: Object.fromEntries(
      skillRows.map((row) => [
        skillStorageKey(row.name),
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
  character.savingThrows = computeSavingThrows(
    draft.classes[0] ? classFor(draft.classes[0]) : undefined,
    finalScores,
    profBonus,
  ).map((save) => ({ stat: save.key, proficient: save.proficient }));
  // Choice-form MADS picks travel on the Character contract fields so both the live
  // creator (applyCreatorMads) and the view page resolve them the same way.
  character.statChoices = { ...draft.madChoices.stats };
  character.proficiencyChoices = { ...draft.madChoices.proficiencies };
  character.spellChoices = { ...draft.madChoices.spells };
  character.ArmorClass = computeAc(getAbilityModifier(finalScores.dex));
  character.Speed = (subrace?.speed || race?.speed) ?? 0;
  if (darkvision) character.senses = { darkvision };
  character.health = {
    max: maxHp,
    current: draft.hp?.current ?? maxHp,
    temp: draft.hp?.temp ?? 0,
  };
  character.stats = finalScores;
  character.statsInclusive = true;
  character.details = { ...draft.details };
  character.builder = {
    abilityMethod: draft.abilityMethod,
    baseScores: { ...draft.baseScores },
    bonusScores: { ...draft.bonusScores },
    backgroundBoosts: { ...draft.backgroundBoosts },
    skillOverrides: { ...draft.skillOverrides },
    // Keyed by selector key so same-named classes (SRD vs homebrew, 2014 vs 2024) don't collide.
    classSkillChoices: Object.fromEntries(
      draft.classes.map((c) => [draftClassKey(c), [...c.skillChoices]]),
    ),
    rolledPool: [...draft.rolledPool],
    raceAbilityChoices: [...draft.raceAbilityChoices],
    raceLanguageChoices: [...draft.raceLanguageChoices],
    raceTraitChoices: [...draft.raceTraitChoices],
    originFeat: draft.originFeat,
    hp: { ...draft.hp },
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

/** Group saved level rows back into per-class entries, first-seen order, keyed by selector key. */
function classesFromLevels(character: Character): DraftClass[] {
  const grouped = new Map<string, DraftClass>();
  (character.levels ?? []).forEach((row) => {
    if (!row.class) return;
    const key = row.classId || entitySelectorKey({ name: row.class });
    const existing = grouped.get(key);
    if (existing) {
      existing.level += 1;
      if (!existing.subclass && row.subclass) existing.subclass = row.subclass;
      if (!existing.subclassId && row.subclassId) existing.subclassId = row.subclassId;
    } else {
      grouped.set(key, {
        name: row.class,
        classId: row.classId,
        level: 1,
        subclass: row.subclass ?? "",
        subclassId: row.subclassId,
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
        grouped.set(entitySelectorKey({ name }), {
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
    // Selector-key keyed since the id rework; older saves keyed by class name.
    entry.skillChoices =
      builder?.classSkillChoices?.[draftClassKey(entry)] ??
      builder?.classSkillChoices?.[entry.name] ??
      [];
  });

  const skillOverrides = builder
    ? { ...builder.skillOverrides }
    : Object.fromEntries(
      Object.entries(character.proficiencies?.skills ?? {})
        .filter(([, skill]) => skill.proficient || skill.expertise)
        .map(([name, skill]) => [
          skillDisplayName(name),
          skill.expertise ? ("expertise" as const) : ("proficient" as const),
        ]),
    );

  const originFeat = backgroundFeatName({ background: character.background ?? "" }, lookups.backgrounds);
  // Stored feat ids resolve to the canonical feat; unresolvable ids keep the stored name.
  const featNameFor = (taken: { name: string; id?: string }): string => {
    const found = taken.id ? lookups.feats.find((f) => featKey(f) === taken.id) : undefined;
    return found?.details?.name ?? taken.name;
  };
  const chosenFeats = character.featsTaken
    ? character.featsTaken.filter((f) => f.source === "chosen").map(featNameFor)
    : (character.features ?? [])
      .map((f) => f.name)
      .filter((name) => name && name.toLowerCase() !== originFeat.toLowerCase());

  // Saved languages include species grants + species picks; only manual/background picks
  // go back into draft.languages (the mapper re-adds the rest on save).
  const race =
    byId(lookups.races, character.race?.speciesId) ?? byName(lookups.races, character.race?.species);
  const subrace = character.race?.subrace || character.race?.subraceId
    ? byId(lookups.subraces, character.race?.subraceId) ??
      byName(lookups.subraces, character.race?.subrace)
    : undefined;
  const background =
    byId(lookups.backgrounds, character.backgroundId) ??
    byName(lookups.backgrounds, character.background);
  const raceLanguageChoices = builder?.raceLanguageChoices ?? [];
  const raceGrantedLanguages = new Set(
    [...(race?.languages ?? []), ...(subrace?.languages ?? []), ...raceLanguageChoices].map((l) =>
      l.toLowerCase()),
  );

  const originFeatOverride = builder?.originFeat ?? "";
  return emptyDraft(character.edition ?? fallbackEdition, {
    characterId: character.id || undefined,
    name: character.name ?? "",
    alignment: character.alignment || "true neutral",
    classes,
    species: race?.name ?? character.race?.species ?? "",
    speciesId: race ? entitySelectorKey(race) : character.race?.speciesId,
    lineage: subrace?.name ?? character.race?.subrace ?? "",
    lineageId: subrace ? entitySelectorKey(subrace) : character.race?.subraceId,
    background: background?.name ?? character.background ?? "",
    backgroundId: background ? entitySelectorKey(background) : character.backgroundId,
    originFeat: originFeatOverride,
    originFeatId: originFeatOverride
      ? featKey(findFeat(lookups.feats, originFeatOverride))
      : undefined,
    hp: builder?.hp ? { ...builder.hp } : { temp: character.health?.temp ?? 0 },
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
    spells: (character.spells ?? [])
      .map((s) => (s.id ? lookups.spells.find((sp) => sp.id === s.id)?.name ?? s.name : s.name))
      .filter(Boolean),
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
