import { getAbilityModifier, getProficiencyBonus, signed } from "../../customHooks/utility/tools/dndMath";
import { buildSlotTable, buildSpellcasting, parseCasterType } from "../refs/spellSlots";
import type { AbilityKey, ArmorCategory, WorkingCharacter, WorkingDerivedStats } from "./types";
import { ABILITY_KEYS } from "./types";

/**
 * Code-computed derived values for the pipeline's "codeless" steps (plan §4 / Phases 3·C·7). The model
 * never emits a modifier, slot count, AC, or HP — those are deterministic, so we compute them here and
 * only ask the model for the genuinely creative choices.
 *
 * This module re-exports the canonical primitives that already exist (`dndMath`, `spellSlots`) so the
 * pipeline has ONE import surface, and adds the two pieces that were missing (`computeAC`, `computeHP`).
 */

// ----- re-exported canonical primitives (single import surface for the pipeline) -----
export { getAbilityModifier, getProficiencyBonus, signed, buildSlotTable, buildSpellcasting, parseCasterType };
export type { ArmorCategory };

export interface ArmorInput {
    category: ArmorCategory;
    /** Base AC of the armor itself (leather 11, scale 14, chain mail 16, plate 18…). Defaults per category. */
    baseAc?: number;
}

/** Sensible base AC when the caller doesn't supply a specific armor's value. */
const DEFAULT_ARMOR_BASE: Record<ArmorCategory, number> = { none: 10, light: 11, medium: 12, heavy: 16 };

/**
 * Armor Class by 5e rules:
 * - unarmored / light: base + full Dex modifier
 * - medium:            base + Dex modifier capped at +2
 * - heavy:             base only (Dex ignored)
 * - shield:            +2 on top of any of the above
 */
export function computeAC(dexMod: number, armor?: ArmorInput, hasShield = false): number {
    const category = armor?.category ?? "none";
    const base = armor?.baseAc ?? DEFAULT_ARMOR_BASE[category];
    let ac = base;
    if (category === "none" || category === "light") ac = base + dexMod;
    else if (category === "medium") ac = base + Math.min(dexMod, 2);
    // heavy: ac stays base
    return ac + (hasShield ? 2 : 0);
}

/** Parse a hit-die token ("d10" / "D10" / 10 / "10") to its die size; 0 if unrecognized. */
export function parseHitDie(raw: unknown): number {
    if (typeof raw === "number" && Number.isFinite(raw)) return Math.floor(raw);
    const m = String(raw ?? "").trim().toLowerCase().match(/^d?(\d+)$/);
    return m ? Number(m[1]) : 0;
}

/**
 * Average-progression Hit Points: max die at level 1, then the fixed average (⌊die/2⌋+1) per later level,
 * plus the Constitution modifier each level, with the 5e minimum of 1 HP gained per level.
 *
 * @param level   character/class level (≥1)
 * @param hitDie  die SIZE (e.g. 10 for d10) — use `parseHitDie` to convert "d10"
 * @param conMod  Constitution modifier
 */
export function computeHP(level: number, hitDie: number, conMod: number): number {
    const lv = Math.max(1, Math.floor(level));
    const hd = Math.max(1, Math.floor(hitDie));
    const avgPerLevel = Math.floor(hd / 2) + 1;
    let hp = Math.max(1, hd + conMod);                          // level 1 = max die + Con (min 1)
    for (let l = 2; l <= lv; l++) hp += Math.max(1, avgPerLevel + conMod);   // each later level (min 1)
    return hp;
}

/** Spell save DC = 8 + proficiency bonus + spellcasting-ability modifier. */
export function spellSaveDC(profBonus: number, abilityMod: number): number {
    return 8 + profBonus + abilityMod;
}

/** Spell attack bonus = proficiency bonus + spellcasting-ability modifier. */
export function spellAttackBonus(profBonus: number, abilityMod: number): number {
    return profBonus + abilityMod;
}

/** Passive Perception = 10 + Wisdom modifier (+ proficiency bonus when proficient in Perception). */
export function passivePerception(wisMod: number, profBonus = 0, proficient = false): number {
    return 10 + wisMod + (proficient ? profBonus : 0);
}

/** All six ability modifiers for a (possibly partial) score set; missing scores default to 10 (mod +0). */
export function abilityMods(scores: Partial<Record<AbilityKey, number>>): Record<AbilityKey, number> {
    const out = {} as Record<AbilityKey, number>;
    for (const k of ABILITY_KEYS) out[k] = getAbilityModifier(scores[k] ?? 10);
    return out;
}

/** The spellcasting ability for a caster of unknown class: the strongest of INT/WIS/CHA (ties → that order). */
export function spellcastingAbility(mods: Record<AbilityKey, number>): AbilityKey {
    return (["int", "wis", "cha"] as AbilityKey[]).reduce((best, k) => (mods[k] > mods[best] ? k : best), "int" as AbilityKey);
}

/**
 * Phase 7 (plan §7): derive EVERY combat stat for a working character in code — the model never emits AC,
 * HP, save DCs, or attack bonuses. Reuses the canonical primitives above so the numbers can never drift
 * from what the character sheet would compute. Spell save DC / attack are filled only for casters (the
 * spellcasting ability is inferred as the strongest mental stat, since the class may be homebrew).
 */
export function computeCharacterStats(working: WorkingCharacter): WorkingDerivedStats {
    const level = Math.max(1, Math.floor(working.level ?? 1));
    const mods = abilityMods(working.abilityScores ?? {});
    const proficiencyBonus = getProficiencyBonus(level);

    const proficientInPerception = (working.skills ?? []).some(s => s.trim().toLowerCase() === "perception");

    const derived: WorkingDerivedStats = {
        proficiencyBonus,
        ac: computeAC(mods.dex, working.armor, working.shield ?? false),
        hp: computeHP(level, parseHitDie(working.hitDie), mods.con),
        initiative: mods.dex,
        passivePerception: passivePerception(mods.wis, proficiencyBonus, proficientInPerception),
    };

    if (working.casterType && working.casterType !== "none") {
        const castMod = mods[spellcastingAbility(mods)];
        derived.spellSaveDC = spellSaveDC(proficiencyBonus, castMod);
        derived.spellAttackBonus = spellAttackBonus(proficiencyBonus, castMod);
    }

    return derived;
}
