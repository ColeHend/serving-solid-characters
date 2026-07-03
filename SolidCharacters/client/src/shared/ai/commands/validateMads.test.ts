import { describe, it, expect } from "vitest";
import type { Feat, MadFeature, Spell } from "../../../models/generated";
import { MadType } from "../../../models/generated";
import type { HomebrewPreview } from "../tools/toolDispatcher";

// validateMads imports featuresOf from commandAgent, which boots the SRD/homebrew catalogs + provider on
// import. Mock them so importing the module is side-effect-free; validateMads itself is pure (no model call).
import { vi } from "vitest";
vi.mock("../../customHooks/homebrewManager", () => ({
    homebrewManager: { spells: () => [], items: () => [], magicItems: () => [], feats: () => [] },
}));
vi.mock("../../customHooks/dndInfo/info/all/spells", () => ({ useDnDSpells: () => () => [] }));
vi.mock("../../customHooks/dndInfo/info/all/items", () => ({ useDnDItems: () => () => [] }));
vi.mock("../../customHooks/dndInfo/info/all/feats", () => ({ useDnDFeats: () => () => [] }));
vi.mock("../../customHooks/dndInfo/useDndFeatures", () => ({ useDndFeature: () => ({ allFeatures: () => [] }) }));
vi.mock("../providers/providerFactory", () => ({ buildProvider: () => ({ streamChat: async function* () { /* none */ } }) }));

import { validateStoredCommand } from "./madCommandCatalog";
import { featuresMissingMads, stripInvalidMads, validateMads } from "./validateMads";

const mad = (over: Partial<MadFeature>): MadFeature =>
    ({ command: "AddResistances", value: { damageType: "Fire" }, type: MadType.Character, prerequisites: [], group: 0, ...over });

/** A feat-shaped entity whose single feature carries the given mads (featuresOf("feat") returns [details]). */
const featWith = (mads: MadFeature[]): Feat =>
    ({ id: "f1", details: { id: "d1", name: "Tough", description: "A sturdy feat.", metadata: { mads } } } as unknown as Feat);

describe("validateStoredCommand", () => {
    it("accepts a well-formed value-based command", () => {
        expect(validateStoredCommand(mad({}))).toEqual([]);
    });

    it("accepts a well-formed id-based command (opaque id post-enrichment)", () => {
        expect(validateStoredCommand(mad({ command: "AddSpells", value: { ID: "spell-123" } }))).toEqual([]);
    });

    it("rejects an unknown command name", () => {
        expect(validateStoredCommand(mad({ command: "AddFoo", value: {} }))).not.toEqual([]);
    });

    it("rejects a command with no Add/Remove prefix", () => {
        expect(validateStoredCommand(mad({ command: "Resistances" }))).not.toEqual([]);
    });

    it("rejects a missing required value field", () => {
        expect(validateStoredCommand(mad({ value: {} }))).not.toEqual([]);
    });

    it("rejects a value that isn't a known option", () => {
        expect(validateStoredCommand(mad({ value: { damageType: "Holy" } }))).not.toEqual([]);
    });

    it("rejects an id-based command missing its id", () => {
        expect(validateStoredCommand(mad({ command: "AddSpells", value: {} }))).not.toEqual([]);
    });

    it("rejects an invalid MadType", () => {
        expect(validateStoredCommand(mad({ type: 7 as MadType }))).not.toEqual([]);
    });

    it("accepts well-formed new-category commands", () => {
        expect(validateStoredCommand(mad({ command: "AddAdvantage", value: { rollType: "SavingThrow", mode: "advantage", stat: "wis" } }))).toEqual([]);
        expect(validateStoredCommand(mad({ command: "AddClassFeature", value: { name: "Archery" } }))).toEqual([]);
        expect(validateStoredCommand(mad({ command: "AddAttacks", value: { amount: "1" } }))).toEqual([]);
        expect(validateStoredCommand(mad({ command: "AddUses", value: { amount: "2", recharge: "Long Rest" }, type: MadType.Info }))).toEqual([]);
    });

    it("flags a stored Advantage with a bogus rollType and a Uses with a non-numeric amount", () => {
        expect(validateStoredCommand(mad({ command: "AddAdvantage", value: { rollType: "Nonsense", mode: "advantage" } }))).not.toEqual([]);
        expect(validateStoredCommand(mad({ command: "AddUses", value: { amount: "some" }, type: MadType.Info }))).not.toEqual([]);
    });
});

describe("validateMads", () => {
    it("no-ops on a non-feature entity (spell)", () => {
        const spell = { name: "Firebolt", description: "..." } as unknown as Spell;
        expect(validateMads("spell", spell)).toEqual({ errors: [], flagged: [] });
    });

    it("returns no errors when every command is well-formed", () => {
        const entity = featWith([mad({}), mad({ command: "AddSpells", value: { ID: "spell-1" } })]);
        expect(validateMads("feat", entity).errors).toEqual([]);
    });

    it("flags the offending command and reports its feature", () => {
        const entity = featWith([mad({}), mad({ command: "AddResistances", value: { damageType: "Holy" } })]);
        const result = validateMads("feat", entity);
        expect(result.errors.length).toBe(1);
        expect(result.flagged).toHaveLength(1);
        expect(result.flagged[0].feature).toBe("Tough");
        expect(result.flagged[0].index).toBe(1);
    });
});

describe("featuresMissingMads", () => {
    it("flags a feature that carries no mads command", () => {
        expect(featuresMissingMads("feat", featWith([]))).toEqual(["Tough"]);
    });

    it("does not flag a feature that carries a (valid or not) command", () => {
        expect(featuresMissingMads("feat", featWith([mad({})]))).toEqual([]);
    });

    it("flags a feature whose commands were all stripped down to empty", () => {
        const stripped = stripInvalidMads("feat", featWith([mad({ value: { damageType: "Holy" } })]));
        expect(featuresMissingMads("feat", stripped)).toEqual(["Tough"]);
    });

    it("returns an empty list for a non-feature entity (spell)", () => {
        const spell = { name: "Firebolt", description: "..." } as unknown as Spell;
        expect(featuresMissingMads("spell", spell)).toEqual([]);
    });

    // mechanicalOnly=true is the `inertFeatures` filter on the preview card: a command-less feature only
    // warns when its text reads as granting a concrete effect — pure flavor is never flagged.
    it("mechanicalOnly narrows to features whose text grants a concrete effect", () => {
        const mechanical = { id: "f1", details: { id: "d1", name: "Tough", description: "You gain resistance to fire damage." } } as unknown as Feat;
        const flavor = { id: "f2", details: { id: "d2", name: "Stoic", description: "You rarely show emotion." } } as unknown as Feat;
        expect(featuresMissingMads("feat", mechanical, true)).toEqual(["Tough"]);
        expect(featuresMissingMads("feat", flavor, true)).toEqual([]);
        expect(featuresMissingMads("feat", flavor)).toEqual(["Stoic"]);   // un-narrowed still lists it
    });
});

describe("stripInvalidMads", () => {
    it("removes only the invalid commands and leaves the entity otherwise intact", () => {
        const entity = featWith([mad({}), mad({ value: { damageType: "Holy" } }), mad({ command: "AddSpells", value: { ID: "s1" } })]);
        const cleaned = stripInvalidMads("feat", entity) as Feat;
        const mads = cleaned.details.metadata!.mads!;
        expect(mads).toHaveLength(2);
        expect(mads.every(m => validateStoredCommand(m).length === 0)).toBe(true);
        // The original is untouched (stripInvalidMads clones).
        expect((entity as Feat).details.metadata!.mads).toHaveLength(3);
    });
});
