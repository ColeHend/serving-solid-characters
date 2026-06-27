import { createNewId } from "../../customHooks/utility/tools/idGen";
import { Character, CharacterLevel, CharacterProficiency, CharacterSavingThrow, CharacterSkillProficiency } from "../../../models/character.model";
import type { FeatureDetail } from "../../../models/generated";
import { SKILLS } from "../../sheetMapping/characterFields";
import { parseHitDie } from "./compute";
import { ABILITY_KEYS } from "./types";
import type { WorkingCharacter, WorkingFeature } from "./types";

/**
 * Phase 7, assemble half (plan §7): map a finished WORKING character onto the `Character` model the app
 * persists. Unlike the class pipeline — which rebuilds a `create_class` tool input and runs `buildPreview`
 * (a character is NOT homebrew; there is no `create_character` tool or "character" preview kind) — this
 * builds the `Character` directly. The orchestrator computes `working.derived` (AC/HP/etc.) in code first,
 * so this reads those values rather than recomputing them, and the host saves the result via
 * `characterManager.createCharacter`.
 *
 * Pure (no DB, no Solid): given a fully-populated working object it returns a `Character`, so it is unit
 * testable on its own and the orchestrator stays free of persistence concerns.
 */

/** Map a working feature to the persisted `FeatureDetail` shape (fresh id; rules text → description). */
function toFeatureDetail(f: WorkingFeature): FeatureDetail {
    return { id: createNewId(), name: f.name, description: f.description };
}

/**
 * Build the per-level rows the `Character.level` getter counts. Each row carries the class + hit die, and
 * the signature features gained AT that level land in their row (capabilities clamps levels to ≤ charLevel,
 * so every feature has a home); a feature with no matching level falls into level 1 as a safe default.
 */
function buildLevels(working: WorkingCharacter): CharacterLevel[] {
    const level = Math.max(1, Math.floor(working.level ?? 1));
    const hitDie = parseHitDie(working.hitDie);
    const className = working.className ?? "";
    const rows: CharacterLevel[] = Array.from({ length: level }, (_, i) => ({
        class: className, subclass: "", level: i + 1, hitDie, features: [] as FeatureDetail[],
    }));
    for (const f of working.features ?? []) {
        const idx = Math.min(Math.max(1, f.level), level) - 1;
        rows[idx].features.push(toFeatureDetail(f));
    }
    return rows;
}

/** Build the 18-skill proficiency record, marking the chosen skills proficient (matched case-insensitively). */
function buildProficiencies(working: WorkingCharacter): CharacterProficiency {
    const chosen = new Set((working.skills ?? []).map(s => s.trim().toLowerCase()));
    const skills: Record<string, CharacterSkillProficiency> = {};
    for (const skill of SKILLS) {
        const proficient = chosen.has(skill.label.toLowerCase()) || chosen.has(skill.profKey.toLowerCase()) || chosen.has(skill.key.toLowerCase());
        skills[skill.profKey] = { stat: skill.stat, value: 0, proficient, expertise: false };
    }
    const other: Record<string, boolean> = {};
    for (const p of working.otherProficiencies ?? []) if (p.trim()) other[p.trim()] = true;
    return { skills, other };
}

/** Build the six saving-throw rows, marking the class's two proficient. */
function buildSavingThrows(working: WorkingCharacter): CharacterSavingThrow[] {
    const proficient = new Set(working.savingThrows ?? []);
    return ABILITY_KEYS.map(stat => ({ stat, proficient: proficient.has(stat) }));
}

/** Assemble a finished working character into the persisted `Character` model (pure; reads `working.derived`). */
export function assembleCharacter(working: WorkingCharacter): Character {
    const c = new Character();
    const derived = working.derived ?? {};
    const scores = working.abilityScores ?? {};
    const hp = derived.hp ?? 0;

    c.name = working.name?.trim() || `${working.lineage ?? ""} ${working.className ?? "Adventurer"}`.trim();
    c.levels = buildLevels(working);
    c.spells = (working.spells ?? []).map(name => ({ name, prepared: false }));
    c.race = { species: working.lineage ?? "", features: [] };
    c.ArmorClass = derived.ac ?? 0;
    c.Speed = 30;   // default walking speed; lineage-specific speeds aren't modelled by the pipeline
    c.className = working.className ?? "";
    c.subclass = [];
    c.background = working.background ?? "";
    c.alignment = working.alignment ?? "";
    c.features = [];
    c.proficiencies = buildProficiencies(working);
    c.savingThrows = buildSavingThrows(working);
    c.resistances = [];
    c.vulnerabilities = [];
    c.immunities = [];
    c.languages = ["Common"];
    c.health = { max: hp, current: hp, temp: 0 };
    c.stats = {
        str: scores.str ?? 10, dex: scores.dex ?? 10, con: scores.con ?? 10,
        int: scores.int ?? 10, wis: scores.wis ?? 10, cha: scores.cha ?? 10,
    };
    c.items = {
        inventory: working.equipment ?? [],
        equipped: [],
        attuned: [],
        currency: { platinumPieces: 0, goldPieces: 0, electrumPieces: 0, sliverPieces: 0, copperPieces: 0 },
    };
    return c;
}
