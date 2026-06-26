import { describe, it, expect, vi } from "vitest";
import type { HomebrewPreview } from "../tools/toolDispatcher";
import type { HomebrewKind } from "../refs/homebrewKind";
import type { RefKind } from "./madCommandCatalog";

// commandAgent imports the SRD/homebrew catalogs (which boot IndexedDB) and the provider factory. Mock
// them so importing the module is side-effect-free; the pure logic under test takes an injected resolver.
vi.mock("../../customHooks/homebrewManager", () => ({
    homebrewManager: { spells: () => [], items: () => [], magicItems: () => [], feats: () => [] },
}));
vi.mock("../../customHooks/dndInfo/info/all/spells", () => ({ useDnDSpells: () => () => [] }));
vi.mock("../../customHooks/dndInfo/info/all/items", () => ({ useDnDItems: () => () => [] }));
vi.mock("../../customHooks/dndInfo/info/all/feats", () => ({ useDnDFeats: () => () => [] }));
vi.mock("../../customHooks/dndInfo/useDndFeatures", () => ({ useDndFeature: () => ({ allFeatures: () => [] }) }));
vi.mock("../providers/providerFactory", () => ({ buildProvider: () => ({ streamChat: async function* () { /* none */ } }) }));

import { coerceCommand, commandChipLabel } from "./madCommandCatalog";
import { applyCommandsToEntity, featuresOf, hasFeatures } from "./commandAgent";

const noRef = (): string | null => null;
const fixedRef = (id: string) => (_k: RefKind, _n: string) => id;

function preview(kind: HomebrewKind, entity: unknown): HomebrewPreview {
    return {
        previewId: "p1", toolCallId: "t1", kind, title: (entity as { name?: string }).name ?? "X",
        entity: entity as HomebrewPreview["entity"], valid: true, errors: [],
    };
}

describe("coerceCommand — value-based categories", () => {
    it("canonicalizes a damage type and builds the command string", () => {
        const mad = coerceCommand("Add", "Resistances", { damageType: "fire" }, undefined, noRef);
        expect(mad).toEqual({ command: "AddResistances", value: { damageType: "Fire" }, type: 0, prerequisites: [], group: 0 });
    });

    it("maps full ability names to keys for Stats", () => {
        const mad = coerceCommand("Add", "Stats", { stat: "Constitution", statValue: "1" }, undefined, noRef);
        expect(mad?.value).toEqual({ stat: "con", statValue: "1" });
    });

    it("drops a command whose required enum doesn't resolve", () => {
        expect(coerceCommand("Add", "Resistances", { damageType: "holy" }, undefined, noRef)).toBeNull();
    });

    it("drops a command missing a required number", () => {
        expect(coerceCommand("Add", "Speed", {}, undefined, noRef)).toBeNull();
        expect(coerceCommand("Add", "Speed", { speed: "fast" }, undefined, noRef)).toBeNull();
        expect(coerceCommand("Add", "Speed", { speed: "10" }, undefined, noRef)?.value).toEqual({ speed: "10" });
    });

    it("requires at least one valid ability for ArmorClass (avoids a NaN sheet)", () => {
        expect(coerceCommand("Add", "ArmorClass", { bonus: "13" }, undefined, noRef)).toBeNull();
        expect(coerceCommand("Add", "ArmorClass", { bonus: "13", stats: "Dex, bogus" }, undefined, noRef)?.value)
            .toEqual({ bonus: "13", stats: "dex" });
    });

    it("canonicalizes skill names and drops unknown ones", () => {
        expect(coerceCommand("Add", "Proficiencies", { proficiency: "stealth" }, undefined, noRef)?.value)
            .toEqual({ proficiency: "Stealth" });
        expect(coerceCommand("Add", "Proficiencies", { proficiency: "Hacking" }, undefined, noRef)).toBeNull();
    });

    it("filters a skill CSV to known skills for Expertise", () => {
        expect(coerceCommand("Add", "Expertise", { proficiencies: "Stealth, Nonsense, Arcana" }, undefined, noRef)?.value)
            .toEqual({ proficiencies: "Stealth,Arcana" });
    });

    it("accepts currency synonyms and a PB-choice shorthand", () => {
        expect(coerceCommand("Add", "Currency", { type: "gold", amount: "5" }, undefined, noRef)?.value)
            .toEqual({ type: "goldPieces", amount: "5" });
        expect(coerceCommand("Add", "AllProficiencies", { allProficiencies: "Arcana,History", proficiencyBonusChoice: "half" }, undefined, noRef)?.value)
            .toEqual({ allProficiencies: "Arcana,History", proficiencyBonusChoice: "Half PB" });
    });

    it("matches the category case-insensitively and rejects unknown categories", () => {
        expect(coerceCommand("Add", "speed", { speed: "5" }, undefined, noRef)?.command).toBe("AddSpeed");
        expect(coerceCommand("Add", "Teleport", { x: "1" }, undefined, noRef)).toBeNull();
    });
});

describe("coerceCommand — id-based categories", () => {
    it("resolves a target name to a catalog id", () => {
        const mad = coerceCommand("Add", "Spells", undefined, "Fireball", fixedRef("spell-7"));
        expect(mad?.value).toEqual({ ID: "spell-7" });
    });

    it("uses the remove-variant key for Items", () => {
        expect(coerceCommand("Remove", "Items", undefined, "Torch", fixedRef("item-3"))?.value).toEqual({ name: "item-3" });
        expect(coerceCommand("Add", "Items", undefined, "Torch", fixedRef("item-3"))?.value).toEqual({ ID: "item-3" });
    });

    it("drops the command when the reference can't be resolved", () => {
        expect(coerceCommand("Add", "Feats", undefined, "Made Up Feat", noRef)).toBeNull();
    });
});

describe("commandChipLabel", () => {
    it("shows concrete values for value-based commands", () => {
        expect(commandChipLabel({ command: "AddResistances", value: { damageType: "Fire" } })).toBe("Add Resistances: Fire");
        expect(commandChipLabel({ command: "AddSpeed", value: { speed: "10" } })).toBe("Add Speed: 10");
    });
    it("shows only the action for id-based commands (the value is an opaque id)", () => {
        expect(commandChipLabel({ command: "AddSpells", value: { ID: "spell-7" } })).toBe("Add Spells");
    });
});

describe("featuresOf", () => {
    it("returns trait details for a race", () => {
        const race = { traits: [{ details: { id: "t1", name: "Stoneborn", description: "d" } }] };
        expect(featuresOf("race", race as HomebrewPreview["entity"]).map(f => f.name)).toEqual(["Stoneborn"]);
    });
    it("flattens leveled features for a class", () => {
        const cls = { features: { 1: [{ id: "f1", name: "Rage", description: "d" }], 2: [{ id: "f2", name: "Reckless", description: "d" }] } };
        expect(featuresOf("class", cls as unknown as HomebrewPreview["entity"]).map(f => f.name)).toEqual(["Rage", "Reckless"]);
    });
    it("returns the single details object for a feat", () => {
        const feat = { details: { id: "d1", name: "Alert", description: "d" } };
        expect(featuresOf("feat", feat as HomebrewPreview["entity"]).map(f => f.name)).toEqual(["Alert"]);
    });
    it("returns nothing for kinds without features", () => {
        expect(featuresOf("spell", { description: "x" } as HomebrewPreview["entity"])).toEqual([]);
        expect(hasFeatures("spell")).toBe(false);
        expect(hasFeatures("race")).toBe(true);
    });
});

describe("applyCommandsToEntity", () => {
    const racePreview = () => preview("race", {
        name: "Cairnkin",
        traits: [{ details: { id: "t1", name: "Stoneborn", description: "resistance to poison" } }],
    });

    it("attaches valid commands to the matching feature and clones (original untouched)", () => {
        const p = racePreview();
        const parsed = [{ name: "Stoneborn", commands: [{ type: "Add", category: "Resistances", value: { damageType: "poison" } }] }];
        const { entity, attached } = applyCommandsToEntity(p, parsed, noRef);
        expect(attached).toBe(1);
        const mads = featuresOf("race", entity)[0].metadata?.mads;
        expect(mads).toEqual([{ command: "AddResistances", value: { damageType: "Poison" }, type: 0, prerequisites: [], group: 0 }]);
        // original entity must be unchanged (we operate on a clone)
        expect(featuresOf("race", p.entity)[0].metadata).toBeUndefined();
    });

    it("drops invalid commands but keeps valid ones", () => {
        const p = racePreview();
        const parsed = [{ name: "Stoneborn", commands: [
            { type: "Add", category: "Resistances", value: { damageType: "holy" } },   // dropped
            { type: "Add", category: "Speed", value: { speed: "5" } },                 // kept
        ] }];
        const { entity, attached } = applyCommandsToEntity(p, parsed, noRef);
        expect(attached).toBe(1);
        expect(featuresOf("race", entity)[0].metadata?.mads?.map(m => m.command)).toEqual(["AddSpeed"]);
    });

    it("ignores feature names that don't match", () => {
        const p = racePreview();
        const parsed = [{ name: "Ghost Feature", commands: [{ type: "Add", category: "Speed", value: { speed: "5" } }] }];
        expect(applyCommandsToEntity(p, parsed, noRef).attached).toBe(0);
    });

    it("returns the clone unchanged when there's nothing to apply", () => {
        expect(applyCommandsToEntity(racePreview(), null, noRef).attached).toBe(0);
        expect(applyCommandsToEntity(racePreview(), [], noRef).attached).toBe(0);
    });
});
