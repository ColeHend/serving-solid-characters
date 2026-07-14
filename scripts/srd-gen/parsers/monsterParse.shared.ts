/**
 * Shared monster-statblock parsing helpers, reused by the 2014 and 2024 monster parsers.
 *
 * The two SRD editions format statblocks differently (heading depth, "Melee Attack Roll" vs
 * "Melee Weapon Attack", separate vs inline saves), so each edition has its own parser for
 * *extracting* the raw pieces. This module owns the edition-agnostic *derivation*: the same
 * character-model math the C# `Monster`/`StatBlockTests` assert — to-hit = mod + PB, save
 * DC = 8 + PB + mod, primary damage adds the ability modifier. Nothing pre-computed is stored;
 * we store `stats`, `ability`, `proficient`, `save.dc_ability`, and always keep the printed text.
 */
import { cleanWhitespace } from "../lib/util.ts";
import type {
    StatsJson,
    MovementSpeedsJson,
    CreatureSensesJson,
    SavingThrowJson,
    SkillProficiencyJson,
    DamageEntryJson,
    MonsterAttackJson,
} from "../types.ts";

export const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"] as const;
export type Ability = (typeof ABILITIES)[number];

const ABBREV_TO_ABILITY: Record<string, Ability> = {
    str: "str", strength: "str",
    dex: "dex", dexterity: "dex",
    con: "con", constitution: "con",
    int: "int", intelligence: "int",
    wis: "wis", wisdom: "wis",
    cha: "cha", charisma: "cha",
};

/** Lowercase skill name → governing ability. */
export const SKILL_ABILITY: Record<string, Ability> = {
    athletics: "str",
    acrobatics: "dex", "sleight of hand": "dex", stealth: "dex",
    arcana: "int", history: "int", investigation: "int", nature: "int", religion: "int",
    "animal handling": "wis", insight: "wis", medicine: "wis", perception: "wis", survival: "wis",
    deception: "cha", intimidation: "cha", performance: "cha", persuasion: "cha",
};

/** 5e ability modifier — mirrors dndMath.ts getAbilityModifier. */
export const abilityMod = (score: number): number => Math.floor((score - 10) / 2);

export function abbrevToAbility(s: string): Ability | undefined {
    return ABBREV_TO_ABILITY[s.trim().toLowerCase()];
}

export function statOf(stats: StatsJson, a: Ability): number {
    return stats[a];
}

// ── Challenge rating → proficiency bonus / XP (standard 5e tables) ──

/** Parse a CR token ("1/4", "6") to a comparable number. */
function crValue(cr: string): number {
    const t = cr.trim();
    if (t.includes("/")) {
        const [n, d] = t.split("/").map(Number);
        return d ? n / d : 0;
    }
    return Number(t) || 0;
}

export function crToPb(cr: string): number {
    const v = crValue(cr);
    if (v <= 4) return 2;
    if (v <= 8) return 3;
    if (v <= 12) return 4;
    if (v <= 16) return 5;
    if (v <= 20) return 6;
    if (v <= 24) return 7;
    if (v <= 28) return 8;
    return 9;
}

const CR_XP: Record<string, number> = {
    "0": 10, "1/8": 25, "1/4": 50, "1/2": 100,
    "1": 200, "2": 450, "3": 700, "4": 1100, "5": 1800, "6": 2300, "7": 2900, "8": 3900,
    "9": 5000, "10": 5900, "11": 7200, "12": 8400, "13": 10000, "14": 11500, "15": 13000,
    "16": 15000, "17": 18000, "18": 20000, "19": 22000, "20": 25000, "21": 33000, "22": 41000,
    "23": 50000, "24": 62000, "25": 75000, "26": 90000, "27": 105000, "28": 120000,
    "29": 135000, "30": 155000,
};

export function crToXp(cr: string): number | undefined {
    return CR_XP[cr.trim()];
}

/** "10 (5,900 XP)" / "10 (XP 5,900, or 7,200 in lair)" → { cr, xp }. */
export function parseChallenge(text: string): { cr: string; xp?: number } {
    const cr = text.split("(")[0].trim();
    const m = text.match(/([\d,]+)\s*XP/i) ?? text.match(/XP\s*([\d,]+)/i);
    const xp = m ? Number(m[1].replace(/,/g, "")) : crToXp(cr);
    return { cr, xp };
}

// ── Header field parsers ──

/** "150 (20d10 + 40)" / "135 (18d10+36)" → { max, hitDice }. */
export function parseHp(text: string): { max: number; hitDice?: string } {
    const m = text.match(/(\d+)\s*(?:\(([^)]+)\))?/);
    const max = m ? Number(m[1]) : 0;
    const hitDice = m?.[2] ? m[2].replace(/\s+/g, "") : undefined;
    return { max, hitDice };
}

/** "10 ft., Swim 40 ft." → { speed: 10, movement_speeds: { swim: 40 } }. */
export function parseSpeeds(text: string): { speed: number; movement_speeds: MovementSpeedsJson } {
    const walk = text.match(/^\s*(\d+)\s*ft/i);
    const ms: MovementSpeedsJson = {};
    for (const kind of ["fly", "swim", "climb", "burrow"] as const) {
        const m = text.match(new RegExp(`${kind}\\s+(\\d+)\\s*ft`, "i"));
        if (m) ms[kind] = Number(m[1]);
    }
    if (/\bhover\b/i.test(text)) ms.hover = true;
    return { speed: walk ? Number(walk[1]) : 0, movement_speeds: ms };
}

/** "blindsight 60 ft., darkvision 120 ft.; passive Perception 21" → CreatureSensesJson. */
export function parseSenses(text: string): CreatureSensesJson {
    const s: CreatureSensesJson = {};
    for (const kind of ["darkvision", "blindsight", "tremorsense", "truesight"] as const) {
        const m = text.match(new RegExp(`${kind}\\s+(\\d+)\\s*ft`, "i"));
        if (m) s[kind] = Number(m[1]);
    }
    const pp = text.match(/passive\s+Perception\s+(\d+)/i);
    if (pp) s.passive_perception = Number(pp[1]);
    return s;
}

/** "History +12, Perception +10" → skills record (keyed by lowercase skill name). */
export function parseSkills(text: string, stats: StatsJson, pb: number): Record<string, SkillProficiencyJson> {
    const out: Record<string, SkillProficiencyJson> = {};
    for (const m of text.matchAll(/([A-Za-z][A-Za-z ]*?)\s*([+-]\d+)/g)) {
        const skill = m[1].trim().toLowerCase();
        const stat = SKILL_ABILITY[skill];
        if (!stat) continue;
        const value = Number(m[2]);
        const mod = abilityMod(statOf(stats, stat));
        const expertise = value === mod + 2 * pb && pb > 0;
        out[skill] = { stat, value, proficient: true, expertise };
    }
    return out;
}

/** "Con +6, Int +8, Wis +6" → saving-throw proficiencies. */
export function parseSaves(text: string): SavingThrowJson[] {
    const out: SavingThrowJson[] = [];
    for (const m of text.matchAll(/([A-Za-z]+)\s*[+-]\d+/g)) {
        const stat = abbrevToAbility(m[1]);
        if (stat) out.push({ stat, proficient: true });
    }
    return out;
}

/** "Large aberration, lawful evil" / "Large Aberration (Chromatic), Lawful Evil". */
export function parseTypeLine(text: string): { size: string; type: string; subtype?: string; alignment?: string } {
    const m = text.match(/^\s*(\w+)\s+([^,(]+?)\s*(?:\(([^)]+)\))?\s*(?:,\s*(.+?))?\s*$/);
    if (!m) return { size: "", type: "" };
    return {
        size: m[1].trim(),
        type: m[2].trim().toLowerCase(),
        subtype: m[3]?.trim(),
        alignment: m[4]?.trim().toLowerCase(),
    };
}

/** Damage-affinity list from a line like "fire, cold, lightning" or "Bludgeoning, Piercing". */
export function parseAffinities(text: string): { type: string; value: boolean }[] {
    return text
        .split(/[,;]/)
        .map(t => cleanWhitespace(t).replace(/\bdamage\b/i, "").trim().toLowerCase())
        .filter(Boolean)
        .map(type => ({ type, value: true }));
}

const NUM_WORDS: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

/** "makes three Rend attacks" → 3 (first number word / digit found), else 1. */
export function multiattackCount(text: string): number {
    const w = text.toLowerCase().match(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/);
    if (w) return NUM_WORDS[w[1]];
    const d = text.match(/\b(\d+)\b/);
    return d ? Number(d[1]) : 1;
}

// ── Ability / DC inference (the character-model derivation) ──

/**
 * Given a printed "+N to hit", find the ability whose (mod + PB) reproduces it. Preference order
 * favors str for melee and dex for ranged. Returns null when nothing standard matches (caller
 * then stores `to_hit_override`).
 */
export function inferAttackAbility(
    toHit: number, stats: StatsJson, pb: number, attackType?: string,
): { ability: Ability; proficient: boolean } | null {
    const pref: Ability[] = attackType === "ranged"
        ? ["dex", "str", "con", "int", "wis", "cha"]
        : ["str", "dex", "con", "int", "wis", "cha"];
    for (const proficient of [true, false]) {
        for (const a of pref) {
            if (abilityMod(statOf(stats, a)) + (proficient ? pb : 0) === toHit) return { ability: a, proficient };
        }
    }
    return null;
}

/** Given a printed save DC, find the monster ability whose (8 + PB + mod) reproduces it. */
export function inferDcAbility(dc: number, stats: StatsJson, pb: number): Ability | null {
    const pref: Ability[] = ["con", "cha", "wis", "int", "dex", "str"];
    for (const a of pref) {
        if (8 + pb + abilityMod(statOf(stats, a)) === dc) return a;
    }
    return null;
}

// ── Damage clauses ──

/**
 * Parse every "N (XdY [+ Z]) Type damage" clause from an attack's text. The first clause is the
 * primary hit; when `abilityModified` is set (weapon attacks) its flat bonus is treated as the
 * governing ability modifier (add_ability_modifier=true, dropped from disk). Riders and
 * save-based clauses store add_ability_modifier=false. A leftover flat within [1,3] of the
 * ability mod is kept as a magic `bonus`.
 */
export function parseDamageClauses(
    text: string, opts: { abilityModified: boolean; abilityMod: number },
): DamageEntryJson[] {
    const out: DamageEntryJson[] = [];
    const re = /\d+\s*\(\s*(\d+d\d+)\s*([+-]\s*\d+)?\s*\)\s*([A-Za-z]+)\s+damage/gi;
    let m: RegExpExecArray | null;
    let first = true;
    while ((m = re.exec(text))) {
        const dice = m[1].replace(/\s+/g, "");
        const flat = m[2] ? Number(m[2].replace(/\s+/g, "")) : undefined;
        const type = m[3][0].toUpperCase() + m[3].slice(1).toLowerCase();
        const primary = first && opts.abilityModified;
        const entry: DamageEntryJson = { dice, type, add_ability_modifier: primary };
        if (primary) {
            const extra = flat !== undefined ? flat - opts.abilityMod : 0;
            if (extra >= 1 && extra <= 3) entry.bonus = extra; // magic weapon bonus on top of the mod
        } else if (flat !== undefined) {
            entry.bonus = flat;
        }
        out.push(entry);
        first = false;
    }
    return out;
}

/** Recharge ("Recharge 5-6") / uses ("3/Day") pulled from a run's parenthetical label suffix. */
export function parseUsage(label: string): { recharge?: string; uses?: string } {
    const rc = label.match(/Recharge\s+([\d]+(?:\s*[-–]\s*\d+)?)/i);
    const uses = label.match(/(\d+\s*\/\s*(?:Day|Rest|Long Rest|Short Rest))/i);
    return {
        recharge: rc ? rc[1].replace(/\s+/g, "") : undefined,
        uses: uses ? uses[1].replace(/\s+/g, "") : undefined,
    };
}

/** Strip a trailing "(3/Day)" / "(Recharge 5-6)" / "(Costs 2 Actions)" from a run label. */
export function cleanActionName(label: string): string {
    return label.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

export interface AttackParseCtx {
    stats: StatsJson;
    pb: number;
    /** "action" | "bonusAction" | "reaction" */
    actionType?: string;
}

/**
 * Turn one trait/action run (name + body text) into a MonsterAttack when it carries a to-hit or a
 * save. Returns null for pure-narrative actions (caller routes those to granted_actions).
 * Handles both editions' phrasings ("+9 to hit" / "Melee Attack Roll: +11"; "DC 14 Con save" /
 * "Constitution Saving Throw: DC 16").
 */
export function parseAttack(rawName: string, text: string, ctx: AttackParseCtx): MonsterAttackJson | null {
    const name = cleanActionName(rawName);
    const { recharge, uses } = parseUsage(rawName);

    // Attack type from "Melee/Ranged (Weapon )?Attack" phrasing.
    let attack_type: string | undefined;
    if (/melee\s+or\s+ranged/i.test(text)) attack_type = "melee_or_ranged";
    else if (/\bmelee\b.*attack/i.test(text)) attack_type = "melee";
    else if (/\branged\b.*attack/i.test(text)) attack_type = "ranged";

    // To-hit: 2024 "Attack Roll:* +11" or 2014 "+9 to hit".
    const toHitMatch = text.match(/Attack Roll:?\**\s*([+-]\d+)/i) ?? text.match(/([+-]\d+)\s*to hit/i);
    // Save: "Dexterity Saving Throw*: DC 18" (2024) or "DC 14 Constitution saving throw" (2014).
    const saveMatch = text.match(/([A-Za-z]+)\s+Saving Throw\*?\s*:?\s*DC\s*(\d+)/i)
        ?? text.match(/DC\s*(\d+)\s+([A-Za-z]+)\s+saving throw/i);

    const reach = text.match(/reach\s+([\d]+\s*ft\.?)/i)?.[1]?.replace(/\s+/g, " ").trim();
    const range = text.match(/range\s+([\d/]+\s*ft\.?)/i)?.[1]?.replace(/\s+/g, " ").trim();

    if (toHitMatch) {
        const toHit = Number(toHitMatch[1]);
        const inferred = inferAttackAbility(toHit, ctx.stats, ctx.pb, attack_type);
        const abilityMod0 = inferred ? abilityMod(statOf(ctx.stats, inferred.ability)) : 0;
        const atk: MonsterAttackJson = {
            name,
            action_type: ctx.actionType ?? "action",
            description: cleanWhitespace(text),
            attack_type,
            damage: parseDamageClauses(text, { abilityModified: !!inferred, abilityMod: abilityMod0 }),
        };
        if (inferred) { atk.ability = inferred.ability; atk.proficient = inferred.proficient; }
        else atk.to_hit_override = toHit;
        if (reach) atk.reach = reach;
        if (range) atk.range = range;
        if (recharge) atk.recharge = recharge;
        if (uses) atk.uses = uses;
        return atk;
    }

    if (saveMatch) {
        // Group order differs between the two regexes; detect which fired.
        const dcFirst = /^DC/i.test(saveMatch[0]);
        const targetWord = dcFirst ? saveMatch[2] : saveMatch[1];
        const dc = Number(dcFirst ? saveMatch[1] : saveMatch[2]);
        const target_ability = abbrevToAbility(targetWord) ?? "dex";
        const dcAbility = inferDcAbility(dc, ctx.stats, ctx.pb);
        const type = /half/i.test(text) ? "half" : "negates";
        const atk: MonsterAttackJson = {
            name,
            action_type: ctx.actionType ?? "action",
            description: cleanWhitespace(text),
            save: { target_ability, type, ...(dcAbility ? { dc_ability: dcAbility } : { dc_override: dc }) },
            damage: parseDamageClauses(text, { abilityModified: false, abilityMod: 0 }),
        };
        if (recharge) atk.recharge = recharge;
        if (uses) atk.uses = uses;
        return atk;
    }

    return null;
}
