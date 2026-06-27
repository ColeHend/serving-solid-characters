import { describe, it, expect } from "vitest";
import { computeCharacterStats } from "./compute";
import { assembleCharacter } from "./assembleCharacter";
import type { WorkingCharacter } from "./types";

/**
 * Phase 7 compute + assemble (plan §14): the derived stats are pure functions of the rolled scores, level,
 * hit die, and gear — verified against hand-computed D&D values — and the assembler maps a finished working
 * object onto the persisted `Character` (level rows, skill/save proficiencies, feature placement, fallbacks).
 */

const baseWorking = (): WorkingCharacter => ({
    name: "Varra Stoneheart",
    className: "Barbarian", lineage: "Goliath", level: 5, background: "Soldier", hitDie: "d12",
    abilityPriority: ["str", "con", "dex", "wis", "cha", "int"],
    abilityScores: { str: 16, con: 15, dex: 13, wis: 12, cha: 10, int: 8 },
    skills: ["Athletics", "Perception"],
    savingThrows: ["str", "con"],
    casterType: "none",
    features: [{ name: "Rage", level: 1, description: "Bonus action rage." }, { name: "Brutal Critical", level: 5, description: "Extra die on a crit." }],
    armor: { category: "medium", name: "Half plate" },
    shield: true,
    equipment: ["Half plate", "Shield", "Greataxe"],
});

describe("computeCharacterStats", () => {
    it("derives prof bonus, HP, AC, initiative, and passive perception from the build", () => {
        const d = computeCharacterStats(baseWorking());
        expect(d.proficiencyBonus).toBe(3);                 // level 5 → ⌈5/4⌉+1
        expect(d.hp).toBe(50);                               // d12 + CON(+2) at L1, then 4 × (avg 7 + 2)
        expect(d.ac).toBe(15);                               // medium base 12 + min(Dex +1, 2) + shield 2
        expect(d.initiative).toBe(1);                        // Dex modifier
        expect(d.passivePerception).toBe(14);               // 10 + Wis(+1) + prof 3 (proficient in Perception)
        expect(d.spellSaveDC).toBeUndefined();               // not a caster
    });

    it("computes spell save DC and attack for a caster off the strongest mental stat", () => {
        const wiz: WorkingCharacter = { ...baseWorking(), className: "Wizard", hitDie: "d6", casterType: "full", abilityScores: { str: 8, con: 14, dex: 14, wis: 12, cha: 10, int: 16 } };
        const d = computeCharacterStats(wiz);
        expect(d.spellSaveDC).toBe(14);                      // 8 + prof 3 + INT(+3)
        expect(d.spellAttackBonus).toBe(6);                  // prof 3 + INT(+3)
    });

    it("unarmored falls back to 10 + Dex", () => {
        const d = computeCharacterStats({ ...baseWorking(), armor: undefined, shield: false });
        expect(d.ac).toBe(11);                               // 10 + Dex(+1)
    });
});

describe("assembleCharacter", () => {
    it("maps a finished working object onto the Character model", () => {
        const working = baseWorking();
        working.derived = computeCharacterStats(working);
        const c = assembleCharacter(working);

        expect(c.name).toBe("Varra Stoneheart");
        expect(c.level).toBe(5);                             // levels.length
        expect(c.levels).toHaveLength(5);
        expect(c.levels.every(l => l.class === "Barbarian" && l.hitDie === 12)).toBe(true);
        expect(c.health.max).toBe(50);
        expect(c.ArmorClass).toBe(15);
        expect(c.stats.str).toBe(16);
        // Chosen skills/saves are marked proficient; others are not.
        expect(c.proficiencies.skills["Athletics"].proficient).toBe(true);
        expect(c.proficiencies.skills["Perception"].proficient).toBe(true);
        expect(c.proficiencies.skills["Stealth"].proficient).toBe(false);
        expect(c.savingThrows.filter(s => s.proficient).map(s => s.stat).sort()).toEqual(["con", "str"]);
        // Features land in their level rows (Rage at L1, Brutal Critical at L5).
        expect(c.levels[0].features.map(f => f.name)).toContain("Rage");
        expect(c.levels[4].features.map(f => f.name)).toContain("Brutal Critical");
    });

    it("falls back to a class+lineage name when unnamed", () => {
        const working = { ...baseWorking(), name: undefined };
        working.derived = computeCharacterStats(working);
        expect(assembleCharacter(working).name).toBe("Goliath Barbarian");
    });
});
