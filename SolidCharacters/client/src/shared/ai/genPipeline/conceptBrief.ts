import { AiSettings } from "../../../models/userSettings";
import { AiToolDef } from "../types";
import { str, strList } from "../coerce";
import { runStep, StepModelRunner } from "./stepWorker";
import type { ConceptBrief, PipelineType, RunStepOptions, StepResult, StepSpec } from "./types";

/**
 * Phase A/1: produce + validate the ConceptBrief — the first step and the through-line for every step
 * after it. The brief's `motifs` must be CONCRETE NOUNS (a "frost-rimed greatsword", not "it should feel
 * cold and dangerous"), because the later feature/narrative steps reuse them verbatim as hooks; a vague
 * motif produces vague, incoherent content. The validator enforces that so the repair loop can fix it.
 */

export const CONCEPT_BRIEF_TOOL: AiToolDef = {
    name: "concept_brief",
    description:
        "Record the design brief for the homebrew entity: its core concept, tone, power tier, recurring motifs " +
        "(concrete nouns/images), themes, naming style, and any hard constraints. This is the through-line every " +
        "later step serves. Example: {\"concept\":\"A knight who borrows strength from a bound storm\",\"tone\":\"grim, " +
        "martial\",\"power_tier\":\"on par with the Fighter\",\"motifs\":[\"chained lightning\",\"iron gauntlet\",\"thunderhead\"]," +
        "\"themes\":[\"debt\",\"restraint\"],\"naming_style\":\"weather + martial terms\",\"constraints\":[\"no spellcasting\"]}.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            concept: { type: "string", description: "One or two sentences: what this entity fundamentally is." },
            tone: { type: "string", description: "The feel — e.g. \"grim and martial\", \"whimsical\", \"eldritch\"." },
            power_tier: { type: "string", description: "Where it sits on the power curve, anchored to official content (e.g. \"on par with the Champion Fighter\")." },
            motifs: { type: "array", items: { type: "string" }, description: "2-6 CONCRETE nouns/images that recur (e.g. \"frost-rimed blade\", \"hollow lantern\"). Not sentences, not adjectives." },
            themes: { type: "array", items: { type: "string" }, description: "1-4 abstract themes (e.g. \"sacrifice\", \"hunger\")." },
            naming_style: { type: "string", description: "How features/names should read (e.g. \"liturgical Latin\", \"plain Common\")." },
            constraints: { type: "array", items: { type: "string" }, description: "Hard guardrails the user cares about (rarity, no spellcasting, etc.). May be empty." },
            fits_concept: { type: "string", description: "One line: the single sentence that captures the whole identity." },
        },
        required: ["concept", "tone", "power_tier", "motifs", "themes", "naming_style"],
    },
};

/** Coerce the model's untrusted tool input into a ConceptBrief (never throws). */
export function coerceConceptBrief(raw: Record<string, unknown>): ConceptBrief {
    return {
        concept: str(raw.concept).trim(),
        tone: str(raw.tone).trim(),
        power_tier: str(raw.power_tier).trim(),
        motifs: strList(raw.motifs),
        themes: strList(raw.themes),
        naming_style: str(raw.naming_style).trim(),
        constraints: strList(raw.constraints),
    };
}

/** A motif that reads as a sentence/clause rather than a concrete noun phrase (too long, or punctuated). */
function looksLikeSentence(motif: string): boolean {
    const words = motif.trim().split(/\s+/).filter(Boolean);
    return words.length > 5 || /[.!?]/.test(motif);
}

/**
 * Validate a brief: every required field present, and motifs are concrete nouns (≥2, short, unpunctuated).
 * Returns the gate errors that drive the step worker's repair loop.
 */
export function validateConceptBrief(b: ConceptBrief): string[] {
    const errors: string[] = [];
    if (!b.concept) errors.push("Concept is required.");
    if (!b.tone) errors.push("Tone is required.");
    if (!b.power_tier) errors.push("Power tier is required — anchor it to official content.");
    if (!b.naming_style) errors.push("Naming style is required.");

    if (b.motifs.length < 2) errors.push("Provide at least 2 motifs as concrete nouns/images.");
    for (const m of b.motifs) {
        if (looksLikeSentence(m)) errors.push(`Motif "${m}" must be a concrete noun/image, not a sentence or adjective.`);
    }
    if (b.themes.length < 1) errors.push("Provide at least 1 theme.");
    return errors;
}

/** The StepSpec for the brief, parameterized by the user's seed and the pipeline type. */
export function conceptBriefStep(seed: string, pipelineType: PipelineType): StepSpec<ConceptBrief> {
    return {
        id: "design_brief",
        tool: CONCEPT_BRIEF_TOOL,
        system: `Distill a user's request into a design brief for a homebrew ${pipelineType}. The brief is the through-line every later step will serve, so be specific and concrete.`,
        task: `The user's request: "${seed.trim()}". Produce the design brief for this homebrew ${pipelineType}. Choose concrete motifs (nouns/images, not adjectives) and anchor the power tier to a comparable official option.`,
        parse: raw => {
            const value = coerceConceptBrief(raw);
            return { value, errors: validateConceptBrief(value) };
        },
    };
}

/** Run Phase A/1: produce a validated ConceptBrief from the user's seed. */
export function produceConceptBrief(
    seed: string,
    pipelineType: PipelineType,
    ai: AiSettings,
    opts?: RunStepOptions,
    runner?: StepModelRunner,
): Promise<StepResult<ConceptBrief>> {
    return runStep(conceptBriefStep(seed, pipelineType), {}, ai, opts, runner);
}
