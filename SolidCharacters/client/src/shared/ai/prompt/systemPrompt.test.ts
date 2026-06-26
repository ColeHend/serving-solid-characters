import { describe, it, expect } from "vitest";
import {
    buildSystemPrompt, personaFor,
    NEUTRAL_PERSONA, GRIMOIRE_LARGE, GRIMOIRE_SMALL,
} from "./systemPrompt";
import { HOMEBREW_KINDS } from "../refs/homebrewKind";
import { BUILTIN_LLM_PASSES, buildReviewSystemPrompt } from "../readiness/reviewSystemPrompt";
import { researchAgentSpec } from "../subAgent";

const allKinds = [...HOMEBREW_KINDS];
const allFlags = { math: true, ask: true, plan: true, lookup: true, edit: true, switchMode: true, canCreate: true };

describe("personaFor", () => {
    it("returns the lean neutral persona for either tier when voice is 'neutral'", () => {
        expect(personaFor("neutral", "small")).toBe(NEUTRAL_PERSONA);
        expect(personaFor("neutral", "large")).toBe(NEUTRAL_PERSONA);
    });

    it("is tier-aware for grimoire: full on large, skeletal on small", () => {
        expect(personaFor("grimoire", "large")).toBe(GRIMOIRE_LARGE);
        expect(personaFor("grimoire", "small")).toBe(GRIMOIRE_SMALL);
    });

    it("defaults to grimoire when voice is undefined", () => {
        expect(personaFor(undefined, "large")).toBe(GRIMOIRE_LARGE);
    });
});

describe("buildSystemPrompt — persona surfaces", () => {
    it("neutral persona names Grimoire but carries no spellbook flavor", () => {
        const p = buildSystemPrompt("2024", "chat", "large", undefined, allFlags, NEUTRAL_PERSONA);
        expect(p).toContain("You are Grimoire, a Dungeons & Dragons assistant");
        expect(p).not.toContain("sentient spellbook");
        expect(p).not.toContain("within my pages");
    });

    it("large Grimoire carries the voice clause AND the substance-clarity guard", () => {
        const p = buildSystemPrompt("2024", "chat", "large", undefined, allFlags, GRIMOIRE_LARGE);
        expect(p).toContain("sentient spellbook");
        expect(p).toContain("never wrap a rules answer in flourish");
    });

    it("small Grimoire is skeletal: identity + 'plain substance' reminder, and shorter than large", () => {
        const small = buildSystemPrompt("2024", "homebrew", "small", allKinds, allFlags, GRIMOIRE_SMALL);
        const large = buildSystemPrompt("2024", "homebrew", "large", allKinds, allFlags, GRIMOIRE_LARGE);
        expect(small).toContain("sentient spellbook that helps with D&D");
        expect(small).toContain("must be plain and exact");
        // The small worked example adds bytes, but the persona footprint itself is lighter — the small
        // identity + voice clause is shorter than the large one.
        expect(GRIMOIRE_SMALL.identityLine.length).toBeLessThan(GRIMOIRE_LARGE.identityLine.length);
    });

    it("chat mode bounds scope and gives Grimoire an in-character decline", () => {
        const neutral = buildSystemPrompt("2024", "chat", "large", undefined, allFlags, NEUTRAL_PERSONA);
        expect(neutral).toContain("Your scope is D&D 5e");
        const grim = buildSystemPrompt("2024", "chat", "large", undefined, allFlags, GRIMOIRE_LARGE);
        expect(grim).toContain("beyond my pages");
    });

    it("homebrew opener offers the preserve-flourish on large but NOT on small (skeletal)", () => {
        const large = buildSystemPrompt("2024", "homebrew", "large", allKinds, allFlags, GRIMOIRE_LARGE);
        const small = buildSystemPrompt("2024", "homebrew", "small", allKinds, allFlags, GRIMOIRE_SMALL);
        expect(large.toLowerCase()).toContain("preserve it within my pages");
        expect(small.toLowerCase()).not.toContain("preserve it within my pages");
    });

    it("never waits for confirmation regardless of persona (preview is the gate)", () => {
        const p = buildSystemPrompt("2024", "homebrew", "large", allKinds, allFlags, GRIMOIRE_LARGE);
        expect(p).toContain("Generate directly");
        expect(p).toContain("never wait for a yes before calling the tool");
    });
});

describe("buildSystemPrompt — correctness & token diet", () => {
    it("no longer tells the model to 'Fill EVERY field'", () => {
        const p = buildSystemPrompt("2024", "homebrew", "small", allKinds, allFlags);
        expect(p).not.toContain("Fill EVERY field");
    });

    it("states the completeness rule once, in the quality bar", () => {
        const p = buildSystemPrompt("2024", "homebrew", "large", allKinds, allFlags);
        const hits = p.split("never leave a supported field empty").length - 1;
        expect(hits).toBe(1);
    });

    it("does not duplicate the disabled-tools note when every kind is disabled", () => {
        const p = buildSystemPrompt("2024", "homebrew", "small", [], allFlags);
        expect(p).toContain("Content creation is turned off in settings");
        expect(p).not.toContain("you may ONLY create");
    });

    it("gives lookup an ordered procedure (ceiling + miss handling)", () => {
        const p = buildSystemPrompt("2024", "homebrew", "large", allKinds, allFlags);
        expect(p).toContain("use its numbers as a ceiling");
        expect(p).toContain("If a lookup returns nothing");
    });
});

describe("zero-persona surfaces stay neutral", () => {
    it("review-pass prompt carries no Grimoire voice and forbids prose", () => {
        const sys = buildReviewSystemPrompt(BUILTIN_LLM_PASSES.balance!, "spell", "2024");
        expect(sys).not.toMatch(/grimoire|spellbook|within my pages|let it be written/i);
        expect(sys).toContain("exactly one report_review tool call and nothing else");
    });

    it("research sub-agent stays in plain fact-reporting mode", () => {
        const sys = researchAgentSpec().system;
        expect(sys).not.toMatch(/grimoire|spellbook|within my pages/i);
        expect(sys).toContain("never fill the gap with an invented number");
    });
});
