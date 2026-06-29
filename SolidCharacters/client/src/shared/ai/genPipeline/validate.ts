import { buildSlotTable, parseCasterType } from "../refs/spellSlots";
import { getAbilityModifier } from "../../customHooks/utility/tools/dndMath";
import type { AbilityKey, CasterTypeName, WorkingFeature } from "./types";

/**
 * Per-step CONSISTENCY gates (plan §2.1 third bullet + §4 validate.ts): cheap deterministic checks that a
 * step's output AGREES with the working object decided so far. These are the cross-step rules a single
 * step can't see on its own — ability modifiers must match the rolled scores, spell levels must be
 * reachable for the caster type, feature levels must be in range, no duplicate feature names, etc.
 *
 * Each returns a (possibly empty) list of error strings; an empty list means the check passed. They feed
 * the step worker's repair loop (a non-empty result re-runs the step with the errors appended).
 */

// ───────────────────────────── ability scores & modifiers ─────────────────────────────

/** Scores must be in a sane 1–30 band (point-buy/standard-array/rolled all land inside this). */
export function validateAbilityScores(scores: Partial<Record<AbilityKey, number>>): string[] {
    const errors: string[] = [];
    for (const [k, v] of Object.entries(scores)) {
        if (v == null) continue;
        if (!Number.isFinite(v) || v < 1 || v > 30) errors.push(`${k.toUpperCase()} score ${v} is out of the 1–30 range.`);
    }
    return errors;
}

/** Each claimed modifier must equal ⌊(score−10)/2⌋ for the matching score (catches a model "doing the math" wrong). */
export function validateAbilityMods(
    scores: Partial<Record<AbilityKey, number>>,
    claimedMods: Partial<Record<AbilityKey, number>>,
): string[] {
    const errors: string[] = [];
    for (const [k, mod] of Object.entries(claimedMods)) {
        const score = scores[k as AbilityKey];
        if (score == null || mod == null) continue;
        const expected = getAbilityModifier(score);
        if (mod !== expected) errors.push(`${k.toUpperCase()} modifier ${signedish(mod)} doesn't match score ${score} (should be ${signedish(expected)}).`);
    }
    return errors;
}

// ───────────────────────────── counts (skills / saving throws) ─────────────────────────────

/** A class grants exactly N saving-throw proficiencies (almost always 2). */
export function validateSavingThrowCount(saves: string[], expected: number): string[] {
    const unique = new Set(saves.map(s => s.trim().toLowerCase()).filter(Boolean));
    if (unique.size !== expected) return [`Expected ${expected} saving-throw proficiencies, found ${unique.size}.`];
    return [];
}

/** Trained skills must match the count the class + background grant (no more, no fewer). */
export function validateSkillCount(skills: string[], expected: number): string[] {
    const unique = new Set(skills.map(s => s.trim().toLowerCase()).filter(Boolean));
    if (unique.size !== expected) return [`Expected ${expected} skill proficiencies, found ${unique.size}.`];
    return [];
}

// ───────────────────────────── features ─────────────────────────────

/** Every feature must sit on a level within [minLevel, maxLevel] (default 1–20). */
export function validateFeatureLevels(features: WorkingFeature[], minLevel = 1, maxLevel = 20): string[] {
    const errors: string[] = [];
    for (const f of features) {
        if (!Number.isInteger(f.level) || f.level < minLevel || f.level > maxLevel) {
            errors.push(`Feature "${f.name || "(unnamed)"}" is at level ${f.level}, outside ${minLevel}–${maxLevel}.`);
        }
    }
    return errors;
}

/** No two features may share a name (case-insensitive) — a duplicate is a contradiction, not an extension. */
export function validateNoDuplicateFeatures(features: WorkingFeature[]): string[] {
    const seen = new Set<string>();
    const dupes = new Set<string>();
    for (const f of features) {
        const key = (f.name ?? "").trim().toLowerCase();
        if (!key) continue;
        if (seen.has(key)) dupes.add(f.name.trim());
        seen.add(key);
    }
    return [...dupes].map(n => `Duplicate feature name: "${n}".`);
}

// ───────────────────────────── spell accessibility ─────────────────────────────

/**
 * The highest spell level a caster of the given type can reach at the given level, derived from the
 * canonical slot tables (so it can never drift from what the sheet actually grants). 0 ⇒ no slots.
 */
export function maxAccessibleSpellLevel(caster: CasterTypeName, level: number): number {
    const table = buildSlotTable(parseCasterType(caster));
    const slots = table[Math.max(1, Math.floor(level))];
    if (!slots) return 0;
    let max = 0;
    for (const key of Object.keys(slots)) {
        const m = key.match(/spellSlotsLevel(\d+)/);
        if (m) max = Math.max(max, Number(m[1]));
    }
    return max;
}

/** Flag any (non-cantrip) spell whose level exceeds what the caster can reach at this level. */
export function validateSpellLevels(
    spells: { name: string; level: number }[],
    caster: CasterTypeName,
    level: number,
): string[] {
    const max = maxAccessibleSpellLevel(caster, level);
    const errors: string[] = [];
    for (const s of spells) {
        if (s.level <= 0) continue;   // cantrips are always fine
        if (s.level > max) {
            errors.push(max === 0
                ? `"${s.name}" is a level-${s.level} spell but this build has no spell slots.`
                : `"${s.name}" is level ${s.level}, above the highest reachable spell level (${max}) for a ${caster} caster at level ${level}.`);
        }
    }
    return errors;
}

/** A signed number for messages (e.g. +3, −1) without pulling the dndMath `signed` (which is display-styled). */
function signedish(n: number): string {
    return n >= 0 ? `+${n}` : `${n}`;
}
