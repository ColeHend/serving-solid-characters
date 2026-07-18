import { describe, it, expect, vi } from "vitest";
import type { Character, CharacterSavingThrow } from "../../../models/character.model";
import { MovementType, itemRefName } from "../../../models/character.model";
import type { FeatureDetail, MadFeature as StoredMad, MagicItem } from "../../../models/generated";

// These handler modules resolve data hooks at import time; mock them so the
// suite never touches IndexedDB (same pattern as commandAgent.test.ts).
vi.mock("../dndInfo/useDndFeatures", () => ({ useDndFeature: () => ({ allFeatures: () => [] }) }));
vi.mock("../dndInfo/info/all/feats", () => ({ useDnDFeats: () => () => [] }));

import { addMadFeature, collectMadFeatures, collectMagicItemMads, useMadCharacters, choiceStatMads, pendingStatChoices, statChoiceKey, choiceProficiencyMads, pendingProficiencyChoices, proficiencyChoiceOptions, proficiencyChoiceCount, choiceSpellMads, pendingSpellChoices, spellChoiceKey, spellChoiceOptions, spellChoiceCount, choiceItemMads, pendingItemChoices, itemChoiceKey, itemChoiceOptions, itemChoiceCount } from "./useMadCharacters";
import { MadFeature, MadType } from "./madModels";
import { featureUsage, resetFeatureUses, SHORT_REST, LONG_REST, RechargeType } from "./commands/useUsesFeature";
import { rollBonusAmount } from "./commands/useRollBonusFeature";

function makeCharacter(overrides: Partial<Character> = {}): Character {
    return {
        name: "Test",
        level: 1,
        levels: [],
        spells: [],
        race: { species: "human", features: [] },
        ArmorClass: 10,
        Speed: 30,
        className: "Fighter",
        subclass: [],
        background: "",
        alignment: "",
        features: [],
        proficiencies: { skills: {}, other: {} },
        savingThrows: [],
        rollAdvantages: [],
        attacksPerAction: 1,
        featureUses: {},
        resistances: [],
        vulnerabilities: [],
        immunities: [],
        languages: [],
        health: { max: 10, current: 10, temp: 0 },
        stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        items: {
            inventory: [], equipped: [], attuned: [],
            currency: { platinumPieces: 0, goldPieces: 0, electrumPieces: 0, sliverPieces: 0, copperPieces: 0 },
        },
        ...overrides,
    } as Character;
}

function makeMagicItem(overrides: Partial<MagicItem> = {}): MagicItem {
    return {
        id: "", name: "Item", desc: "", rarity: "", cost: "", category: "", weight: "",
        properties: {},
        ...overrides,
    } as MagicItem;
}

function mad(command: string, value: Record<string, string>, type = MadType.Character): MadFeature {
    return { command: command as MadFeature["command"], value, type, prerequisites: [], group: 0 };
}

/** The runtime shapes are identical; the two MadFeature declarations differ only nominally (enum vs enum). */
const stored = (...mads: MadFeature[]) => mads as unknown as StoredMad[];

describe("AddClassFeature / RemoveClassFeature", () => {
    it("pushes a named feature with description and category onto character.features", () => {
        const c = addMadFeature(makeCharacter(), mad("AddClassFeature", {
            name: "Agonizing Blast",
            description: "Add CHA to eldritch blast damage.",
            category: "Eldritch Invocation",
        }));

        expect(c.features).toHaveLength(1);
        expect(c.features[0]).toMatchObject({
            id: "",
            name: "Agonizing Blast",
            description: "Add CHA to eldritch blast damage.",
            metadata: { category: "Eldritch Invocation" },
        });
    });

    it("dedupes by name and ignores a missing name", () => {
        let c = addMadFeature(makeCharacter(), mad("AddClassFeature", { name: "Archery" }));
        c = addMadFeature(c, mad("AddClassFeature", { name: "archery" }));
        c = addMadFeature(c, mad("AddClassFeature", { name: "   " }));

        expect(c.features).toHaveLength(1);
    });

    it("removes by case-insensitive name", () => {
        let c = addMadFeature(makeCharacter(), mad("AddClassFeature", { name: "Defense" }));
        c = addMadFeature(c, mad("RemoveClassFeature", { name: "DEFENSE" }));

        expect(c.features).toHaveLength(0);
    });
});

describe("AddSavingThrows", () => {
    // Creator-built characters pre-fill all six saves as non-proficient.
    const prefilled = (): CharacterSavingThrow[] =>
        (["str", "dex", "con", "int", "wis", "cha"] as const).map(stat => ({ stat, proficient: false }));

    it("upgrades a pre-filled entry to proficient instead of skipping it", () => {
        const c = addMadFeature(makeCharacter({ savingThrows: prefilled() }), mad("AddSavingThrows", { stat: "con" }));

        expect(c.savingThrows).toHaveLength(6);
        expect(c.savingThrows.find(st => st.stat === "con")?.proficient).toBe(true);
        expect(c.savingThrows.filter(st => st.proficient)).toHaveLength(1);
    });

    it("pushes an absent stat as a proficient entry", () => {
        const c = addMadFeature(makeCharacter(), mad("AddSavingThrows", { stat: "wis" }));

        expect(c.savingThrows).toEqual([{ stat: "wis", proficient: true }]);
    });

    it("re-adding an already-proficient stat stays a single proficient entry", () => {
        let c = addMadFeature(makeCharacter(), mad("AddSavingThrows", { stat: "dex" }));
        c = addMadFeature(c, mad("AddSavingThrows", { stat: "dex" }));

        expect(c.savingThrows).toEqual([{ stat: "dex", proficient: true }]);
    });
});

describe("AddAdvantage / RemoveAdvantage", () => {
    it("initializes rollAdvantages on old-shape characters and appends", () => {
        const old = makeCharacter();
        delete (old as Partial<Character>).rollAdvantages;

        const c = addMadFeature(old, mad("AddAdvantage", {
            rollType: "SavingThrow", mode: "advantage", stat: "wis", condition: "against being frightened",
        }));

        expect(c.rollAdvantages).toEqual([{
            rollType: "SavingThrow", mode: "advantage", stat: "wis", condition: "against being frightened",
        }]);
    });

    it("dedupes identical grants and drops invalid rollType/mode", () => {
        let c = addMadFeature(makeCharacter(), mad("AddAdvantage", { rollType: "Initiative", mode: "advantage" }));
        c = addMadFeature(c, mad("AddAdvantage", { rollType: "Initiative", mode: "advantage" }));
        c = addMadFeature(c, mad("AddAdvantage", { rollType: "Nonsense", mode: "advantage" }));
        c = addMadFeature(c, mad("AddAdvantage", { rollType: "Initiative", mode: "sideways" }));

        expect(c.rollAdvantages).toHaveLength(1);
    });

    it("keeps disadvantage as a separate Add and removes only the matching entry", () => {
        let c = addMadFeature(makeCharacter(), mad("AddAdvantage", { rollType: "WeaponAttack", mode: "advantage" }));
        c = addMadFeature(c, mad("AddAdvantage", { rollType: "WeaponAttack", mode: "disadvantage" }));

        expect(c.rollAdvantages).toHaveLength(2);

        c = addMadFeature(c, mad("RemoveAdvantage", { rollType: "WeaponAttack", mode: "disadvantage" }));

        expect(c.rollAdvantages).toEqual([{ rollType: "WeaponAttack", mode: "advantage", stat: undefined, condition: undefined }]);
    });

    it("remove without stat clears all matching entries; with stat narrows the match", () => {
        let c = addMadFeature(makeCharacter(), mad("AddAdvantage", { rollType: "SavingThrow", mode: "advantage", stat: "dex" }));
        c = addMadFeature(c, mad("AddAdvantage", { rollType: "SavingThrow", mode: "advantage", stat: "wis" }));

        const narrowed = addMadFeature(c, mad("RemoveAdvantage", { rollType: "SavingThrow", mode: "advantage", stat: "dex" }));
        expect(narrowed.rollAdvantages).toHaveLength(1);
        expect(narrowed.rollAdvantages[0].stat).toBe("wis");

        const cleared = addMadFeature(narrowed, mad("RemoveAdvantage", { rollType: "SavingThrow", mode: "advantage" }));
        expect(cleared.rollAdvantages).toHaveLength(0);
    });
});

describe("AddAttacks / RemoveAttacks", () => {
    it("adds to attacksPerAction, defaulting a missing field to 1", () => {
        const old = makeCharacter();
        delete (old as Partial<Character>).attacksPerAction;

        const c = addMadFeature(old, mad("AddAttacks", { amount: "1" }));

        expect(c.attacksPerAction).toBe(2);
    });

    it("floors at 1 on remove and ignores non-numeric amounts", () => {
        let c = addMadFeature(makeCharacter(), mad("RemoveAttacks", { amount: "5" }));
        expect(c.attacksPerAction).toBe(1);

        c = addMadFeature(c, mad("AddAttacks", { amount: "lots" }));
        expect(c.attacksPerAction).toBe(1);
    });
});

describe("Uses (Info command)", () => {
    it("is a no-op on the character", () => {
        const before = makeCharacter();
        const after = addMadFeature(before, mad("AddUses", { amount: "2", recharge: "Long Rest" }, MadType.Info));

        expect(after).toEqual(makeCharacter());
    });

    it("featureUsage prefers the AddUses command over metadata", () => {
        const feature: FeatureDetail = {
            id: "", name: "Rage", description: "",
            metadata: {
                uses: 9, recharge: "Short Rest",
                mads: stored(mad("AddUses", { amount: "2", recharge: "Long Rest" }, MadType.Info)),
            },
        };

        expect(featureUsage(feature)).toEqual({ max: 2, recharge: LONG_REST });
    });

    it("featureUsage resolves a PB-fraction max against the character level", () => {
        const pbScaled = (fraction: string): FeatureDetail => ({
            id: "", name: "Divine Sense", description: "",
            metadata: { mads: stored(mad("AddUses", { proficiencyBonus: fraction, recharge: "Long Rest" }, MadType.Info)) },
        });

        expect(featureUsage(pbScaled("Full PB"), 5)).toEqual({ max: 3, recharge: LONG_REST });
        expect(featureUsage(pbScaled("Half PB"), 5)).toEqual({ max: 1, recharge: LONG_REST });
        // no level → treated as level 1 (PB 2)
        expect(featureUsage(pbScaled("Full PB"))).toEqual({ max: 2, recharge: LONG_REST });
        // Third PB floors to 0 at PB 2 → not limited-use rather than max 0
        expect(featureUsage(pbScaled("Third PB"), 1)).toBeNull();
    });

    it("featureUsage prefers a fixed amount over a PB fraction when both are present", () => {
        const both: FeatureDetail = {
            id: "", name: "Rage", description: "",
            metadata: { mads: stored(mad("AddUses", { amount: "4", proficiencyBonus: "Full PB", recharge: "Long Rest" }, MadType.Info)) },
        };

        expect(featureUsage(both, 5)).toEqual({ max: 4, recharge: LONG_REST });
    });

    it("featureUsage falls back to metadata.uses/recharge and returns null otherwise", () => {
        const fromMeta: FeatureDetail = {
            id: "", name: "Second Wind", description: "",
            metadata: { uses: 1, recharge: "short rest" },
        };
        const unlimited: FeatureDetail = { id: "", name: "Darkvision", description: "" };

        expect(featureUsage(fromMeta)).toEqual({ max: 1, recharge: SHORT_REST });
        expect(featureUsage(unlimited)).toBeNull();
    });

    it("resetFeatureUses: long rest clears everything, short rest only short-rest features", () => {
        const limited: { name: string; recharge: RechargeType }[] = [
            { name: "Rage", recharge: LONG_REST },
            { name: "Action Surge", recharge: SHORT_REST },
        ];
        const c = makeCharacter({ featureUses: { "Rage": 1, "Action Surge": 1 } });

        const afterShort = resetFeatureUses(makeCharacter({ featureUses: { ...c.featureUses } }), SHORT_REST, limited);
        expect(afterShort.featureUses).toEqual({ "Rage": 1 });

        const afterLong = resetFeatureUses(c, LONG_REST, limited);
        expect(afterLong.featureUses).toEqual({});
    });
});

describe("AddStats set mode and choice form", () => {
    it("mode=set sets the score instead of adding", () => {
        const c = addMadFeature(makeCharacter(), mad("AddStats", { stat: "int", statValue: "19", mode: "set" }));
        expect(c.stats.int).toBe(19);
    });

    it("default mode still adds", () => {
        const c = addMadFeature(makeCharacter(), mad("AddStats", { stat: "con", statValue: "2" }));
        expect(c.stats.con).toBe(12);
    });

    it("an unresolved choice-form command reaching the handler is a no-op", () => {
        const c = addMadFeature(makeCharacter(), mad("AddStats", { stat: "choice", options: "str,dex", statValue: "1" }));
        expect(c.stats).toEqual(makeCharacter().stats);
    });

    it("collectMadFeatures excludes unresolved choice mads and substitutes the pick when resolved", () => {
        const choice = mad("AddStats", { stat: "choice", options: "str,dex,con,int,wis,cha", statValue: "2" });
        const feature: FeatureDetail = { id: "asi-4", name: "Ability Score Improvement", description: "", metadata: { mads: stored(choice) } };
        const base = makeCharacter({
            levels: [{ class: "Fighter", level: 4, hitDie: 10, features: [feature] }],
        });

        // no pick yet → excluded, listed as pending
        expect(collectMadFeatures(base)).toEqual([]);
        expect(pendingStatChoices(base, feature)).toHaveLength(1);
        expect(choiceStatMads(feature)).toHaveLength(1);

        // picked (keyed by feature id) → substituted concrete stat
        const picked = makeCharacter({ ...base, statChoices: { "asi-4": "con" } });
        const collected = collectMadFeatures(picked);
        expect(collected).toHaveLength(1);
        expect(collected[0].value["stat"]).toBe("con");
        expect(pendingStatChoices(picked, feature)).toHaveLength(0);

        const applied = useMadCharacters(structuredClone(picked), collected);
        expect(applied.stats.con).toBe(12);
    });

    it("a pick outside the options list does not apply", () => {
        const choice = mad("AddStats", { stat: "choice", options: "str,dex", statValue: "1" });
        const feature: FeatureDetail = { id: "half-feat", name: "Athlete", description: "", metadata: { mads: stored(choice) } };
        const c = makeCharacter({
            features: [feature],
            statChoices: { "half-feat": "cha" },
        });
        expect(collectMadFeatures(c)).toEqual([]);
    });

    it("statChoiceKey prefers the id and falls back to the name", () => {
        expect(statChoiceKey({ id: "abc", name: "ASI" })).toBe("abc");
        expect(statChoiceKey({ id: "", name: "ASI" })).toBe("ASI");
    });
});

describe("collectMadFeatures", () => {
    it("gathers Character-type mads from levels, race, and top-level features and skips Info", () => {
        const speed = mad("AddSpeed", { speed: "10" });
        const advantage = mad("AddAdvantage", { rollType: "Initiative", mode: "advantage" });
        const classFeature = mad("AddClassFeature", { name: "Dueling" });
        const uses = mad("AddUses", { amount: "2" }, MadType.Info);

        const c = makeCharacter({
            levels: [{
                class: "Barbarian", level: 1, hitDie: 12,
                features: [{ id: "", name: "Rage", description: "", metadata: { mads: stored(speed, uses) } }],
            }],
            race: {
                species: "elf",
                features: [{ id: "", name: "Fey Ancestry", description: "", metadata: { mads: stored(advantage) } }],
            },
            features: [{ id: "", name: "Fighting Style", description: "", metadata: { mads: stored(classFeature) } }],
        });

        expect(collectMadFeatures(c)).toEqual([speed, advantage, classFeature]);
    });

    it("includes a Character-type mad carried by a background feature", () => {
        const bgMad = mad("AddClassFeature", { name: "Shelter of the Faithful" });
        const c = makeCharacter({
            backgroundFeatures: [{ id: "", name: "Acolyte", description: "", metadata: { mads: stored(bgMad) } }],
        });

        expect(collectMadFeatures(c)).toEqual([bgMad]);
    });

    it("applying the collected mads to fresh clones is deterministic", () => {
        const base = makeCharacter({
            levels: [{
                class: "Fighter", level: 1, hitDie: 10,
                features: [{
                    id: "", name: "Extra Attack", description: "",
                    metadata: { mads: stored(mad("AddAttacks", { amount: "1" }), mad("AddSpeed", { speed: "10" })) },
                }],
            }],
        });

        const first = useMadCharacters(structuredClone(base), collectMadFeatures(base));
        const second = useMadCharacters(structuredClone(base), collectMadFeatures(base));

        expect(first).toEqual(second);
        expect(first.attacksPerAction).toBe(2);
        expect(first.Speed).toBe(40);
        expect(base.attacksPerAction).toBe(1);
        expect(base.Speed).toBe(30);
    });
});

describe("AddMovement / RemoveMovement", () => {
    it("initializes movementTypes on old-shape characters and stores an explicit speed", () => {
        const c = addMadFeature(makeCharacter(), mad("AddMovement", { movementType: "fly", speed: "60" }));
        expect(c.movementTypes).toContain(MovementType.Fly);
        expect(c.movementSpeeds?.fly).toBe(60);
    });

    it("a mode without a speed moves at the walking speed (no movementSpeeds entry)", () => {
        const c = addMadFeature(makeCharacter(), mad("AddMovement", { movementType: "climb" }));
        expect(c.movementTypes).toContain(MovementType.Climb);
        expect(c.movementSpeeds?.climb).toBeUndefined();
    });

    it("dedupes modes and keeps the best explicit speed", () => {
        let c = addMadFeature(makeCharacter(), mad("AddMovement", { movementType: "swim", speed: "40" }));
        c = addMadFeature(c, mad("AddMovement", { movementType: "swim", speed: "30" }));
        expect(c.movementTypes.filter(t => t === MovementType.Swim)).toHaveLength(1);
        expect(c.movementSpeeds?.swim).toBe(40);
    });

    it("remove drops the mode and its speed; an unknown movementType is a no-op", () => {
        let c = addMadFeature(makeCharacter(), mad("AddMovement", { movementType: "fly", speed: "60" }));
        c = addMadFeature(c, mad("RemoveMovement", { movementType: "fly" }));
        expect(c.movementTypes).not.toContain(MovementType.Fly);
        expect(c.movementSpeeds?.fly).toBeUndefined();

        const untouched = addMadFeature(makeCharacter(), mad("AddMovement", { movementType: "teleport" }));
        expect(untouched.movementTypes ?? []).not.toContain(undefined);
        expect(untouched.movementSpeeds ?? {}).toEqual({});
    });
});

describe("AddSenses / RemoveSenses", () => {
    it("adds a sense with its range and keeps the longest range on overlapping grants", () => {
        let c = addMadFeature(makeCharacter(), mad("AddSenses", { sense: "darkvision", range: "60" }));
        c = addMadFeature(c, mad("AddSenses", { sense: "darkvision", range: "120" }));
        c = addMadFeature(c, mad("AddSenses", { sense: "darkvision", range: "60" }));
        expect(c.senses?.darkvision).toBe(120);
    });

    it("remove deletes the sense; invalid sense or range is a no-op", () => {
        let c = addMadFeature(makeCharacter(), mad("AddSenses", { sense: "blindsight", range: "30" }));
        c = addMadFeature(c, mad("RemoveSenses", { sense: "blindsight" }));
        expect(c.senses?.blindsight).toBeUndefined();

        const invalid = addMadFeature(makeCharacter(), mad("AddSenses", { sense: "x-ray", range: "60" }));
        expect(invalid.senses ?? {}).toEqual({});
        const noRange = addMadFeature(makeCharacter(), mad("AddSenses", { sense: "truesight", range: "" }));
        expect(noRange.senses ?? {}).toEqual({});
    });
});

describe("AddHitPoints / RemoveHitPoints", () => {
    const levels = (n: number) =>
        Array.from({ length: n }, (_, i) => ({ class: "Fighter", level: i + 1, hitDie: 10, features: [] }));

    it("adds a flat amount to health.max", () => {
        const c = addMadFeature(makeCharacter(), mad("AddHitPoints", { amount: "5" }));
        expect(c.health.max).toBe(15);
    });

    it("perLevel scales by the number of levels, treating a level-less character as level 1", () => {
        const c5 = addMadFeature(makeCharacter({ levels: levels(5) }), mad("AddHitPoints", { amount: "1", perLevel: "true" }));
        expect(c5.health.max).toBe(15);

        const c0 = addMadFeature(makeCharacter(), mad("AddHitPoints", { amount: "1", perLevel: "true" }));
        expect(c0.health.max).toBe(11);
    });

    it("remove subtracts (per level too) and floors max at 0; a bad amount is a no-op", () => {
        const c = addMadFeature(makeCharacter({ levels: levels(3) }), mad("RemoveHitPoints", { amount: "2", perLevel: "true" }));
        expect(c.health.max).toBe(4);

        const floored = addMadFeature(makeCharacter(), mad("RemoveHitPoints", { amount: "99" }));
        expect(floored.health.max).toBe(0);

        const bad = addMadFeature(makeCharacter(), mad("AddHitPoints", { amount: "lots" }));
        expect(bad.health.max).toBe(10);
    });
});

describe("AddRollBonus / RemoveRollBonus", () => {
    it("initializes rollBonuses on old-shape characters and appends", () => {
        const old = makeCharacter();
        delete (old as Partial<Character>).rollBonuses;

        const c = addMadFeature(old, mad("AddRollBonus", { rollType: "Initiative", proficiencyBonus: "Full PB" }));

        expect(c.rollBonuses).toEqual([{
            rollType: "Initiative", bonus: undefined, proficiencyBonus: "Full PB", stat: undefined, condition: undefined,
        }]);
    });

    it("dedupes identical grants and drops invalid or empty bonuses", () => {
        let c = addMadFeature(makeCharacter(), mad("AddRollBonus", { rollType: "WeaponAttack", bonus: "2" }));
        c = addMadFeature(c, mad("AddRollBonus", { rollType: "WeaponAttack", bonus: "2" }));
        c = addMadFeature(c, mad("AddRollBonus", { rollType: "Nonsense", bonus: "2" }));
        c = addMadFeature(c, mad("AddRollBonus", { rollType: "WeaponAttack" }));

        expect(c.rollBonuses).toHaveLength(1);
    });

    it("keeps differently-valued bonuses separate and remove narrows by stat/condition", () => {
        let c = addMadFeature(makeCharacter(), mad("AddRollBonus", { rollType: "SavingThrow", bonus: "1" }));
        c = addMadFeature(c, mad("AddRollBonus", { rollType: "SavingThrow", bonus: "1", stat: "dex", condition: "against traps" }));
        expect(c.rollBonuses).toHaveLength(2);

        c = addMadFeature(c, mad("RemoveRollBonus", { rollType: "SavingThrow", bonus: "1", stat: "dex" }));
        expect(c.rollBonuses).toHaveLength(1);
        expect(c.rollBonuses[0].stat).toBeUndefined();
    });

    it("rollBonusAmount resolves flat and PB-fraction values (rounding down)", () => {
        expect(rollBonusAmount({ rollType: "WeaponAttack", bonus: 2 }, 3)).toBe(2);
        expect(rollBonusAmount({ rollType: "Initiative", proficiencyBonus: "Full PB" }, 3)).toBe(3);
        expect(rollBonusAmount({ rollType: "Initiative", proficiencyBonus: "Half PB" }, 3)).toBe(1);
        expect(rollBonusAmount({ rollType: "Initiative", proficiencyBonus: "Third PB" }, 5)).toBe(1);
    });

    it("rollBonusAmount adds a statBonus ability's modifier on top of the base", () => {
        const stats = { str: 8, dex: 14, con: 10, int: 10, wis: 16, cha: 10 };

        // statBonus alone: WIS 16 → +3
        expect(rollBonusAmount({ rollType: "Initiative", statBonus: "wis" }, 3, stats)).toBe(3);
        // flat + statBonus sum: 2 + 3 = 5
        expect(rollBonusAmount({ rollType: "Initiative", bonus: 2, statBonus: "wis" }, 3, stats)).toBe(5);
        // PB fraction + statBonus sum: 3 + 2 (DEX 14) = 5
        expect(rollBonusAmount({ rollType: "Initiative", proficiencyBonus: "Full PB", statBonus: "dex" }, 3, stats)).toBe(5);
        // negative modifiers apply too: STR 8 → -1
        expect(rollBonusAmount({ rollType: "SavingThrow", bonus: 1, statBonus: "str" }, 3, stats)).toBe(0);
        // no stats available → base only
        expect(rollBonusAmount({ rollType: "Initiative", statBonus: "wis" }, 3)).toBe(0);
    });

    it("parses statBonus and keeps it distinct from the stat filter for dedupe", () => {
        let c = addMadFeature(makeCharacter(), mad("AddRollBonus", { rollType: "Initiative", statBonus: "wis" }));
        expect(c.rollBonuses).toHaveLength(1);
        expect(c.rollBonuses[0].statBonus).toBe("wis");
        expect(c.rollBonuses[0].stat).toBeUndefined();

        // same rollType, different statBonus → a distinct grant
        c = addMadFeature(c, mad("AddRollBonus", { rollType: "Initiative", statBonus: "cha" }));
        expect(c.rollBonuses).toHaveLength(2);
        // identical grant dedupes
        c = addMadFeature(c, mad("AddRollBonus", { rollType: "Initiative", statBonus: "wis" }));
        expect(c.rollBonuses).toHaveLength(2);
    });
});

describe("AddProficiencies choice form", () => {
    const skill = (stat: "str" | "dex" | "con" | "int" | "wis" | "cha") =>
        ({ stat, value: 0, proficient: false, expertise: false });
    const skillSet = () => ({
        "Athletics": skill("str"), "Stealth": skill("dex"), "Perception": skill("wis"),
    });

    it("an unresolved choice-form command reaching the handler is a no-op", () => {
        const c = addMadFeature(makeCharacter({ proficiencies: { skills: skillSet(), other: {} } }),
            mad("AddProficiencies", { proficiency: "choice", options: "Athletics,Stealth", count: "1" }));
        expect(Object.values(c.proficiencies.skills).some(s => s.proficient)).toBe(false);
    });

    it("collectMadFeatures excludes unresolved choices and expands complete picks into concrete commands", () => {
        const choice = mad("AddProficiencies", { proficiency: "choice", options: "Athletics,Stealth,Perception", count: "2" });
        const feature: FeatureDetail = { id: "skilled-1", name: "Skilled", description: "", metadata: { mads: stored(choice) } };
        const base = makeCharacter({
            features: [feature],
            proficiencies: { skills: skillSet(), other: {} },
        });

        // no picks yet → excluded, listed as pending
        expect(collectMadFeatures(base)).toEqual([]);
        expect(pendingProficiencyChoices(base, feature)).toHaveLength(1);
        expect(choiceProficiencyMads(feature)).toHaveLength(1);
        expect(proficiencyChoiceOptions(choice)).toEqual(["Athletics", "Stealth", "Perception"]);
        expect(proficiencyChoiceCount(choice)).toBe(2);

        // incomplete picks (1 of 2) stay pending
        const partial = makeCharacter({ ...base, proficiencyChoices: { "skilled-1": "Athletics" } });
        expect(collectMadFeatures(partial)).toEqual([]);

        // complete picks → one concrete AddProficiencies per skill, and they apply
        const picked = makeCharacter({ ...base, proficiencyChoices: { "skilled-1": "Athletics,Stealth" } });
        const collected = collectMadFeatures(picked);
        expect(collected).toHaveLength(2);
        expect(collected.map(m => m.value["proficiency"]).sort()).toEqual(["Athletics", "Stealth"]);
        expect(pendingProficiencyChoices(picked, feature)).toHaveLength(0);

        const applied = useMadCharacters(structuredClone(picked), collected);
        expect(applied.proficiencies.skills["Athletics"].proficient).toBe(true);
        expect(applied.proficiencies.skills["Stealth"].proficient).toBe(true);
        expect(applied.proficiencies.skills["Perception"].proficient).toBe(false);
    });

    it("a pick outside the options list does not apply", () => {
        const choice = mad("AddProficiencies", { proficiency: "choice", options: "Athletics,Stealth", count: "1" });
        const feature: FeatureDetail = { id: "p1", name: "Primal Knowledge", description: "", metadata: { mads: stored(choice) } };
        const c = makeCharacter({
            features: [feature],
            proficiencyChoices: { "p1": "Perception" },
        });
        expect(collectMadFeatures(c)).toEqual([]);
    });
});

describe("AddArmorClass flat bonus", () => {
    it("a bonus-only command adds flat AC (no stats field)", () => {
        const c = addMadFeature(makeCharacter(), mad("AddArmorClass", { bonus: "1" }));
        expect(c.ArmorClass).toBe(11);
    });

    it("the formula form still adds ability modifiers", () => {
        const c = addMadFeature(makeCharacter({ stats: { str: 10, dex: 14, con: 12, int: 10, wis: 10, cha: 10 } }),
            mad("AddArmorClass", { bonus: "10", stats: "dex,con" }));
        // 10 (base) + 10 (bonus) + 2 (dex) + 1 (con)
        expect(c.ArmorClass).toBe(23);
    });

    it("remove subtracts the flat bonus symmetrically", () => {
        let c = addMadFeature(makeCharacter(), mad("AddArmorClass", { bonus: "2" }));
        c = addMadFeature(c, mad("RemoveArmorClass", { bonus: "2" }));
        expect(c.ArmorClass).toBe(10);
    });
});

describe("AddSpeed modes", () => {
    it("mode=set sets the walking speed instead of adding", () => {
        const c = addMadFeature(makeCharacter(), mad("AddSpeed", { speed: "30", mode: "set" }));
        expect(c.Speed).toBe(30);
    });

    it("default mode still adds", () => {
        const c = addMadFeature(makeCharacter(), mad("AddSpeed", { speed: "10" }));
        expect(c.Speed).toBe(40);
    });

    it("RemoveSpeed with mode=set is a no-op; plain remove subtracts", () => {
        const noop = addMadFeature(makeCharacter(), mad("RemoveSpeed", { speed: "30", mode: "set" }));
        expect(noop.Speed).toBe(30);

        const c = addMadFeature(makeCharacter(), mad("RemoveSpeed", { speed: "10" }));
        expect(c.Speed).toBe(20);
    });
});

describe("AddActions / RemoveActions", () => {
    it("initializes grantedActions on old-shape characters and stores all fields", () => {
        const old = makeCharacter();
        delete (old as Partial<Character>).grantedActions;

        const c = addMadFeature(old, mad("AddActions", {
            name: "Second Wind", actionType: "bonusAction", description: "regain 1d10 + level HP", source: "Second Wind",
        }));

        expect(c.grantedActions).toEqual([{
            name: "Second Wind", actionType: "bonusAction", description: "regain 1d10 + level HP", source: "Second Wind",
        }]);
    });

    it("dedupes by case-insensitive name + actionType and drops invalid input", () => {
        let c = addMadFeature(makeCharacter(), mad("AddActions", { name: "Rage", actionType: "bonusAction" }));
        c = addMadFeature(c, mad("AddActions", { name: "RAGE", actionType: "bonusAction" }));
        c = addMadFeature(c, mad("AddActions", { name: "   ", actionType: "bonusAction" }));
        c = addMadFeature(c, mad("AddActions", { name: "Dodge Roll", actionType: "somersault" }));

        expect(c.grantedActions).toHaveLength(1);
    });

    it("the same name with a different actionType is a distinct grant; remove matches name + type", () => {
        let c = addMadFeature(makeCharacter(), mad("AddActions", { name: "Wild Shape", actionType: "action" }));
        c = addMadFeature(c, mad("AddActions", { name: "Wild Shape", actionType: "bonusAction" }));

        expect(c.grantedActions).toHaveLength(2);

        c = addMadFeature(c, mad("RemoveActions", { name: "wild shape", actionType: "action" }));

        expect(c.grantedActions).toEqual([{
            name: "Wild Shape", actionType: "bonusAction", description: undefined, source: undefined,
        }]);
    });
});

describe("useMadCharacters returnActions flag", () => {
    const grants = () => [
        mad("AddActions", { name: "Channel Divinity", actionType: "action" }),
        mad("AddActions", { name: "Retaliation", actionType: "reaction" }),
        mad("AddSpeed", { speed: "10" }),
    ];

    it("the two-arg call still returns the character", () => {
        const c = useMadCharacters(makeCharacter(), grants());
        expect(c.Speed).toBe(40);
        expect(c.grantedActions).toHaveLength(2);
    });

    it("returnActions returns only the mads-granted actions instead of the character", () => {
        const actions = useMadCharacters(makeCharacter(), grants(), { returnActions: true });
        expect(actions.map(a => a.name).sort()).toEqual(["Channel Divinity", "Retaliation"]);
        expect(actions.every(a => ["action", "bonusAction", "reaction"].includes(a.actionType))).toBe(true);
    });

    it("returnActions on a character with no action grants is an empty list, not defaults", () => {
        const actions = useMadCharacters(makeCharacter(), [mad("AddSpeed", { speed: "10" })], { returnActions: true });
        expect(actions).toEqual([]);
    });
});

describe("AddSpells choice form", () => {
    it("an unresolved choice reaching the handler is a no-op", () => {
        const c = addMadFeature(makeCharacter(), mad("AddSpells", { ID: "choice", options: "sp-1,sp-2", count: "1" }));
        expect(c.spells).toEqual([]);
    });

    it("collectMadFeatures excludes unresolved choices and expands complete picks into concrete grants", () => {
        const cantrips = mad("AddSpells", { ID: "choice", options: "sp-a,sp-b,sp-c", count: "2", spellLevel: "0" });
        const feature: FeatureDetail = { id: "mi-1", name: "Magic Initiate", description: "", metadata: { mads: stored(cantrips) } };
        const base = makeCharacter({ features: [feature] });

        // no picks yet → excluded, listed as pending
        expect(collectMadFeatures(base)).toEqual([]);
        expect(pendingSpellChoices(base, feature)).toHaveLength(1);
        expect(choiceSpellMads(feature)).toHaveLength(1);
        expect(spellChoiceOptions(cantrips)).toEqual(["sp-a", "sp-b", "sp-c"]);
        expect(spellChoiceCount(cantrips)).toBe(2);
        expect(spellChoiceKey(feature, cantrips)).toBe("mi-1::0");

        // incomplete picks (1 of 2) stay pending
        const partial = makeCharacter({ ...base, spellChoices: { "mi-1::0": "sp-a" } });
        expect(collectMadFeatures(partial)).toEqual([]);

        // complete picks → one concrete AddSpells per spell, and they apply
        const picked = makeCharacter({ ...base, spellChoices: { "mi-1::0": "sp-a,sp-c" } });
        const collected = collectMadFeatures(picked);
        expect(collected).toHaveLength(2);
        expect(collected.map(m => m.value["ID"]).sort()).toEqual(["sp-a", "sp-c"]);
        expect(pendingSpellChoices(picked, feature)).toHaveLength(0);

        const applied = useMadCharacters(structuredClone(picked), collected);
        expect(applied.spells.map(s => s.name).sort()).toEqual(["sp-a", "sp-c"]);
    });

    it("two choice commands on one feature resolve independently via distinct spellLevel keys", () => {
        const cantrips = mad("AddSpells", { ID: "choice", options: "c-1,c-2", count: "1", spellLevel: "0" });
        const level1 = mad("AddSpells", { ID: "choice", options: "l-1,l-2", count: "1", spellLevel: "1" });
        const feature: FeatureDetail = { id: "mi-2", name: "Magic Initiate", description: "", metadata: { mads: stored(cantrips, level1) } };

        // only the cantrip picked → the level-1 choice stays pending
        const half = makeCharacter({ features: [feature], spellChoices: { "mi-2::0": "c-1" } });
        expect(collectMadFeatures(half).map(m => m.value["ID"])).toEqual(["c-1"]);
        expect(pendingSpellChoices(half, feature)).toHaveLength(1);

        // both picked → both resolve
        const full = makeCharacter({ features: [feature], spellChoices: { "mi-2::0": "c-1", "mi-2::1": "l-2" } });
        expect(collectMadFeatures(full).map(m => m.value["ID"]).sort()).toEqual(["c-1", "l-2"]);
        expect(pendingSpellChoices(full, feature)).toHaveLength(0);
    });

    it("a pick outside the options list does not apply", () => {
        const choice = mad("AddSpells", { ID: "choice", options: "sp-a,sp-b", count: "1", spellLevel: "1" });
        const feature: FeatureDetail = { id: "mi-3", name: "Magic Initiate", description: "", metadata: { mads: stored(choice) } };
        const c = makeCharacter({ features: [feature], spellChoices: { "mi-3::1": "sp-z" } });
        expect(collectMadFeatures(c)).toEqual([]);
    });

    it("fixed-form AddSpells still applies unchanged", () => {
        const c = addMadFeature(makeCharacter(), mad("AddSpells", { ID: "spell-123" }));
        expect(c.spells).toEqual([{ name: "spell-123", prepared: false }]);
    });
});

describe("AddItems choice form", () => {
    it("an unresolved choice reaching the handler is a no-op", () => {
        const c = addMadFeature(makeCharacter(), mad("AddItems", { ID: "choice", options: "it-1,it-2", count: "1" }));
        expect(c.items.inventory).toEqual([]);
    });

    it("collectMadFeatures excludes unresolved choices and expands complete picks into concrete grants", () => {
        const choice = mad("AddItems", { ID: "choice", options: "it-a,it-b,it-c", count: "2" });
        const feature: FeatureDetail = { id: "pack-1", name: "Adventuring Gear", description: "", metadata: { mads: stored(choice) } };
        const base = makeCharacter({ features: [feature] });

        // no picks yet → excluded, listed as pending
        expect(collectMadFeatures(base)).toEqual([]);
        expect(pendingItemChoices(base, feature)).toHaveLength(1);
        expect(choiceItemMads(feature)).toHaveLength(1);
        expect(itemChoiceOptions(choice)).toEqual(["it-a", "it-b", "it-c"]);
        expect(itemChoiceCount(choice)).toBe(2);
        expect(itemChoiceKey(feature, choice)).toBe("pack-1::items::it-a,it-b,it-c");

        // incomplete picks (1 of 2) stay pending
        const partial = makeCharacter({ ...base, itemChoices: { "pack-1::items::it-a,it-b,it-c": "it-a" } });
        expect(collectMadFeatures(partial)).toEqual([]);

        // complete picks → one concrete AddItems per item, and they apply
        const picked = makeCharacter({ ...base, itemChoices: { "pack-1::items::it-a,it-b,it-c": "it-a,it-c" } });
        const collected = collectMadFeatures(picked);
        expect(collected).toHaveLength(2);
        expect(collected.map(m => m.value["ID"]).sort()).toEqual(["it-a", "it-c"]);
        expect(pendingItemChoices(picked, feature)).toHaveLength(0);

        const applied = useMadCharacters(structuredClone(picked), collected);
        expect([...applied.items.inventory].map(itemRefName).sort()).toEqual(["it-a", "it-c"]);
    });

    it("two choice commands on one feature resolve independently via distinct options keys", () => {
        const weapon = mad("AddItems", { ID: "choice", options: "w-1,w-2", count: "1" });
        const tool = mad("AddItems", { ID: "choice", options: "t-1,t-2", count: "1" });
        const feature: FeatureDetail = { id: "kit-1", name: "Starter Kit", description: "", metadata: { mads: stored(weapon, tool) } };

        // only the weapon picked → the tool choice stays pending
        const half = makeCharacter({ features: [feature], itemChoices: { "kit-1::items::w-1,w-2": "w-2" } });
        expect(collectMadFeatures(half).map(m => m.value["ID"])).toEqual(["w-2"]);
        expect(pendingItemChoices(half, feature)).toHaveLength(1);

        // both picked → both resolve
        const full = makeCharacter({
            features: [feature],
            itemChoices: { "kit-1::items::w-1,w-2": "w-2", "kit-1::items::t-1,t-2": "t-1" },
        });
        expect(collectMadFeatures(full).map(m => m.value["ID"]).sort()).toEqual(["t-1", "w-2"]);
        expect(pendingItemChoices(full, feature)).toHaveLength(0);
    });

    it("a pick outside the options list does not apply", () => {
        const choice = mad("AddItems", { ID: "choice", options: "it-a,it-b", count: "1" });
        const feature: FeatureDetail = { id: "kit-2", name: "Kit", description: "", metadata: { mads: stored(choice) } };
        const c = makeCharacter({ features: [feature], itemChoices: { "kit-2::items::it-a,it-b": "it-z" } });
        expect(collectMadFeatures(c)).toEqual([]);
    });

    it("fixed-form AddItems still applies unchanged", () => {
        const c = addMadFeature(makeCharacter(), mad("AddItems", { ID: "it-123" }));
        expect(c.items.inventory).toEqual([{ name: "it-123" }]);
    });
});

describe("collectMagicItemMads", () => {
    // A character carrying the given equipped/attuned item names.
    const carrying = (equipped: string[], attuned: string[] = []): Character =>
        makeCharacter({
            items: {
                inventory: [], equipped, attuned,
                currency: { platinumPieces: 0, goldPieces: 0, electrumPieces: 0, sliverPieces: 0, copperPieces: 0 },
            },
        });

    it("an equipped item with no attunement requirement contributes its Character-type mads", () => {
        const bonus = mad("AddStats", { stat: "int", statValue: "19", mode: "set" });
        const item = makeMagicItem({ name: "Headband of Intellect", metadata: { mads: stored(bonus) } });

        expect(collectMagicItemMads(carrying(["Headband of Intellect"]), [item])).toEqual([bonus]);
    });

    it("an attunement item contributes only when attuned, not merely equipped", () => {
        const ac = mad("AddArmorClass", { bonus: "1" });
        const ring = makeMagicItem({
            name: "Ring of Protection",
            properties: { attunement: "requires attunement" },
            metadata: { mads: stored(ac) },
        });

        expect(collectMagicItemMads(carrying(["Ring of Protection"]), [ring])).toEqual([]);
        expect(collectMagicItemMads(carrying([], ["Ring of Protection"]), [ring])).toEqual([ac]);
    });

    it("matches equipped/attuned names case-insensitively", () => {
        const speed = mad("AddSpeed", { speed: "10" });
        const item = makeMagicItem({ name: "Boots of Speed", metadata: { mads: stored(speed) } });

        expect(collectMagicItemMads(carrying(["boots of SPEED"]), [item])).toEqual([speed]);
    });

    it("contributes nothing for items that are neither equipped nor attuned", () => {
        const speed = mad("AddSpeed", { speed: "10" });
        const item = makeMagicItem({ name: "Cloak of Elvenkind", metadata: { mads: stored(speed) } });

        expect(collectMagicItemMads(carrying(["Some Other Item"]), [item])).toEqual([]);
    });

    it("filters out Info-type mads, keeping only Character-type", () => {
        const speed = mad("AddSpeed", { speed: "10" });
        const uses = mad("AddUses", { amount: "3" }, MadType.Info);
        const item = makeMagicItem({ name: "Wand of Wonder", metadata: { mads: stored(speed, uses) } });

        expect(collectMagicItemMads(carrying(["Wand of Wonder"]), [item])).toEqual([speed]);
    });

    it("skips choice-form mads — items have no picker to resolve them", () => {
        const itemChoice = mad("AddItems", { ID: "choice", options: "it-1,it-2", count: "1" });
        const speed = mad("AddSpeed", { speed: "10" });
        const item = makeMagicItem({ name: "Bag of Tricks", metadata: { mads: stored(itemChoice, speed) } });

        expect(collectMagicItemMads(carrying(["Bag of Tricks"]), [item])).toEqual([speed]);
    });
});
