import { AiToolDef, AiToolCall } from "./types";
import {
    AttackDamage, AttackParams, DiceGroup, SaveEffectParams,
    baseSaveFailProbability, getAbilityModifier, getProficiencyBonus, signed, singleAttackDPRResult,
    saveEffectDPR,
} from "../customHooks/utility/tools/dndMath";

/**
 * Deterministic D&D math tools. Unlike create_* tools these are EXECUTED in the browser (no model,
 * no user): the orchestration store calls runComputeTool() and feeds the result straight back as a
 * tool_result, so the model can reason over an exact number instead of doing arithmetic itself.
 *
 * Schemas are deliberately FLAT (primitive fields, dice as a "2d6+1d6" string) so a small local model
 * like gemma can populate them reliably; runComputeTool maps them into dndMath's nested AttackParams /
 * AttackDamage / SaveEffectParams. The dispatcher is pure, synchronous, and never throws — on bad input
 * it returns { isError: true } with a hint so the model can retry.
 */

// ----- input coercers (model output is untrusted JSON; mirrors toolDispatcher.ts) -----
const str = (v: unknown, d = ""): string => (typeof v === "string" ? v : v == null ? d : String(v));
const optNum = (v: unknown, d: number): number => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v))) return Number(v);
    return d;
};
/** A required numeric field: null when absent or unparseable, so the caller can flag it. */
const reqNum = (v: unknown): number | null => {
    const n = optNum(v, NaN);
    return Number.isFinite(n) ? n : null;
};
const boolean = (v: unknown): boolean => v === true || v === "true";

const ADV_MODES = ["normal", "advantage", "disadvantage"] as const;
const SAVE_TYPES = ["no_save", "save_negates", "save_half"] as const;
type AdvMode = (typeof ADV_MODES)[number];
type SaveType = (typeof SAVE_TYPES)[number];
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], d: T): T => {
    const s = str(v).trim().toLowerCase().replace(/[\s-]+/g, "_");
    return (allowed as readonly string[]).includes(s) ? (s as T) : d;
};

/**
 * Parse a flat dice expression like "2d6+1d4+3" into dice groups plus any embedded flat bonus.
 * Tolerant: ignores whitespace and unparseable tokens; "d8" means 1d8. The flat bonus lets a model
 * that crams "+3" into the dice string instead of the damageBonus field still get a correct answer.
 */
export function parseDiceExpression(s: unknown): { groups: DiceGroup[]; flatBonus: number } {
    const text = str(s).toLowerCase().replace(/\s+/g, "");
    const groups: DiceGroup[] = [];
    let flatBonus = 0;
    const tokens = text.match(/[+-]?[^+-]+/g) ?? [];
    for (const tok of tokens) {
        const sign = tok.startsWith("-") ? -1 : 1;
        const body = tok.replace(/^[+-]/, "");
        const dice = body.match(/^(\d*)d(\d+)$/);
        if (dice) {
            const count = dice[1] === "" ? 1 : parseInt(dice[1], 10);
            const sides = parseInt(dice[2], 10);
            if (count > 0 && sides > 0) groups.push({ count, sides });
            continue;
        }
        if (/^\d+$/.test(body)) flatBonus += sign * parseInt(body, 10);
        // anything else is garbage — ignore
    }
    return { groups, flatBonus };
}

const diceLabel = (groups: DiceGroup[]): string => groups.map(g => `${g.count}d${g.sides}`).join("+");
const pct = (p: number): string => `${Math.round(p * 100)}%`;
const bonusLabel = (n: number): string => (n === 0 ? "" : signed(n));

export const COMPUTE_TOOLS: AiToolDef[] = [
    {
        name: "calc_ability_modifier",
        description: "Compute the D&D 5e ability modifier for an ability score. Example: {\"score\":16} → +3.",
        inputSchema: {
            type: "object",
            additionalProperties: false,
            properties: {
                score: { type: "integer", minimum: 1, maximum: 30, description: "The ability score (1-30)." },
            },
            required: ["score"],
        },
    },
    {
        name: "calc_proficiency_bonus",
        description: "Compute the D&D 5e proficiency bonus for a character/monster level. Example: {\"level\":5} → +3.",
        inputSchema: {
            type: "object",
            additionalProperties: false,
            properties: {
                level: { type: "integer", minimum: 1, maximum: 20, description: "Character or monster level (1-20)." },
            },
            required: ["level"],
        },
    },
    {
        name: "calc_attack_dpr",
        description: "Estimate average damage-per-round for a weapon/attack-roll attack. Use to balance martial features or weapons. Example: {\"attackBonus\":7,\"targetAC\":16,\"damageDice\":\"2d6\",\"damageBonus\":4,\"numberOfAttacks\":2}.",
        inputSchema: {
            type: "object",
            additionalProperties: false,
            properties: {
                attackBonus: { type: "integer", description: "Total bonus to the attack roll." },
                targetAC: { type: "integer", description: "The target's Armor Class (use 14-16 for a same-level foe if unsure)." },
                damageDice: { type: "string", description: "Damage dice on a hit, e.g. \"2d6\" or \"1d8+1d6\". Do not include the flat bonus here." },
                damageBonus: { type: "integer", description: "Flat damage added on a hit (e.g. ability modifier). Default 0." },
                numberOfAttacks: { type: "integer", minimum: 1, description: "How many identical attacks per round. Default 1." },
                advantage: { type: "string", enum: [...ADV_MODES], description: "Roll mode. Default normal." },
                critThreshold: { type: "integer", minimum: 18, maximum: 20, description: "Lowest d20 that crits (20 normally, 19 for Champion). Default 20." },
            },
            required: ["attackBonus", "targetAC", "damageDice"],
        },
    },
    {
        name: "calc_save_dpr",
        description: "Estimate average damage for a saving-throw effect (e.g. a spell like Fireball). Example: {\"saveDC\":15,\"targetSaveBonus\":3,\"damageDice\":\"8d6\",\"saveType\":\"save_half\",\"numberOfTargets\":3}.",
        inputSchema: {
            type: "object",
            additionalProperties: false,
            properties: {
                saveDC: { type: "integer", description: "The save DC the target rolls against." },
                targetSaveBonus: { type: "integer", description: "The target's bonus to the saving throw. Default 0." },
                damageDice: { type: "string", description: "Damage dice on a failed save, e.g. \"8d6\". Do not include the flat bonus here." },
                damageBonus: { type: "integer", description: "Flat damage added. Default 0." },
                saveType: { type: "string", enum: [...SAVE_TYPES], description: "no_save (always full), save_negates (none on success), or save_half (half on success). Default save_half." },
                numberOfTargets: { type: "integer", minimum: 1, description: "How many targets are affected. Default 1." },
                evasion: { type: "boolean", description: "Target has Evasion (no damage on success, half on fail). Default false." },
            },
            required: ["saveDC", "damageDice"],
        },
    },
];

export interface ComputeResult { content: string; isError: boolean; }
const err = (content: string): ComputeResult => ({ content, isError: true });

/**
 * Execute a compute tool call synchronously. Returns a short natural-language result string (fed back
 * to the model as a tool_result) and whether it was an error. Never throws.
 */
export function runComputeTool(tc: AiToolCall): ComputeResult {
    const i = (tc.input ?? {}) as Record<string, unknown>;
    switch (tc.name) {
        case "calc_ability_modifier": {
            const score = reqNum(i.score);
            if (score === null) return err("calc_ability_modifier needs a numeric \"score\".");
            const mod = getAbilityModifier(score);
            return { content: `Ability score ${score} → modifier ${signed(mod)}.`, isError: false };
        }
        case "calc_proficiency_bonus": {
            const level = reqNum(i.level);
            if (level === null) return err("calc_proficiency_bonus needs a numeric \"level\".");
            const pb = getProficiencyBonus(level);
            return { content: `At level ${level} the proficiency bonus is ${signed(pb)}.`, isError: false };
        }
        case "calc_attack_dpr": {
            const attackBonus = reqNum(i.attackBonus);
            const targetAC = reqNum(i.targetAC);
            if (attackBonus === null || targetAC === null) return err("calc_attack_dpr needs numeric \"attackBonus\" and \"targetAC\".");
            const { groups, flatBonus } = parseDiceExpression(i.damageDice);
            if (!groups.length) return err(`Could not read damage dice from "${str(i.damageDice)}". Use a form like "2d6" or "1d8+1d6".`);
            const damageBonus = optNum(i.damageBonus, 0) + flatBonus;
            const advantageMode: AdvMode = oneOf(i.advantage, ADV_MODES, "normal");
            const critThreshold = Math.min(20, Math.max(18, optNum(i.critThreshold, 20)));
            const attacks = Math.max(1, Math.round(optNum(i.numberOfAttacks, 1)));
            const attack: AttackParams = { attackBonus, targetAC, advantageMode, critThreshold };
            const damage: AttackDamage = { damageDice: groups, damageBonus };
            const r = singleAttackDPRResult(attack, damage);
            const total = r.dpr * attacks;
            return {
                content: `Attack ${signed(attackBonus)} vs AC ${targetAC}, ${diceLabel(groups)}${bonusLabel(damageBonus)}, ` +
                    `${attacks} attack${attacks === 1 ? "" : "s"} (${advantageMode}): ~${total.toFixed(1)} DPR. ` +
                    `Per-attack hit chance ${pct(r.hitChance)}, crit ${pct(r.critChance)}, ` +
                    `avg ${r.averageDamageOnHit.toFixed(1)} on hit / ${r.averageDamageOnCrit.toFixed(1)} on crit.`,
                isError: false,
            };
        }
        case "calc_save_dpr": {
            const saveDC = reqNum(i.saveDC);
            if (saveDC === null) return err("calc_save_dpr needs a numeric \"saveDC\".");
            const { groups, flatBonus } = parseDiceExpression(i.damageDice);
            if (!groups.length) return err(`Could not read damage dice from "${str(i.damageDice)}". Use a form like "8d6".`);
            const targetSaveBonus = optNum(i.targetSaveBonus, 0);
            const damageBonus = optNum(i.damageBonus, 0) + flatBonus;
            const saveType: SaveType = oneOf(i.saveType, SAVE_TYPES, "save_half");
            const numberOfTargets = Math.max(1, Math.round(optNum(i.numberOfTargets, 1)));
            const params: SaveEffectParams = {
                saveDC, targetSaveBonus, damageDice: groups, damageBonus, saveType,
                evasion: boolean(i.evasion), numberOfTargets,
            };
            const total = saveEffectDPR(params);
            const fail = baseSaveFailProbability(saveDC, targetSaveBonus);
            const saveLabel = saveType === "no_save" ? "no save" : saveType === "save_negates" ? "save negates" : "save for half";
            return {
                content: `DC ${saveDC} save (target ${signed(targetSaveBonus)}), ${diceLabel(groups)}${bonusLabel(damageBonus)}, ` +
                    `${saveLabel}${params.evasion ? " (evasion)" : ""}, ${numberOfTargets} target${numberOfTargets === 1 ? "" : "s"}: ` +
                    `~${total.toFixed(1)} expected damage (fail chance ${pct(fail)}).`,
                isError: false,
            };
        }
        default:
            return err(`Unknown compute tool "${tc.name}".`);
    }
}
