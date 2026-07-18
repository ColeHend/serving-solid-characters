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

import { coerceCommand, validateStoredCommand } from "./madCommandCatalog";
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

describe("Stats choice/set form", () => {
    const noRef = () => null;

    it("coerces a fixed increase unchanged", () => {
        const m = coerceCommand("Add", "Stats", { stat: "con", statValue: "1" }, undefined, noRef);
        expect(m).toMatchObject({ command: "AddStats", value: { stat: "con", statValue: "1" } });
    });

    it("coerces the choice form with an options list", () => {
        const m = coerceCommand("Add", "Stats", { stat: "choice", options: "str, DEX", statValue: "1" }, undefined, noRef);
        expect(m).toMatchObject({ command: "AddStats", value: { stat: "choice", options: "str,dex", statValue: "1" } });
    });

    it("drops a choice-form command with no options", () => {
        expect(coerceCommand("Add", "Stats", { stat: "choice", statValue: "1" }, undefined, noRef)).toBeNull();
    });

    it("coerces mode=set and ignores an invalid mode", () => {
        const set = coerceCommand("Add", "Stats", { stat: "int", statValue: "19", mode: "set" }, undefined, noRef);
        expect(set?.value).toMatchObject({ stat: "int", statValue: "19", mode: "set" });

        const junk = coerceCommand("Add", "Stats", { stat: "int", statValue: "19", mode: "sideways" }, undefined, noRef);
        expect(junk?.value["mode"]).toBeUndefined();
    });

    it("validateStoredCommand accepts choice+options and rejects choice without options", () => {
        expect(validateStoredCommand(mad({ command: "AddStats", value: { stat: "choice", options: "str,dex", statValue: "1" } }))).toEqual([]);
        expect(validateStoredCommand(mad({ command: "AddStats", value: { stat: "choice", statValue: "1" } }))).not.toEqual([]);
        expect(validateStoredCommand(mad({ command: "AddStats", value: { stat: "int", statValue: "19", mode: "set" } }))).toEqual([]);
    });
});

describe("RollBonus", () => {
    const noRef = () => null;

    it("coerces a flat bonus with rollType, condition and stat", () => {
        const m = coerceCommand("Add", "RollBonus", { rollType: "WeaponAttack", bonus: "2", condition: "with Ranged weapons" }, undefined, noRef);
        expect(m).toMatchObject({ command: "AddRollBonus", value: { rollType: "WeaponAttack", bonus: "2", condition: "with Ranged weapons" } });
    });

    it("coerces a proficiency-bonus fraction (Alert)", () => {
        const m = coerceCommand("Add", "RollBonus", { rollType: "Initiative", proficiencyBonus: "Full PB" }, undefined, noRef);
        expect(m).toMatchObject({ command: "AddRollBonus", value: { rollType: "Initiative", proficiencyBonus: "Full PB" } });
    });

    it("coerces an ability-modifier bonus (statBonus)", () => {
        const m = coerceCommand("Add", "RollBonus", { rollType: "Initiative", statBonus: "WIS" }, undefined, noRef);
        expect(m).toMatchObject({ command: "AddRollBonus", value: { rollType: "Initiative", statBonus: "wis" } });
    });

    it("drops a RollBonus with no bonus, proficiencyBonus, or statBonus, or a bogus rollType", () => {
        expect(coerceCommand("Add", "RollBonus", { rollType: "Initiative" }, undefined, noRef)).toBeNull();
        expect(coerceCommand("Add", "RollBonus", { rollType: "Nonsense", bonus: "1" }, undefined, noRef)).toBeNull();
    });

    it("resolves loose aliases to RollBonus", () => {
        const m = coerceCommand("Add", "initiative bonus", { rollType: "Initiative", bonus: "2" }, undefined, noRef);
        expect(m?.command).toBe("AddRollBonus");
    });

    it("validateStoredCommand accepts valid forms and rejects a bonus-less command", () => {
        expect(validateStoredCommand(mad({ command: "AddRollBonus", value: { rollType: "SavingThrow", bonus: "1" } }))).toEqual([]);
        expect(validateStoredCommand(mad({ command: "AddRollBonus", value: { rollType: "Initiative", proficiencyBonus: "Full PB" } }))).toEqual([]);
        expect(validateStoredCommand(mad({ command: "AddRollBonus", value: { rollType: "Initiative", statBonus: "wis" } }))).toEqual([]);
        expect(validateStoredCommand(mad({ command: "AddRollBonus", value: { rollType: "Initiative" } }))).not.toEqual([]);
        expect(validateStoredCommand(mad({ command: "AddRollBonus", value: { rollType: "Nope", bonus: "1" } }))).not.toEqual([]);
    });
});

describe("Uses PB scaling", () => {
    const noRef = () => null;

    it("coerces a PB-fraction Uses with no fixed amount", () => {
        const m = coerceCommand("Add", "Uses", { proficiencyBonus: "Full PB", recharge: "Long Rest" }, undefined, noRef);
        expect(m).toMatchObject({ command: "AddUses", value: { proficiencyBonus: "Full PB", recharge: "Long Rest" } });
    });

    it("drops a Uses with neither amount nor proficiencyBonus", () => {
        expect(coerceCommand("Add", "Uses", { recharge: "Long Rest" }, undefined, noRef)).toBeNull();
    });

    it("validateStoredCommand accepts amount or PB forms and rejects neither", () => {
        expect(validateStoredCommand(mad({ command: "AddUses", value: { amount: "2", recharge: "Long Rest" }, type: MadType.Info }))).toEqual([]);
        expect(validateStoredCommand(mad({ command: "AddUses", value: { proficiencyBonus: "Half PB", recharge: "Short Rest" }, type: MadType.Info }))).toEqual([]);
        expect(validateStoredCommand(mad({ command: "AddUses", value: { recharge: "Long Rest" }, type: MadType.Info }))).not.toEqual([]);
    });
});

describe("Armor/Weapon/Tool proficiencies", () => {
    const noRef = () => null;

    it("coerces flat grants, canonicalizing loose armor/weapon-category phrasings", () => {
        expect(coerceCommand("Add", "ArmorProficiencies", { armor: "heavy" }, undefined, noRef))
            .toMatchObject({ command: "AddArmorProficiencies", value: { armor: "Heavy Armor" } });
        expect(coerceCommand("Add", "WeaponProficiencies", { weapon: "martial weapons" }, undefined, noRef))
            .toMatchObject({ command: "AddWeaponProficiencies", value: { weapon: "Martial Weapons" } });
        expect(coerceCommand("Add", "ToolProficiencies", { tool: "Thieves' Tools" }, undefined, noRef))
            .toMatchObject({ command: "AddToolProficiencies", value: { tool: "Thieves' Tools" } });
    });

    it("accepts a specific weapon name as free text but drops unknown armor", () => {
        expect(coerceCommand("Add", "WeaponProficiencies", { weapon: "Longswords" }, undefined, noRef))
            .toMatchObject({ value: { weapon: "Longswords" } });
        expect(coerceCommand("Add", "ArmorProficiencies", { armor: "Chainmail Hat" }, undefined, noRef)).toBeNull();
    });

    it("coerces the choose-N form and drops it without options", () => {
        expect(coerceCommand("Add", "WeaponProficiencies",
            { weapon: "choice", options: "Longswords, Rapiers", count: "2" }, undefined, noRef))
            .toMatchObject({ value: { weapon: "choice", options: "Longswords,Rapiers", count: "2" } });
        expect(coerceCommand("Add", "WeaponProficiencies", { weapon: "choice", count: "2" }, undefined, noRef)).toBeNull();
        expect(coerceCommand("Add", "ArmorProficiencies", { armor: "choice" }, undefined, noRef)).toBeNull();
        expect(coerceCommand("Add", "ToolProficiencies", { tool: "choice" }, undefined, noRef)).toBeNull();
    });

    it("resolves loose category aliases", () => {
        expect(coerceCommand("Add", "weapon training", { weapon: "simple" }, undefined, noRef)?.command)
            .toBe("AddWeaponProficiencies");
        expect(coerceCommand("Add", "Armor Training", { armor: "light armor" }, undefined, noRef)?.command)
            .toBe("AddArmorProficiencies");
    });

    it("validateStoredCommand accepts grants and choice+options, rejects choice without options", () => {
        expect(validateStoredCommand(mad({ command: "AddArmorProficiencies", value: { armor: "Shields" } }))).toEqual([]);
        expect(validateStoredCommand(mad({ command: "AddWeaponProficiencies", value: { weapon: "choice", options: "Longswords,Rapiers", count: "2" } }))).toEqual([]);
        expect(validateStoredCommand(mad({ command: "AddWeaponProficiencies", value: { weapon: "choice" } }))).not.toEqual([]);
        expect(validateStoredCommand(mad({ command: "AddArmorProficiencies", value: { armor: "Chainmail Hat" } }))).not.toEqual([]);
    });
});

describe("Proficiencies choice form", () => {
    const noRef = () => null;

    it("coerces a fixed skill unchanged", () => {
        const m = coerceCommand("Add", "Proficiencies", { proficiency: "Stealth" }, undefined, noRef);
        expect(m).toMatchObject({ command: "AddProficiencies", value: { proficiency: "Stealth" } });
    });

    it("coerces the choice form with canonical options and a count", () => {
        const m = coerceCommand("Add", "Proficiencies", { proficiency: "choice", options: "athletics, STEALTH", count: "3" }, undefined, noRef);
        expect(m).toMatchObject({ command: "AddProficiencies", value: { proficiency: "choice", options: "Athletics,Stealth", count: "3" } });
    });

    it("drops a choice-form command with no options", () => {
        expect(coerceCommand("Add", "Proficiencies", { proficiency: "choice", count: "3" }, undefined, noRef)).toBeNull();
    });

    it("validateStoredCommand accepts choice+options and rejects choice without options", () => {
        expect(validateStoredCommand(mad({ command: "AddProficiencies", value: { proficiency: "choice", options: "Athletics,Stealth", count: "2" } }))).toEqual([]);
        expect(validateStoredCommand(mad({ command: "AddProficiencies", value: { proficiency: "choice", count: "2" } }))).not.toEqual([]);
        expect(validateStoredCommand(mad({ command: "AddProficiencies", value: { proficiency: "Stealth" } }))).toEqual([]);
    });
});

describe("Spells choice form", () => {
    // A tiny spell "catalog": Fire Bolt / Light / Shield resolve, anything else doesn't.
    const ids: Record<string, string> = { "fire bolt": "sp-firebolt", "light": "sp-light", "shield": "sp-shield" };
    const ref = (_kind: string, name: string) => ids[name.toLowerCase()] ?? null;

    it("still coerces the fixed form from a target name", () => {
        const m = coerceCommand("Add", "Spells", {}, "Fire Bolt", ref);
        expect(m).toMatchObject({ command: "AddSpells", value: { ID: "sp-firebolt" } });
    });

    it("coerces the choice form, resolving each option name to its id and dropping unknowns", () => {
        const m = coerceCommand("Add", "Spells", { ID: "choice", options: "Fire Bolt, Light, Wishful Thinking", count: "2", spellLevel: "0" }, undefined, ref);
        expect(m).toMatchObject({ command: "AddSpells", value: { ID: "choice", options: "sp-firebolt,sp-light", count: "2", spellLevel: "0" } });
    });

    it("drops a choice-form command with no options, or whose options all fail to resolve", () => {
        expect(coerceCommand("Add", "Spells", { ID: "choice", count: "2" }, undefined, ref)).toBeNull();
        expect(coerceCommand("Add", "Spells", { ID: "choice", options: "Wishful Thinking", count: "1" }, undefined, ref)).toBeNull();
    });

    it("validateStoredCommand accepts choice+options and rejects choice without options", () => {
        expect(validateStoredCommand(mad({ command: "AddSpells", value: { ID: "choice", options: "sp-firebolt,sp-light", count: "2", spellLevel: "0" } }))).toEqual([]);
        expect(validateStoredCommand(mad({ command: "AddSpells", value: { ID: "choice", count: "2" } }))).not.toEqual([]);
        expect(validateStoredCommand(mad({ command: "AddSpells", value: { ID: "sp-firebolt" } }))).toEqual([]);
    });
});

describe("Actions", () => {
    const noRef = () => null;

    it("coerces a well-formed grant and normalizes loose actionType phrasings", () => {
        const m = coerceCommand("Add", "Actions", { name: "Rage", actionType: "Bonus Action", source: "Rage" }, undefined, noRef);
        expect(m).toMatchObject({ command: "AddActions", value: { name: "Rage", actionType: "bonusAction", source: "Rage" } });

        const magic = coerceCommand("Add", "Actions", { name: "Turn Undead", actionType: "Magic action" }, undefined, noRef);
        expect(magic?.value["actionType"]).toBe("action");
    });

    it("drops a grant with a missing name or unknown actionType", () => {
        expect(coerceCommand("Add", "Actions", { actionType: "action" }, undefined, noRef)).toBeNull();
        expect(coerceCommand("Add", "Actions", { name: "Dodge Roll", actionType: "somersault" }, undefined, noRef)).toBeNull();
    });

    it("resolves loose category names to Actions", () => {
        const m = coerceCommand("Add", "bonus action", { name: "Second Wind", actionType: "bonus" }, undefined, noRef);
        expect(m).toMatchObject({ command: "AddActions", value: { name: "Second Wind", actionType: "bonusAction" } });
    });

    it("validateStoredCommand accepts a stored grant and flags a bogus actionType", () => {
        expect(validateStoredCommand(mad({ command: "AddActions", value: { name: "Channel Divinity", actionType: "action" } }))).toEqual([]);
        expect(validateStoredCommand(mad({ command: "AddActions", value: { name: "Channel Divinity", actionType: "somersault" } }))).not.toEqual([]);
        expect(validateStoredCommand(mad({ command: "AddActions", value: { actionType: "action" } }))).not.toEqual([]);
    });
});

describe("ArmorClass flat bonus", () => {
    const noRef = () => null;

    it("coerces a bonus-only command (flat +1 AC) with optional condition", () => {
        const m = coerceCommand("Add", "ArmorClass", { bonus: "1", condition: "while wearing armor" }, undefined, noRef);
        expect(m).toMatchObject({ command: "AddArmorClass", value: { bonus: "1", condition: "while wearing armor" } });
        expect(m?.value["stats"]).toBeUndefined();
    });

    it("still coerces the formula form and validates both", () => {
        const formula = coerceCommand("Add", "ArmorClass", { bonus: "13", stats: "dex" }, undefined, noRef);
        expect(formula).toMatchObject({ command: "AddArmorClass", value: { bonus: "13", stats: "dex" } });
        expect(validateStoredCommand(mad({ command: "AddArmorClass", value: { bonus: "1" } }))).toEqual([]);
        expect(validateStoredCommand(mad({ command: "AddArmorClass", value: { bonus: "13", stats: "dex,con" } }))).toEqual([]);
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
