import { describe, it, expect } from "vitest";
import { Spell } from "../../../models/generated";
import {
    filterSelectionsFromValue,
    filterSpellsForChoice,
    hasDerivedSpellPool,
    hasSpellFilterValue,
    serializeSpellFilter,
} from "./spellChoiceFilters";

const makeSpell = (overrides: Partial<Spell>): Spell => ({
    id: "sp-x",
    name: "Spell X",
    description: "",
    duration: "Instantaneous",
    concentration: false,
    components: "V,S",
    level: "0",
    range: "60 feet",
    ritual: false,
    school: "Evocation",
    castingTime: "1 action",
    damageType: "",
    page: "",
    isMaterial: false,
    isSomatic: true,
    isVerbal: true,
    classes: [],
    subClasses: [],
    ...overrides,
});

const spells: Spell[] = [
    makeSpell({ id: "fire-bolt", name: "Fire Bolt", level: "0", school: "Evocation", classes: ["Sorcerer", "Wizard"], damageType: "Fire" }),
    makeSpell({ id: "guidance", name: "Guidance", level: "0", school: "Divination", classes: ["Cleric", "Druid"], concentration: true }),
    makeSpell({ id: "magic-missile", name: "Magic Missile", level: "1", school: "Evocation", classes: ["Sorcerer", "Wizard"], damageType: "Force" }),
    makeSpell({ id: "cure-wounds", name: "Cure Wounds", level: "1", school: "Abjuration", classes: ["Cleric", "Druid", "Paladin"] }),
    makeSpell({ id: "detect-magic", name: "Detect Magic", level: "1", school: "Divination", classes: ["Wizard", "Cleric"], ritual: true, concentration: true }),
];

const ids = (result: Spell[]) => result.map((s) => s.id).sort();

describe("hasSpellFilterValue", () => {
    it("is false for undefined, empty, and non-filter values", () => {
        expect(hasSpellFilterValue(undefined)).toBe(false);
        expect(hasSpellFilterValue({})).toBe(false);
        expect(hasSpellFilterValue({ ID: "choice", options: "a,b", count: "1" })).toBe(false);
        expect(hasSpellFilterValue({ filterClass: "  " })).toBe(false);
    });

    it("is true when any filter field is non-empty", () => {
        expect(hasSpellFilterValue({ filterClass: "Wizard" })).toBe(true);
        expect(hasSpellFilterValue({ filterRitual: "true" })).toBe(true);
    });
});

describe("hasDerivedSpellPool", () => {
    it("is true for any filter field", () => {
        expect(hasDerivedSpellPool({ filterSchool: "Evocation" })).toBe(true);
        expect(hasDerivedSpellPool({ filterLevel: "1", options: "a,b" })).toBe(true);
    });

    it("is true for a bare spellLevel with no options (including cantrips)", () => {
        expect(hasDerivedSpellPool({ ID: "choice", count: "1", spellLevel: "1" })).toBe(true);
        expect(hasDerivedSpellPool({ ID: "choice", count: "2", spellLevel: "0" })).toBe(true);
    });

    it("is false for options-only values, whatever spellLevel says", () => {
        expect(hasDerivedSpellPool({ ID: "choice", options: "a,b", spellLevel: "1" })).toBe(false);
        expect(hasDerivedSpellPool({ ID: "choice", options: "a,b" })).toBe(false);
        expect(hasDerivedSpellPool({})).toBe(false);
        expect(hasDerivedSpellPool(undefined)).toBe(false);
    });

    it("treats whitespace-only options as absent", () => {
        expect(hasDerivedSpellPool({ ID: "choice", spellLevel: "1", options: "   " })).toBe(true);
    });
});

describe("filterSpellsForChoice", () => {
    it("returns [] when the value has no filter fields", () => {
        expect(filterSpellsForChoice(spells, undefined)).toEqual([]);
        expect(filterSpellsForChoice(spells, { ID: "choice", options: "fire-bolt" })).toEqual([]);
    });

    it("options-only pools stay options-only even with a spellLevel (SRD Magic Initiate shape)", () => {
        expect(filterSpellsForChoice(spells, { ID: "choice", options: "fire-bolt,guidance", count: "2", spellLevel: "0" }))
            .toEqual([]);
    });

    it("a bare spellLevel with no options means any spell of that level", () => {
        expect(ids(filterSpellsForChoice(spells, { ID: "choice", count: "1", spellLevel: "1" })))
            .toEqual(["cure-wounds", "detect-magic", "magic-missile"]);
        expect(ids(filterSpellsForChoice(spells, { ID: "choice", count: "2", spellLevel: "0" })))
            .toEqual(["fire-bolt", "guidance"]);
    });

    it("spellLevel further restricts filter matches when filterLevel is absent", () => {
        expect(ids(filterSpellsForChoice(spells, { filterSchool: "Divination", spellLevel: "1" })))
            .toEqual(["detect-magic"]);
        // The cantrip level "0" must restrict too — a falsy-number regression would skip it.
        expect(ids(filterSpellsForChoice(spells, { filterSchool: "Divination", spellLevel: "0" })))
            .toEqual(["guidance"]);
        // Even alongside explicit options — those union back in at pick time untouched.
        expect(ids(filterSpellsForChoice(spells, { filterSchool: "Divination", spellLevel: "1", options: "fire-bolt" })))
            .toEqual(["detect-magic"]);
    });

    it("an explicit filterLevel wins over spellLevel", () => {
        expect(ids(filterSpellsForChoice(spells, { filterSchool: "Divination", filterLevel: "0", spellLevel: "1" })))
            .toEqual(["guidance"]);
    });

    it("ANDs across fields (class + level)", () => {
        const result = filterSpellsForChoice(spells, { filterClass: "Wizard", filterLevel: "0" });
        expect(ids(result)).toEqual(["fire-bolt"]);
    });

    it("ORs within a field (two classes)", () => {
        const result = filterSpellsForChoice(spells, { filterClass: "Paladin,Druid", filterLevel: "1" });
        expect(ids(result)).toEqual(["cure-wounds"]);
    });

    it("matches membership in the multi-valued classes array", () => {
        const result = filterSpellsForChoice(spells, { filterClass: "Cleric" });
        expect(ids(result)).toEqual(["cure-wounds", "detect-magic", "guidance"]);
    });

    it("matches booleans stored as CSV of true/false", () => {
        expect(ids(filterSpellsForChoice(spells, { filterRitual: "true" }))).toEqual(["detect-magic"]);
        expect(ids(filterSpellsForChoice(spells, { filterConcentration: "true", filterLevel: "0" })))
            .toEqual(["guidance"]);
    });

    it("filters on school, casting time and damage type", () => {
        expect(ids(filterSpellsForChoice(spells, { filterSchool: "Divination" })))
            .toEqual(["detect-magic", "guidance"]);
        expect(ids(filterSpellsForChoice(spells, { filterDamageType: "Fire,Force" })))
            .toEqual(["fire-bolt", "magic-missile"]);
    });

    it("trims CSV whitespace", () => {
        const result = filterSpellsForChoice(spells, { filterClass: " Wizard , Paladin " });
        expect(ids(result)).toEqual(["cure-wounds", "detect-magic", "fire-bolt", "magic-missile"]);
    });
});

describe("serializeSpellFilter / filterSelectionsFromValue round-trip", () => {
    it("serializes selections to filter value keys, omitting empty fields", () => {
        expect(serializeSpellFilter({
            classes: ["Wizard", "Cleric"],
            level: ["0"],
            school: [],
            concentration: ["true"],
        })).toEqual({
            filterClass: "Wizard,Cleric",
            filterLevel: "0",
            filterConcentration: "true",
        });
    });

    it("round-trips through mad.value and back", () => {
        const selections = { classes: ["Wizard"], level: ["0", "1"], ritual: ["false"] };
        expect(filterSelectionsFromValue(serializeSpellFilter(selections))).toEqual(selections);
    });

    it("ignores non-filter keys when reading a stored value", () => {
        expect(filterSelectionsFromValue({ ID: "choice", options: "a,b", count: "2", filterSchool: "Evocation" }))
            .toEqual({ school: ["Evocation"] });
    });
});
