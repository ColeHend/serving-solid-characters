import { describe, it, expect } from "vitest";
import { applyChassis, coerceChassis, validateChassis } from "./chassis";
import type { WorkingClass } from "./types";

/** Phase C unit tests (plan §14): coercion, the level-1 chassis gate, and carry-forward onto the class. */

const goodRaw = {
    saving_throws: ["str", "con"],
    skills: ["Athletics", "Intimidation", "Perception"],
    armor: ["Light armor", "Medium armor", "Shields"],
    weapons: ["Simple weapons", "Martial weapons"],
    tools: [],
    starting_equipment: ["A martial weapon", "Leather armor"],
    features: [{ level: 1, name: "Storm's Charge", description: "Gain 1 Charge when you take damage; spend on a hit for +1d6 thunder." }],
};

describe("coerceChassis", () => {
    it("uppercases saving throws and keeps level-1 features", () => {
        const c = coerceChassis(goodRaw);
        expect(c.savingThrows).toEqual(["STR", "CON"]);
        expect(c.features).toHaveLength(1);
        expect(c.features[0]).toMatchObject({ level: 1, name: "Storm's Charge" });
    });
});

describe("validateChassis", () => {
    it("accepts a complete level-1 chassis", () => {
        expect(validateChassis(coerceChassis(goodRaw))).toEqual([]);
    });

    it("requires exactly two saving throws", () => {
        const errors = validateChassis(coerceChassis({ ...goodRaw, saving_throws: ["STR"] }));
        expect(errors.some(e => /saving-throw/i.test(e))).toBe(true);
    });

    it("requires at least one level-1 feature with rules text", () => {
        const noFeatures = validateChassis(coerceChassis({ ...goodRaw, features: [] }));
        expect(noFeatures.some(e => /level-1 feature/i.test(e))).toBe(true);

        const blankText = validateChassis(coerceChassis({ ...goodRaw, features: [{ level: 1, name: "Empty", description: "" }] }));
        expect(blankText.some(e => /rules text/i.test(e))).toBe(true);
    });

    it("rejects a feature placed above level 1 (this slice is level-1 only)", () => {
        const errors = validateChassis(coerceChassis({ ...goodRaw, features: [{ level: 3, name: "Later", description: "Too soon for the slice." }] }));
        expect(errors.some(e => /outside 1.1/.test(e))).toBe(true);
    });

    it("requires at least two skill options", () => {
        const errors = validateChassis(coerceChassis({ ...goodRaw, skills: ["Athletics"] }));
        expect(errors.some(e => /skill proficiency options/i.test(e))).toBe(true);
    });
});

describe("applyChassis", () => {
    it("writes proficiencies, saves, equipment, and named features onto the class", () => {
        const working: WorkingClass = { name: "Stormwarden" };
        applyChassis(working, coerceChassis(goodRaw));
        expect(working.savingThrows).toEqual(["STR", "CON"]);
        expect(working.proficiencies?.skills).toContain("Perception");
        expect(working.proficiencies?.armor).toContain("Shields");
        expect(working.features).toHaveLength(1);
        expect(working.startingEquipment).toContain("Leather armor");
    });

    it("drops nameless feature stubs", () => {
        const working: WorkingClass = {};
        applyChassis(working, coerceChassis({ ...goodRaw, features: [...goodRaw.features, { level: 1, name: "", description: "ghost" }] }));
        expect(working.features).toHaveLength(1);
    });
});
