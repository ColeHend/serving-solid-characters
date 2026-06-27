import { describe, it, expect } from "vitest";
import { coerceConceptBrief, validateConceptBrief } from "./conceptBrief";

const goodRaw = {
    concept: "A knight who borrows strength from a bound storm",
    tone: "grim, martial",
    power_tier: "on par with the Champion Fighter",
    motifs: ["chained lightning", "iron gauntlet", "thunderhead"],
    themes: ["debt", "restraint"],
    naming_style: "weather + martial terms",
    constraints: ["no spellcasting"],
};

describe("coerceConceptBrief", () => {
    it("coerces untrusted input, trimming and dropping blank list entries", () => {
        const brief = coerceConceptBrief({ ...goodRaw, concept: "  hi  ", motifs: ["a", "", "  b  "] });
        expect(brief.concept).toBe("hi");
        expect(brief.motifs).toEqual(["a", "b"]);
        expect(brief.constraints).toEqual(["no spellcasting"]);
    });
    it("defaults missing fields to empty rather than throwing", () => {
        const brief = coerceConceptBrief({});
        expect(brief).toEqual({ concept: "", tone: "", power_tier: "", motifs: [], themes: [], naming_style: "", constraints: [] });
    });
});

describe("validateConceptBrief", () => {
    it("passes a complete, concrete brief", () => {
        expect(validateConceptBrief(coerceConceptBrief(goodRaw))).toEqual([]);
    });

    it("requires the core fields", () => {
        const errs = validateConceptBrief(coerceConceptBrief({ ...goodRaw, concept: "", power_tier: "", naming_style: "" }));
        expect(errs).toEqual(expect.arrayContaining([
            expect.stringContaining("Concept"),
            expect.stringContaining("Power tier"),
            expect.stringContaining("Naming style"),
        ]));
    });

    it("requires at least two motifs", () => {
        const errs = validateConceptBrief(coerceConceptBrief({ ...goodRaw, motifs: ["lonely"] }));
        expect(errs.some(e => e.includes("at least 2 motifs"))).toBe(true);
    });

    it("rejects motifs that read as sentences or adjectives, not concrete nouns", () => {
        const errs = validateConceptBrief(coerceConceptBrief({
            ...goodRaw,
            motifs: ["it should feel cold and very dangerous", "iron gauntlet"],
        }));
        expect(errs.some(e => e.includes("concrete noun"))).toBe(true);
    });

    it("requires at least one theme", () => {
        const errs = validateConceptBrief(coerceConceptBrief({ ...goodRaw, themes: [] }));
        expect(errs.some(e => e.includes("at least 1 theme"))).toBe(true);
    });
});
