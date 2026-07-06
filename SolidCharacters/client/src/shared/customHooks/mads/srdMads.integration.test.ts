import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import type { FeatureDetail } from "../../../models/generated";
import { Character } from "../../../models/character.model";

// Same import-time mocks as useMadCharacters.test.ts — keep the suite off IndexedDB/network.
vi.mock("../dndInfo/useDndFeatures", () => ({ useDndFeature: () => ({ allFeatures: () => [] }) }));
vi.mock("../dndInfo/info/all/feats", () => ({ useDnDFeats: () => () => [] }));

import { collectMadFeatures, useMadCharacters, pendingStatChoices, statChoiceKey } from "./useMadCharacters";

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

    it("Headband of Intellect sets Intelligence to 19 via mode=set", () => {
        const headband = magicItems.find((m: { name: string }) => m.name === "Headband of Intellect");
        expect(headband?.metadata?.mads?.length).toBeGreaterThan(0);

        const c = new Character();
        c.stats = { str: 10, dex: 10, con: 10, int: 8, wis: 10, cha: 10 };
        // item mads don't auto-apply yet (equip/attune wiring is a follow-up) — apply directly
        const applied = useMadCharacters(structuredClone(c), headband.metadata.mads);
        expect(applied.stats.int).toBe(19);
    });
});
