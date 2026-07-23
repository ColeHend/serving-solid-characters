import { describe, expect, it } from "vitest";
import type { FeatureOption } from "../../../../../../../models/generated";
import {
    blankOptionRow,
    hydrateOptionRow,
    hydrateOptionsConfig,
    parseScalingRows,
    serializeOptionRows,
    serializeOptionsConfig,
    serializeScaling,
} from "../optionsFeature.shared";

describe("countScaling round-trip", () => {
    it("parses 'level:count' pairs into rows, dropping malformed pairs", () => {
        expect(parseScalingRows("2:2,5:3")).toEqual([
            { level: "2", count: "2" },
            { level: "5", count: "3" },
        ]);
        expect(parseScalingRows(" 2:2 , junk , :4 , 7: ")).toEqual([{ level: "2", count: "2" }]);
        expect(parseScalingRows(undefined)).toEqual([]);
    });

    it("serializes valid rows ascending by level and drops invalid ones", () => {
        expect(serializeScaling([
            { level: "5", count: "3" },
            { level: "2", count: "2" },
            { level: "", count: "9" },
            { level: "x", count: "1" },
        ])).toBe("2:2,5:3");
    });

    it("optionsConfig: scaling wins over the flat count; empty config serializes to undefined", () => {
        expect(serializeOptionsConfig({ label: "Invocation", count: "4", scalingRows: [{ level: "2", count: "2" }] }))
            .toEqual({ label: "Invocation", countScaling: "2:2" });
        expect(serializeOptionsConfig({ label: "", count: "3", scalingRows: [] })).toEqual({ count: 3 });
        expect(serializeOptionsConfig({ label: "", count: "", scalingRows: [] })).toBeUndefined();
        expect(hydrateOptionsConfig({ label: "Maneuver", countScaling: "3:3,7:5" })).toEqual({
            label: "Maneuver", count: "", scalingRows: [{ level: "3", count: "3" }, { level: "7", count: "5" }],
        });
    });
});

describe("option row serialization", () => {
    const storedOption: FeatureOption = {
        name: "Armor of Shadows",
        description: "Cast mage armor at will.",
        prerequisites: { minLevel: 5, requiredFeature: "Pact of the Blade", text: "5th level" },
        mads: [{ command: "AddSpells", value: { ID: "sp1" }, type: 0, prerequisites: [], group: 0 }],
    };

    it("hydrate → serialize round-trips a stored option, dropping unset mad rows", () => {
        const row = hydrateOptionRow(storedOption, 1);
        expect(row.name).toBe("Armor of Shadows");
        expect(row.minLevel).toBe("5");
        expect(row.requiredFeature).toBe("Pact of the Blade");
        expect(row.mads.get()).toHaveLength(1);

        const [out] = serializeOptionRows([row]);
        expect(out).toMatchObject({
            name: "Armor of Shadows",
            description: "Cast mage armor at will.",
            prerequisites: { minLevel: 5, requiredFeature: "Pact of the Blade", text: "5th level" },
        });
        expect(out.mads).toEqual([{ command: "AddSpells", value: { ID: "sp1" }, type: 0, prerequisites: [], group: 0 }]);
    });

    it("drops nameless rows and squeezes commas out of names (picks persist as a name CSV)", () => {
        const named = blankOptionRow(1);
        named.name = "Foo,  the  Great,";
        named.description = "d";
        const nameless = blankOptionRow(2);
        nameless.description = "orphan";

        const out = serializeOptionRows([named, nameless]);
        expect(out).toHaveLength(1);
        expect(out[0].name).toBe("Foo the Great");
    });

    it("round-trips a mad's own prerequisites through the row's prereq forms", () => {
        const option: FeatureOption = {
            name: "Thirsting Blade",
            description: "Attack twice.",
            mads: [{
                command: "AddActions",
                value: { name: "Extra Attack" },
                type: 0,
                prerequisites: [{ value: "Level", operation: ">=", keyValue: "5", group: 0 }],
                group: 0,
            }],
        };
        const row = hydrateOptionRow(option, 1);
        expect(row.prereqForms.size).toBe(1);

        const [out] = serializeOptionRows([row]);
        expect(out.mads).toEqual([{
            command: "AddActions",
            value: { name: "Extra Attack" },
            type: 0,
            prerequisites: [{ value: "Level", operation: ">=", keyValue: "5", group: 0 }],
            group: 0,
        }]);
    });

    it("omits prerequisites entirely when all fields are blank/invalid", () => {
        const row = blankOptionRow(1);
        row.name = "Plain";
        row.description = "d";
        row.minLevel = "0"; // below 1 → invalid → omitted
        const [out] = serializeOptionRows([row]);
        expect(out.prerequisites).toBeUndefined();
    });
});
