import { validateStoredCommand } from "../../../SolidCharacters/client/src/shared/ai/commands/madCommandCatalog.ts";
import { COUNT_GATES } from "../config.ts";
import type { Ruleset, RulesetData, FeatureDetailJson, MadFeatureJson } from "../types.ts";

export interface ValidationResult {
    errors: string[];
    warnings: string[];
}

const CASTERS_2014 = ["Bard", "Cleric", "Druid", "Paladin", "Ranger", "Sorcerer", "Warlock", "Wizard"];

export function validateCounts(ruleset: Ruleset, plan: Record<string, unknown[]>): ValidationResult {
    const res: ValidationResult = { errors: [], warnings: [] };
    const gates = COUNT_GATES[ruleset] ?? {};
    for (const [file, gate] of Object.entries(gates)) {
        const n = plan[file]?.length ?? 0;
        if (gate.eq !== undefined && n !== gate.eq) res.errors.push(`${ruleset}/${file}: expected exactly ${gate.eq}, got ${n}`);
        if (gate.min !== undefined && n < gate.min) res.errors.push(`${ruleset}/${file}: expected >= ${gate.min}, got ${n}`);
    }
    return res;
}

function eachFeature(data: RulesetData, cb: (owner: string, kind: string, f: FeatureDetailJson) => void) {
    for (const c of data.classes) for (const feats of Object.values(c.features ?? {})) for (const f of feats) cb(c.name, "class", f);
    for (const s of data.subclasses) for (const feats of Object.values(s.features ?? {})) for (const f of feats) cb(s.name, "subclass", f);
    for (const r of data.races) for (const t of r.traits ?? []) if (t.details) cb(r.name, "race", t.details);
    for (const r of data.subraces) for (const t of r.traits ?? []) if (t.details) cb(r.name, "subrace", t.details);
    for (const b of data.backgrounds) for (const f of b.features ?? []) cb(b.name, "background", f);
    for (const f of data.feats) if (f.details) cb(f.details.name, "feat", f.details);
}

export function validateMadsInData(data: RulesetData): ValidationResult {
    const res: ValidationResult = { errors: [], warnings: [] };
    const checkMads = (owner: string, name: string, mads?: MadFeatureJson[]) => {
        for (const m of mads ?? []) {
            const errs = validateStoredCommand(m as any);
            for (const e of errs) res.errors.push(`${owner}/${name}: ${e}`);
            if (m.command === "AddUses" && m.type !== 1) res.errors.push(`${owner}/${name}: AddUses must be Info type (1)`);
            if (m.command !== "AddUses" && m.command !== "RemoveUses" && m.type !== 0) {
                res.errors.push(`${owner}/${name}: ${m.command} must be Character type (0)`);
            }
        }
    };
    eachFeature(data, (owner, _kind, f) => checkMads(owner, f.name, f.metadata?.mads));
    for (const m of data.magicItems) checkMads("magic_item", m.name, m.metadata?.mads);
    return res;
}

/** Every top-level entity must carry the centrally stamped `legacy` flag (2014 → true, 2024 → false). */
export function validateLegacy(ruleset: Ruleset, data: RulesetData): ValidationResult {
    const res: ValidationResult = { errors: [], warnings: [] };
    const expected = ruleset === "2014";
    for (const [kind, rows] of Object.entries(data)) {
        if (!Array.isArray(rows)) continue;
        rows.forEach((row: { legacy?: unknown; name?: string; id?: string }, i) => {
            const label = `${kind}[${i}] "${row?.name ?? row?.id ?? "?"}"`;
            if (typeof row?.legacy !== "boolean") res.errors.push(`${label}: missing/non-boolean legacy`);
            else if (row.legacy !== expected) res.errors.push(`${label}: legacy=${row.legacy}, ruleset ${ruleset} expects ${expected}`);
        });
    }
    return res;
}

export function validateStructure(ruleset: Ruleset, data: RulesetData): ValidationResult {
    const res: ValidationResult = { errors: [], warnings: [] };
    const nonEmpty = (kind: string, name: unknown, id: unknown) => {
        if (typeof name !== "string" || !name.trim()) res.errors.push(`${kind}: empty name`);
        if (typeof id !== "string" || !id.trim()) res.errors.push(`${kind} "${name}": empty id`);
    };

    for (const c of data.classes) {
        nonEmpty("class", c.name, c.id);
        const levels = Object.keys(c.features ?? {}).map(Number);
        for (let lvl = 1; lvl <= 20; lvl++) {
            if (!levels.includes(lvl)) res.errors.push(`class ${c.name}: missing feature level ${lvl}`);
        }
        if (!c.hit_die) res.errors.push(`class ${c.name}: missing hit_die`);
    }
    if (ruleset === "2014") {
        for (const name of CASTERS_2014) {
            const c = data.classes.find(x => x.name === name);
            if (!c) continue;
            const slots = c.spellcasting?.metadata?.slots ?? {};
            const hasSlots = Object.values(slots).some(s => Object.keys(s).some(k => k.startsWith("spell_slots_level_")));
            if (!hasSlots) res.errors.push(`class ${name} (2014): no spell_slots_level_* in slots`);
        }
    }
    for (const s of data.subclasses) {
        nonEmpty("subclass", s.name, s.id);
        if (!s.parent_class) res.errors.push(`subclass ${s.name}: missing parent_class`);
    }
    const raceIds = new Set(data.races.map(r => r.id));
    for (const r of data.races) nonEmpty("race", r.name, r.id);
    for (const r of data.subraces) {
        nonEmpty("subrace", r.name, r.id);
        if (!raceIds.has(r.parentRace)) res.errors.push(`subrace ${r.name}: parentRace "${r.parentRace}" is not a race id`);
    }
    for (const b of data.backgrounds) nonEmpty("background", b.name, b.id);
    for (const f of data.feats) nonEmpty("feat", f.details?.name, f.id);
    for (const s of data.spells) {
        nonEmpty("spell", s.name, s.id);
        if (typeof s.level !== "number" || s.level < 0 || s.level > 9) res.errors.push(`spell ${s.name}: bad level ${s.level}`);
        if (!s.classes?.length) res.warnings.push(`spell ${s.name}: no classes`);
    }
    for (const list of [data.items, data.weapons ?? [], data.armor ?? []]) {
        for (const i of list) {
            nonEmpty("item", i.name, i.id);
            if (![0, 1, 2, 3].includes(i.type)) res.errors.push(`item ${i.name}: bad type ${i.type}`);
        }
    }
    for (const m of data.magicItems) {
        nonEmpty("magic_item", m.name, m.id);
        if (!m.rarity) res.warnings.push(`magic_item ${m.name}: empty rarity`);
    }
    for (const w of data.weaponMasteries ?? []) nonEmpty("weapon_mastery", w.name, w.id);
    for (const r of data.rules) {
        nonEmpty("rule", r.name, r.id);
        if (!r.description?.trim()) res.errors.push(`rule ${r.name}: empty description`);
    }
    for (const m of data.monsters) {
        nonEmpty("monster", m.name, m.id);
        if (!m.challenge_rating) res.errors.push(`monster ${m.name}: empty challenge_rating`);
        if (!m.stats) res.errors.push(`monster ${m.name}: missing stats`);
        if (!(m.health?.max > 0)) res.errors.push(`monster ${m.name}: health.max must be > 0`);
    }
    return res;
}
