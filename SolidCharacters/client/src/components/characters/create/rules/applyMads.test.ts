import { describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { FeatureDetail } from "../../../../models/generated";

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

  it("holds a choice-form ASI pending, then applies the draft's pick", () => {
    const before = draftToCharacter(dwarfBarbarian(4), lookups);
    const pending = draftMadChoices(before).filter((choice) => choice.pending);
    expect(pending.some((choice) => choice.kind === "stat")).toBe(true);
    expect(applyCreatorMads(before).stats.con).toBe(14);

    const asi = before.levels[3].features.find((f: FeatureDetail) =>
      f.name.startsWith("Ability Score"))!;
    const picked = dwarfBarbarian(4, {
      madChoices: { stats: { [statChoiceKey(asi)]: "con" }, proficiencies: {}, spells: {} },
    });
    const character = draftToCharacter(picked, lookups);
    expect(draftMadChoices(character).filter((c) => c.pending && c.kind === "stat")).toHaveLength(0);
    expect(applyCreatorMads(character).stats.con).toBe(16);
  });
});
