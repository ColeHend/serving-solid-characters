import { describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { FeatureDetail, MadFeature, MadType, MagicItem } from "../../../../models/generated";

// Same import-time mocks as the mads suites — keep the test off IndexedDB/network.
vi.mock("../../../../shared/customHooks/dndInfo/useDndFeatures", () => ({
  useDndFeature: () => ({ allFeatures: () => [] }),
}));
vi.mock("../../../../shared/customHooks/dndInfo/info/all/feats", () => ({
  useDnDFeats: () => () => [],
}));

import { statChoiceKey } from "../../../../shared/customHooks/mads/useMadCharacters";
import { SrdLookups, draftToCharacter } from "../state/draftMapper";
import { CharacterDraft, emptyDraft } from "../state/types";
import { applyCreatorMads, draftMadChoices } from "./applyMads";

/** Drive the creator's own mapping + mads path with the GENERATED server SRD JSON. */
const DATA = path.resolve(__dirname, "../../../../../../../SolidCharacters.Repository/data/srd");
const read = (rel: string) => JSON.parse(fs.readFileSync(path.join(DATA, rel), "utf8"));

const classes = read("2014/classes.json");
const races = read("2014/races.json");
const barbarian = classes.find((c: { name: string }) => c.name === "Barbarian");
const dwarf = races.find((r: { name: string }) => r.name === "Dwarf");

const lookups: SrdLookups = {
  classes: [barbarian],
  subclasses: [],
  races: [dwarf],
  subraces: [],
  backgrounds: [],
  feats: [],
  spells: [],
};

const dwarfBarbarian = (level: number, overrides?: Partial<CharacterDraft>): CharacterDraft =>
  emptyDraft("2014", {
    name: "Grimnir",
    classes: [{ name: "Barbarian", level, subclass: "", skillChoices: [] }],
    species: "Dwarf",
    abilityMethod: "manual",
    // str 16 / dex 14 / con 12 — Dwarf +2 CON makes final con 14.
    baseScores: { str: 16, dex: 14, con: 12, int: 8, wis: 12, cha: 10 },
    ...overrides,
  });

describe("applyCreatorMads on the creator's mapped character", () => {
  it("treats Unarmored Defense as a base-AC formula, not an additive bonus", () => {
    const character = draftToCharacter(dwarfBarbarian(1), lookups);
    expect(character.ArmorClass).toBe(12); // mapper baseline 10 + DEX
    const applied = applyCreatorMads(character);
    // 10 + dex(2) + con(2) — NOT 12 + 14.
    expect(applied.ArmorClass).toBe(14);
  });

  it("applies Dwarf senses and resistances and Fast Movement on top of race speed", () => {
    const applied = applyCreatorMads(draftToCharacter(dwarfBarbarian(5), lookups));
    expect(applied.senses?.darkvision).toBe(60);
    expect(applied.resistances.map((r) => r.type)).toContain("Poison");
    expect(applied.Speed).toBe(35); // Dwarf 25 + Fast Movement 10
  });

  it("does not mutate the mapped character it is given", () => {
    const character = draftToCharacter(dwarfBarbarian(5), lookups);
    applyCreatorMads(character);
    expect(character.ArmorClass).toBe(12);
    expect(character.Speed).toBe(25);
  });

  it("holds a choice-form ASI pending until BOTH picks, then applies the draft's picks", () => {
    const before = draftToCharacter(dwarfBarbarian(4), lookups);
    const pending = draftMadChoices(before).filter((choice) => choice.pending);
    expect(pending.some((choice) => choice.kind === "stat")).toBe(true);
    expect(applyCreatorMads(before).stats.con).toBe(14);

    const asi = before.levels[3].features.find((f: FeatureDetail) =>
      f.name.startsWith("Ability Score"))!;

    // one of two picks → still pending, nothing applies
    const half = draftToCharacter(dwarfBarbarian(4, {
      madChoices: { stats: { [statChoiceKey(asi)]: "con" }, proficiencies: {}, spells: {}, items: {} },
    }), lookups);
    expect(draftMadChoices(half).filter((c) => c.pending && c.kind === "stat")).toHaveLength(1);
    expect(applyCreatorMads(half).stats.con).toBe(14);

    // both picks → +1 to each distinct ability
    const picked = dwarfBarbarian(4, {
      madChoices: { stats: { [statChoiceKey(asi)]: "con,str" }, proficiencies: {}, spells: {}, items: {} },
    });
    const character = draftToCharacter(picked, lookups);
    expect(draftMadChoices(character).filter((c) => c.pending && c.kind === "stat")).toHaveLength(0);
    const applied = applyCreatorMads(character);
    expect(applied.stats.con).toBe(15);
    expect(applied.stats.str).toBe(17);
  });

  it("tags each choice with its source so sections can filter their own", () => {
    const character = draftToCharacter(dwarfBarbarian(4), lookups);
    const choices = draftMadChoices(character);
    expect(choices.length).toBeGreaterThan(0);

    const classChoices = choices.filter((c) => c.source === "class");
    expect(classChoices.some((c) => c.kind === "stat")).toBe(true); // the level-4 ASI
    // The draft entry carries no classId, so the key falls back to hb:<name> —
    // exactly what draftClassKey derives for the same entry in the class card.
    expect(new Set(classChoices.map((c) => c.sourceKey))).toEqual(new Set(["hb:Barbarian"]));

    // Dwarf trait commands (Darkvision, resistances, tool proficiency choice) tag as race.
    expect(choices.filter((c) => c.source === "race").every((c) => c.sourceKey === undefined)).toBe(true);
    expect(choices.every((c) => ["class", "race", "background", "feat"].includes(c.source))).toBe(true);
  });

  it("tags a choice-form mad on a background feature as source 'background'", () => {
    const bgChoice: FeatureDetail = {
      id: "bg-asi",
      name: "Prodigy",
      description: "",
      metadata: {
        mads: [{ command: "AddStats", value: { stat: "choice", options: "str,dex", statValue: "1" }, type: MadType.Character, prerequisites: [], group: 0 }],
      },
    };
    const character = draftToCharacter(dwarfBarbarian(1), lookups);
    character.backgroundFeatures = [bgChoice];

    const background = draftMadChoices(character).filter((c) => c.source === "background");
    expect(background).toHaveLength(1);
    expect(background[0]).toMatchObject({ kind: "stat", pending: true, sourceKey: undefined });
  });
});

describe("magic item mads", () => {
  /** Minimal MagicItem — collectMagicItemMads only reads name, properties.attunement, metadata.mads. */
  const magicItem = (name: string, attunement: string | undefined, mads: MadFeature[]): MagicItem => ({
    id: name,
    name,
    desc: "",
    rarity: "rare",
    cost: "",
    category: "Wondrous Item",
    weight: "",
    properties: { attunement },
    metadata: { mads },
  });

  const headband = magicItem("Headband of Intellect", "requires attunement", [
    { command: "AddStats", value: { stat: "int", statValue: "19", mode: "set" }, type: MadType.Character, prerequisites: [], group: 0 },
  ]);
  const ringOfProtection = magicItem("Ring of Protection", undefined, [
    { command: "AddArmorClass", value: { bonus: "1" }, type: MadType.Character, prerequisites: [], group: 0 },
  ]);

  // A feat feature that grants +2 INT — base INT 8 (Dwarf adds none) becomes 10 before any item mad.
  const withIntFeat = () => {
    const character = draftToCharacter(dwarfBarbarian(1), lookups);
    character.features = [{
      id: "feat-int",
      name: "Keen Mind",
      description: "",
      metadata: { mads: [{ command: "AddStats", value: { stat: "int", statValue: "2" }, type: MadType.Character, prerequisites: [], group: 0 }] },
    }];
    return character;
  };

  it("baseline: the feat's +2 INT applies with no items", () => {
    expect(applyCreatorMads(withIntFeat()).stats.int).toBe(10);
  });

  it("an attuned Headband of Intellect's mode:set wins over the feat's +2 (item mads run last)", () => {
    const character = withIntFeat();
    character.items.attuned = ["Headband of Intellect"];
    expect(applyCreatorMads(character, [headband]).stats.int).toBe(19);
  });

  it("the same item only equipped (not attuned) leaves INT unchanged", () => {
    const character = withIntFeat();
    character.items.equipped = ["Headband of Intellect"];
    expect(applyCreatorMads(character, [headband]).stats.int).toBe(10);
  });

  it("a flat-AC item without attunement adds its bonus while equipped", () => {
    const baseline = applyCreatorMads(draftToCharacter(dwarfBarbarian(1), lookups));
    expect(baseline.ArmorClass).toBe(14); // 10 + dex(2) + con(2), Unarmored Defense

    const character = draftToCharacter(dwarfBarbarian(1), lookups);
    character.items.equipped = ["Ring of Protection"];
    expect(applyCreatorMads(character, [ringOfProtection]).ArmorClass).toBe(15);
  });

  it("without the magic-items argument item mads are simply absent", () => {
    const character = withIntFeat();
    character.items.attuned = ["Headband of Intellect"];
    expect(applyCreatorMads(character).stats.int).toBe(10);
  });
});

describe("draftMadChoices — new choice kinds and branch groups", () => {
  const madOf = (command: string, value: Record<string, string>, group = 0): MadFeature =>
    ({ command, value, type: MadType.Character, prerequisites: [], group }) as MadFeature;

  const raceCharacter = (feature: FeatureDetail, proficiencyChoices: Record<string, string> = {}) =>
    ({
      levels: [],
      race: { species: "Test", features: [feature] },
      backgroundFeatures: [],
      features: [],
      proficiencyChoices,
      statChoices: {},
      spellChoices: {},
      itemChoices: {},
      spells: [],
    }) as unknown as Parameters<typeof draftMadChoices>[0];

  it("emits expertise, resistance and language choices with live pending state", () => {
    const feature = {
      id: "f-1",
      name: "Deft Scholar",
      metadata: { mads: [
        madOf("AddExpertise", { proficiency: "choice", options: "Arcana,History", count: "1" }),
        madOf("AddResistances", { damageType: "choice", options: "Fire,Cold", count: "1" }),
        madOf("AddLanguages", { name: "choice", options: "Elvish,Giant", count: "2" }),
      ] },
    } as FeatureDetail;

    const pendingChoices = draftMadChoices(raceCharacter(feature));
    expect(pendingChoices.map((c) => c.kind).sort()).toEqual(["expertise", "language", "resistance"]);
    expect(pendingChoices.every((c) => c.pending && c.source === "race")).toBe(true);

    const done = draftMadChoices(raceCharacter(feature, {
      "f-1::expertise": "Arcana",
      "f-1::resistance": "Fire",
      "f-1::languages": "Elvish,Giant",
    }));
    expect(done.every((c) => !c.pending)).toBe(true);
  });

  it("emits a filter-form spell choice as pending, then grants the picks once complete", () => {
    const feature = {
      id: "f-3",
      name: "Wizardly Dabbler",
      metadata: { mads: [
        madOf("AddSpells", { ID: "choice", filterClass: "Wizard", filterLevel: "0", count: "2", spellLevel: "0" }),
      ] },
    } as FeatureDetail;

    const unpicked = raceCharacter(feature);
    const pendingChoices = draftMadChoices(unpicked);
    expect(pendingChoices.map((c) => c.kind)).toEqual(["spell"]);
    expect(pendingChoices[0].pending).toBe(true);
    expect(applyCreatorMads(unpicked).spells).toEqual([]);

    const picked = raceCharacter(feature);
    (picked as unknown as { spellChoices: Record<string, string> }).spellChoices = { "f-3::0": "sp-a,sp-b" };
    expect(draftMadChoices(picked).every((c) => !c.pending)).toBe(true);
    expect(applyCreatorMads(picked).spells.map((s) => s.name).sort()).toEqual(["sp-a", "sp-b"]);
  });

  it("emits one group choice per branched feature and keeps dormant-branch sub-choices hidden", () => {
    const feature = {
      id: "f-2",
      name: "Divine Order",
      metadata: { mads: [
        madOf("AddWeaponProficiencies", { weapon: "Martial Weapons", groupLabel: "Protector" }, 1),
        madOf("AddSpells", { ID: "choice", options: "sp-1,sp-2", count: "1", spellLevel: "0", groupLabel: "Thaumaturge" }, 2),
      ] },
    } as FeatureDetail;

    const unpicked = draftMadChoices(raceCharacter(feature));
    expect(unpicked).toHaveLength(1);
    expect(unpicked[0].kind).toBe("group");
    expect(unpicked[0].pending).toBe(true);

    // Thaumaturge picked → the group choice resolves and the nested spell picker surfaces.
    const picked = draftMadChoices(raceCharacter(feature, { "f-2::group": "2" }));
    expect(picked.map((c) => c.kind).sort()).toEqual(["group", "spell"]);
    expect(picked.find((c) => c.kind === "group")?.pending).toBe(false);
    expect(picked.find((c) => c.kind === "spell")?.pending).toBe(true);
  });
});
