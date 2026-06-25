import { describe, it, expect, vi } from "vitest";

vi.mock("../customHooks/homebrewManager", () => ({ homebrewManager: { classes: () => [], feats: () => [] } }));

import { buildPreview } from "./toolDispatcher";
import type { AiToolCall } from "./types";
import type { Class5E, Spell, Race } from "../../models/generated";

const call = (name: string, input: Record<string, unknown>): AiToolCall => ({ id: "t1", name, input });

const classCall = (input: Record<string, unknown>) =>
    call("create_class", { name: "Warden", primaryAbility: "WIS", hitDie: "d8", features: [{ level: 1, name: "Mark", description: "Mark a foe." }], ...input });

describe("buildPreview — description is a hard failure", () => {
    it("marks a spell with no description invalid", () => {
        const p = buildPreview(call("create_spell", { name: "Bolt", level: 0 }));
        expect(p.valid).toBe(false);
        expect(p.errors).toContain("Missing description.");
    });

    it("accepts a spell that has a description", () => {
        const p = buildPreview(call("create_spell", { name: "Bolt", description: "1d10 fire on a hit.", level: 0 }));
        expect(p.valid).toBe(true);
        expect(p.errors).not.toContain("Missing description.");
    });

    it("does not list description twice (hard error, not also a soft warning)", () => {
        const p = buildPreview(call("create_spell", { name: "Bolt", level: 0 }));
        expect((p.warnings ?? []).some(w => /description/i.test(w))).toBe(false);
    });

    it("requires a description on feats, magic items, backgrounds and subclasses", () => {
        expect(buildPreview(call("create_feat", { name: "X" })).errors).toContain("Missing description.");
        expect(buildPreview(call("create_magic_item", { name: "X", rarity: "Rare" })).errors).toContain("Missing description.");
        expect(buildPreview(call("create_background", { name: "X" })).errors).toContain("Missing description.");
        expect(buildPreview(call("create_subclass", { name: "X", parentClass: "Wizard" })).errors).toContain("Missing description.");
    });

    it("canonicalizes spell classes so wrong-case names match the consumer", () => {
        const p = buildPreview(call("create_spell", { name: "X", description: "1d6 fire.", level: 0, classes: ["wizard", "SORCERER"] }));
        expect((p.entity as Spell).classes).toEqual(["Wizard", "Sorcerer"]);
    });

    it("blocks a class with a non-standard hit die", () => {
        const p = buildPreview(classCall({ hitDie: "d4" }));
        expect(p.valid).toBe(false);
        expect(p.errors).toContain("Hit die must be one of d6, d8, d10, d12.");
    });

    it("blocks a class with no primary ability", () => {
        const p = buildPreview(classCall({ primaryAbility: "" }));
        expect(p.valid).toBe(false);
        expect(p.errors).toContain("Missing primary ability.");
    });

    it("blocks a class with no features", () => {
        const p = buildPreview(classCall({ features: [] }));
        expect(p.valid).toBe(false);
        expect(p.errors).toContain("Add at least one class feature.");
    });

    it("stamps a spell-slot table from casterType so a caster isn't saved with zero slots", () => {
        const p = buildPreview(classCall({ casterType: "full" }));
        const sc = (p.entity as Class5E).spellcasting;
        expect(sc).toBeTruthy();
        expect(sc!.metadata.slots[1].spellSlotsLevel1).toBe(2);
        expect(sc!.metadata.slots[20].spellSlotsLevel9).toBe(1);
    });

    it("leaves a non-caster class with no spellcasting", () => {
        const p = buildPreview(classCall({ casterType: "none" }));
        expect((p.entity as Class5E).spellcasting).toBeUndefined();
    });

    it("blocks placeholder text in any usage level", () => {
        const p = buildPreview(call("create_spell", { name: "X", description: "Deals TODO fire damage.", level: 0 }));
        expect(p.valid).toBe(false);
        expect(p.errors.some(e => /TODO/.test(e))).toBe(true);
    });

    it("warns (does not block) on a race trait missing its name or description", () => {
        const p = buildPreview(call("create_race", { name: "X", size: "Medium", speed: 30, traits: [{ name: "Sight", description: "" }] }));
        expect(p.valid).toBe(true);   // trait blanks are warn-only
        expect((p.warnings ?? []).some(w => /name or description/i.test(w))).toBe(true);
    });

    it("drops an unrecognized race ability bonus instead of defaulting to STR", () => {
        const p = buildPreview(call("create_race", { name: "X", size: "Medium", speed: 30, abilityBonuses: [{ ability: "LUC", value: 2 }] }));
        expect((p.entity as Race).abilityBonuses).toHaveLength(0);
        expect((p.warnings ?? []).some(w => /unknown ability/i.test(w))).toBe(true);
    });

    it("exempts races and classes (no single description field)", () => {
        const race = buildPreview(call("create_race", { name: "Emberkin", size: "Medium", speed: 30 }));
        expect(race.errors).not.toContain("Missing description.");
        expect(race.valid).toBe(true);

        const klass = buildPreview(call("create_class", {
            name: "Warden", hitDie: "d10", primaryAbility: "WIS", savingThrows: ["CON", "WIS"],
            features: [{ level: 1, name: "Guardian's Mark", description: "Mark a foe; advantage on attacks against it." }],
        }));
        expect(klass.errors).not.toContain("Missing description.");
        expect(klass.valid).toBe(true);
    });
});
