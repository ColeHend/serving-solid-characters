import { describe, it, expect } from "vitest";
import { coerceFoundation, validateFoundation } from "./foundation";
import { coerceAbilityScores, validateScores, coerceTraining, validateTraining } from "./trainedIn";
import { coerceCapabilities, validateCapabilities, coercePickedSpells, validatePickedSpells } from "./capabilities";
import { coerceLoadout, validateLoadout, applyLoadout } from "./loadout";
import { coerceNarrative, validateNarrative } from "./narrative";
import type { AbilityKey, WorkingCharacter } from "./types";

/**
 * Per-step gate unit tests (plan §14 "pure functions first"): each character step's coerce + validate pair
 * is exercised with legal input, the structural failures the repair loop must catch, and the cross-step
 * consistency rules (scores honour the priority, spells stay within reach, feature levels ≤ character level).
 * No model — these are the deterministic gates the step worker drives.
 */

describe("foundation step", () => {
    const ok = { class_name: "Barbarian", lineage: "Goliath", level: 5, background: "Soldier", hit_die: "d12", ability_priority: ["STR", "CON", "DEX", "WIS", "CHA", "INT"] };

    it("accepts a complete foundation", () => {
        expect(validateFoundation(coerceFoundation(ok))).toEqual([]);
    });
    it("coerces the priority to lowercase ability keys and de-dupes", () => {
        const f = coerceFoundation({ ...ok, ability_priority: ["STR", "str", "CON", "DEX", "WIS", "CHA", "INT", "bogus"] });
        expect(f.abilityPriority).toEqual(["str", "con", "dex", "wis", "cha", "int"]);
    });
    it("flags a bad hit die, an out-of-range level, and an incomplete priority", () => {
        expect(validateFoundation(coerceFoundation({ ...ok, hit_die: "d7" }))).toEqual(expect.arrayContaining([expect.stringMatching(/hit die/i)]));
        expect(validateFoundation(coerceFoundation({ ...ok, level: 25 }))).toEqual(expect.arrayContaining([expect.stringMatching(/level/i)]));
        expect(validateFoundation(coerceFoundation({ ...ok, ability_priority: ["STR", "CON"] }))).toEqual(expect.arrayContaining([expect.stringMatching(/all six abilities/i)]));
    });
    it("flags missing class/lineage/background", () => {
        expect(validateFoundation(coerceFoundation({ ...ok, class_name: "", lineage: "", background: "" }))).toHaveLength(3);
    });
});

describe("ability scores step", () => {
    const priority: AbilityKey[] = ["str", "con", "dex", "wis", "cha", "int"];

    it("defaults missing scores to 10", () => {
        expect(coerceAbilityScores({ str: 16 })).toEqual({ str: 16, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    });
    it("passes when the primary ability holds the highest score", () => {
        expect(validateScores(coerceAbilityScores({ str: 16, con: 15, dex: 13, wis: 12, cha: 10, int: 8 }), priority)).toEqual([]);
    });
    it("flags scores out of the 1–30 band", () => {
        expect(validateScores(coerceAbilityScores({ str: 16, con: 15, dex: 31, wis: 12, cha: 10, int: 8 }), priority))
            .toEqual(expect.arrayContaining([expect.stringMatching(/out of the 1–30/i)]));
    });
    it("flags when the primary ability isn't the highest", () => {
        expect(validateScores(coerceAbilityScores({ str: 14, con: 15, dex: 16, wis: 12, cha: 10, int: 8 }), priority))
            .toEqual(expect.arrayContaining([expect.stringMatching(/most-important ability/i)]));
    });
});

describe("training step", () => {
    it("accepts two saves and a sensible skill count, de-duping skills", () => {
        const t = coerceTraining({ skills: ["Athletics", "athletics", "Intimidation"], saving_throws: ["STR", "CON"] });
        expect(t.skills).toEqual(["Athletics", "Intimidation"]);
        expect(t.savingThrows).toEqual(["str", "con"]);
        expect(validateTraining(t)).toEqual([]);
    });
    it("flags the wrong number of saving throws", () => {
        expect(validateTraining(coerceTraining({ skills: ["Athletics", "Intimidation"], saving_throws: ["STR"] })))
            .toEqual(expect.arrayContaining([expect.stringMatching(/saving-throw/i)]));
    });
    it("flags too few or too many skills", () => {
        expect(validateTraining(coerceTraining({ skills: ["Athletics"], saving_throws: ["STR", "CON"] }))).not.toEqual([]);
        const many = Array.from({ length: 9 }, (_, i) => `Skill${i}`);
        expect(validateTraining(coerceTraining({ skills: many, saving_throws: ["STR", "CON"] }))).not.toEqual([]);
    });
});

describe("capabilities step", () => {
    const feat = (over: Record<string, unknown> = {}) => ({ name: "Rage", level: 1, description: "Bonus action rage for resistance to physical damage and bonus melee damage.", ...over });

    it("accepts well-formed features and a legal caster type", () => {
        const c = coerceCapabilities({ caster_type: "full", features: [feat()] }, 5);
        expect(c.casterType).toBe("full");
        expect(validateCapabilities(c, 5)).toEqual([]);
    });
    it("clamps feature levels above the character level down to the cap", () => {
        const c = coerceCapabilities({ caster_type: "none", features: [feat({ level: 9 })] }, 5);
        expect(c.features[0].level).toBe(5);
        expect(validateCapabilities(c, 5)).toEqual([]);
    });
    it("flags duplicate features and thin rules text", () => {
        const dup = coerceCapabilities({ caster_type: "none", features: [feat(), feat()] }, 5);
        expect(validateCapabilities(dup, 5)).toEqual(expect.arrayContaining([expect.stringMatching(/duplicate/i)]));
        const thin = coerceCapabilities({ caster_type: "none", features: [feat({ description: "tiny" })] }, 5);
        expect(validateCapabilities(thin, 5)).toEqual(expect.arrayContaining([expect.stringMatching(/rules text/i)]));
    });
    it("defaults an unknown caster type to none and requires a feature", () => {
        const c = coerceCapabilities({ caster_type: "wizardly", features: [] }, 5);
        expect(c.casterType).toBe("none");
        expect(validateCapabilities(c, 5)).toEqual(expect.arrayContaining([expect.stringMatching(/at least one/i)]));
    });
});

describe("spells step", () => {
    it("accepts cantrips and spells within the caster's reach", () => {
        const spells = coercePickedSpells({ spells: [{ name: "Fire Bolt", level: 0 }, { name: "Fireball", level: 3 }] });
        expect(validatePickedSpells(spells, "full", 5)).toEqual([]);   // L5 full caster reaches 3rd level
    });
    it("flags a spell above the caster's reachable level", () => {
        const spells = coercePickedSpells({ spells: [{ name: "Meteor Swarm", level: 9 }] });
        expect(validatePickedSpells(spells, "full", 5)).not.toEqual([]);
    });
    it("flags an empty spell list", () => {
        expect(validatePickedSpells(coercePickedSpells({ spells: [] }), "full", 5)).toEqual(expect.arrayContaining([expect.stringMatching(/at least one/i)]));
    });
});

describe("loadout step", () => {
    it("coerces an unknown armor weight class to none", () => {
        expect(coerceLoadout({ armor: { category: "powered" } }).armor.category).toBe("none");
        expect(validateLoadout(coerceLoadout({ armor: { category: "medium" } }))).toEqual([]);
    });
    it("builds a flat equipment list with the armor name and shield", () => {
        const working: WorkingCharacter = {};
        applyLoadout(working, coerceLoadout({ armor: { category: "medium", name: "Half plate" }, shield: true, weapons: ["Greataxe"], items: ["Rope"] }));
        expect(working.equipment).toEqual(["Half plate", "Shield", "Greataxe", "Rope"]);
        expect(working.armor).toEqual({ category: "medium", name: "Half plate" });
        expect(working.shield).toBe(true);
    });
    it("omits armor from the equipment list when unarmored", () => {
        const working: WorkingCharacter = {};
        applyLoadout(working, coerceLoadout({ armor: { category: "none" }, weapons: ["Quarterstaff"] }));
        expect(working.equipment).toEqual(["Quarterstaff"]);
    });
});

describe("narrative step", () => {
    const ok = { name: "Varra Stoneheart", backstory: "A goliath barbarian whose rage became a shield for the helpless after a tragedy she could not prevent." };

    it("accepts a named character with a real backstory", () => {
        expect(validateNarrative(coerceNarrative(ok))).toEqual([]);
    });
    it("flags a missing name and a one-line backstory", () => {
        expect(validateNarrative(coerceNarrative({ name: "", backstory: "short" }))).toHaveLength(2);
    });
});
