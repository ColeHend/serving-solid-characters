import { describe, expect, it } from "vitest";
import { Character } from "../../../../models/character.model";
import { Background, CasterType, Class5E, Feat, Race, Spell, Subclass } from "../../../../models/generated";
import { MadType } from "../../../../shared/customHooks/mads/madModels";
import { draftMadChoices } from "../rules/applyMads";
import { SrdLookups, characterToDraft, draftToCharacter } from "./draftMapper";
import { draftClassKey } from "./draftStore";
import { emptyDraft } from "./types";

const barbarian = {
  name: "Barbarian",
  hitDie: "d12",
  savingThrows: ["Strength", "Constitution"],
  features: { 1: [{ id: "rage", name: "Rage", description: "" }] },
  choices: { skills: { options: ["Athletics", "Perception", "Survival"], amount: 2 } },
} as unknown as Class5E;

const sorcerer = {
  name: "Sorcerer",
  hitDie: "d6",
  savingThrows: ["Constitution", "Charisma"],
  spellcasting: { metadata: { casterType: CasterType.Full, slots: {} }, knownType: 0, learnedSpells: {} },
  features: { 3: [{ id: "sub", name: "Sorcerer Subclass", description: "" }] },
} as unknown as Class5E;

const human = {
  name: "Human",
  size: "Medium",
  speed: 30,
  abilityBonuses: [],
  traits: [{ details: { id: "v", name: "Versatile", description: "" } }],
} as unknown as Race;

const soldier = {
  name: "Soldier",
  proficiencies: { skills: ["Athletics", "Intimidation"], tools: [], weapons: [], armor: [] },
  abilityOptions: ["Strength", "Dexterity", "Constitution"],
  feat: "Savage Attacker",
} as unknown as Background;

const feat = (name: string): Feat =>
  ({ id: name, details: { id: name, name, description: `${name} does things.` }, prerequisites: [] }) as unknown as Feat;

const lookups: SrdLookups = {
  classes: [barbarian, sorcerer],
  subclasses: [],
  races: [human],
  subraces: [],
  backgrounds: [soldier],
  feats: [feat("Savage Attacker"), feat("Alert")],
  spells: [],
};

/** The plan's verification character: 2024 Human Soldier, Barbarian 1 / Sorcerer 3 (Draconic). */
const scenarioDraft = () =>
  emptyDraft("2024", {
    name: "Verity",
    alignment: "true neutral",
    classes: [
      { name: "Barbarian", level: 1, subclass: "", skillChoices: ["Perception"] },
      { name: "Sorcerer", level: 3, subclass: "Draconic Sorcery", skillChoices: [] },
    ],
    species: "Human",
    background: "Soldier",
    abilityMethod: "manual",
    baseScores: { str: 15, dex: 16, con: 14, int: 12, wis: 10, cha: 8 },
    feats: ["Alert"],
    spells: ["Acid Splash", "Blade Ward"],
    languages: ["Elvish"],
  });

describe("draftToCharacter", () => {
  const character = draftToCharacter(scenarioDraft(), lookups);

  it("builds contiguous level rows with real hit dice and the subclass on each row", () => {
    expect(character.levels).toHaveLength(4);
    expect(character.levels.map((l) => l.level)).toEqual([1, 2, 3, 4]);
    expect(character.levels.map((l) => l.hitDie)).toEqual([12, 6, 6, 6]);
    expect(character.levels[0].features.map((f) => f.name)).toEqual(["Rage"]);
    expect(character.levels[3].subclass).toBe("Draconic Sorcery");
    expect(character.subclass).toEqual(["Draconic Sorcery"]);
  });

  it("derives HP 32, AC 13, and final scores with statsInclusive", () => {
    expect(character.health).toEqual({ max: 32, current: 32, temp: 0 });
    expect(character.ArmorClass).toBe(13);
    expect(character.stats).toEqual({ str: 15, dex: 16, con: 14, int: 12, wis: 10, cha: 8 });
    expect(character.statsInclusive).toBe(true);
    expect(character.edition).toBe("2024");
  });

  it("persists real skill proficiencies from class picks and background", () => {
    const skills = character.proficiencies.skills;
    expect(skills.Perception).toMatchObject({ proficient: true, value: 2 });
    expect(skills.Athletics).toMatchObject({ proficient: true, value: 4 });
    expect(skills.Intimidation).toMatchObject({ proficient: true, value: 1 });
    // The old mapper hardcoded these two as expert — they must be plain now.
    expect(skills.Arcana).toMatchObject({ proficient: false, expertise: false, value: 1 });
    expect(skills.History).toMatchObject({ proficient: false, expertise: false, value: 1 });
    expect(Object.keys(skills)).toHaveLength(18);
    // The view page indexes this legacy key casing case-sensitively.
    expect(skills["Sleight Of Hand"]).toBeDefined();
    expect(skills["Sleight of Hand"]).toBeUndefined();
  });

  it("marks initial-class saving throws only", () => {
    const proficient = character.savingThrows.filter((s) => s.proficient).map((s) => s.stat);
    expect(proficient.sort()).toEqual(["con", "str"]);
    expect(character.savingThrows).toHaveLength(6);
  });

  it("keeps the view/PDF contract fields", () => {
    expect(character.className).toBe("Barbarian,Sorcerer");
    expect(character.background).toBe("Soldier");
    expect(character.languages).toEqual(["Common", "Elvish"]);
    expect(character.spells).toEqual([
      { name: "Acid Splash", prepared: false },
      { name: "Blade Ward", prepared: false },
    ]);
    expect(character.race.species).toBe("Human");
    expect(character.Speed).toBe(30);
  });

  it("composes the origin feat and chosen feats into features + featsTaken", () => {
    expect(character.featsTaken).toEqual([
      { name: "Savage Attacker", source: "background", id: "Savage Attacker" },
      { name: "Alert", source: "chosen", id: "Alert" },
    ]);
    expect(character.features.map((f) => f.name)).toEqual(["Savage Attacker", "Alert"]);
    expect(character.features[0].description).toContain("Savage Attacker");
  });
});

describe("characterToDraft", () => {
  it("round-trips a creator-saved character", () => {
    const original = scenarioDraft();
    const restored = characterToDraft(draftToCharacter(original, lookups), lookups, "2014");
    expect(restored.edition).toBe("2024");
    expect(restored.classes).toEqual(original.classes);
    expect(restored.species).toBe("Human");
    expect(restored.background).toBe("Soldier");
    expect(restored.abilityMethod).toBe("manual");
    expect(restored.baseScores).toEqual(original.baseScores);
    expect(restored.feats).toEqual(["Alert"]);
    expect(restored.spells).toEqual(original.spells);
    expect(restored.languages).toEqual(["Elvish"]);
  });

  it("round-trips a both-editions character", () => {
    const original = emptyDraft("both", {
      name: "Blend",
      classes: [{ name: "Barbarian", level: 1, subclass: "", skillChoices: [] }],
      species: "Human",
    });
    const restored = characterToDraft(draftToCharacter(original, lookups), lookups, "2014");
    expect(restored.edition).toBe("both");
    expect(restored.species).toBe("Human");
  });

  it("folds species languages and language picks into character.languages and back", () => {
    const dwarf = {
      name: "Dwarf",
      size: "Medium",
      speed: 25,
      languages: ["Common", "Dwarvish"],
      languageChoice: { options: ["Giant", "Gnomish"], amount: 1 },
      abilityBonuses: [],
      traits: [],
    } as unknown as Race;
    const withDwarf: SrdLookups = { ...lookups, races: [human, dwarf] };
    const original = emptyDraft("2014", {
      name: "Grimnir",
      classes: [{ name: "Barbarian", level: 1, subclass: "", skillChoices: [] }],
      species: "Dwarf",
      languages: ["Elvish"],
      raceLanguageChoices: ["Giant"],
    });
    const character = draftToCharacter(original, withDwarf);
    expect(character.languages).toEqual(["Common", "Dwarvish", "Giant", "Elvish"]);

    const restored = characterToDraft(character, withDwarf, "2014");
    expect(restored.languages).toEqual(["Elvish"]);
    expect(restored.raceLanguageChoices).toEqual(["Giant"]);
  });

  it("applies and round-trips race ability choice picks", () => {
    const halfElf = {
      name: "Half-Elf",
      size: "Medium",
      speed: 30,
      abilityBonuses: [{ stat: 5, value: 2 }],
      abilityBonusChoice: {
        amount: 2,
        choices: [
          { stat: 0, value: 1 },
          { stat: 2, value: 1 },
        ],
      },
      traits: [],
    } as unknown as Race;
    const withHalfElf: SrdLookups = { ...lookups, races: [halfElf] };
    const original = emptyDraft("2014", {
      name: "Sylvie",
      classes: [{ name: "Barbarian", level: 1, subclass: "", skillChoices: [] }],
      species: "Half-Elf",
      abilityMethod: "manual",
      baseScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      raceAbilityChoices: ["str", "con"],
    });
    const character = draftToCharacter(original, withHalfElf);
    expect(character.stats).toEqual({ str: 11, dex: 10, con: 11, int: 10, wis: 10, cha: 12 });

    const restored = characterToDraft(character, withHalfElf, "2014");
    expect(restored.raceAbilityChoices).toEqual(["str", "con"]);
    expect(restored.baseScores).toEqual(original.baseScores);
  });

  it("round-trips the extended standard array method", () => {
    const original = emptyDraft("2024", {
      name: "Extra",
      classes: [{ name: "Barbarian", level: 1, subclass: "", skillChoices: [] }],
      abilityMethod: "extended",
      baseScores: { str: 17, dex: 15, con: 13, int: 12, wis: 10, cha: 8 },
    });
    const restored = characterToDraft(draftToCharacter(original, lookups), lookups, "2014");
    expect(restored.abilityMethod).toBe("extended");
    expect(restored.baseScores).toEqual(original.baseScores);
  });

  it("loads a pre-rebuild character without crashing and with conservative defaults", () => {
    // Shaped like the old mapper's output: no edition/details/builder, hardcoded skill bug included.
    const legacy = {
      name: "Old Timer",
      className: "Barbarian",
      subclass: [],
      background: "Soldier",
      alignment: "",
      levels: [{ class: "Barbarian", subclass: "", level: 1, hitDie: 12, features: [] }],
      spells: [{ name: "Acid Splash", prepared: false }],
      race: { species: "Human", features: [] },
      languages: ["Common", "Elvish"],
      stats: { str: 15, dex: 10, con: 14, int: 8, wis: 12, cha: 10 },
      proficiencies: {
        skills: { Arcana: { stat: "int", value: 10, proficient: true, expertise: true } },
        other: {},
      },
      features: [{ id: "", name: "Savage Attacker", description: "" }],
      items: { inventory: ["Spear"], equipped: [], attuned: [], currency: { platinumPieces: 0, goldPieces: 12, electrumPieces: 0, sliverPieces: 0, copperPieces: 0 } },
    } as unknown as Character;

    const draft = characterToDraft(legacy, lookups, "2014");
    expect(draft.edition).toBe("2014");
    expect(draft.classes).toEqual([{ name: "Barbarian", level: 1, subclass: "", skillChoices: [] }]);
    expect(draft.abilityMethod).toBe("manual");
    expect(draft.baseScores).toEqual(legacy.stats);
    expect(draft.skillOverrides).toEqual({ Arcana: "expertise" });
    // The background's own feat is derived, not treated as a chosen feat.
    expect(draft.feats).toEqual([]);
    expect(draft.languages).toEqual(["Elvish"]);
    expect(draft.items.currency.gp).toBe(12);
  });

  it("falls back to the className CSV when the levels array is broken", () => {
    const broken = {
      name: "CSV",
      className: "Barbarian,Sorcerer",
      subclass: ["", "Draconic Sorcery"],
      levels: [],
      stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    } as unknown as Character;
    const draft = characterToDraft(broken, lookups, "2024");
    expect(draft.classes.map((c) => c.name)).toEqual(["Barbarian", "Sorcerer"]);
    expect(draft.classes[1].subclass).toBe("Draconic Sorcery");
  });
});

describe("hp overrides", () => {
  it("honors manual max/current/temp and persists them in builder.hp", () => {
    const draft = { ...scenarioDraft(), hp: { maxOverride: 40, current: 17, temp: 5 } };
    const character = draftToCharacter(draft, lookups);
    expect(character.health).toEqual({ max: 40, current: 17, temp: 5 });
    expect(character.builder?.hp).toEqual({ maxOverride: 40, current: 17, temp: 5 });

    const restored = characterToDraft(character, lookups, "2014");
    expect(restored.hp).toEqual({ maxOverride: 40, current: 17, temp: 5 });
  });

  it("clears back to auto max and full current when overrides are unset", () => {
    const draft = { ...scenarioDraft(), hp: { temp: 0 } };
    const character = draftToCharacter(draft, lookups);
    expect(character.health).toEqual({ max: 32, current: 32, temp: 0 });
  });

  it("restores only temp for legacy saves without builder.hp", () => {
    const character = draftToCharacter(scenarioDraft(), lookups);
    delete character.builder!.hp;
    character.health = { max: 99, current: 3, temp: 7 };
    const restored = characterToDraft(character, lookups, "2014");
    expect(restored.hp).toEqual({ temp: 7 });
  });
});

describe("id write-through", () => {
  const barbarianWithId = { ...barbarian, id: "class-barb" } as Class5E;
  const humanWithId = { ...human, id: "race-human" } as Race;
  const soldierWithId = { ...soldier, id: "bg-soldier" } as Background;
  const draconic = {
    id: "sub-draconic",
    name: "Draconic Sorcery",
    parentClass: "Sorcerer",
    description: "",
    features: { 3: [{ id: "affinity", name: "Draconic Resilience", description: "" }] },
  } as unknown as Subclass;
  const idLookups: SrdLookups = {
    ...lookups,
    classes: [barbarianWithId, sorcerer],
    subclasses: [draconic],
    races: [humanWithId],
    backgrounds: [soldierWithId],
    spells: [{ id: "spell-acid", name: "Acid Splash" } as unknown as Spell],
  };

  const idDraft = () => ({
    ...scenarioDraft(),
    characterId: "char-1",
    classes: [
      { name: "Barbarian", classId: "class-barb", level: 1, subclass: "", skillChoices: ["Perception"] },
      { name: "Sorcerer", level: 3, subclass: "Draconic Sorcery", subclassId: "sub-draconic", skillChoices: [] },
    ],
    speciesId: "race-human",
    backgroundId: "bg-soldier",
  });

  it("stamps entity ids onto the saved character", () => {
    const character = draftToCharacter(idDraft(), idLookups);
    expect(character.id).toBe("char-1");
    expect(character.levels[0].classId).toBe("class-barb");
    expect(character.levels[3].subclassId).toBe("sub-draconic");
    expect(character.race.speciesId).toBe("race-human");
    expect(character.backgroundId).toBe("bg-soldier");
    expect(character.spells[0]).toEqual({ name: "Acid Splash", prepared: false, id: "spell-acid" });
  });

  it("bakes chosen-subclass features into the level rows", () => {
    const character = draftToCharacter(idDraft(), idLookups);
    // Sorcerer class level 3 = overall row index 3 (Barb 1 + Sorc 3).
    expect(character.levels[3].features.map((f) => f.name)).toEqual([
      "Sorcerer Subclass",
      "Draconic Resilience",
    ]);
  });

  it("round-trips ids through characterToDraft, grouping levels by classId", () => {
    const character = draftToCharacter(idDraft(), idLookups);
    const restored = characterToDraft(character, idLookups, "2014");
    expect(restored.characterId).toBe("char-1");
    expect(restored.classes).toEqual(idDraft().classes);
    expect(restored.speciesId).toBe("race-human");
    expect(restored.backgroundId).toBe("bg-soldier");
    expect(restored.spells).toEqual(["Acid Splash", "Blade Ward"]);
  });

  it("resolves stored ids over names when they disagree (renamed entity)", () => {
    const character = draftToCharacter(idDraft(), idLookups);
    character.race.species = "Old Human Name";
    const restored = characterToDraft(character, idLookups, "2014");
    expect(restored.species).toBe("Human");
  });
});

describe("background features", () => {
  // A background whose OWN feature carries a Character-type mad (a mads source like race.features),
  // distinct from its recommended feat.
  const guildArtisan = {
    name: "Guild Artisan",
    proficiencies: { skills: ["Insight", "Persuasion"], tools: [], weapons: [], armor: [] },
    abilityOptions: ["Strength", "Dexterity", "Constitution"],
    feat: "Alert",
    features: [
      {
        id: "guild-membership",
        name: "Guild Membership",
        description: "",
        metadata: {
          mads: [
            { command: "AddLanguages", value: { language: "Guild Cant" }, type: MadType.Character, group: 0 },
          ],
        },
      },
    ],
  } as unknown as Background;
  const bgLookups: SrdLookups = { ...lookups, backgrounds: [soldier, guildArtisan] };

  const guildDraft = () =>
    emptyDraft("2024", {
      name: "Artisan",
      classes: [{ name: "Barbarian", level: 1, subclass: "", skillChoices: [] }],
      species: "Human",
      background: "Guild Artisan",
      abilityMethod: "manual",
      baseScores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
    });

  it("carries the background's own features as raw backgroundFeatures, not as feats", () => {
    const character = draftToCharacter(guildDraft(), bgLookups);
    expect(character.backgroundFeatures?.map((f) => f.name)).toContain("Guild Membership");
    expect(character.features.map((f) => f.name)).not.toContain("Guild Membership");
  });

  it("leaves backgroundFeatures undefined for a background with no features", () => {
    const character = draftToCharacter(scenarioDraft(), lookups);
    expect(character.backgroundFeatures).toBeUndefined();
  });

  it("re-derives backgroundFeatures from the catalog on a load/save round-trip", () => {
    const saved = draftToCharacter(guildDraft(), bgLookups);
    const restored = characterToDraft(saved, bgLookups, "2014");
    const resaved = draftToCharacter(restored, bgLookups);
    expect(resaved.backgroundFeatures?.map((f) => f.name)).toContain("Guild Membership");
  });
});

describe("mad choice keying", () => {
  // A class feature bearing a choice-form Proficiencies mad — draftMadChoices must key its
  // class-source choice by the owning class's selector key (draftClassKey), i.e. its classId.
  const rogue = {
    id: "class-rogue",
    name: "Rogue",
    hitDie: "d8",
    savingThrows: ["Dexterity", "Intelligence"],
    features: {
      1: [
        {
          id: "expertise",
          name: "Expertise",
          description: "",
          metadata: {
            mads: [
              {
                command: "AddProficiencies",
                value: { proficiency: "choice", options: "Stealth,Acrobatics,Perception", count: "2" },
                type: MadType.Character,
                group: 0,
              },
            ],
          },
        },
      ],
    },
  } as unknown as Class5E;
  const rogueLookups: SrdLookups = { ...lookups, classes: [rogue] };

  const rogueDraft = () =>
    emptyDraft("2024", {
      name: "Sneak",
      classes: [{ name: "Rogue", classId: "class-rogue", level: 1, subclass: "", skillChoices: [] }],
      species: "Human",
      background: "Soldier",
      abilityMethod: "manual",
      baseScores: { str: 10, dex: 16, con: 12, int: 14, wis: 10, cha: 8 },
    });

  it("keys class-source choices by draftClassKey (the entry's classId)", () => {
    const entry = rogueDraft().classes[0];
    const character = draftToCharacter(rogueDraft(), rogueLookups);
    const classChoices = draftMadChoices(character).filter((c) => c.source === "class");
    expect(classChoices.length).toBeGreaterThan(0);
    expect(classChoices.every((c) => c.sourceKey === draftClassKey(entry))).toBe(true);
    expect(draftClassKey(entry)).toBe("class-rogue");
  });
});
