import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import type { FeatureDetail } from "../../../models/generated";
import { Character, MovementType } from "../../../models/character.model";

// Same import-time mocks as useMadCharacters.test.ts — keep the suite off IndexedDB/network.
vi.mock("../dndInfo/useDndFeatures", () => ({ useDndFeature: () => ({ allFeatures: () => [] }) }));
vi.mock("../dndInfo/info/all/feats", () => ({ useDnDFeats: () => () => [] }));

import { collectMadFeatures, useMadCharacters, pendingStatChoices, pendingProficiencyChoices, statChoiceKey, pendingSpellChoices, spellChoiceKey, spellChoiceOptions, pendingExpertiseChoices, expertiseChoiceKey, pendingResistanceChoices, resistanceChoiceKey, pendingGroupChoice, groupChoiceKey, featureGroupOptions } from "./useMadCharacters";

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

    it("holds choice-form ASI pending until BOTH abilities are picked, then applies +1 to each", () => {
        const c = level5Barbarian();
        const asi = c.levels[3].features.find(f => f.name.startsWith("Ability Score"))!;
        expect(asi).toBeDefined();
        expect(pendingStatChoices(c, asi)).toHaveLength(1);

        const before = useMadCharacters(structuredClone(c), collectMadFeatures(c));
        expect(before.stats.con).toBe(14);

        // one of two picks → still pending, nothing applies
        c.statChoices = { [statChoiceKey(asi)]: "con" };
        expect(pendingStatChoices(c, asi)).toHaveLength(1);
        const halfPicked = useMadCharacters(structuredClone(c), collectMadFeatures(c));
        expect(halfPicked.stats.con).toBe(14);

        // both picks → +1 to each distinct ability
        c.statChoices = { [statChoiceKey(asi)]: "con,str" };
        expect(pendingStatChoices(c, asi)).toHaveLength(0);
        const after = useMadCharacters(structuredClone(c), collectMadFeatures(c));
        expect(after.stats.con).toBe(15);
        expect(after.stats.str).toBe(17);
    });

    it("Rage carries an Info-type AddUses command (limited-use tracking)", () => {
        const rage = barb.features["1"].find((f: FeatureDetail) => f.name === "Rage")!;
        const uses = rage.metadata?.mads?.find((m: { command: string }) => m.command === "AddUses");
        expect(uses).toBeDefined();
        expect(uses!.type).toBe(1);
    });

    it("the returnActions flag surfaces Rage as a granted bonus action", () => {
        const c = level5Barbarian();
        const actions = useMadCharacters(structuredClone(c), collectMadFeatures(c), { returnActions: true });
        expect(actions).toEqual(expect.arrayContaining([
            expect.objectContaining({ name: "Rage", actionType: "bonusAction" }),
        ]));
    });

    it("a level 2 Cleric gains Turn Undead from Channel Divinity (1/rest)", () => {
        const cleric = read("2014/classes.json").find((cl: { name: string }) => cl.name === "Cleric");
        const c = new Character();
        for (let lvl = 1; lvl <= 2; lvl++) {
            c.levels.push({ class: "Cleric", level: lvl, hitDie: 8, features: cleric.features[String(lvl)] ?? [] });
        }
        const actions = useMadCharacters(structuredClone(c), collectMadFeatures(c), { returnActions: true });
        expect(actions).toEqual(expect.arrayContaining([
            expect.objectContaining({ name: "Turn Undead", actionType: "action", source: "Channel Divinity (1/rest)" }),
        ]));
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

    it("the 2024 ASI feat asks for two distinct picks and applies +1 to each", () => {
        const asi = findFeat("Ability Score Improvement");
        expect(asi?.metadata?.mads).toEqual([expect.objectContaining({
            command: "AddStats",
            value: { stat: "choice", statValue: "1", options: "str,dex,con,int,wis,cha", count: "2" },
        })]);

        const c = new Character();
        c.stats = { str: 10, dex: 10, con: 10, int: 8, wis: 10, cha: 10 };
        c.features = [asi];

        // one pick → pending, nothing applies
        c.statChoices = { [statChoiceKey(asi)]: "int" };
        expect(pendingStatChoices(c, asi)).toHaveLength(1);
        expect(useMadCharacters(structuredClone(c), collectMadFeatures(c)).stats.int).toBe(8);

        // two distinct picks → +1 each
        c.statChoices = { [statChoiceKey(asi)]: "int,wis" };
        expect(pendingStatChoices(c, asi)).toHaveLength(0);
        const applied = useMadCharacters(structuredClone(c), collectMadFeatures(c));
        expect(applied.stats.int).toBe(9);
        expect(applied.stats.wis).toBe(11);
    });

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

    it("a level 2 Cleric gains Channel Divinity's Magic actions via the returnActions flag", () => {
        const cleric = classes2024.find((cl: { name: string }) => cl.name === "Cleric");
        const c = new Character();
        for (let lvl = 1; lvl <= 2; lvl++) {
            c.levels.push({ class: "Cleric", level: lvl, hitDie: 8, features: cleric.features[String(lvl)] ?? [] });
        }
        const actions = useMadCharacters(structuredClone(c), collectMadFeatures(c), { returnActions: true });
        expect(actions).toEqual(expect.arrayContaining([
            expect.objectContaining({ name: "Divine Spark", actionType: "action", source: "Channel Divinity" }),
            expect.objectContaining({ name: "Turn Undead", actionType: "action", source: "Channel Divinity" }),
        ]));
    });

    it("a level 1 Fighter gains Second Wind as a bonus action", () => {
        const fighter = classes2024.find((cl: { name: string }) => cl.name === "Fighter");
        const c = new Character();
        c.levels.push({ class: "Fighter", level: 1, hitDie: 10, features: fighter.features["1"] ?? [] });
        const actions = useMadCharacters(structuredClone(c), collectMadFeatures(c), { returnActions: true });
        expect(actions).toEqual(expect.arrayContaining([
            expect.objectContaining({ name: "Second Wind", actionType: "bonusAction" }),
        ]));
    });

    it("Magic Initiate holds its two spell choices pending, then grants the picked spells", () => {
        const mi = findFeat("Magic Initiate");
        expect(mi?.metadata?.mads?.length).toBeGreaterThan(0);

        const c = new Character();
        c.features = [mi];

        // two choice commands (2 cantrips + 1 level-1 spell), both pending — nothing applies yet
        const pending = pendingSpellChoices(c, mi);
        expect(pending).toHaveLength(2);
        expect(collectMadFeatures(c)).toEqual([]);

        const cantrips = pending.find(m => m.value["spellLevel"] === "0")!;
        const level1 = pending.find(m => m.value["spellLevel"] === "1")!;
        expect(spellChoiceOptions(cantrips).length).toBeGreaterThan(20); // Cleric∪Druid∪Wizard cantrips
        expect(spellChoiceOptions(level1).length).toBeGreaterThan(40);

        const cantripPicks = spellChoiceOptions(cantrips).slice(0, 2);
        const spellPick = spellChoiceOptions(level1)[0];
        c.spellChoices = {
            [spellChoiceKey(mi, cantrips)]: cantripPicks.join(","),
            [spellChoiceKey(mi, level1)]: spellPick,
        };

        const applied = useMadCharacters(structuredClone(c), collectMadFeatures(c));
        expect(applied.spells.map(s => s.name).sort()).toEqual([...cantripPicks, spellPick].sort());
        expect(pendingSpellChoices(c, mi)).toHaveLength(0);
    });

    it("Boon of the Night Spirit grants Merge with Shadows as a bonus action", () => {
        const boon = findFeat("Boon of the Night Spirit");
        const c = new Character();
        c.features = [boon];
        const actions = useMadCharacters(structuredClone(c), collectMadFeatures(c), { returnActions: true });
        expect(actions).toEqual(expect.arrayContaining([
            expect.objectContaining({ name: "Merge with Shadows", actionType: "bonusAction", source: "Boon of the Night Spirit" }),
        ]));
    });
});

describe("choice-form Expertise / Resistances / branch groups from the generated data", () => {
    const classes2024 = read("2024/classes.json");
    const races2024 = read("2024/races.json");
    const spells2024 = read("2024/spells.json");
    const spellId = (name: string) => spells2024.find((s: { name: string }) => s.name === name)?.id;

    const proficientSkill = (stat: "str" | "dex" | "con" | "int" | "wis" | "cha") =>
        ({ stat, value: 0, proficient: true, expertise: false });

    it("2024 Wizard Scholar holds its expertise choice pending, then doubles the picked skill", () => {
        const wizard = classes2024.find((c: { name: string }) => c.name === "Wizard");
        const scholar = wizard.features["2"].find((f: FeatureDetail) => f.name === "Scholar")!;
        expect(scholar.metadata?.mads).toHaveLength(1);

        const c = new Character();
        c.features = [scholar];
        c.proficiencies.skills = { "Arcana": proficientSkill("int"), "History": proficientSkill("int") };

        expect(pendingExpertiseChoices(c, scholar)).toHaveLength(1);
        expect(collectMadFeatures(c)).toEqual([]);

        c.proficiencyChoices = { [expertiseChoiceKey(scholar)]: "Arcana" };
        expect(pendingExpertiseChoices(c, scholar)).toHaveLength(0);
        const applied = useMadCharacters(structuredClone(c), collectMadFeatures(c));
        expect(applied.proficiencies.skills["Arcana"].expertise).toBe(true);
        expect(applied.proficiencies.skills["History"].expertise).toBe(false);
    });

    it("Rogue Expertise at levels 1 and 6 are independent picks (distinct feature ids)", () => {
        const rogue = classes2024.find((c: { name: string }) => c.name === "Rogue");
        const exp1 = rogue.features["1"].find((f: FeatureDetail) => f.name === "Expertise")!;
        const exp6 = rogue.features["6"].find((f: FeatureDetail) => f.name === "Expertise")!;
        expect(exp1.id).not.toBe(exp6.id);

        const c = new Character();
        c.features = [exp1, exp6];
        c.proficiencies.skills = {
            "Stealth": proficientSkill("dex"), "Acrobatics": proficientSkill("dex"),
            "Deception": proficientSkill("cha"), "Persuasion": proficientSkill("cha"),
        };
        c.proficiencyChoices = { [expertiseChoiceKey(exp1)]: "Stealth,Acrobatics" };

        expect(pendingExpertiseChoices(c, exp1)).toHaveLength(0);
        expect(pendingExpertiseChoices(c, exp6)).toHaveLength(1);
        const applied = useMadCharacters(structuredClone(c), collectMadFeatures(c));
        expect(applied.proficiencies.skills["Stealth"].expertise).toBe(true);
        expect(applied.proficiencies.skills["Deception"].expertise).toBe(false);
    });

    it("2024 Dragonborn Damage Resistance resolves the picked ancestry damage type", () => {
        const dragonborn = races2024.find((r: { name: string }) => r.name === "Dragonborn");
        const resistance = dragonborn.traits
            .map((t: { details: FeatureDetail }) => t.details)
            .find((d: FeatureDetail) => d?.name === "Damage Resistance")!;
        expect(resistance.metadata?.mads).toHaveLength(1);

        const c = new Character();
        c.race = { species: "Dragonborn", features: [resistance] };
        expect(pendingResistanceChoices(c, resistance)).toHaveLength(1);
        expect(collectMadFeatures(c)).toEqual([]);

        c.proficiencyChoices = { [resistanceChoiceKey(resistance)]: "Lightning" };
        const applied = useMadCharacters(structuredClone(c), collectMadFeatures(c));
        expect(applied.resistances.map(r => r.type)).toContain("Lightning");
    });

    it("2024 Elven Lineage is a pick-one branch group; the chosen branch applies with level gates", () => {
        const elf = races2024.find((r: { name: string }) => r.name === "Elf");
        const traits = elf.traits.map((t: { details: FeatureDetail }) => t.details).filter(Boolean);
        const lineage = traits.find((d: FeatureDetail) => d.name === "Elven Lineage")!;

        expect(featureGroupOptions(lineage)).toEqual([
            { group: 1, label: "Drow" },
            { group: 2, label: "High Elf" },
            { group: 3, label: "Wood Elf" },
        ]);

        const c = new Character();
        // Character.level derives from the levels array — a single level-1 entry to start.
        c.levels.push({ class: "Wizard", level: 1, hitDie: 6, features: [] });
        c.Speed = 30;
        c.race = { species: "Elf", features: traits };

        // structuredClone drops the class's `level` getter — restore it as plain data, the shape
        // a Dexie-loaded character has at runtime (the spell prerequisites read character.level).
        const applyNow = () => {
            const clone = structuredClone(c) as Character & { level: number };
            clone.level = c.levels.length;
            return useMadCharacters(clone, collectMadFeatures(c));
        };

        // Unpicked → base traits apply (Darkvision 60) but no lineage benefit.
        expect(pendingGroupChoice(c, lineage)).toBe(true);
        const before = applyNow();
        expect(before.senses?.darkvision).toBe(60);
        expect(before.Speed).toBe(30);
        expect(before.spells).toHaveLength(0);

        // Wood Elf picked → Speed becomes 35 and Druidcraft is known at level 1...
        c.proficiencyChoices = { [groupChoiceKey(lineage)]: "3" };
        const woodL1 = applyNow();
        expect(woodL1.Speed).toBe(35);
        expect(woodL1.senses?.darkvision).toBe(60); // Drow's 120 ft stays dormant
        expect(woodL1.spells.map(s => s.name)).toContain(spellId("Druidcraft"));
        // ...but the level-3/5 spells stay gated behind character level.
        expect(woodL1.spells.map(s => s.name)).not.toContain(spellId("Longstrider"));

        for (let lvl = 2; lvl <= 5; lvl++) {
            c.levels.push({ class: "Wizard", level: lvl, hitDie: 6, features: [] });
        }
        const woodL5 = applyNow();
        expect(woodL5.spells.map(s => s.name)).toContain(spellId("Longstrider"));
        expect(woodL5.spells.map(s => s.name)).toContain(spellId("Pass without Trace"));
    });

    it("2014 High Elf Cantrip offers the wizard cantrip list and grants the pick", () => {
        const highElf = read("2014/subraces.json").find((r: { name: string }) => r.name === "High Elf");
        const cantrip = highElf.traits
            .map((t: { details: FeatureDetail }) => t.details)
            .find((d: FeatureDetail) => d?.name === "Cantrip")!;

        const c = new Character();
        c.race = { species: "High Elf", features: [cantrip] };
        expect(pendingSpellChoices(c, cantrip)).toHaveLength(1);

        const mad = cantrip.metadata!.mads![0];
        const options = spellChoiceOptions(mad as never);
        expect(options).toHaveLength(14);

        c.spellChoices = { [spellChoiceKey(cantrip, mad as never)]: options[0] };
        expect(pendingSpellChoices(c, cantrip)).toHaveLength(0);
        const applied = useMadCharacters(structuredClone(c), collectMadFeatures(c));
        expect(applied.spells.map(s => s.name)).toContain(options[0]);
    });

    it("2014 Paladin Divine Health grants immunity to Disease", () => {
        const paladin = read("2014/classes.json").find((cl: { name: string }) => cl.name === "Paladin");
        const c = new Character();
        for (let lvl = 1; lvl <= 3; lvl++) {
            c.levels.push({ class: "Paladin", level: lvl, hitDie: 10, features: paladin.features[String(lvl)] ?? [] });
        }
        const applied = useMadCharacters(structuredClone(c), collectMadFeatures(c));
        expect(applied.immunities.map(i => i.type)).toContain("Disease");
    });
});
