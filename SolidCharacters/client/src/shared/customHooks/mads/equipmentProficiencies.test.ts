import { describe, it, expect, vi } from "vitest";
import type { Character } from "../../../models/character.model";
import type { FeatureDetail, MadFeature as StoredMad } from "../../../models/generated";

// useMadCharacters (statChoiceKey's home) pulls handler modules that resolve data
// hooks at import time; mock them so the suite never touches IndexedDB.
vi.mock("../dndInfo/useDndFeatures", () => ({ useDndFeature: () => ({ allFeatures: () => [] }) }));
vi.mock("../dndInfo/info/all/feats", () => ({ useDnDFeats: () => () => [] }));

import { MadFeature, MadType } from "./madModels";
import {
    applyEquipProficiencyMads,
    equipProfChoiceCount,
    equipProfChoiceKey,
    equipProfChoiceOptions,
    pendingEquipProfChoices,
    resolveCharacterEquipProficiencies,
    resolveEquipProfChoice,
} from "./equipmentProficiencies";

function mad(command: string, value: Record<string, string>): MadFeature {
    return { command: command as MadFeature["command"], value, type: MadType.Character, prerequisites: [], group: 0 };
}

const feature = (name: string, ...mads: MadFeature[]): FeatureDetail =>
    ({ id: "", name, description: "", metadata: { mads: mads as unknown as StoredMad[] } });

function characterWith(features: FeatureDetail[], proficiencyChoices: Record<string, string> = {}): Character {
    return {
        levels: [{ features }],
        race: { species: "human", features: [] },
        features: [],
        proficiencyChoices,
    } as unknown as Character;
}

const EMPTY = { armor: [], weapons: [], tools: [] };

describe("applyEquipProficiencyMads", () => {
    it("unions flat grants with the base lists, case-insensitively deduped", () => {
        const c = characterWith([feature("Training",
            mad("AddArmorProficiencies", { armor: "Heavy Armor" }),
            mad("AddWeaponProficiencies", { weapon: "Martial Weapons" }),
            mad("AddToolProficiencies", { tool: "Thieves' Tools" }),
        )]);

        const out = applyEquipProficiencyMads(c, { armor: ["Light armor"], weapons: ["martial weapons"], tools: [] });

        expect(out.armor).toEqual(["Light armor", "Heavy Armor"]);
        expect(out.weapons).toEqual(["martial weapons"]); // dupe of the base entry
        expect(out.tools).toEqual(["Thieves' Tools"]);
    });

    it("subtracts Remove commands case-insensitively", () => {
        const c = characterWith([feature("Curse",
            mad("RemoveArmorProficiencies", { armor: "Heavy Armor" }),
        )]);

        const out = applyEquipProficiencyMads(c, { ...EMPTY, armor: ["heavy armor", "Shields"] });

        expect(out.armor).toEqual(["Shields"]);
    });

    it("includes choose-N picks only once they are complete and valid", () => {
        const weaponChoice = mad("AddWeaponProficiencies",
            { weapon: "choice", options: "Longswords,Shortswords,Rapiers,Greataxes", count: "2" });
        const f = feature("Weapon Master", weaponChoice);
        const key = equipProfChoiceKey("weapon", f);

        // no picks yet → nothing contributed, choice pending
        const unpicked = characterWith([f]);
        expect(applyEquipProficiencyMads(unpicked, EMPTY).weapons).toEqual([]);
        expect(pendingEquipProfChoices("weapon", unpicked, f)).toEqual([weaponChoice]);
        expect(resolveEquipProfChoice("weapon", unpicked, f, weaponChoice)).toBeNull();

        // partial or out-of-options picks stay pending
        expect(applyEquipProficiencyMads(characterWith([f], { [key]: "Longswords" }), EMPTY).weapons).toEqual([]);
        expect(applyEquipProficiencyMads(characterWith([f], { [key]: "Longswords,Clubs" }), EMPTY).weapons).toEqual([]);

        // complete picks land on the sheet and clear the pending state
        const picked = characterWith([f], { [key]: "Longswords,Rapiers" });
        expect(applyEquipProficiencyMads(picked, EMPTY).weapons).toEqual(["Longswords", "Rapiers"]);
        expect(pendingEquipProfChoices("weapon", picked, f)).toEqual([]);
    });

    it("keys picks per kind so one feature can carry several choice kinds", () => {
        const f = feature("Adept",
            mad("AddArmorProficiencies", { armor: "choice", options: "Light Armor,Shields", count: "1" }),
            mad("AddToolProficiencies", { tool: "choice", options: "Smith's Tools,Brewer's Supplies", count: "1" }),
        );
        expect(equipProfChoiceKey("armor", f)).not.toBe(equipProfChoiceKey("tool", f));

        const c = characterWith([f], {
            [equipProfChoiceKey("armor", f)]: "Shields",
            [equipProfChoiceKey("tool", f)]: "Smith's Tools",
        });
        const out = applyEquipProficiencyMads(c, EMPTY);
        expect(out.armor).toEqual(["Shields"]);
        expect(out.tools).toEqual(["Smith's Tools"]);
    });
});

describe("choice helpers", () => {
    it("parses options and count with a count floor of 1", () => {
        const m = mad("AddArmorProficiencies", { armor: "choice", options: " Light Armor , Shields ", count: "0" });
        expect(equipProfChoiceOptions(m)).toEqual(["Light Armor", "Shields"]);
        expect(equipProfChoiceCount(m)).toBe(1);
    });
});

describe("resolveCharacterEquipProficiencies", () => {
    const barbarian = {
        name: "Barbarian",
        proficiencies: { armor: ["Light Armor", "Medium Armor", "Shields"], weapons: ["Simple Weapons", "Martial Weapons"], tools: [] },
    };
    const soldier = { name: "Soldier", proficiencies: { armor: [], weapons: [], tools: ["Gaming Set"] } };

    const fullCharacter = (features: FeatureDetail[], proficiencyChoices: Record<string, string> = {}): Character =>
        ({
            levels: [{ class: "Barbarian", features }],
            className: "Barbarian",
            background: "Soldier",
            race: { species: "dwarf", features: [] },
            features: [],
            proficiencyChoices,
        } as unknown as Character);

    it("unions class and background base lists before applying mads", () => {
        const out = resolveCharacterEquipProficiencies(fullCharacter([]), [barbarian], [soldier]);
        expect(out.armor).toEqual(["Light Armor", "Medium Armor", "Shields"]);
        expect(out.weapons).toEqual(["Simple Weapons", "Martial Weapons"]);
        expect(out.tools).toEqual(["Gaming Set"]);
    });

    it("applies flat grants and resolved choice picks on top of the base lists", () => {
        const training = feature("Dwarven Combat Training", mad("AddWeaponProficiencies", { weapon: "Warhammers" }));
        const toolChoice = feature("Tool Proficiency",
            mad("AddToolProficiencies", { tool: "choice", options: "Smith's Tools,Brewer's Supplies,Mason's Tools", count: "1" }));
        const c = fullCharacter([training, toolChoice], {
            [equipProfChoiceKey("tool", toolChoice)]: "Smith's Tools",
        });

        const out = resolveCharacterEquipProficiencies(c, [barbarian], [soldier]);
        expect(out.weapons).toEqual(["Simple Weapons", "Martial Weapons", "Warhammers"]);
        expect(out.tools).toEqual(["Gaming Set", "Smith's Tools"]);
    });

    it("resolves class rows by name from the supplied (edition-scoped) list only", () => {
        const wrongEdition = { name: "Barbarian", proficiencies: { armor: ["Heavy Armor"], weapons: [], tools: [] } };
        const out = resolveCharacterEquipProficiencies(fullCharacter([]), [wrongEdition], []);
        // whatever list the caller supplies wins — the resolver never reaches for global data
        expect(out.armor).toEqual(["Heavy Armor"]);
    });

    it("returns only mads grants when neither class nor background resolves", () => {
        const training = feature("Elf Weapon Training", mad("AddWeaponProficiencies", { weapon: "Longbows" }));
        const out = resolveCharacterEquipProficiencies(fullCharacter([training]), [], []);
        expect(out).toEqual({ armor: [], weapons: ["Longbows"], tools: [] });
    });
});
