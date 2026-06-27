import { describe, it, expect, vi } from "vitest";
import type { HomebrewPreview } from "../tools/toolDispatcher";
import type { HomebrewKind } from "../refs/homebrewKind";

vi.mock("../../customHooks/homebrewManager", () => ({ homebrewManager: { classes: () => [] } }));

import { balanceFacts, parseDice } from "./balanceFacts";

function preview(kind: HomebrewKind, entity: unknown): HomebrewPreview {
    return { previewId: "p", toolCallId: "t", kind, title: "X", entity: entity as HomebrewPreview["entity"], valid: true, errors: [] };
}

describe("parseDice", () => {
    it("extracts NdM dice groups", () => {
        expect(parseDice("deals 3d6 fire and then 1d4 at the start of its next turn")).toEqual([
            { count: 3, sides: 6 }, { count: 1, sides: 4 },
        ]);
    });

    it("tolerates spacing and ignores non-dice numbers", () => {
        expect(parseDice("range 60 feet, 2 d8 radiant")).toEqual([{ count: 2, sides: 8 }]);
    });

    it("returns nothing when there are no dice", () => {
        expect(parseDice("you gain resistance to fire damage")).toEqual([]);
    });
});

describe("balanceFacts", () => {
    it("summarizes dice, save DC, and spell level for a spell", () => {
        const facts = balanceFacts(preview("spell", {
            description: "DC 15 Dexterity saving throw, taking 3d6 fire damage on a failure.",
            level: "1",
        }));
        expect(facts).toContain("3d6");
        expect(facts).toContain("DC: 15");
        expect(facts).toContain("Dexterity");
        expect(facts).toContain("Spell level: 1");
    });

    it("reports the average damage from dndMath", () => {
        // 3d6 averages 10.5
        expect(balanceFacts(preview("spell", { description: "3d6 damage", level: "0" }))).toContain("10.5");
    });

    it("returns an empty string when there is no description", () => {
        expect(balanceFacts(preview("feat", { details: {} }))).toBe("");
    });

    it("notes rarity for magic items", () => {
        expect(balanceFacts(preview("magic_item", { desc: "grants 1d6 extra cold damage", rarity: "Rare" }))).toContain("Rare");
    });

    it("summarizes a class's chassis, feature spread and dice across features", () => {
        const facts = balanceFacts(preview("class", {
            hitDie: "d10", primaryAbility: "STR",
            features: {
                1: [{ name: "Storm's Charge", description: "Spend 1 Charge to deal 2d6 thunder damage." }],
                5: [{ name: "Tempest", description: "You can attack twice." }],
            },
        }));
        expect(facts).toContain("hit die d10");
        expect(facts).toContain("primary ability STR");
        expect(facts).toContain("2d6");                  // dice scanned across the feature text
        expect(facts).toContain("Grants 2 features");
        expect(facts).toContain("levels 1, 5");
    });

    it("flags dead levels but excludes ASI levels", () => {
        const sparse = balanceFacts(preview("class", {
            hitDie: "d8", primaryAbility: "DEX",
            features: { 1: [{ name: "A", description: "Does a thing, dealing 1d4." }] },
        }));
        expect(sparse).toMatch(/Levels with no new feature/);

        // A class with a feature at every level except an ASI level (4) has NO dead level.
        const features: Record<number, { name: string; description: string }[]> = {};
        for (let l = 1; l <= 20; l++) if (l !== 4) features[l] = [{ name: `F${l}`, description: `Feature ${l} deals 1d6.` }];
        const full = balanceFacts(preview("class", { hitDie: "d8", primaryAbility: "STR", features }));
        expect(full).not.toMatch(/Levels with no new feature/);
    });
});
