import { AiSettings } from "../../../models/userSettings";
import { AiToolDef } from "../types";
import { list, num, str, strList } from "../coerce";
import { runStep, StepModelRunner } from "./stepWorker";
import { validateFeatureLevels, validateNoDuplicateFeatures, validateSavingThrowCount } from "./validate";
import type {
    ConceptBrief, RunStepOptions, StepContext, StepResult, StepSpec, WorkingClass, WorkingFeature,
} from "./types";

/**
 * Phase C (plan §6): the CHASSIS — the structural rules that hang off the ratified skeleton. The model
 * fills proficiencies, saving throws, starting equipment, and writes the level-1 feature(s) that put the
 * skeleton's core mechanic into actual rules text. After this the working class is a complete (if minimal)
 * level-1 class that assembles to a savable `Class5E`.
 *
 * The skeleton's name / hit die / primary ability / caster type are already decided and live in the
 * carry-forward summary, so this step does NOT re-ask for them — it builds the body around them.
 */

const ABILITIES = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
const ABILITY_SET = new Set(ABILITIES);
const SAVING_THROW_COUNT = 2;   // every official class grants exactly two saving-throw proficiencies

/** A class/subclass feature as the chassis tool emits it. */
const featureSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
        level: { type: "integer", minimum: 1, maximum: 1, description: "Level the feature is gained at. For this step that is 1." },
        name: { type: "string", description: "Feature name, e.g. \"Storm's Charge\"." },
        description: { type: "string", description: "Full rules text with concrete numbers (Markdown allowed). 1-3 sentences minimum." },
    },
    required: ["level", "name", "description"],
};

/** The body the chassis step produces. Assembled (with the skeleton fields) into a `Class5E`. */
export interface ClassChassis {
    savingThrows: string[];
    skills: string[];
    armor: string[];
    weapons: string[];
    tools: string[];
    startingEquipment: string[];
    features: WorkingFeature[];
}

export const CHASSIS_TOOL: AiToolDef = {
    name: "class_chassis",
    description:
        "Fill the CHASSIS of a homebrew class whose skeleton (name, hit die, primary ability, core mechanic) is " +
        "already decided: its saving-throw proficiencies, the skills it can choose from, armor/weapon/tool " +
        "proficiencies, starting equipment, and the level-1 feature(s) that turn the core mechanic into real " +
        "rules. Example: {\"saving_throws\":[\"STR\",\"CON\"],\"skills\":[\"Athletics\",\"Intimidation\",\"Perception\"]," +
        "\"armor\":[\"Light armor\",\"Medium armor\",\"Shields\"],\"weapons\":[\"Simple weapons\",\"Martial weapons\"]," +
        "\"tools\":[],\"starting_equipment\":[\"A martial weapon\",\"Leather armor\",\"An explorer's pack\"]," +
        "\"features\":[{\"level\":1,\"name\":\"Storm's Charge\",\"description\":\"You gain 1 Charge when you take damage; " +
        "spend a Charge on a hit to deal +1d6 thunder damage.\"}]}.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            saving_throws: { type: "array", items: { type: "string", enum: ABILITIES }, description: "Exactly two saving-throw proficiencies." },
            skills: { type: "array", items: { type: "string" }, description: "The skill proficiency options this class can choose from (2-6)." },
            armor: { type: "array", items: { type: "string" }, description: "Armor proficiencies, e.g. [\"Light armor\",\"Shields\"]. Empty if none." },
            weapons: { type: "array", items: { type: "string" }, description: "Weapon proficiencies, e.g. [\"Simple weapons\"]. Empty if none." },
            tools: { type: "array", items: { type: "string" }, description: "Tool proficiencies, if any. May be empty." },
            starting_equipment: { type: "array", items: { type: "string" }, description: "Starting equipment items." },
            features: { type: "array", items: featureSchema, description: "At least one LEVEL-1 feature implementing the core mechanic." },
            fits_concept: { type: "string", description: "One line: how this chassis serves the concept." },
        },
        required: ["saving_throws", "skills", "features"],
    },
};

/** A leveled feature from untrusted tool input. */
function coerceFeature(raw: unknown): WorkingFeature {
    const f = (raw ?? {}) as Record<string, unknown>;
    return { name: str(f.name).trim(), level: Math.floor(num(f.level, 1)), description: str(f.description).trim() };
}

/** Coerce the model's untrusted tool input into a ClassChassis (never throws). */
export function coerceChassis(raw: Record<string, unknown>): ClassChassis {
    return {
        savingThrows: strList(raw.saving_throws).map(s => s.toUpperCase()),
        skills: strList(raw.skills),
        armor: strList(raw.armor),
        weapons: strList(raw.weapons),
        tools: strList(raw.tools),
        startingEquipment: strList(raw.starting_equipment),
        features: list(raw.features).map(coerceFeature),
    };
}

/**
 * Gate the chassis against the level-1 slice: exactly two legal saving throws, at least two skill options,
 * and at least one well-formed level-1 feature (so the assembled class actually does something at level 1).
 */
export function validateChassis(c: ClassChassis): string[] {
    const errors: string[] = [];

    errors.push(...validateSavingThrowCount(c.savingThrows, SAVING_THROW_COUNT));
    for (const s of c.savingThrows) {
        if (!ABILITY_SET.has(s)) errors.push(`Saving throw "${s}" must be one of STR, DEX, CON, INT, WIS, CHA.`);
    }

    if (c.skills.length < 2) errors.push("Offer at least two skill proficiency options.");

    const named = c.features.filter(f => f.name);
    if (!named.length) errors.push("Add at least one level-1 feature.");
    for (const f of named) {
        if (!f.description) errors.push(`Feature "${f.name}" needs rules text.`);
    }
    // Level-1 slice (M1): the chassis only defines what the class can do at level 1.
    errors.push(...validateFeatureLevels(named, 1, 1));
    errors.push(...validateNoDuplicateFeatures(named));

    return errors;
}

/** Apply the chassis onto the working class. */
export function applyChassis(working: WorkingClass, c: ClassChassis): void {
    working.savingThrows = c.savingThrows;
    working.proficiencies = { armor: c.armor, weapons: c.weapons, tools: c.tools, skills: c.skills };
    working.startingEquipment = c.startingEquipment;
    working.features = c.features.filter(f => f.name);
}

/** The StepSpec for the chassis. The skeleton lives in the carry-forward summary, not re-asked here. */
export function chassisStep(_brief: ConceptBrief): StepSpec<ClassChassis> {
    return {
        id: "chassis",
        tool: CHASSIS_TOOL,
        system: "Build the chassis of a homebrew class whose skeleton is already decided (it is in DECIDED SO FAR). Fill its proficiencies, saving throws, starting equipment, and write the level-1 feature(s) that realise the core mechanic. Do not change the name, hit die, primary ability, or caster type.",
        task: "Using the decided skeleton, fill the class chassis: pick exactly two saving throws, the skill options, armor/weapon/tool proficiencies, starting equipment, and write at least one level-1 feature that implements the core mechanic with concrete numbers.",
        parse: raw => {
            const value = coerceChassis(raw);
            return { value, errors: validateChassis(value) };
        },
    };
}

/** Run Phase C once: produce a gated ClassChassis built against the ratified skeleton. */
export function produceChassis(
    brief: ConceptBrief,
    ctx: StepContext,
    ai: AiSettings,
    opts?: RunStepOptions,
    runner?: StepModelRunner,
): Promise<StepResult<ClassChassis>> {
    return runStep(chassisStep(brief), ctx, ai, opts, runner);
}
