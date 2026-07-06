import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import type { FeatureDetail } from "../../../models/generated";
import { Character, MovementType } from "../../../models/character.model";

// Same import-time mocks as useMadCharacters.test.ts — keep the suite off IndexedDB/network.
vi.mock("../dndInfo/useDndFeatures", () => ({ useDndFeature: () => ({ allFeatures: () => [] }) }));
vi.mock("../dndInfo/info/all/feats", () => ({ useDnDFeats: () => () => [] }));

import { collectMadFeatures, useMadCharacters, pendingStatChoices, pendingProficiencyChoices, statChoiceKey } from "./useMadCharacters";

/**
 * Integration gate: the GENERATED server SRD JSON (SolidCharacters.Repository/data/srd)
 * must drive the real mads runtime. If the generator's command shapes drift from what
 * the sheet handlers expect, this fails before anything ships.
 */
const DATA = path.resolve(__dirname, "../../../../../../SolidCharacters.Repository/data/srd");
const read = (rel: string) => JSON.parse(fs.readFileSync(path.join(DATA, rel), "utf8"));

describe("generated SRD data through the mads runtime (2014)", () => {
    const classes = read("2014/classes.json");
    const races = read("2014/races.json");
    const barb = classes.find((c: { name: string }) => c.name === "Barbarian");
    const dwarf = races.find((r: { name: string }) => r.name === "Dwarf");

    function level5Barbarian(): Character {
        const c = new Character();
        c.stats = { str: 16, dex: 14, con: 14, int: 8, wis: 12, cha: 10 };
        for (let lvl = 1; lvl <= 5; lvl++) {
            c.levels.push({ class: "Barbarian", level: lvl, hitDie: 12, features: barb.features[String(lvl)] ?? [] });
        }
        c.race = { species: "Dwarf", features: dwarf.traits.map((t: { details: FeatureDetail }) => t.details) };
        return c;
    }

    it("applies Unarmored Defense, Fast Movement, Extra Attack and Dwarven Resilience from the data", () => {
        const c = level5Barbarian();
        const applied = useMadCharacters(structuredClone(c), collectMadFeatures(c));

        expect(applied.ArmorClass).toBe(14); // 10 + dex(2) + con(2)
        expect(applied.Speed).toBe(10);      // +10 Fast Movement on a base of 0
        expect(applied.attacksPerAction).toBe(2);
        expect(applied.resistances.map(r => r.type)).toContain("Poison");
        expect(applied.rollAdvantages.length).toBeGreaterThan(0);
        expect(applied.senses?.darkvision).toBe(60); // Dwarf Darkvision trait
    });

    it("holds choice-form ASI pending until picked, then applies the pick", () => {
        const c = level5Barbarian();
        const asi = c.levels[3].features.find(f => f.name.startsWith("Ability Score"))!;
        expect(asi).toBeDefined();
        expect(pendingStatChoices(c, asi)).toHaveLength(1);

        const before = useMadCharacters(structuredClone(c), collectMadFeatures(c));
        expect(before.stats.con).toBe(14);

        c.statChoices = { [statChoiceKey(asi)]: "con" };
        const after = useMadCharacters(structuredClone(c), collectMadFeatures(c));
        expect(after.stats.con).toBe(16);
    });

    it("Rage carries an Info-type AddUses command (limited-use tracking)", () => {
        const rage = barb.features["1"].find((f: FeatureDetail) => f.name === "Rage")!;
        const uses = rage.metadata?.mads?.find((m: { command: string }) => m.command === "AddUses");
        expect(uses).toBeDefined();
        expect(uses!.type).toBe(1);
    });
});

describe("generated SRD data through the mads runtime (2024)", () => {
    const magicItems = read("2024/magic_items.json");
    const classes2024 = read("2024/classes.json");

    it("Headband of Intellect sets Intelligence to 19 via mode=set", () => {
        const headband = magicItems.find((m: { name: string }) => m.name === "Headband of Intellect");
        expect(headband?.metadata?.mads?.length).toBeGreaterThan(0);

        const c = new Character();
        c.stats = { str: 10, dex: 10, con: 10, int: 8, wis: 10, cha: 10 };
        // item mads don't auto-apply yet (equip/attune wiring is a follow-up) — apply directly
        const applied = useMadCharacters(structuredClone(c), headband.metadata.mads);
        expect(applied.stats.int).toBe(19);
    });

    it("Ranger Roving grants +10 speed plus climb and swim modes at the walking speed", () => {
        const ranger = classes2024.find((c: { name: string }) => c.name === "Ranger");
        const c = new Character();
        c.Speed = 30;
        for (let lvl = 1; lvl <= 6; lvl++) {
            c.levels.push({ class: "Ranger", level: lvl, hitDie: 10, features: ranger.features[String(lvl)] ?? [] });
        }

        const applied = useMadCharacters(structuredClone(c), collectMadFeatures(c));
        expect(applied.Speed).toBe(40);
        expect(applied.movementTypes).toContain(MovementType.Climb);
        expect(applied.movementTypes).toContain(MovementType.Swim);
        // no explicit speeds — both modes move at the walking Speed
        expect(applied.movementSpeeds?.climb).toBeUndefined();
        expect(applied.movementSpeeds?.swim).toBeUndefined();
    });

    it("Boots of Striding and Springing set the walking speed to 30", () => {
        const boots = magicItems.find((m: { name: string }) => m.name === "Boots of Striding and Springing");
        expect(boots?.metadata?.mads?.length).toBeGreaterThan(0);

        const c = new Character();
        c.Speed = 25;
        const applied = useMadCharacters(structuredClone(c), boots.metadata.mads);
        expect(applied.Speed).toBe(30);
    });

    const feats2024 = read("2024/feats.json");
    const findFeat = (name: string) => feats2024.find((f: { details: { name: string } }) => f.details?.name === name)?.details;

    it("Alert carries a PB-to-Initiative RollBonus that lands on rollBonuses", () => {
        const alert = findFeat("Alert");
        expect(alert?.metadata?.mads?.length).toBeGreaterThan(0);

        const c = new Character();
        c.features = [alert];
        const applied = useMadCharacters(structuredClone(c), collectMadFeatures(c));
        expect(applied.rollBonuses).toEqual([expect.objectContaining({ rollType: "Initiative", proficiencyBonus: "Full PB" })]);
    });

    it("Archery grants +2 to ranged weapon attacks", () => {
        const archery = findFeat("Archery");
        const c = new Character();
        c.features = [archery];
        const applied = useMadCharacters(structuredClone(c), collectMadFeatures(c));
        expect(applied.rollBonuses).toEqual([expect.objectContaining({ rollType: "WeaponAttack", bonus: 2 })]);
    });

    it("Skilled holds its 3-skill choice pending, then grants the picked proficiencies", () => {
        const skilled = findFeat("Skilled");
        expect(skilled?.metadata?.mads?.length).toBeGreaterThan(0);

        const c = new Character();
        c.features = [skilled];
        c.proficiencies.skills = {
            "Athletics": { stat: "str", value: 0, proficient: false, expertise: false },
            "Stealth": { stat: "dex", value: 0, proficient: false, expertise: false },
            "Perception": { stat: "wis", value: 0, proficient: false, expertise: false },
        };
        expect(pendingProficiencyChoices(c, skilled)).toHaveLength(1);
        expect(collectMadFeatures(c)).toEqual([]);

        c.proficiencyChoices = { [statChoiceKey(skilled)]: "Athletics,Stealth,Perception" };
        const applied = useMadCharacters(structuredClone(c), collectMadFeatures(c));
        expect(applied.proficiencies.skills["Athletics"].proficient).toBe(true);
        expect(applied.proficiencies.skills["Stealth"].proficient).toBe(true);
        expect(applied.proficiencies.skills["Perception"].proficient).toBe(true);
    });

    it("Ring of Protection carries a flat +1 AC and +1 saves; split '+1' items carry exact bonuses", () => {
        const ring = magicItems.find((m: { name: string }) => m.name === "Ring of Protection");
        expect(ring?.metadata?.mads).toHaveLength(2);

        const c = new Character();
        c.ArmorClass = 15;
        const applied = useMadCharacters(structuredClone(c), ring.metadata.mads);
        expect(applied.ArmorClass).toBe(16);
        expect(applied.rollBonuses).toEqual([expect.objectContaining({ rollType: "SavingThrow", bonus: 1 })]);

        // the variant pass split the combined "+1, +2, or +3" entries into concrete items
        const weaponPlus2 = magicItems.find((m: { name: string }) => m.name === "Weapon, +2");
        expect(weaponPlus2?.metadata?.mads).toEqual([expect.objectContaining({ command: "AddRollBonus" })]);
        const gauntlets = magicItems.find((m: { name: string }) => m.name === "Belt of Giant Strength (Hill)");
        expect(gauntlets?.metadata?.mads).toEqual([expect.objectContaining({ command: "AddStats", value: expect.objectContaining({ stat: "str", statValue: "21", mode: "set" }) })]);
        expect(magicItems.find((m: { name: string }) => m.name === "Weapon, +1, +2, or +3")).toBeUndefined();
    });

    it("Barbarian Primal Knowledge offers a 1-skill choice from the barbarian list", () => {
        const barb2024 = classes2024.find((c: { name: string }) => c.name === "Barbarian");
        const primal = Object.values(barb2024.features as Record<string, FeatureDetail[]>).flat()
            .find(f => f.name === "Primal Knowledge")!;
        const choice = primal.metadata?.mads?.find((m: { command: string }) => m.command === "AddProficiencies");
        expect(choice?.value).toMatchObject({ proficiency: "choice", count: "1" });
        expect(choice?.value["options"]).toContain("Athletics");
    });
});
