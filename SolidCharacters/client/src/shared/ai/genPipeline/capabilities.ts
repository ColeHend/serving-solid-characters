import { AiSettings } from "../../../models/userSettings";
import { AiToolDef } from "../types";
import { list, num, str } from "../coerce";
import { runStep, StepModelRunner } from "./stepWorker";
import { validateFeatureLevels, validateNoDuplicateFeatures, validateSpellLevels } from "./validate";
import type {
    CasterTypeName, RunStepOptions, StepContext, StepResult, StepSpec, WorkingFeature,
} from "./types";

/**
 * Phase 4 (plan §7): CAPABILITIES — the character's signature features at its level, and its spell list if
 * it casts. Unlike the class pipeline's 1-20 feature loop, a character is a SNAPSHOT at one level, so the
 * notable features come in a single step (each tagged with the level it was gained). The spell list is a
 * separate step the orchestrator runs only for casters, gated so no spell exceeds the highest level the
 * caster type can reach at this level (validate.maxAccessibleSpellLevel — derived from the canonical slot
 * tables, so it can't drift from what the sheet grants).
 */

const CASTER_TYPES: CasterTypeName[] = ["none", "third", "half", "full", "pact"];
const CASTER_SET = new Set<string>(CASTER_TYPES);

// ───────────────────────────── 4a: features + caster type ─────────────────────────────

const featureSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
        name: { type: "string", description: "Feature name." },
        level: { type: "integer", minimum: 1, maximum: 20, description: "The level this feature was gained at (≤ the character's level)." },
        description: { type: "string", description: "Full rules text with concrete numbers (Markdown allowed)." },
    },
    required: ["name", "level", "description"],
};

/** The capabilities the model writes for the character. */
export interface CharacterCapabilities {
    casterType: CasterTypeName;
    features: WorkingFeature[];
}

export const CAPABILITIES_TOOL: AiToolDef = {
    name: "character_capabilities",
    description:
        "Describe what a D&D 5e character can DO at its level: its spellcasting progression (\"none\" if it doesn't cast) " +
        "and its SIGNATURE class/lineage features, each tagged with the level it was gained at. Give the notable, " +
        "play-defining features — not every minor trait. Example: {\"caster_type\":\"none\",\"features\":[{\"name\":\"Rage\"," +
        "\"level\":1,\"description\":\"As a bonus action, enter a rage for resistance to physical damage and +2 melee damage.\"}]}.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            caster_type: { type: "string", enum: CASTER_TYPES, description: "Spellcasting progression: \"none\", \"third\", \"half\", \"full\", or \"pact\"." },
            features: { type: "array", items: featureSchema, description: "The character's signature features (typically 2-6), each with the level it was gained at." },
            fits_concept: { type: "string", description: "One line: how these capabilities serve the concept." },
        },
        required: ["caster_type", "features"],
    },
};

/** Coerce one feature, clamping its level to [1, maxLevel] (a character can't have a feature above its level). */
function coerceCapabilityFeature(raw: unknown, maxLevel: number): WorkingFeature {
    const f = (raw ?? {}) as Record<string, unknown>;
    const level = Math.min(Math.max(1, Math.floor(num(f.level, 1))), maxLevel);
    return { name: str(f.name).trim(), level, description: str(f.description).trim() };
}

/** Coerce the model's untrusted capabilities output (never throws). */
export function coerceCapabilities(raw: Record<string, unknown>, maxLevel: number): CharacterCapabilities {
    const casterRaw = str(raw.caster_type).trim().toLowerCase();
    return {
        casterType: (CASTER_SET.has(casterRaw) ? casterRaw : "none") as CasterTypeName,
        features: list(raw.features).map(f => coerceCapabilityFeature(f, maxLevel)).filter(f => f.name),
    };
}

const MIN_FEATURE_DESC = 15;

/** Gate capabilities: at least one well-formed feature, no duplicates, every level within 1..charLevel. */
export function validateCapabilities(c: CharacterCapabilities, charLevel: number): string[] {
    const errors: string[] = [];
    if (!c.features.length) errors.push("Give the character at least one signature feature.");
    for (const f of c.features) {
        if (f.description.length < MIN_FEATURE_DESC) errors.push(`Feature "${f.name}" needs real rules text with numbers.`);
    }
    errors.push(...validateFeatureLevels(c.features, 1, Math.max(1, charLevel)));
    errors.push(...validateNoDuplicateFeatures(c.features));
    return errors;
}

export function capabilitiesStep(charLevel: number): StepSpec<CharacterCapabilities> {
    return {
        id: "capabilities",
        tool: CAPABILITIES_TOOL,
        system:
            "Describe a D&D 5e character's capabilities at its decided level (its class/level/scores are in DECIDED SO " +
            "FAR): its spellcasting progression and its signature, play-defining features. Each feature must be gained at " +
            "a level no higher than the character's level.",
        task:
            `State the character's caster type and write its signature features (2-6), each at the level it was gained ` +
            `(no higher than level ${charLevel}). Give real rules text with concrete numbers.`,
        parse: raw => {
            const value = coerceCapabilities(raw, charLevel);
            return { value, errors: validateCapabilities(value, charLevel) };
        },
    };
}

/** Run Phase 4a once: produce a gated caster type + signature features for the character's level. */
export function produceCapabilities(
    charLevel: number,
    ctx: StepContext,
    ai: AiSettings,
    opts?: RunStepOptions,
    runner?: StepModelRunner,
): Promise<StepResult<CharacterCapabilities>> {
    return runStep(capabilitiesStep(charLevel), ctx, ai, opts, runner);
}

// ───────────────────────────── 4b: spells (casters only) ─────────────────────────────

/** A spell the model picked, with its level (level 0 = cantrip) for the accessibility gate. */
interface PickedSpell { name: string; level: number; }

export const SPELLS_TOOL: AiToolDef = {
    name: "character_spells",
    description:
        "Choose the spells a D&D 5e spellcaster knows or has prepared, each with its spell level (0 for a cantrip). " +
        "No spell may exceed the highest level this caster can reach at its level. Example: {\"spells\":[{\"name\":\"Fire " +
        "Bolt\",\"level\":0},{\"name\":\"Shield\",\"level\":1},{\"name\":\"Fireball\",\"level\":3}]}.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            spells: {
                type: "array",
                items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                        name: { type: "string", description: "Spell name." },
                        level: { type: "integer", minimum: 0, maximum: 9, description: "Spell level (0 = cantrip)." },
                    },
                    required: ["name", "level"],
                },
                description: "The spells known/prepared, each with its level.",
            },
            fits_concept: { type: "string", description: "One line: how this spell list serves the concept." },
        },
        required: ["spells"],
    },
};

/** Coerce the model's untrusted spell list into picked spells (never throws). */
export function coercePickedSpells(raw: Record<string, unknown>): PickedSpell[] {
    return list(raw.spells)
        .map(s => {
            const o = (s ?? {}) as Record<string, unknown>;
            return { name: str(o.name).trim(), level: Math.max(0, Math.floor(num(o.level, 0))) };
        })
        .filter(s => s.name);
}

/** Gate the spell list: at least one spell, and none above the caster's reachable level (validate.ts). */
export function validatePickedSpells(spells: PickedSpell[], caster: CasterTypeName, charLevel: number): string[] {
    const errors: string[] = [];
    if (!spells.length) errors.push("Pick at least one spell.");
    errors.push(...validateSpellLevels(spells, caster, charLevel));
    return errors;
}

export function spellsStep(caster: CasterTypeName, charLevel: number): StepSpec<string[]> {
    return {
        id: "spells",
        tool: SPELLS_TOOL,
        system:
            "Choose the spells a D&D 5e caster knows. The character's class, level, and caster type are in DECIDED SO " +
            "FAR. No spell may be a higher level than this caster can reach at its level.",
        task:
            `Pick the spells this ${caster} caster knows or has prepared at level ${charLevel}, each with its spell level ` +
            "(0 for cantrips). Include a few cantrips and a spread of leveled spells that fit the concept.",
        parse: raw => {
            const picked = coercePickedSpells(raw);
            // The step's VALUE is just the names (what the character stores); the levels only drive the gate.
            return { value: picked.map(s => s.name), errors: validatePickedSpells(picked, caster, charLevel) };
        },
    };
}

/** Run Phase 4b once: produce a gated spell-name list for a caster at this level. */
export function produceSpells(
    caster: CasterTypeName,
    charLevel: number,
    ctx: StepContext,
    ai: AiSettings,
    opts?: RunStepOptions,
    runner?: StepModelRunner,
): Promise<StepResult<string[]>> {
    return runStep(spellsStep(caster, charLevel), ctx, ai, opts, runner);
}
