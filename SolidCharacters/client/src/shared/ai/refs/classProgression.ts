import { FeatureDetail } from "../../../models/generated";
import { createNewId } from "../../customHooks/utility/tools/idGen";

/**
 * Canonical 1–20 class-progression scaffolding, so an AI-generated class is STAMPED into the same shape as
 * the SRD classes: `features` keyed for every level 1..20. The model authors the "open" levels (see
 * `BASE_FEATURE_LEVELS`); the levels it never writes — Ability Score Improvement (4/8/12/16), Epic Boon (19),
 * and the subclass-grant level — are filled here deterministically.
 *
 * Why this matters: the class popup's level table renders one row per key of `Class5E.features`
 * (`featureTable.tsx` / `classModal.component.tsx` both do `Object.keys(features)`), so a level with no key
 * is silently dropped. Without this fill an AI class shows ~12 rows instead of the full 20.
 *
 * Kept out of the generation-time `working.features` on purpose: the duplicate-name gate
 * (`genPipeline/validate.ts`) runs over that list, and four identical "Ability Score Improvement" names would
 * make the Phase-F critic flag a duplicate on every regenerated feature. `featuresByLevel` keys by level, so
 * repeated names across different level keys are harmless — hence we stamp only on the level-keyed record.
 */

export const MAX_CLASS_LEVEL = 20;

/** Levels that grant an Ability Score Improvement in 2024 SRD classes. */
export const ASI_LEVELS = [4, 8, 12, 16];

/** The level that grants an Epic Boon in 2024 SRD classes. */
export const EPIC_BOON_LEVEL = 19;

export const ASI_FEATURE = {
    name: "Ability Score Improvement",
    description: "Increase one ability score by 2, or two scores by 1 (to a maximum of 20), or take a feat.",
};

export const EPIC_BOON_FEATURE = {
    name: "Epic Boon",
    description: "Gain an Epic Boon feat (or another feat) of your choice.",
};

/** The minimal, named fill used when a level has no other content (only fires if a generation step failed). */
const BACKSTOP_FEATURE = {
    name: "Class Feature",
    description: "You gain a class feature at this level.",
};

/**
 * The `create_class` tool-input feature (no `id` — `featuresByLevel` stamps one) marking the subclass-grant
 * level, so that row in the base-class table isn't blank. Appended in `assemble.ts` where the working class's
 * `subclassLevel` is known (the `create_class` schema itself carries no subclass field).
 */
export function subclassMarkerInput(className: string, level: number): { level: number; name: string; description: string } {
    const label = className.trim() ? `${className.trim()} Subclass` : "Subclass";
    return {
        level,
        name: label,
        description: "You choose a subclass, gaining its features at this and later levels.",
    };
}

/** Build a fresh `FeatureDetail` from a `{ name, description }` template, stamping a new id. */
function toFeatureDetail(template: { name: string; description: string }): FeatureDetail {
    return { id: createNewId(), name: template.name, description: template.description };
}

/**
 * Return a dense copy of `features` with a key for every level 1..`MAX_CLASS_LEVEL`. A level that already
 * has ≥1 feature is left untouched (so a model that authored real content at, say, an ASI level keeps it);
 * an absent or empty level is filled with ASI (at `ASI_LEVELS`), Epic Boon (at `EPIC_BOON_LEVEL`), else the
 * named backstop. Pure — does not mutate the input.
 *
 * A class with NO features at all is returned unchanged, so the "add at least one class feature" hard block
 * (`validateEntity`) still fires — we only complete a class that already has real content, never fabricate a
 * whole class out of backstops.
 */
export function ensureAllClassLevels(features: Record<number, FeatureDetail[]>): Record<number, FeatureDetail[]> {
    if (!Object.values(features).some(fs => fs?.length)) return features;
    const out: Record<number, FeatureDetail[]> = { ...features };
    for (let level = 1; level <= MAX_CLASS_LEVEL; level++) {
        if (out[level]?.length) continue;
        const template = ASI_LEVELS.includes(level)
            ? ASI_FEATURE
            : level === EPIC_BOON_LEVEL
                ? EPIC_BOON_FEATURE
                : BACKSTOP_FEATURE;
        out[level] = [toFeatureDetail(template)];
    }
    return out;
}
