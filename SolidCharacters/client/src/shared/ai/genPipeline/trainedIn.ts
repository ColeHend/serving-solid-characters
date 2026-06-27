import { AiSettings } from "../../../models/userSettings";
import { AiToolDef } from "../types";
import { num, strList } from "../coerce";
import { runStep, StepModelRunner } from "./stepWorker";
import { validateAbilityScores, validateSavingThrowCount } from "./validate";
import { ABILITY_KEYS } from "./types";
import type {
    AbilityKey, RunStepOptions, StepContext, StepResult, StepSpec, WorkingCharacter,
} from "./types";

/**
 * Phase 3 (plan §7): TRAINED-IN, the model → code → model interleave. First the model rolls the six ability
 * SCORES (gated against the foundation's priority order: the most-important ability must be the highest);
 * then the orchestrator computes modifiers + proficiency bonus IN CODE (compute.ts) — never asked of the
 * model; then the model picks the SKILLS, SAVING THROWS, and other proficiencies the class + background
 * grant. Splitting scores from proficiencies keeps each step small and lets the code-computed modifiers
 * inform the skill choices (they ride in the carry-forward summary).
 */

const ABILITIES = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
const SAVING_THROW_COUNT = 2;   // a single-class character is proficient in exactly two saving throws

// ───────────────────────────── 3a: ability scores ─────────────────────────────

export const ABILITY_SCORES_TOOL: AiToolDef = {
    name: "ability_scores",
    description:
        "Assign the six ability scores for a D&D 5e character. Use a legal spread (point-buy/standard-array style, " +
        "8-15 before racial bonuses, up to ~17 at level 1 / 20 later) and put the HIGHEST score in the character's " +
        "most-important ability (the priority order is in DECIDED SO FAR). Example: {\"str\":16,\"dex\":12,\"con\":15," +
        "\"int\":8,\"wis\":13,\"cha\":10}.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            str: { type: "integer", minimum: 1, maximum: 30, description: "Strength score." },
            dex: { type: "integer", minimum: 1, maximum: 30, description: "Dexterity score." },
            con: { type: "integer", minimum: 1, maximum: 30, description: "Constitution score." },
            int: { type: "integer", minimum: 1, maximum: 30, description: "Intelligence score." },
            wis: { type: "integer", minimum: 1, maximum: 30, description: "Wisdom score." },
            cha: { type: "integer", minimum: 1, maximum: 30, description: "Charisma score." },
            fits_concept: { type: "string", description: "One line: how this spread serves the concept." },
        },
        required: ["str", "dex", "con", "int", "wis", "cha"],
    },
};

/** Coerce the model's untrusted scores into a full ability-score record (never throws; missing → 10). */
export function coerceAbilityScores(raw: Record<string, unknown>): Record<AbilityKey, number> {
    const out = {} as Record<AbilityKey, number>;
    for (const k of ABILITY_KEYS) out[k] = Math.floor(num(raw[k], 10));
    return out;
}

/**
 * Gate the scores: all in the legal 1-30 band (reused) and the foundation's PRIMARY ability (priority[0])
 * holds the highest score, so the build's mechanics line up with its stated priority.
 */
export function validateScores(scores: Record<AbilityKey, number>, priority: AbilityKey[]): string[] {
    const errors = validateAbilityScores(scores);
    const primary = priority[0];
    if (primary) {
        const top = Math.max(...ABILITY_KEYS.map(k => scores[k]));
        if (scores[primary] < top) {
            errors.push(`${primary.toUpperCase()} is the most-important ability but isn't the highest score — put the highest score in ${primary.toUpperCase()}.`);
        }
    }
    return errors;
}

export function abilityScoresStep(priority: AbilityKey[]): StepSpec<Record<AbilityKey, number>> {
    return {
        id: "ability_scores",
        tool: ABILITY_SCORES_TOOL,
        system:
            "Assign the six ability scores for a D&D 5e character whose class, level, and ability priority are already " +
            "decided (in DECIDED SO FAR). Use a legal spread and put the highest score in the most-important ability.",
        task:
            "Assign all six ability scores. Use a legal spread for the character's level and make the most-important " +
            "ability (first in the priority order) the highest.",
        parse: raw => {
            const value = coerceAbilityScores(raw);
            return { value, errors: validateScores(value, priority) };
        },
    };
}

/** Run Phase 3a once: produce gated ability scores honouring the foundation's priority order. */
export function produceAbilityScores(
    priority: AbilityKey[],
    ctx: StepContext,
    ai: AiSettings,
    opts?: RunStepOptions,
    runner?: StepModelRunner,
): Promise<StepResult<Record<AbilityKey, number>>> {
    return runStep(abilityScoresStep(priority), ctx, ai, opts, runner);
}

// ───────────────────────────── 3b: skills / saves / proficiencies ─────────────────────────────

/** The proficiencies the model picks once scores are set. */
export interface CharacterTraining {
    skills: string[];
    savingThrows: AbilityKey[];
    otherProficiencies: string[];
}

export const TRAINING_TOOL: AiToolDef = {
    name: "character_training",
    description:
        "Choose the proficiencies for a D&D 5e character whose class, background, and ability scores are decided: the " +
        "SKILLS it is trained in (those its class + background grant), its two SAVING-THROW proficiencies (the class's), " +
        "and any tool/weapon/armor proficiencies. Example: {\"skills\":[\"Athletics\",\"Intimidation\"],\"saving_throws\":" +
        "[\"str\",\"con\"],\"other_proficiencies\":[\"Smith's tools\"]}.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            skills: { type: "array", items: { type: "string" }, description: "Skill proficiencies from the class + background (typically 3-5)." },
            saving_throws: { type: "array", items: { type: "string", enum: ABILITIES }, description: "Exactly two saving-throw proficiencies (the class's)." },
            other_proficiencies: { type: "array", items: { type: "string" }, description: "Tool/weapon/armor proficiencies. May be empty." },
            fits_concept: { type: "string", description: "One line: how this training serves the concept." },
        },
        required: ["skills", "saving_throws"],
    },
};

/** Coerce the model's untrusted training output (never throws). */
export function coerceTraining(raw: Record<string, unknown>): CharacterTraining {
    const saves = strList(raw.saving_throws)
        .map(s => s.toLowerCase())
        .filter((s): s is AbilityKey => (ABILITY_KEYS as string[]).includes(s));
    return {
        skills: dedupe(strList(raw.skills)),
        savingThrows: [...new Set(saves)],
        otherProficiencies: strList(raw.other_proficiencies),
    };
}

/** Gate training: a sensible number of distinct skills, and exactly two legal saving throws. */
export function validateTraining(t: CharacterTraining): string[] {
    const errors: string[] = [];
    if (t.skills.length < 2) errors.push("Choose at least two skill proficiencies.");
    if (t.skills.length > 8) errors.push("That is too many skills — pick the ones the class and background actually grant (usually 3-5).");
    errors.push(...validateSavingThrowCount(t.savingThrows, SAVING_THROW_COUNT));
    return errors;
}

/** Apply training onto the working character. */
export function applyTraining(working: WorkingCharacter, t: CharacterTraining): void {
    working.skills = t.skills;
    working.savingThrows = t.savingThrows;
    working.otherProficiencies = t.otherProficiencies;
}

export function trainingStep(): StepSpec<CharacterTraining> {
    return {
        id: "training",
        tool: TRAINING_TOOL,
        system:
            "Choose the proficiencies for a D&D 5e character whose class, background, and ability scores are decided (in " +
            "DECIDED SO FAR). Pick the skills the class + background grant, the class's two saving-throw proficiencies, and " +
            "any tool/weapon/armor proficiencies.",
        task:
            "Pick the character's skill proficiencies (those its class + background grant), its two saving-throw " +
            "proficiencies, and any other proficiencies (tools/weapons/armor).",
        parse: raw => {
            const value = coerceTraining(raw);
            return { value, errors: validateTraining(value) };
        },
    };
}

/** Run Phase 3b once: produce gated skills/saves/proficiencies. */
export function produceTraining(
    ctx: StepContext,
    ai: AiSettings,
    opts?: RunStepOptions,
    runner?: StepModelRunner,
): Promise<StepResult<CharacterTraining>> {
    return runStep(trainingStep(), ctx, ai, opts, runner);
}

/** Case-insensitive de-dupe that keeps the first spelling of each entry. */
function dedupe(items: string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const s of items) {
        const key = s.trim().toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(s.trim());
    }
    return out;
}
