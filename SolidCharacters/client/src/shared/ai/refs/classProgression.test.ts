import { describe, it, expect } from "vitest";
import { ensureAllClassLevels, subclassMarkerInput, MAX_CLASS_LEVEL } from "./classProgression";
import type { FeatureDetail } from "../../../models/generated";

/**
 * `ensureAllClassLevels` is what makes an AI-generated class show all 20 rows in the class popup (the table
 * renders one row per key of `features`). It must densify a sparse class to every level 1–20 while leaving
 * real model content untouched — and must NOT fabricate a whole class from nothing.
 */

const feat = (name: string): FeatureDetail => ({ id: `id-${name}`, name, description: `Rules text for ${name}.` });

describe("ensureAllClassLevels", () => {
    it("returns a key for every level 1..20", () => {
        const out = ensureAllClassLevels({ 1: [feat("Chassis")], 5: [feat("Hunt")] });
        const levels = Object.keys(out).map(Number).sort((a, b) => a - b);
        expect(levels).toEqual([...Array(MAX_CLASS_LEVEL)].map((_, i) => i + 1));
    });

    it("stamps Ability Score Improvement at 4/8/12/16 and Epic Boon at 19", () => {
        const out = ensureAllClassLevels({ 1: [feat("Chassis")] });
        for (const l of [4, 8, 12, 16]) expect(out[l][0].name).toBe("Ability Score Improvement");
        expect(out[19][0].name).toBe("Epic Boon");
    });

    it("fills a plain gap level with a named backstop (never an empty array)", () => {
        const out = ensureAllClassLevels({ 1: [feat("Chassis")] });
        expect(out[7]).toHaveLength(1);
        expect(out[7][0].name).toBe("Class Feature");
        expect(Object.values(out).every(fs => fs.length > 0)).toBe(true);
    });

    it("preserves model content — never overwrites a level that already has a feature (even an ASI level)", () => {
        const out = ensureAllClassLevels({ 1: [feat("Chassis")], 4: [feat("Real Level 4 Feature")] });
        expect(out[4][0].name).toBe("Real Level 4 Feature");
    });

    it("gives every stamped feature a non-empty id, name and description", () => {
        const out = ensureAllClassLevels({ 1: [feat("Chassis")] });
        for (const fs of Object.values(out)) {
            for (const f of fs) {
                expect(f.id).toBeTruthy();
                expect(f.name).toBeTruthy();
                expect(f.description).toBeTruthy();
            }
        }
    });

    it("leaves a truly empty class untouched, so the 'no features' guard can still block it", () => {
        expect(ensureAllClassLevels({})).toEqual({});
    });

    it("does not mutate its input", () => {
        const input = { 1: [feat("Chassis")] };
        ensureAllClassLevels(input);
        expect(Object.keys(input)).toEqual(["1"]);
    });
});

describe("subclassMarkerInput", () => {
    it("labels the marker with the class name at the grant level", () => {
        expect(subclassMarkerInput("Stormwarden", 3)).toMatchObject({ level: 3, name: "Stormwarden Subclass" });
    });

    it("falls back to a bare label when the class is unnamed", () => {
        expect(subclassMarkerInput("  ", 3).name).toBe("Subclass");
    });
});
