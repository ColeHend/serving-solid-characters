import { AiSettings } from "../../../models/userSettings";
import { AiToolDef } from "../types";
import { str } from "../coerce";
import { runStep, StepModelRunner } from "./stepWorker";
import type { RunStepOptions, StepContext, StepResult, StepSpec, WorkingClass } from "./types";

/**
 * Phase E (plan §6): the SUBCLASS LOOP. For each subclass the class promised in its ratified skeleton, the
 * model first writes a mini-brief (name + theme + how it varies the base class), then runs its OWN feature
 * loop (reusing Phase D's `produceFeature`, scoped to the subclass). The brief is a deliberate first step:
 * a subclass that reads as a coherent variation needs an anchor the same way the class needs its concept
 * brief — and it lets the gate reject a subclass that just duplicates a sibling's name.
 */

/**
 * The levels at which a subclass gains a feature, derived from its base class's subclass-grant level so the
 * first feature lands exactly when the subclass is chosen. A Barbarian-like cadence (e.g. unlock at 3 →
 * 3/6/10/14): the grant level, then +3/+7/+11, clamped to ≤20 and de-duplicated. Empty when there is no
 * sensible unlock level.
 */
export function subclassFeatureLevels(subclassLevel: number): number[] {
    const base = Math.floor(subclassLevel);
    if (!Number.isFinite(base) || base < 1 || base > 20) return [];
    const levels = [base, base + 3, base + 7, base + 11].filter(l => l <= 20);
    return [...new Set(levels)];
}

/** The mini-brief that anchors a subclass before its feature loop. */
export interface SubclassBrief {
    name: string;
    brief: string;
}

export const SUBCLASS_BRIEF_TOOL: AiToolDef = {
    name: "subclass_brief",
    description:
        "Name ONE subclass of a homebrew class and write a short brief: its theme and how it varies the base class's " +
        "core mechanic. Keep the rules for later — this is just the anchor. It must be DISTINCT from any subclass " +
        "already named in DECIDED SO FAR. Example: {\"name\":\"Path of the Tempest\",\"brief\":\"Stormwardens who turn " +
        "their Charge into chained lightning, striking many foes at once.\"}.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            name: { type: "string", description: "Subclass name, following the class's naming style." },
            brief: { type: "string", description: "One or two sentences: the subclass's theme and how it varies the base class's core mechanic." },
            fits_concept: { type: "string", description: "One line: how this subclass serves the concept." },
        },
        required: ["name", "brief"],
    },
};

/** Coerce the model's untrusted subclass-brief output (never throws). */
export function coerceSubclassBrief(raw: Record<string, unknown>): SubclassBrief {
    return { name: str(raw.name).trim(), brief: str(raw.brief).trim() };
}

/** Minimum brief length for a subclass to count as anchored (a one-word "brief" is a non-answer). */
const MIN_BRIEF = 15;

/** Gate a subclass brief: named, with a real brief, and not a duplicate of a sibling subclass's name. */
export function validateSubclassBrief(b: SubclassBrief, existingNames: string[]): string[] {
    const errors: string[] = [];
    if (!b.name) errors.push("The subclass needs a name.");
    if (b.brief.length < MIN_BRIEF) errors.push("Write a one or two sentence brief for the subclass.");
    const taken = new Set(existingNames.map(n => n.trim().toLowerCase()).filter(Boolean));
    if (b.name && taken.has(b.name.toLowerCase())) {
        errors.push(`There is already a subclass named "${b.name}". Choose a distinct one.`);
    }
    return errors;
}

/**
 * The StepSpec for a subclass brief. `existingNames` (the siblings already designed) is closed in so the
 * gate can reject a repeat, and `index`/`count` let the task tell the model which of N it is designing.
 */
export function subclassBriefStep(index: number, count: number, existingNames: string[]): StepSpec<SubclassBrief> {
    return {
        id: `subclass-brief-${index}`,
        tool: SUBCLASS_BRIEF_TOOL,
        system:
            "Design ONE subclass of a homebrew class that is already built (its skeleton and features are in DECIDED " +
            "SO FAR). A subclass is a VARIATION on the base class — it should reinterpret the core mechanic, not replace " +
            "it. Give just the anchor here; the features come next.",
        task:
            `Design subclass ${index + 1} of ${count}: give it a distinct name and a one-or-two sentence brief describing ` +
            "its theme and how it varies the base class's core mechanic. It must differ clearly from any subclass already named.",
        parse: raw => {
            const value = coerceSubclassBrief(raw);
            return { value, errors: validateSubclassBrief(value, existingNames) };
        },
    };
}

/** Run one subclass-brief step. */
export function produceSubclassBrief(
    index: number,
    count: number,
    existingNames: string[],
    ctx: StepContext,
    ai: AiSettings,
    opts?: RunStepOptions,
    runner?: StepModelRunner,
): Promise<StepResult<SubclassBrief>> {
    return runStep(subclassBriefStep(index, count, existingNames), ctx, ai, opts, runner);
}

/** The names already given to subclasses on the working class (for the sibling-uniqueness gate). */
export function subclassNames(working: WorkingClass): string[] {
    return (working.subclasses ?? []).map(s => s.name).filter(Boolean);
}
