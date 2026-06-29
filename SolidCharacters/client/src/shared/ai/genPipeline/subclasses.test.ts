import { describe, it, expect } from "vitest";
import {
    coerceSubclassBrief, subclassBriefStep, subclassFeatureLevels, subclassNames, validateSubclassBrief,
} from "./subclasses";
import type { WorkingClass } from "./types";

/**
 * Phase E unit coverage (plan §14): the subclass loop's pure pieces — feature-level planning derived from
 * the unlock level, brief coercion, and the gate (well-formed + distinct from siblings).
 */

describe("subclassFeatureLevels", () => {
    it("starts at the unlock level and follows a +3/+7/+11 cadence", () => {
        expect(subclassFeatureLevels(3)).toEqual([3, 6, 10, 14]);
        expect(subclassFeatureLevels(1)).toEqual([1, 4, 8, 12]);
    });

    it("clamps to level 20 and de-duplicates", () => {
        expect(subclassFeatureLevels(18)).toEqual([18]);            // 21/25/29 dropped
        expect(subclassFeatureLevels(20)).toEqual([20]);
    });

    it("returns nothing for an out-of-range unlock level", () => {
        expect(subclassFeatureLevels(0)).toEqual([]);
        expect(subclassFeatureLevels(99)).toEqual([]);
    });
});

describe("coerceSubclassBrief", () => {
    it("trims name and brief", () => {
        expect(coerceSubclassBrief({ name: "  Path of the Tempest  ", brief: "  Storm-callers.  " }))
            .toEqual({ name: "Path of the Tempest", brief: "Storm-callers." });
    });
});

describe("validateSubclassBrief", () => {
    it("passes a named, briefed, distinct subclass", () => {
        expect(validateSubclassBrief({ name: "Path of the Tempest", brief: "Stormwardens who chain their Charge into lightning." }, ["Path of the Gale"]))
            .toEqual([]);
    });

    it("requires a name and a real brief", () => {
        expect(validateSubclassBrief({ name: "", brief: "Stormwardens who chain lightning together." }, [])).toContain("The subclass needs a name.");
        expect(validateSubclassBrief({ name: "Tempest", brief: "Storms." }, []).some(e => /brief/i.test(e))).toBe(true);
    });

    it("rejects a name a sibling already took (case-insensitive)", () => {
        const errs = validateSubclassBrief({ name: "path of the tempest", brief: "A second take on the same storm idea." }, ["Path of the Tempest"]);
        expect(errs.some(e => /already a subclass named/i.test(e))).toBe(true);
    });
});

describe("subclassBriefStep", () => {
    it("tells the model which of N it is designing and gates via validateSubclassBrief", () => {
        const spec = subclassBriefStep(1, 3, ["Path of the Gale"]);
        expect(spec.task).toContain("subclass 2 of 3");
        expect(spec.tool.name).toBe("subclass_brief");

        const dup = spec.parse({ name: "Path of the Gale", brief: "A clashing duplicate of the first subclass." });
        expect(dup.errors.length).toBeGreaterThan(0);
    });
});

describe("subclassNames", () => {
    it("lists the named subclasses on the working class", () => {
        const working: WorkingClass = { subclasses: [{ name: "A", features: [] }, { name: "", features: [] }, { name: "B", features: [] }] };
        expect(subclassNames(working)).toEqual(["A", "B"]);
    });
});
