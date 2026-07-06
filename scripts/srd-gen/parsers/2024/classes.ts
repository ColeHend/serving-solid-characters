/**
 * Parser for the 2024 (SRD 5.2) classes and subclasses.
 * Sources: Docs/dndsrd5.2_markdown-main/src/03_Classes/01_Barbarian.md … 12_Wizard.md
 * Produces ClassJson[] + SubclassJson[] per CONTRACT.md "Classes"/"Subclasses" (2024 rules),
 * mirroring the key conventions of the served SolidCharacters.Repository/data/srd/2024/classes.json.
 */
import fs from "node:fs";
import path from "node:path";
import { SRC_2024 } from "../../config.ts";
import { normalizeMarkdown } from "../../md/normalize.ts";
import { sectionize, walk, type Section } from "../../md/sections.ts";
import { parseTables, type MdTable } from "../../md/tables.ts";
import { cleanWhitespace, parseLevel, nameKey } from "../../lib/util.ts";
import type {
    ClassJson,
    SubclassJson,
    FeatureDetailJson,
    FeatureMetadataJson,
    SpellcastingJson,
    SpellslotsJson,
    ChoiceDetailJson,
} from "../../types.ts";

const CLASSES_DIR = path.join(SRC_2024, "03_Classes");

/* ------------------------------------------------------------------ config */

interface SpellConfig {
    casterType: number; // CASTER_TYPE: Full=3, Half=2, Pact=4
    known: "number" | "calc";
    calc?: { stat: string; level: string; roundUp?: boolean };
    cantrips: boolean;
    pact?: boolean;
}
interface ClassConfig {
    /** progression-table header → classSpecific key (exact keys mirror the served 2024 file). */
    classSpecific: Record<string, string>;
    spell?: SpellConfig;
}

// Header→key maps and caster shapes are mirrored EXACTLY from the served
// data/srd/2024/classes.json (e.g. Monk "Focus Points"→"ki", Sorcerer→"sorceryPoints",
// and the 2014 known/prepared split preserved: Bard/Sorcerer/Warlock="number", the
// prepared casters Cleric/Druid/Wizard/Paladin/Ranger="calc").
const CLASS_CONFIG: Record<string, ClassConfig> = {
    Barbarian: { classSpecific: { "Rages": "rage", "Rage Damage": "rage_damage", "Weapon Mastery": "weapon_mastery" } },
    Bard: {
        classSpecific: { "Bardic Die": "bardic_die" },
        spell: { casterType: 3, known: "number", cantrips: true },
    },
    Cleric: {
        classSpecific: { "Channel Divinity": "channel_divinity" },
        spell: { casterType: 3, known: "calc", calc: { stat: "WIS", level: "full", roundUp: false }, cantrips: true },
    },
    Druid: {
        classSpecific: { "Wild Shape": "wild_shape" },
        spell: { casterType: 3, known: "calc", calc: { stat: "WIS", level: "full", roundUp: false }, cantrips: true },
    },
    Fighter: { classSpecific: { "Second Wind": "second_wind", "Weapon Mastery": "weapon_mastery" } },
    Monk: { classSpecific: { "Martial Arts": "martial_arts", "Focus Points": "ki", "Unarmored Movement": "unarmored_movement" } },
    Paladin: {
        classSpecific: { "Channel Divinity": "channel_divinity" },
        spell: { casterType: 2, known: "calc", calc: { stat: "CHA", level: "half", roundUp: true }, cantrips: false },
    },
    Ranger: {
        classSpecific: { "Favored Enemy": "favored_enemy" },
        spell: { casterType: 2, known: "calc", calc: { stat: "WIS", level: "half", roundUp: true }, cantrips: false },
    },
    Rogue: { classSpecific: { "Sneak Attack": "sneak_attack" } },
    Sorcerer: {
        classSpecific: { "Sorcery Points": "sorceryPoints" },
        spell: { casterType: 3, known: "number", cantrips: true },
    },
    Warlock: { classSpecific: {}, spell: { casterType: 4, known: "number", cantrips: true, pact: true } },
    Wizard: {
        classSpecific: {},
        spell: { casterType: 3, known: "calc", calc: { stat: "INT", level: "full", roundUp: false }, cantrips: true },
    },
};

// Curated feature-use metadata, mirroring the served file exactly (these legacy values are
// hand-set per the resource the feature introduces and are not reliably derivable from the text).
const CURATED_METADATA: Record<string, Record<string, FeatureMetadataJson>> = {
    Barbarian: {
        "Rage": { uses: 2, recharge: "long" },
        "Relentless Rage": { uses: 2, recharge: "long" },
        "Persistent Rage": { uses: 2, recharge: "long" },
    },
    Bard: { "Bardic Inspiration": { uses: 3, recharge: "long" } },
    Cleric: { "Channel Divinity": { uses: 1, recharge: "short" } },
    Druid: { "Wild Shape": { uses: 2, recharge: "short" } },
    Fighter: {
        "Action Surge (one use)": { uses: 1, recharge: "short" },
        "Action Surge (two uses)": { uses: 1, recharge: "short" },
    },
    Paladin: { "Channel Divinity": { uses: 1, recharge: "short" } },
};

const SKILLS = [
    "Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception", "History", "Insight",
    "Intimidation", "Investigation", "Medicine", "Nature", "Perception", "Performance",
    "Persuasion", "Religion", "Sleight of Hand", "Stealth", "Survival",
];
// The SRD 5.2 markdown carries PDF line-wrap artifacts INSIDE skill names ("In sight", "Na ture",
// "Persua sion", "Ath letics"); snap options back to canonical skills by de-spacing.
const SKILL_LOOKUP = new Map(SKILLS.map(s => [s.toLowerCase().replace(/[^a-z]/g, ""), s]));

/* ------------------------------------------------------------------ helpers */

function isBlankCell(cell: string | undefined): boolean {
    const t = (cell ?? "").trim();
    return t === "" || t === "—" || t === "–" || t === "-";
}

function toInt(cell: string): number {
    return parseInt(cell.replace(/[^\d-]/g, ""), 10) || 0;
}

/** Split a Features-column cell on top-level commas (commas inside parens stay put). */
function splitFeatures(cell: string): string[] {
    const parts: string[] = [];
    let depth = 0;
    let cur = "";
    for (const ch of cell) {
        if (ch === "(") depth++;
        else if (ch === ")") depth = Math.max(0, depth - 1);
        if (ch === "," && depth === 0) {
            parts.push(cur.trim());
            cur = "";
        } else {
            cur += ch;
        }
    }
    if (cur.trim()) parts.push(cur.trim());
    return parts.map(p => p.trim()).filter(p => p && !isBlankCell(p));
}

function canonSkill(s: string): string {
    const key = s.toLowerCase().replace(/[^a-z]/g, "");
    return SKILL_LOOKUP.get(key) ?? cleanWhitespace(s);
}

/** classSpecific cell → raw value (dashes normalized to "-", dice lowercased, bare "+N" → "N"); "" → skip. */
function normalizeClassSpecific(cell: string | undefined): string | null {
    let v = (cell ?? "").trim();
    if (v === "") return null;
    v = v.replace(/[—–]/g, "-");
    if (v === "-") return "-";
    if (/^\d*[dD]\d+$/.test(v)) v = v.toLowerCase(); // "D6" → "d6"
    if (/^\+\d+$/.test(v)) v = v.slice(1); // "+2" → "2"
    return v;
}

function findCaption(tables: MdTable[], re: RegExp): MdTable | undefined {
    return tables.find(t => re.test(t.caption));
}

// NOTE: the shared keyValueRecord()/parseTables() drop the Core Traits table's empty header row
// (all-whitespace `| | |`) because the SEPARATOR regex treats it as a divider — which promotes the
// first real key/value pair ("Primary Ability | Strength") into `headers`. Rebuild the record locally
// by treating `headers` as another key/value row so that first pair isn't lost.
function coreTraitsRecord(t: MdTable): Record<string, string> {
    const rec: Record<string, string> = {};
    for (const row of [t.headers, ...t.rows]) {
        if (row.length >= 2 && row[0]) rec[row[0]] = row.slice(1).filter(Boolean).join(" | ");
    }
    return rec;
}

function parseWeapons(s: string): string[] {
    return cleanWhitespace(s)
        .split(/\s+and\s+/)
        .map(p => p.trim())
        .filter(Boolean)
        .map(p => (/weapon/i.test(p) ? p : `${p} weapons`));
}

function parseArmor(s: string): string[] {
    const out: string[] = [];
    for (const w of ["Light", "Medium", "Heavy"]) {
        if (new RegExp(`\\b${w}\\b`).test(s)) out.push(`${w} armor`);
    }
    if (/shield/i.test(s)) out.push("Shields");
    return out;
}

function parseTools(s: string | undefined): string[] {
    if (!s) return [];
    const cleaned = cleanWhitespace(s.replace(/\s*\(see[^)]*\)\s*/gi, "")).trim();
    if (!cleaned || /^none$/i.test(cleaned)) return [];
    return [cleaned];
}

/** "Choose 2: A, B, or C" → { options:[canonical skills], amount:2 }; "Choose any 3 skills (…)" → { options:[], amount:3 }. */
function parseSkillChoice(v: string): ChoiceDetailJson {
    const m = v.match(/Choose\s+(?:any\s+)?(\d+)/i);
    const amount = m ? parseInt(m[1], 10) : 2;
    let options: string[] = [];
    const colon = v.indexOf(":");
    if (colon >= 0) {
        options = v
            .slice(colon + 1)
            .split(",")
            .map(s => s.replace(/^\s*or\s+/i, "").trim())
            .filter(s => s && !s.startsWith("("))
            .map(canonSkill);
    }
    return { options, amount };
}

/** "Choose A or B: (A) …; or (B) …" → { options:[A-text, B-text], amount:1 }. */
function parseEquipmentChoice(v: string): ChoiceDetailJson {
    const colon = v.indexOf(":");
    const body = colon >= 0 ? v.slice(colon + 1) : v;
    const options = body
        .split(";")
        .map(seg => seg.replace(/^\s*or\s+/i, "").replace(/^\s*\(\*?[A-Za-z]\*?\)\s*/, "").trim())
        .filter(Boolean);
    return { options, amount: 1 };
}

/* -------------------------------------------------------------- feature sections */

interface FeatureSection {
    level: number;
    name: string;
    body: string;
}

/** All "Level N: <Name>" sections (any hash depth) with start-line in [from, to). */
function collectFeatureSections(all: Section[], from: number, to: number): FeatureSection[] {
    const out: FeatureSection[] = [];
    for (const s of all) {
        if (s.start < from || s.start >= to) continue;
        const m = s.title.match(/^Level\s+(\d+):\s*(.+)$/i);
        if (!m) continue;
        out.push({ level: parseInt(m[1], 10), name: cleanWhitespace(m[2]), body: cleanWhitespace(s.body) });
    }
    return out;
}

function indexByName(sections: FeatureSection[]): Map<string, FeatureSection[]> {
    const map = new Map<string, FeatureSection[]>();
    for (const s of sections) {
        const key = nameKey(s.name);
        (map.get(key) ?? map.set(key, []).get(key)!).push(s);
    }
    return map;
}

/** Emitted feature name keeps the parenthetical suffix; section match strips it. */
function resolveFeature(
    raw: string,
    level: number,
    index: Map<string, FeatureSection[]>,
    curated: Record<string, FeatureMetadataJson> | undefined,
): FeatureDetailJson {
    const matchName = raw.replace(/\s*\([^)]*\)\s*$/, "").trim();
    const name = /^subclass feature$/i.test(raw) ? "Subclass Feature" : raw;
    const candidates = index.get(nameKey(matchName)) ?? [];
    const pick = candidates.find(c => c.level === level) ?? candidates[0];

    let description: string;
    if (pick) description = pick.body;
    else if (/subclass feature/i.test(raw)) description = "See your subclass.";
    else description = "";

    const feat: FeatureDetailJson = { id: "", name, description };
    const meta = curated?.[name];
    if (meta) feat.metadata = { ...meta };
    return feat;
}

/* -------------------------------------------------------------- spellcasting */

function buildSpellcasting(cfg: SpellConfig, table: MdTable, levelIdx: number, featuresIdx: number): SpellcastingJson {
    const H = table.headers;
    const cantripsIdx = H.findIndex(h => /^cantrips$/i.test(h));
    const digitCols = H.map((h, i) => ({ h, i })).filter(x => /^\d$/.test(x.h));
    const spellsKnownIdx = H.findIndex(h => /prepared spells|spells known/i.test(h));
    const pactCountIdx = H.findIndex(h => /^spell slots$/i.test(h));
    const pactLevelIdx = H.findIndex(h => /^slot level$/i.test(h));

    // Warlock Mystic Arcanum grants (from the Class Features column): one persistent slot of that level.
    const arcanum: { grant: number; arc: number }[] = [];
    if (cfg.pact) {
        for (const row of table.rows) {
            const L = parseLevel(row[levelIdx]);
            if (L == null) continue;
            const m = (row[featuresIdx] ?? "").match(/Mystic Arcanum \(level (\d+) spell\)/i);
            if (m) arcanum.push({ grant: L, arc: parseInt(m[1], 10) });
        }
    }

    const slots: Record<string, SpellslotsJson> = {};
    const spellsKnown: Record<string, number> = {};
    for (const row of table.rows) {
        const L = parseLevel(row[levelIdx]);
        if (L == null) continue;
        const slot: Record<string, number> = {};
        if (cantripsIdx >= 0 && !isBlankCell(row[cantripsIdx])) slot.cantrips_known = toInt(row[cantripsIdx]);
        if (cfg.pact) {
            if (pactCountIdx >= 0 && pactLevelIdx >= 0 && !isBlankCell(row[pactCountIdx]) && !isBlankCell(row[pactLevelIdx])) {
                slot[`spell_slots_level_${toInt(row[pactLevelIdx])}`] = toInt(row[pactCountIdx]);
            }
            for (const a of arcanum) if (a.grant <= L) slot[`spell_slots_level_${a.arc}`] = 1;
        } else {
            for (const { h, i } of digitCols) if (!isBlankCell(row[i])) slot[`spell_slots_level_${h}`] = toInt(row[i]);
        }
        if (Object.keys(slot).length) slots[String(L)] = slot as SpellslotsJson;
        if (cfg.known === "number" && spellsKnownIdx >= 0 && !isBlankCell(row[spellsKnownIdx])) {
            spellsKnown[String(L)] = toInt(row[spellsKnownIdx]);
        }
    }

    const sc: SpellcastingJson = {
        metadata: { slots, casterType: cfg.casterType },
        known_type: cfg.known,
    };
    if (cfg.known === "number") sc.spells_known = spellsKnown;
    else if (cfg.calc) sc.spells_known_calc = cfg.calc;
    return sc;
}

/* -------------------------------------------------------------- per-class parse */

function parseOneClass(md: string): { cls: ClassJson; sub: SubclassJson } {
    const sections = [...walk(sectionize(md))];
    const className = sections.find(s => s.level === 2)?.title ?? sections[0].title;

    // The single subclass H3 ("### <Class> Subclass: <Name>") splits class vs subclass regions.
    const subSection = sections.find(s => /subclass:/i.test(s.title));
    if (!subSection) throw new Error(`srd-gen: no subclass section in ${className}`);
    const subStart = subSection.start;

    const tables = parseTables(md);
    const coreTable = findCaption(tables, /core\b.*traits/i);
    const featTable = findCaption(tables, /features/i);
    if (!coreTable) throw new Error(`srd-gen: no Core Traits table for ${className}`);
    if (!featTable) throw new Error(`srd-gen: no Features table for ${className}`);

    const traits = coreTraitsRecord(coreTable);
    const cfg = CLASS_CONFIG[className];
    if (!cfg) throw new Error(`srd-gen: no config for class ${className}`);

    /* -- Core Traits row -- */
    const hitDie = (traits["Hit Point Die"]?.match(/d(\d+)/i)?.[0] ?? "").toLowerCase();
    const primaryAbility = cleanWhitespace(traits["Primary Ability"] ?? "")
        .split(/\s+(?:and|or)\s+/)
        .join(", ");
    const savingThrows = cleanWhitespace(traits["Saving Throw Proficiencies"] ?? "")
        .split(/\s+and\s+/)
        .map(s => s.trim())
        .filter(Boolean);
    const weapons = parseWeapons(traits["Weapon Proficiencies"] ?? "");
    const armor = parseArmor(traits["Armor Training"] ?? "");
    const tools = parseTools(traits["Tool Proficiencies"]);
    const skillChoice = parseSkillChoice(traits["Skill Proficiencies"] ?? "");
    const equipmentChoice = parseEquipmentChoice(traits["Starting Equipment"] ?? "");

    /* -- Features table columns -- */
    const H = featTable.headers;
    const levelIdx = H.findIndex(h => /^level$/i.test(h));
    const featuresIdx = H.findIndex(h => /class features|^features$/i.test(h));

    /* -- feature sections (class region only) -- */
    const classFeatureSections = collectFeatureSections(sections, 0, subStart);
    const classIndex = indexByName(classFeatureSections);

    const features: Record<string, FeatureDetailJson[]> = {};
    for (let L = 1; L <= 20; L++) features[String(L)] = [];
    for (const row of featTable.rows) {
        const L = parseLevel(row[levelIdx]);
        if (L == null || L < 1 || L > 20) continue;
        for (const raw of splitFeatures(row[featuresIdx] ?? "")) {
            features[String(L)].push(resolveFeature(raw, L, classIndex, CURATED_METADATA[className]));
        }
    }

    /* -- classSpecific columns -- */
    const classSpecific: Record<string, Record<string, string>> = {};
    for (const [header, key] of Object.entries(cfg.classSpecific)) {
        const ci = H.findIndex(h => h.toLowerCase() === header.toLowerCase());
        if (ci < 0) continue;
        const col: Record<string, string> = {};
        for (const row of featTable.rows) {
            const L = parseLevel(row[levelIdx]);
            if (L == null) continue;
            const v = normalizeClassSpecific(row[ci]);
            if (v !== null) col[String(L)] = v;
        }
        classSpecific[key] = col;
    }

    /* -- spellcasting -- */
    const spellcasting = cfg.spell ? buildSpellcasting(cfg.spell, featTable, levelIdx, featuresIdx) : undefined;

    const cls: ClassJson = {
        id: "",
        name: className,
        hit_die: hitDie,
        primary_ability: primaryAbility,
        saving_throws: savingThrows,
        starting_equipment: [],
        proficiencies: { armor, weapons, tools, skills: [] },
        ...(spellcasting ? { spellcasting } : {}),
        start_choices: { skills: "skills", equipment: "equipment" },
        features,
        choices: { skills: skillChoice, equipment: equipmentChoice },
        classSpecific,
    };

    const sub = parseSubclass(sections, subSection, className);
    return { cls, sub };
}

/* -------------------------------------------------------------- subclass */

function parseSubclass(all: Section[], subSection: Section, className: string): SubclassJson {
    const name = subSection.title.replace(/^.*?Subclass:\s*/i, "").trim();
    // description = tagline + intro (the body above the first feature heading), emphasis stripped.
    const description = cleanWhitespace(subSection.body.replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1"));

    const featSections = collectFeatureSections(all, subSection.start + 1, Number.MAX_SAFE_INTEGER);
    const features: Record<string, FeatureDetailJson[]> = {};
    for (const s of featSections) {
        const feat: FeatureDetailJson = { id: "", name: s.name, description: s.body };
        const spells = extractGrantedSpells(s.body);
        if (spells.length) feat.metadata = { spells };
        const key = String(s.level);
        (features[key] ?? (features[key] = [])).push(feat);
    }

    return { id: "", name, parent_class: className, description, features, spellcasting: null };
}

/** Domain/Circle spell-grant tables inside a subclass feature body → the granted spell names. */
function extractGrantedSpells(body: string): string[] {
    const out: string[] = [];
    for (const t of parseTables(body)) {
        const spellCol = t.headers.findIndex(h => /spell/i.test(h) && !/level/i.test(h));
        if (spellCol < 0) continue;
        for (const row of t.rows) {
            const cell = row[spellCol];
            if (!cell) continue;
            for (const nm of cell.split(",").map(x => cleanWhitespace(x)).filter(Boolean)) {
                if (!out.includes(nm)) out.push(nm);
            }
        }
    }
    return out;
}

/* -------------------------------------------------------------- entry */

export function parseClasses2024(): { classes: ClassJson[]; subclasses: SubclassJson[] } {
    const files = fs
        .readdirSync(CLASSES_DIR)
        .filter(f => /^\d\d_.+\.md$/.test(f) && f !== "00_Classes.md")
        .sort();

    const classes: ClassJson[] = [];
    const subclasses: SubclassJson[] = [];
    for (const file of files) {
        const raw = fs.readFileSync(path.join(CLASSES_DIR, file), "utf8");
        const md = normalizeMarkdown(raw);
        const { cls, sub } = parseOneClass(md);
        classes.push(cls);
        subclasses.push(sub);
    }
    return { classes, subclasses };
}
