import { describe, it, expect } from "vitest";
import {
    maxAccessibleSpellLevel, validateAbilityMods, validateAbilityScores, validateFeatureLevels,
    validateNoDuplicateFeatures, validateSavingThrowCount, validateSkillCount, validateSpellLevels,
} from "./validate";
import type { WorkingFeature } from "./types";

const feat = (name: string, level: number): WorkingFeature => ({ name, level, description: "x" });

describe("validateAbilityScores", () => {
    it("passes sane scores, flags out-of-range", () => {
        expect(validateAbilityScores({ str: 16, dex: 8 })).toEqual([]);
        expect(validateAbilityScores({ str: 0 })).toHaveLength(1);
        expect(validateAbilityScores({ cha: 31 })).toHaveLength(1);
    });
});

describe("validateAbilityMods", () => {
    it("accepts modifiers that match the scores and rejects ones that don't", () => {
        expect(validateAbilityMods({ str: 16, con: 15 }, { str: 3, con: 2 })).toEqual([]);
        const errs = validateAbilityMods({ str: 16 }, { str: 4 });
        expect(errs).toHaveLength(1);
        expect(errs[0]).toContain("STR");
    });
});

describe("count gates", () => {
    it("validates saving-throw count (dedups case-insensitively)", () => {
        expect(validateSavingThrowCount(["STR", "Con"], 2)).toEqual([]);
        expect(validateSavingThrowCount(["str", "str"], 2)).toHaveLength(1);
        expect(validateSavingThrowCount(["str"], 2)).toHaveLength(1);
    });
    it("validates skill count", () => {
        expect(validateSkillCount(["Athletics", "Stealth"], 2)).toEqual([]);
        expect(validateSkillCount(["Athletics"], 2)).toHaveLength(1);
    });
});

describe("feature gates", () => {
    it("flags features outside the level range", () => {
        expect(validateFeatureLevels([feat("Rage", 1), feat("Capstone", 20)])).toEqual([]);
        expect(validateFeatureLevels([feat("Too High", 21)])).toHaveLength(1);
        expect(validateFeatureLevels([feat("Zero", 0)])).toHaveLength(1);
    });
    it("flags duplicate feature names", () => {
        expect(validateNoDuplicateFeatures([feat("Rage", 1), feat("Reckless", 2)])).toEqual([]);
        expect(validateNoDuplicateFeatures([feat("Rage", 1), feat("rage", 6)])).toHaveLength(1);
    });
});

describe("maxAccessibleSpellLevel", () => {
    it.each([
        ["full", 1, 1], ["full", 5, 3], ["full", 9, 5], ["full", 20, 9],
        ["half", 1, 0], ["half", 2, 1], ["half", 5, 2], ["half", 17, 5],
        ["third", 2, 0], ["third", 3, 1], ["third", 7, 2],
        ["pact", 1, 1], ["pact", 5, 3], ["pact", 11, 5],
        ["none", 20, 0],
    ] as const)("%s caster at level %i reaches spell level %i", (caster, level, expected) => {
        expect(maxAccessibleSpellLevel(caster, level)).toBe(expected);
    });
});

describe("validateSpellLevels", () => {
    it("allows reachable spells and cantrips, flags out-of-reach ones", () => {
        const spells = [
            { name: "Fire Bolt", level: 0 },
            { name: "Fireball", level: 3 },
            { name: "Meteor Swarm", level: 9 },
        ];
        // full caster, level 5: can reach level 3, not 9
        const errs = validateSpellLevels(spells, "full", 5);
        expect(errs).toHaveLength(1);
        expect(errs[0]).toContain("Meteor Swarm");
    });
    it("calls out a non-caster that lists a leveled spell", () => {
        const errs = validateSpellLevels([{ name: "Bless", level: 1 }], "none", 5);
        expect(errs).toHaveLength(1);
        expect(errs[0]).toContain("no spell slots");
    });
});
