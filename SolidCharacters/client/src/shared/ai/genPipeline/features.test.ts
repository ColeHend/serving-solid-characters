import { describe, it, expect } from "vitest";
import { BASE_FEATURE_LEVELS, baseFeatureLevels, coerceFeatureAt, featureStep, validateFeature } from "./features";
import type { WorkingClass, WorkingFeature } from "./types";

/**
 * Phase D unit coverage (plan §14): the feature loop's pure pieces — level planning, level stamping, and the
 * gate (well-formed + no duplicate-in-scope). The orchestrator owns the structure (which levels), the model
 * owns the content, so these tests pin the structure the model never sees.
 */

describe("baseFeatureLevels", () => {
    it("returns the canonical spread when the class has no subclasses", () => {
        const working: WorkingClass = { subclassCount: 0, subclassLevel: 0 };
        expect(baseFeatureLevels(working)).toEqual(BASE_FEATURE_LEVELS);
    });

    it("drops the subclass-grant level so that level reads as 'choose a subclass'", () => {
        const working: WorkingClass = { subclassCount: 3, subclassLevel: 3 };
        expect(baseFeatureLevels(working)).not.toContain(3);
        expect(baseFeatureLevels(working)).toEqual(BASE_FEATURE_LEVELS.filter(l => l !== 3));
    });

    it("never mutates the shared constant", () => {
        baseFeatureLevels({ subclassCount: 2, subclassLevel: 5 });
        expect(BASE_FEATURE_LEVELS).toContain(5);
    });
});

describe("coerceFeatureAt", () => {
    it("stamps the driver-owned level and ignores any model-set level", () => {
        const f = coerceFeatureAt(7, { name: "  Thunderstep  ", description: "  Teleport 30 ft.  ", level: 99 } as Record<string, unknown>);
        expect(f).toMatchObject({ name: "Thunderstep", level: 7, description: "Teleport 30 ft." });
    });

    it("keeps a non-empty resource and omits a blank one", () => {
        expect(coerceFeatureAt(3, { name: "A", description: "x", resource: " Charge " }).resource).toBe("Charge");
        expect(coerceFeatureAt(3, { name: "A", description: "x", resource: "  " })).not.toHaveProperty("resource");
    });
});

describe("validateFeature", () => {
    const existing: WorkingFeature[] = [{ name: "Storm's Charge", level: 1, description: "Gain a Charge when hit." }];

    it("passes a well-formed, novel feature", () => {
        const f: WorkingFeature = { name: "Thunderous Rebuke", level: 5, description: "Spend a Charge to deal 2d6 thunder and push 10 feet." };
        expect(validateFeature(f, existing)).toEqual([]);
    });

    it("requires a name and real rules text", () => {
        expect(validateFeature({ name: "", level: 5, description: "Spend a Charge to deal thunder damage." }, existing)).toContain("The feature needs a name.");
        const short = validateFeature({ name: "Zap", level: 5, description: "Zap." }, existing);
        expect(short.some(e => /rules text/i.test(e))).toBe(true);
    });

    it("rejects a name that collides with a feature already in scope", () => {
        const dup: WorkingFeature = { name: "storm's charge", level: 6, description: "A re-worded copy of the level-1 feature." };
        expect(validateFeature(dup, existing).some(e => /Duplicate feature name/i.test(e))).toBe(true);
    });
});

describe("featureStep", () => {
    it("tells the model the level and gates via validateFeature", () => {
        const spec = featureStep(6, [{ name: "Storm's Charge", level: 1, description: "Gain a Charge." }]);
        expect(spec.task).toContain("LEVEL 6");
        expect(spec.tool.name).toBe("class_feature");

        const ok = spec.parse({ name: "Galeforce", description: "Push every creature within 10 ft. 15 feet away." });
        expect(ok.value.level).toBe(6);
        expect(ok.errors).toEqual([]);

        const dup = spec.parse({ name: "Storm's Charge", description: "A duplicate of an existing feature." });
        expect(dup.errors.length).toBeGreaterThan(0);
    });

    it("frames the step for a subclass when an owner label is given", () => {
        expect(featureStep(3, [], "the «Tempest» subclass").task).toContain("the «Tempest» subclass");
    });
});
