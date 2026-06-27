import { AiSettings } from "../../../models/userSettings";
import { AiToolDef } from "../types";
import { num, str, strList } from "../coerce";
import { runStep, StepModelRunner } from "./stepWorker";
import { ABILITY_KEYS } from "./types";
import type {
    AbilityKey, ConceptBrief, RunStepOptions, StepContext, StepResult, StepSpec, WorkingCharacter,
} from "./types";

/**
 * Phase 2 (plan §7): the MECHANICAL FOUNDATION — the load-bearing choices everything else hangs off, the
 * character analogue of the class skeleton. The model commits the class, lineage (species), level,
 * background, hit die, and the ability-score PRIORITY ORDER (which ability matters most → least). Those
 * decisions feed every later step: Phase 3 rolls scores against the priority, Phase 4 gates spell levels by
 * level, Phase 7 computes HP off the hit die. They are small and high-leverage, so this is one tight step.
 *
 * NOTE: the character's NAME is deliberately NOT decided here — it belongs to the narrative (Phase 6), once
 * the mechanics give it something to be named after.
 */

const ABILITIES = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
const HIT_DICE = ["d6", "d8", "d10", "d12"];
const HIT_DIE_SET = new Set(HIT_DICE);

/** The foundation the model commits before any detail is built. Mirrors the foundation fields of WorkingCharacter. */
export interface CharacterFoundation {
    className: string;
    lineage: string;
    level: number;
    background: string;
    hitDie: string;                 // "d8"
    abilityPriority: AbilityKey[];  // most-important ability first
}

export const FOUNDATION_TOOL: AiToolDef = {
    name: "character_foundation",
    description:
        "Record the mechanical foundation of a D&D 5e character: its class, lineage/species, total level, " +
        "background, the class's hit die, and the ability-score PRIORITY ORDER (most-important ability first). " +
        "Prefer official options unless the concept clearly calls for homebrew. Example: {\"class_name\":\"Barbarian\"," +
        "\"lineage\":\"Goliath\",\"level\":5,\"background\":\"Soldier\",\"hit_die\":\"d12\",\"ability_priority\":[\"str\"," +
        "\"con\",\"dex\",\"wis\",\"cha\",\"int\"]}.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            class_name: { type: "string", description: "The character's class (e.g. \"Wizard\")." },
            lineage: { type: "string", description: "The character's lineage / species / race (e.g. \"High Elf\")." },
            level: { type: "integer", minimum: 1, maximum: 20, description: "Total character level (1-20)." },
            background: { type: "string", description: "The character's background (e.g. \"Sage\")." },
            hit_die: { type: "string", enum: HIT_DICE, description: "The class's hit die (d6/d8/d10/d12)." },
            ability_priority: {
                type: "array",
                items: { type: "string", enum: ABILITIES },
                description: "All six abilities (STR/DEX/CON/INT/WIS/CHA) ordered most-important first.",
            },
            fits_concept: { type: "string", description: "One line: how this foundation serves the concept." },
        },
        required: ["class_name", "lineage", "level", "background", "hit_die", "ability_priority"],
    },
};

/** Coerce the model's untrusted tool input into a CharacterFoundation (never throws). */
export function coerceFoundation(raw: Record<string, unknown>): CharacterFoundation {
    const priority = strList(raw.ability_priority)
        .map(a => a.toLowerCase())
        .filter((a): a is AbilityKey => (ABILITY_KEYS as string[]).includes(a));
    return {
        className: str(raw.class_name).trim(),
        lineage: str(raw.lineage).trim(),
        level: Math.max(1, Math.floor(num(raw.level, 1))),
        background: str(raw.background).trim(),
        hitDie: str(raw.hit_die).trim().toLowerCase(),
        abilityPriority: [...new Set(priority)],   // de-dupe, preserve order
    };
}

/** Gate the foundation: every load-bearing field legal, level in range, and the priority a full ability ordering. */
export function validateFoundation(f: CharacterFoundation): string[] {
    const errors: string[] = [];
    if (!f.className) errors.push("The character needs a class.");
    if (!f.lineage) errors.push("The character needs a lineage/species.");
    if (!f.background) errors.push("The character needs a background.");
    if (!Number.isInteger(f.level) || f.level < 1 || f.level > 20) errors.push("Level must be an integer between 1 and 20.");
    if (!HIT_DIE_SET.has(f.hitDie)) errors.push("Hit die must be one of d6, d8, d10, d12.");
    if (f.abilityPriority.length !== ABILITY_KEYS.length) {
        errors.push("List all six abilities (STR, DEX, CON, INT, WIS, CHA) once each, ordered most-important first.");
    }
    return errors;
}

/** Apply an approved foundation onto the working character (the source of truth for later phases). */
export function applyFoundation(working: WorkingCharacter, f: CharacterFoundation): void {
    working.className = f.className;
    working.lineage = f.lineage;
    working.level = f.level;
    working.background = f.background;
    working.hitDie = f.hitDie;
    working.abilityPriority = f.abilityPriority;
}

/** The StepSpec for the foundation, parameterized by the user's seed. */
export function foundationStep(seed: string, _brief: ConceptBrief): StepSpec<CharacterFoundation> {
    return {
        id: "foundation",
        tool: FOUNDATION_TOOL,
        system:
            "Decide the mechanical foundation of a D&D 5e character: class, lineage/species, level, background, the " +
            "class's hit die, and the ability priority order. Prefer official options that fit the concept. Do not name " +
            "the character yet — that comes later.",
        task:
            `Original request: "${seed.trim()}". Choose the character's class, lineage, total level, background, the ` +
            "class's hit die, and order all six abilities most-important first for this concept.",
        parse: raw => {
            const value = coerceFoundation(raw);
            return { value, errors: validateFoundation(value) };
        },
    };
}

/** Run Phase 2 once: produce a gated CharacterFoundation from the user's seed. */
export function produceFoundation(
    seed: string,
    brief: ConceptBrief,
    ctx: StepContext,
    ai: AiSettings,
    opts?: RunStepOptions,
    runner?: StepModelRunner,
): Promise<StepResult<CharacterFoundation>> {
    return runStep(foundationStep(seed, brief), ctx, ai, opts, runner);
}
