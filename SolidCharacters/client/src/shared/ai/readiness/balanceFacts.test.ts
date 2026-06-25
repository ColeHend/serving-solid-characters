import { describe, it, expect, vi } from "vitest";
import type { HomebrewPreview } from "../toolDispatcher";
import type { HomebrewKind } from "../homebrewKind";

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
});
