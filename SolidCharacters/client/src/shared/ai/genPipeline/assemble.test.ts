import { describe, it, expect } from "vitest";
import { assembleClassPreview, workingClassToToolInput } from "./assemble";
import type { Class5E } from "../../../models/generated";
import type { WorkingClass } from "./types";

/**
 * Assemble unit tests (plan §14): the working class rebuilds the `create_class` tool input and reuses
 * `buildPreview`/`toClass`/`validateEntity`, so a complete working class yields a valid, savable preview.
 */

const fullClass: WorkingClass = {
    name: "Stormwarden",
    primaryAbility: "STR",
    hitDie: "d10",
    coreMechanic: "Charge",
    casterType: "none",
    savingThrows: ["STR", "CON"],
    proficiencies: { armor: ["Light armor", "Shields"], weapons: ["Simple weapons"], tools: [], skills: ["Athletics", "Perception"] },
    startingEquipment: ["A spear", "Leather armor"],
    features: [{ name: "Storm's Charge", level: 1, description: "Gain 1 Charge when you take damage; spend on a hit for +1d6 thunder." }],
};

describe("workingClassToToolInput", () => {
    it("mirrors the create_class schema keys", () => {
        const input = workingClassToToolInput(fullClass);
        expect(input).toMatchObject({ name: "Stormwarden", hitDie: "d10", primaryAbility: "STR", casterType: "none" });
        expect(input.savingThrows).toEqual(["STR", "CON"]);
        expect((input.features as unknown[])).toHaveLength(1);
        expect(input.skills).toEqual(["Athletics", "Perception"]);
    });
});

describe("assembleClassPreview", () => {
    it("builds a valid, savable class preview from a complete working class", () => {
        const preview = assembleClassPreview(fullClass, "both");
        expect(preview.kind).toBe("class");
        expect(preview.title).toBe("Stormwarden");
        expect(preview.valid).toBe(true);
        expect(preview.errors).toEqual([]);
        const entity = preview.entity as Class5E;
        expect(entity.hitDie).toBe("d10");
        expect(entity.savingThrows).toEqual(["STR", "CON"]);
        expect(entity.features?.[1]?.[0]?.name).toBe("Storm's Charge");
    });

    it("marks an incomplete class invalid (no features → Save blocked)", () => {
        const preview = assembleClassPreview({ ...fullClass, features: [] }, "both");
        expect(preview.valid).toBe(false);
        expect(preview.errors.join(" ")).toMatch(/feature/i);
    });
});
