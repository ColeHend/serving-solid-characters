import { describe, it, expect } from "vitest";
import { applySkeleton, coerceSkeleton, skeletonSummaryLines, validateSkeleton, type SkeletonPlan } from "./skeleton";
import type { WorkingClass } from "./types";

/**
 * Phase B unit tests (plan §14, pure functions first): coercion of untrusted tool input, the skeleton
 * gate, and the carry-forward of an approved skeleton onto the working class.
 */

const goodRaw = {
    name: "Stormwarden",
    primary_ability: "str",
    hit_die: "D10",
    core_mechanic: "Builds Charge by taking or dealing damage, spent on thunderous strikes.",
    caster_type: "none",
    subclass_count: 3,
    subclass_level: 3,
    fits_concept: "A storm bound in armour.",
};

describe("coerceSkeleton", () => {
    it("normalizes ability/hit-die case and clamps the subclass plan", () => {
        const s = coerceSkeleton(goodRaw);
        expect(s.name).toBe("Stormwarden");
        expect(s.primaryAbility).toBe("STR");
        expect(s.hitDie).toBe("d10");
        expect(s.casterType).toBe("none");
        expect(s.subclassCount).toBe(3);
        expect(s.subclassLevel).toBe(3);
    });

    it("zeroes the subclass level when there are no subclasses", () => {
        const s = coerceSkeleton({ ...goodRaw, subclass_count: 0, subclass_level: 7 });
        expect(s.subclassCount).toBe(0);
        expect(s.subclassLevel).toBe(0);
    });

    it("falls back to a non-caster on an unknown caster type", () => {
        expect(coerceSkeleton({ ...goodRaw, caster_type: "psionic" }).casterType).toBe("none");
    });
});

describe("validateSkeleton", () => {
    it("accepts a complete, legal skeleton", () => {
        expect(validateSkeleton(coerceSkeleton(goodRaw))).toEqual([]);
    });

    it("rejects a bad hit die and a non-ability primary", () => {
        const errors = validateSkeleton(coerceSkeleton({ ...goodRaw, hit_die: "d7", primary_ability: "luck" }));
        expect(errors.some(e => /hit die/i.test(e))).toBe(true);
        expect(errors.some(e => /primary ability/i.test(e.toLowerCase()))).toBe(true);
    });

    it("requires a real core mechanic and a name", () => {
        const errors = validateSkeleton(coerceSkeleton({ ...goodRaw, name: "", core_mechanic: "uh" }));
        expect(errors.some(e => /name/i.test(e))).toBe(true);
        expect(errors.some(e => /core mechanic/i.test(e))).toBe(true);
    });
});

describe("applySkeleton + summary", () => {
    it("writes every skeleton field onto the working class", () => {
        const working: WorkingClass = {};
        const plan: SkeletonPlan = coerceSkeleton(goodRaw);
        applySkeleton(working, plan);
        expect(working).toMatchObject({
            name: "Stormwarden", primaryAbility: "STR", hitDie: "d10", casterType: "none",
            subclassCount: 3, subclassLevel: 3,
        });
        expect(working.coreMechanic).toContain("Charge");
    });

    it("renders one ratification line per decision", () => {
        const lines = skeletonSummaryLines(coerceSkeleton(goodRaw));
        expect(lines.join("\n")).toMatch(/Hit die: d10/);
        expect(lines.join("\n")).toMatch(/Primary ability: STR/);
        expect(lines.some(l => /Subclasses: 3.*level 3/.test(l))).toBe(true);
    });
});
