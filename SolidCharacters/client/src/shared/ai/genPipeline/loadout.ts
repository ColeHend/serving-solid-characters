import { AiSettings } from "../../../models/userSettings";
import { AiToolDef } from "../types";
import { boolean, str, strList } from "../coerce";
import { runStep, StepModelRunner } from "./stepWorker";
import type {
    ArmorCategory, RunStepOptions, StepContext, StepResult, StepSpec, WorkingCharacter,
} from "./types";

/**
 * Phase 5 (plan §7): LOADOUT — the character's armor, weapons, and gear. The armor's WEIGHT CLASS is the
 * load-bearing field: Phase 7 feeds it (plus the shield flag) to compute.computeAC, so AC is derived in
 * code, never asked of the model. Everything else is descriptive equipment. Proficiency-vs-stat is only a
 * soft concern here (plan §7 "warn"), so the gate stays lenient — a missing item is not worth a repair.
 */

const ARMOR_CATEGORIES: ArmorCategory[] = ["none", "light", "medium", "heavy"];
const ARMOR_SET = new Set<string>(ARMOR_CATEGORIES);

/** The loadout the model picks. `armor.category` drives AC; the rest is descriptive gear. */
export interface CharacterLoadout {
    armor: { category: ArmorCategory; name?: string };
    shield: boolean;
    weapons: string[];
    items: string[];
}

export const LOADOUT_TOOL: AiToolDef = {
    name: "character_loadout",
    description:
        "Choose the equipment a D&D 5e character carries: its ARMOR (with its weight class — none/light/medium/heavy — " +
        "since that decides Armor Class), whether it has a shield, its weapons, and other gear. Only pick armor the " +
        "character is proficient with. Example: {\"armor\":{\"category\":\"medium\",\"name\":\"Half plate\"},\"shield\":true," +
        "\"weapons\":[\"Longsword\",\"Javelin (3)\"],\"items\":[\"Explorer's pack\",\"Holy symbol\"]}.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            armor: {
                type: "object",
                additionalProperties: false,
                properties: {
                    category: { type: "string", enum: ARMOR_CATEGORIES, description: "Armor weight class (\"none\" if unarmored)." },
                    name: { type: "string", description: "The armor's name (e.g. \"Chain mail\"). Omit if unarmored." },
                },
                required: ["category"],
                description: "The character's armor and its weight class.",
            },
            shield: { type: "boolean", description: "Whether the character wields a shield." },
            weapons: { type: "array", items: { type: "string" }, description: "Weapons the character carries." },
            items: { type: "array", items: { type: "string" }, description: "Other gear, packs, and notable items." },
            fits_concept: { type: "string", description: "One line: how this loadout serves the concept." },
        },
        required: ["armor"],
    },
};

/** Coerce the model's untrusted loadout output (never throws; unknown weight class → "none"). */
export function coerceLoadout(raw: Record<string, unknown>): CharacterLoadout {
    const armorRaw = (raw.armor ?? {}) as Record<string, unknown>;
    const category = str(armorRaw.category).trim().toLowerCase();
    const name = str(armorRaw.name).trim();
    return {
        armor: { category: (ARMOR_SET.has(category) ? category : "none") as ArmorCategory, ...(name ? { name } : {}) },
        shield: boolean(raw.shield),
        weapons: strList(raw.weapons),
        items: strList(raw.items),
    };
}

/** Gate the loadout: the armor's weight class must be legal (it drives AC). The rest is best-effort. */
export function validateLoadout(l: CharacterLoadout): string[] {
    if (!ARMOR_SET.has(l.armor.category)) return ["Armor category must be one of none, light, medium, heavy."];
    return [];
}

/** Apply the loadout onto the working character: a flat equipment list plus the AC-bearing armor fields. */
export function applyLoadout(working: WorkingCharacter, l: CharacterLoadout): void {
    const armorLine = l.armor.category === "none" ? [] : [l.armor.name || `${l.armor.category} armor`];
    working.equipment = [...armorLine, ...(l.shield ? ["Shield"] : []), ...l.weapons, ...l.items];
    working.armor = { category: l.armor.category, ...(l.armor.name ? { name: l.armor.name } : {}) };
    working.shield = l.shield;
}

export function loadoutStep(): StepSpec<CharacterLoadout> {
    return {
        id: "loadout",
        tool: LOADOUT_TOOL,
        system:
            "Choose the equipment for a D&D 5e character whose class, proficiencies, and ability scores are decided (in " +
            "DECIDED SO FAR). Pick armor the character is proficient with and TAG ITS WEIGHT CLASS, note any shield, and " +
            "list weapons and gear that fit the concept.",
        task:
            "Equip the character: choose its armor (with its weight class none/light/medium/heavy), whether it has a " +
            "shield, its weapons, and other gear. Pick only armor it is proficient with.",
        parse: raw => {
            const value = coerceLoadout(raw);
            return { value, errors: validateLoadout(value) };
        },
    };
}

/** Run Phase 5 once: produce a gated loadout (armor weight class + shield + weapons + gear). */
export function produceLoadout(
    ctx: StepContext,
    ai: AiSettings,
    opts?: RunStepOptions,
    runner?: StepModelRunner,
): Promise<StepResult<CharacterLoadout>> {
    return runStep(loadoutStep(), ctx, ai, opts, runner);
}
