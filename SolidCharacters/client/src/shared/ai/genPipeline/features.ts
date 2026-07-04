import { AiSettings } from "../../../models/userSettings";
import { AiToolDef } from "../types";
import { str } from "../coerce";
import { runStep, StepModelRunner } from "./stepWorker";
import { validateNoDuplicateFeatures } from "./validate";
import type { RunStepOptions, StepContext, StepResult, StepSpec, WorkingClass, WorkingFeature } from "./types";

/**
 * Phase D (plan §6): the FEATURE LOOP — one model call per feature, each one handed every feature already
 * decided (via the carry-forward summary) so it extends the class rather than restating or contradicting
 * it. This is what makes a 1–20 progression read as one coherent thing instead of N unrelated abilities
 * (spec §4.D). The orchestrator owns the STRUCTURE (which levels gain a feature — the "curve"); the model
 * owns the CONTENT (the rules text). Keeping the level out of the model's hands removes a whole class of
 * gate failures and matches "compute derived values in code between steps."
 */

/**
 * The levels at which the base class gains a model-authored feature beyond the level-1 chassis feature.
 * Covers every "open" level — the ASI levels (4, 8, 12, 16), the Epic Boon level (19), and the subclass-grant
 * level are NOT here because they are stamped deterministically at assembly (`ensureAllClassLevels` /
 * `subclassMarkerInput` in `refs/classProgression`), not written by the model. Together with those stamps
 * the assembled class carries all 20 level keys, so the class table reads like a real 1–20 progression.
 * The subclass-grant level is dropped from this list by `baseFeatureLevels` — there the headline is "choose a subclass".
 */
export const BASE_FEATURE_LEVELS = [2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15, 17, 18, 20];

/** The base-class feature levels to fill for this working class: the canonical spread minus the subclass-grant level. */
export function baseFeatureLevels(working: WorkingClass): number[] {
    const subclassLevel = working.subclassCount && working.subclassCount > 0 ? working.subclassLevel : undefined;
    return BASE_FEATURE_LEVELS.filter(l => l !== subclassLevel);
}

export const FEATURE_TOOL: AiToolDef = {
    name: "class_feature",
    description:
        "Write ONE feature for a homebrew class (or subclass) that is already partly built. You are told the level " +
        "it is gained at; do not restate the level. The feature must be NEW — never a duplicate or a re-wording of a " +
        "feature in DECIDED SO FAR — must build on the class's core mechanic, and must scale appropriately for its " +
        "level. Example: {\"name\":\"Thunderous Rebuke\",\"description\":\"When a creature within 10 feet hits you, you " +
        "may spend 1 Charge to deal 2d6 thunder damage to it and push it 10 feet.\",\"resource\":\"Charge\"}.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            name: { type: "string", description: "Feature name, following the class's naming style." },
            description: { type: "string", description: "Full rules text with concrete numbers (Markdown allowed). One to three sentences minimum." },
            resource: { type: "string", description: "The resource/mechanic this feature spends or interacts with, if any (e.g. \"Charge\"). Omit if it is passive." },
            fits_concept: { type: "string", description: "One line: how this feature serves the concept and builds on what came before." },
        },
        required: ["name", "description"],
    },
};

/** Coerce the model's untrusted feature output, stamping the driver-owned level (never trust a model-set level). */
export function coerceFeatureAt(level: number, raw: Record<string, unknown>): WorkingFeature {
    const resource = str(raw.resource).trim();
    return {
        name: str(raw.name).trim(),
        level,
        description: str(raw.description).trim(),
        ...(resource ? { resource } : {}),
    };
}

/** Minimum rules-text length for a feature to count as written (a one-word "description" is a non-answer). */
const MIN_FEATURE_DESC = 15;

/**
 * Gate one feature against the features already decided: it must be named, have real rules text, and not
 * collide (case-insensitive) with any existing feature in its scope — a duplicate is a contradiction, not
 * an extension (spec §4.D). `existing` is the base class's features (Phase D) or the subclass's own (Phase E).
 */
export function validateFeature(f: WorkingFeature, existing: WorkingFeature[]): string[] {
    const errors: string[] = [];
    if (!f.name) errors.push("The feature needs a name.");
    if (f.description.length < MIN_FEATURE_DESC) {
        errors.push("Write the feature's rules text — a sentence or two with concrete numbers.");
    }
    // Appending f and re-checking flags it iff its name collides with one already in scope.
    errors.push(...validateNoDuplicateFeatures([...existing, f]));
    return errors;
}

/**
 * The StepSpec for one feature at `level`. `existing` (the features already in this scope) is closed in so
 * the gate can reject a duplicate; `ownerLabel` lets the same step write base-class features ("this class")
 * or subclass features ("the «X» subclass"). The skeleton + prior features live in the carry-forward summary.
 *
 * `critique` is set only when the Phase-F critic asked for a REWRITE of a flagged feature: it's the reviewer's
 * complaint, appended to the task so the new version fixes that specific problem (e.g. an over-tuned feature
 * is rewritten weaker) while still filling the same level.
 */
export function featureStep(level: number, existing: WorkingFeature[], ownerLabel = "this class", critique?: string): StepSpec<WorkingFeature> {
    const fix = critique?.trim()
        ? ` A reviewer flagged the previous version of this feature: "${critique.trim()}". Write a NEW version that ` +
          "fixes that problem (tone it down if it was too strong) while keeping its role at this level."
        : "";
    return {
        id: `feature-l${level}`,
        tool: FEATURE_TOOL,
        system:
            "Write one feature for a homebrew class that is already partly built — its skeleton and earlier features " +
            "are in DECIDED SO FAR. The feature must EXTEND what exists: build on the core mechanic, never restate or " +
            "contradict an earlier feature, and read as part of the same class.",
        task:
            `Write the feature gained at LEVEL ${level} for ${ownerLabel}. It must be new (not a duplicate or re-wording ` +
            `of any feature in DECIDED SO FAR), build on the core mechanic, scale appropriately for level ${level}, and ` +
            "follow the naming style. Give concrete rules text with numbers." + fix,
        parse: raw => {
            const value = coerceFeatureAt(level, raw);
            return { value, errors: validateFeature(value, existing) };
        },
    };
}

/** Run one feature step: produce a gated feature at `level`, given the features already decided in its scope. */
export function produceFeature(
    level: number,
    existing: WorkingFeature[],
    ctx: StepContext,
    ai: AiSettings,
    opts?: RunStepOptions,
    runner?: StepModelRunner,
    ownerLabel?: string,
    critique?: string,
): Promise<StepResult<WorkingFeature>> {
    return runStep(featureStep(level, existing, ownerLabel, critique), ctx, ai, opts, runner);
}
