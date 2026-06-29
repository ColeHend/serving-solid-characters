import { AiSettings } from "../../../models/userSettings";
import { AiToolDef } from "../types";
import { num, str } from "../coerce";
import { runStep, StepModelRunner } from "./stepWorker";
import type {
    CasterTypeName, ConceptBrief, RunStepOptions, StepContext, StepResult, StepSpec, WorkingClass,
} from "./types";

/**
 * Phase B (plan §6): the SKELETON — the load-bearing shape the user RATIFIES before any detail is built
 * (spec §4.B). The model commits to the few decisions everything else hangs off: class name, primary
 * ability, hit die, the one core mechanic, caster progression, and the subclass plan. These are small,
 * high-leverage, and cheap to get wrong, so they go through a human gate (the orchestrator surfaces this
 * as a ratification card) before Phase C spends the model's budget filling in the chassis around them.
 */

const ABILITIES = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
const ABILITY_SET = new Set(ABILITIES);
const HIT_DICE = ["d6", "d8", "d10", "d12"];
const HIT_DIE_SET = new Set(HIT_DICE);
const CASTER_TYPES: CasterTypeName[] = ["none", "third", "half", "full", "pact"];
const CASTER_SET = new Set<string>(CASTER_TYPES);

/** The few decisions the user ratifies. Mirrors the skeleton fields of `WorkingClass`. */
export interface SkeletonPlan {
    name: string;
    primaryAbility: string;     // "STR" or "STR, CON"
    hitDie: string;             // "d10"
    coreMechanic: string;
    casterType: CasterTypeName;
    subclassCount: number;
    subclassLevel: number;
}

export const SKELETON_TOOL: AiToolDef = {
    name: "skeleton_plan",
    description:
        "Record the SKELETON of a homebrew class: the few load-bearing decisions the user will approve before the " +
        "full build. Name, primary ability, hit die, the single core mechanic that defines the class, its " +
        "spellcasting progression, and how many subclasses it has and when they unlock. Keep the core mechanic to " +
        "one or two sentences — the detailed rules come later. Example: {\"name\":\"Stormwarden\",\"primary_ability\":\"STR\"," +
        "\"hit_die\":\"d10\",\"core_mechanic\":\"Builds Charge by taking or dealing damage, spent to unleash thunderous " +
        "strikes.\",\"caster_type\":\"none\",\"subclass_count\":3,\"subclass_level\":3}.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            name: { type: "string", description: "The class name." },
            primary_ability: { type: "string", enum: ABILITIES, description: "Primary ability score (STR/DEX/CON/INT/WIS/CHA). Use one." },
            hit_die: { type: "string", enum: HIT_DICE, description: "Hit die size." },
            core_mechanic: { type: "string", description: "The ONE signature resource or mechanic that defines the class, in one or two sentences (detailed rules come later)." },
            caster_type: { type: "string", enum: CASTER_TYPES, description: "Spellcasting progression: \"none\" (martial), \"third\", \"half\", \"full\", or \"pact\"." },
            subclass_count: { type: "integer", minimum: 0, maximum: 8, description: "How many subclasses the class offers (0 if none)." },
            subclass_level: { type: "integer", minimum: 1, maximum: 20, description: "The level the subclass is chosen at (e.g. 3). Ignored when subclass_count is 0." },
            fits_concept: { type: "string", description: "One line: how this skeleton serves the concept." },
        },
        required: ["name", "primary_ability", "hit_die", "core_mechanic", "caster_type"],
    },
};

/** Coerce the model's untrusted tool input into a SkeletonPlan (never throws). */
export function coerceSkeleton(raw: Record<string, unknown>): SkeletonPlan {
    const casterRaw = str(raw.caster_type).trim().toLowerCase();
    const count = Math.max(0, Math.floor(num(raw.subclass_count, 0)));
    return {
        name: str(raw.name).trim(),
        primaryAbility: str(raw.primary_ability).trim().toUpperCase(),
        hitDie: str(raw.hit_die).trim().toLowerCase(),
        coreMechanic: str(raw.core_mechanic).trim(),
        casterType: (CASTER_SET.has(casterRaw) ? casterRaw : "none") as CasterTypeName,
        subclassCount: count,
        // A subclass level only matters when there are subclasses; default to 3 (the common unlock level).
        subclassLevel: count > 0 ? Math.max(1, Math.floor(num(raw.subclass_level, 3))) : 0,
    };
}

/** Gate the skeleton: every load-bearing field must be legal so Phase C can build against it. */
export function validateSkeleton(s: SkeletonPlan): string[] {
    const errors: string[] = [];
    if (!s.name) errors.push("The class needs a name.");

    const abilities = s.primaryAbility.split(/[\s,]+/).filter(Boolean);
    if (!abilities.length) errors.push("Set a primary ability (STR/DEX/CON/INT/WIS/CHA).");
    else for (const a of abilities) {
        if (!ABILITY_SET.has(a)) errors.push(`Primary ability "${a}" must be one of STR, DEX, CON, INT, WIS, CHA.`);
    }

    if (!HIT_DIE_SET.has(s.hitDie)) errors.push("Hit die must be one of d6, d8, d10, d12.");
    if (s.coreMechanic.length < 10) errors.push("Describe the core mechanic in a sentence or two.");
    if (s.subclassCount > 0 && (s.subclassLevel < 1 || s.subclassLevel > 20)) {
        errors.push("Subclass level must be between 1 and 20.");
    }
    return errors;
}

/** Apply an approved skeleton onto the working class (the source of truth for later phases). */
export function applySkeleton(working: WorkingClass, plan: SkeletonPlan): void {
    working.name = plan.name;
    working.primaryAbility = plan.primaryAbility;
    working.hitDie = plan.hitDie;
    working.coreMechanic = plan.coreMechanic;
    working.casterType = plan.casterType;
    working.subclassCount = plan.subclassCount;
    working.subclassLevel = plan.subclassLevel;
}

/** Human-readable bullet lines for the ratification card (one decision per line). */
export function skeletonSummaryLines(plan: SkeletonPlan): string[] {
    const lines = [
        `Hit die: ${plan.hitDie}`,
        `Primary ability: ${plan.primaryAbility}`,
        `Core mechanic: ${plan.coreMechanic}`,
        `Spellcasting: ${plan.casterType === "none" ? "none (martial)" : `${plan.casterType} caster`}`,
    ];
    lines.push(plan.subclassCount > 0
        ? `Subclasses: ${plan.subclassCount}, chosen at level ${plan.subclassLevel}`
        : "Subclasses: none");
    return lines;
}

/**
 * The StepSpec for the skeleton. `refinement` carries the user's "change this" note from a rejected
 * ratification round so the re-run produces an adjusted skeleton rather than the same one.
 */
export function skeletonStep(seed: string, refinement: string, _brief: ConceptBrief): StepSpec<SkeletonPlan> {
    const refineBlock = refinement.trim()
        ? ` The user reviewed your previous skeleton and asked for this change: "${refinement.trim()}". Revise accordingly.`
        : "";
    return {
        id: "skeleton",
        tool: SKELETON_TOOL,
        system: "Decide the load-bearing skeleton of a homebrew class: name, primary ability, hit die, the single core mechanic, spellcasting progression, and subclass plan. This is the shape the user approves before the detailed build, so keep it tight and legal.",
        task: `Original request: "${seed.trim()}". Propose the class skeleton: pick a name, primary ability, hit die, the ONE core mechanic, the caster type, and the subclass count + unlock level.${refineBlock}`,
        parse: raw => {
            const value = coerceSkeleton(raw);
            return { value, errors: validateSkeleton(value) };
        },
    };
}

/** Run Phase B once: produce a gated SkeletonPlan (the orchestrator then surfaces it for ratification). */
export function produceSkeleton(
    seed: string,
    refinement: string,
    brief: ConceptBrief,
    ctx: StepContext,
    ai: AiSettings,
    opts?: RunStepOptions,
    runner?: StepModelRunner,
): Promise<StepResult<SkeletonPlan>> {
    return runStep(skeletonStep(seed, refinement, brief), ctx, ai, opts, runner);
}
