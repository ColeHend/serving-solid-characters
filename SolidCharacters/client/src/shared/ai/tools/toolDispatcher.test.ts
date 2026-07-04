import { describe, it, expect, vi, beforeEach } from "vitest";

const hb = vi.hoisted(() => ({
    backgrounds: [] as Array<{ name?: string; description?: string }>,
    races: [] as Array<{ id: string; name: string; size?: string; speed?: number }>,
    subraces: [] as Array<{ id?: string; name?: string; parentRace?: string }>,
}));
vi.mock("../../customHooks/homebrewManager", () => ({
    homebrewManager: {
        classes: () => [], feats: () => [], spells: () => [], items: () => [], magicItems: () => [],
        backgrounds: () => hb.backgrounds, races: () => hb.races, subraces: () => hb.subraces,
        subclasses: () => [], findSubclass: () => undefined,
    },
}));

import { buildPreview, buildEditPreview } from "./toolDispatcher";
import type { AiToolCall } from "../types";
import type { Background, Class5E, Spell, Race, Subrace } from "../../../models/generated";

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

    it("densifies a class with features to all 20 levels (ASI/Epic Boon stamped) so the popup shows a full 1–20 table", () => {
        const p = buildPreview(classCall({ features: [{ level: 1, name: "Mark", description: "Mark a foe." }, { level: 5, name: "Hunt", description: "Track the marked foe relentlessly." }] }));
        expect(p.valid).toBe(true);
        const feats = (p.entity as Class5E).features ?? {};
        expect(Object.keys(feats)).toHaveLength(20);
        expect(feats[1]?.[0].name).toBe("Mark");
        expect(feats[5]?.[0].name).toBe("Hunt");
        expect(feats[4]?.[0].name).toBe("Ability Score Improvement");
        expect(feats[19]?.[0].name).toBe("Epic Boon");
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

    it("maps a background's starting equipment instead of dropping it", () => {
        const p = buildPreview(call("create_background", {
            name: "Chronicler of Truth", desc: "A seeker of hidden truths.",
            startEquipment: [
                { items: ["Quill", "Ink (1-ounce bottle)", "Parchment (10 sheets)", "8 GP"] },
                { optionKeys: ["Option A"], items: ["50 GP"] },
                { items: [] },   // empty group is dropped
            ],
        }));
        const bg = p.entity as Background;
        expect(bg.startEquipment).toHaveLength(2);
        expect(bg.startEquipment[0].items).toContain("Quill");
        expect(bg.startEquipment[1].optionKeys).toEqual(["Option A"]);
        expect(bg.startEquipment[1].items).toEqual(["50 GP"]);
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

describe("buildPreview — create_subrace resolves its parent race", () => {
    beforeEach(() => {
        hb.races = [{ id: "race-elf", name: "Elf", size: "Medium", speed: 30 }];
        hb.subraces = [];
    });

    const subraceCall = (input: Record<string, unknown>) =>
        call("create_subrace", { name: "Moonshade", parentRace: "Elf", traits: [{ name: "Umbral Step", description: "Once per short rest, teleport 15 feet through dim light." }], ...input });

    it("stores the parent race's ID (not its name) so consumers' id filter matches", () => {
        const p = buildPreview(subraceCall({}));
        expect(p.valid).toBe(true);
        expect((p.entity as Subrace).parentRace).toBe("race-elf");
    });

    it("resolves the parent name case-insensitively and inherits size/speed", () => {
        hb.races = [{ id: "race-dwarf", name: "Dwarf", size: "Medium", speed: 25 }];
        const p = buildPreview(subraceCall({ parentRace: "dwarf" }));
        const sr = p.entity as Subrace;
        expect(sr.parentRace).toBe("race-dwarf");
        expect(sr.size).toBe("Medium");
        expect(sr.speed).toBe(25);
    });

    it("hard-blocks an unknown parent race and hands the model the real names", () => {
        const p = buildPreview(subraceCall({ parentRace: "Elff" }));
        expect(p.valid).toBe(false);
        expect(p.errors.some(e => e.includes('No race named "Elff"') && e.includes('"Elf"'))).toBe(true);
    });

    it("hard-blocks a missing parent race", () => {
        const p = buildPreview(subraceCall({ parentRace: "" }));
        expect(p.valid).toBe(false);
        expect(p.errors).toContain("Missing parent race.");
    });

    it("warns (does not block) when the subrace has no usable traits", () => {
        const p = buildPreview(subraceCall({ traits: [] }));
        expect(p.valid).toBe(true);
        expect(p.warnings).toContain("No subrace traits.");
        expect(p.missingFields).toContain("traits");
    });

    it("keeps the 2024 double-dip ASI warning for subraces", () => {
        const p = buildPreview(subraceCall({ abilityBonuses: [{ ability: "DEX", value: 1 }] }), "2024");
        expect((p.warnings ?? []).some(w => /2024/.test(w))).toBe(true);
    });
});

describe("buildEditPreview — missing target self-corrects instead of dead-ending", () => {
    beforeEach(() => { hb.backgrounds = []; });

    it("flags targetMissing and lists the real names when the requested name doesn't exist", () => {
        hb.backgrounds = [{ name: "Chronicler of Truth", description: "A seeker of hidden truths." }];
        const p = buildEditPreview(call("edit_homebrew", { kind: "background", name: "Journalist", changes: [] }));
        expect(p.valid).toBe(false);
        expect(p.targetMissing).toBe(true);
        expect(p.errors[0]).toContain('No homebrew background named "Journalist"');
        expect(p.errors[0]).toContain("Chronicler of Truth");   // hands the model the real name to retry with
    });

    it("tells the model to create one first when there are none of that kind", () => {
        const p = buildEditPreview(call("edit_homebrew", { kind: "background", name: "Journalist", changes: [] }));
        expect(p.targetMissing).toBe(true);
        expect(p.errors[0]).toContain("no homebrew backgrounds yet");
    });

    it("builds a real edit preview (no targetMissing) when the name matches case-insensitively", () => {
        hb.backgrounds = [{ name: "Chronicler of Truth", description: "A seeker of hidden truths." }];
        const p = buildEditPreview(call("edit_homebrew", { kind: "background", name: "chronicler of truth", changes: [] }));
        expect(p.targetMissing).toBeFalsy();
        expect(p.baseEntity).toBeTruthy();
    });

    it("flags an unknown kind as targetMissing rather than surfacing a card", () => {
        const p = buildEditPreview(call("edit_homebrew", { kind: "potion", name: "X", changes: [] }));
        expect(p.targetMissing).toBe(true);
        expect(p.errors[0]).toContain("Unknown kind");
    });
});
