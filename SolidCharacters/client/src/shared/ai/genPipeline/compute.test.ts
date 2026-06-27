import { describe, it, expect } from "vitest";
import {
    abilityMods, buildSlotTable, computeAC, computeHP, getAbilityModifier, getProficiencyBonus,
    parseCasterType, parseHitDie, passivePerception, spellAttackBonus, spellSaveDC,
} from "./compute";
import { CasterType } from "../../../models/generated";

describe("computeAC", () => {
    it("unarmored = 10 + Dex (+2 with a shield)", () => {
        expect(computeAC(2)).toBe(12);
        expect(computeAC(2, { category: "none" }, true)).toBe(14);
        expect(computeAC(-1)).toBe(9);
    });
    it("light armor adds full Dex", () => {
        expect(computeAC(3, { category: "light", baseAc: 11 })).toBe(14);   // studded-ish
    });
    it("medium armor caps Dex at +2", () => {
        expect(computeAC(4, { category: "medium", baseAc: 15 })).toBe(17);  // half plate, Dex over cap
        expect(computeAC(1, { category: "medium", baseAc: 12 })).toBe(13);  // hide, Dex under cap
    });
    it("heavy armor ignores Dex; shield still stacks", () => {
        expect(computeAC(3, { category: "heavy", baseAc: 16 })).toBe(16);   // chain mail
        expect(computeAC(3, { category: "heavy", baseAc: 16 }, true)).toBe(18);
    });
});

describe("parseHitDie", () => {
    it.each([
        ["d10", 10], ["D8", 8], ["d12", 12], ["6", 6], [12, 12], ["d20", 20], ["", 0], ["fast", 0],
    ])("%s → %i", (input, expected) => {
        expect(parseHitDie(input)).toBe(expected);
    });
});

describe("computeHP", () => {
    it("level 1 is the max die plus Con", () => {
        expect(computeHP(1, 12, 3)).toBe(15);   // Barbarian d12, Con +3
        expect(computeHP(1, 6, 0)).toBe(6);      // Wizard d6
    });
    it("later levels add the fixed average + Con", () => {
        expect(computeHP(5, 10, 2)).toBe(44);    // Fighter d10 L5 Con +2: 12 + 8*4
        expect(computeHP(3, 8, 1)).toBe(21);     // d8 L3 Con +1: (8+1) + (5+1)*2
    });
    it("guarantees at least 1 HP per level even with a big Con penalty", () => {
        expect(computeHP(3, 6, -5)).toBe(3);     // 1 + 1 + 1
    });
});

describe("spell derived stats", () => {
    it("save DC = 8 + PB + mod; attack = PB + mod", () => {
        expect(spellSaveDC(3, 4)).toBe(15);
        expect(spellAttackBonus(3, 4)).toBe(7);
    });
    it("passive perception = 10 + Wis (+PB when proficient)", () => {
        expect(passivePerception(2)).toBe(12);
        expect(passivePerception(2, 3, true)).toBe(15);
        expect(passivePerception(2, 3, false)).toBe(12);
    });
});

describe("abilityMods", () => {
    it("computes all six, defaulting missing scores to 10 (+0)", () => {
        expect(abilityMods({ str: 16, con: 15 })).toEqual({ str: 3, dex: 0, con: 2, int: 0, wis: 0, cha: 0 });
    });
});

describe("re-exported primitives", () => {
    it("dndMath helpers come through unchanged", () => {
        expect(getAbilityModifier(10)).toBe(0);
        expect(getAbilityModifier(18)).toBe(4);
        expect(getProficiencyBonus(1)).toBe(2);
        expect(getProficiencyBonus(20)).toBe(6);
    });
    it("caster helpers come through unchanged", () => {
        expect(parseCasterType("full")).toBe(CasterType.Full);
        expect(parseCasterType("bogus")).toBe(CasterType.None);
        expect(buildSlotTable(CasterType.Full)[1]).toEqual({ spellSlotsLevel1: 2 });
    });
});
