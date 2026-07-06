/**
 * 2014 (SRD 5.1) class + subclass parser.
 *
 * Reads Docs/dnd.srd.5.1-main/02_Classes/*.md (12 files) and produces ClassJson[] +
 * SubclassJson[] per CONTRACT.md. Primary abilities come from Multiclassing.md.
 *
 * This is a from-scratch regeneration that intentionally fixes the served
 * SolidCharacters.Repository/data/srd/2014/classes.json where it is broken:
 *   - features are emitted for ALL 20 levels (the served file omits empty levels).
 *   - full casters (Bard/Cleric/Druid/Sorcerer/Wizard) get their real per-level
 *     spell_slots_level_* (the served file only stored cantrips_known for them).
 *   - Warlock is casterType Pact(4), not Full(3).
 * It matches the served file's KEY STYLE (classSpecific keys are the raw table
 * column headers like "Rages"/"Ki Points"; choices/optionKeys use start_<n>) and the
 * spellcasting shapes (known_type number/calc). Values are the raw markdown cells.
 */
import fs from "node:fs";
import path from "node:path";
import { SRC_2014 } from "../../config.ts";
import type {
    ClassJson, SubclassJson, FeatureDetailJson, SpellcastingJson, SpellslotsJson,
    ChoiceDetailJson, StartingEquipmentJson, ProficienciesJson,
} from "../../types.ts";
import { CASTER_TYPE } from "../../types.ts";
import { normalizeMarkdown } from "../../md/normalize.ts";
import { sectionize, walk, sectionText, type Section } from "../../md/sections.ts";
import { parseTables, findTable, type MdTable } from "../../md/tables.ts";
import { labeledFields } from "../../md/inline.ts";
import { cleanWhitespace, parseLevel, nameKey } from "../../lib/util.ts";

const CLASS_NAMES = [
    "Barbarian", "Bard", "Cleric", "Druid", "Fighter", "Monk",
    "Paladin", "Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard",
];

const ABBR: Record<string, string> = {
    strength: "STR", dexterity: "DEX", constitution: "CON",
    intelligence: "INT", wisdom: "WIS", charisma: "CHA",
};
const WORD_NUM: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };

// Headers that are NOT class-specific extra columns.
const RESERVED_HEADERS = new Set([
    "level", "proficiency bonus", "features",
    "cantrips known", "spells known", "spell slots", "slot level",
]);

// ---------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------

function readClass(name: string): string {
    return normalizeMarkdown(fs.readFileSync(path.join(SRC_2014, "02_Classes", `${name}.md`), "utf8"));
}

function titleCase(s: string): string {
    return s.trim().split(/\s+/).map(w => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
}

/** Header text -> slot level number when it is an ordinal column ("1st".."9th"), else null. */
function ordinalSlotLevel(header: string): number | null {
    const m = header.trim().toLowerCase().match(/^(\d+)(st|nd|rd|th)$/);
    return m ? parseInt(m[1], 10) : null;
}

/** Split a Features cell on commas that are NOT inside parentheses. */
function splitFeatures(cell: string): string[] {
    const out: string[] = [];
    let depth = 0, cur = "";
    for (const ch of cell) {
        if (ch === "(") depth++;
        else if (ch === ")") depth = Math.max(0, depth - 1);
        if (ch === "," && depth === 0) { out.push(cur); cur = ""; } else cur += ch;
    }
    out.push(cur);
    return out.map(s => s.trim()).filter(s => s && s !== "-");
}

/** Strip a trailing "(...)" suffix and a trailing "improvement(s)" word for section matching. */
function matchBase(name: string): string {
    let b = name.replace(/\s*\([^)]*\)\s*$/, "").trim();
    b = b.replace(/\s+improvements?$/i, "").trim();
    return b;
}

/**
 * Match a table feature name to its `###` feature section. Handles the table/section
 * name drift in the 5.1 files: exact, section-is-an-extension ("Relentless" -> "Relentless
 * Rage"), and section-is-a-prefix ("Favored Enemy and Natural Explorer" -> "Favored Enemy").
 */
function matchSection(base: string, map: Map<string, Section>): Section | undefined {
    const key = nameKey(base);
    if (!key) return undefined;
    if (map.has(key)) return map.get(key);
    // singular/plural drift ("Signature Spell" table row vs "Signature Spells" section)
    const keyAlt = key.endsWith("s") ? key.slice(0, -1) : key + "s";
    if (map.has(keyAlt)) return map.get(keyAlt);
    let ext: Section | undefined, extLen = Infinity;
    for (const [k, sec] of map) if (k.startsWith(key + "-") && k.length < extLen) { ext = sec; extLen = k.length; }
    if (ext) return ext;
    let pre: Section | undefined, preLen = -1;
    for (const [k, sec] of map) if (key.startsWith(k + "-") && k.length > preLen) { pre = sec; preLen = k.length; }
    return pre;
}

/**
 * First "...at 3rd level..." style level number in a body, or null. Handles ordinal LISTS
 * ("At 3rd, 5th, 7th, and 9th level you gain...") by taking the FIRST ordinal of the list,
 * not the one adjacent to the word "level".
 */
function firstMentionedLevel(body: string): number | null {
    const m = body.match(/(\d+)(?:st|nd|rd|th)(?:(?:,\s*|,?\s+and\s+|\s+or\s+)\d+(?:st|nd|rd|th))*\s+levels?\b/i);
    return m ? parseInt(m[1], 10) : null;
}

/**
 * The level at which each 5.1 class picks its subclass — the default for subclass features whose
 * text names no level (e.g. Paladin "Tenets of Devotion"/"Oath Spells" belong at 3, not 1).
 * SRD-stable, from each class's progression table.
 */
const SUBCLASS_ENTRY_LEVEL: Record<string, number> = {
    Barbarian: 3, Bard: 3, Cleric: 1, Druid: 2, Fighter: 3, Monk: 3,
    Paladin: 3, Ranger: 3, Rogue: 3, Sorcerer: 1, Warlock: 1, Wizard: 2,
};

/** Remove pipe tables and their `**Table- ...**` captions from a block (for prose descriptions). */
function stripTables(md: string): string {
    return md
        .split("\n")
        .filter(l => !/^\s*\|/.test(l) && !/^\*\*Table[-–—:]/.test(l.trim()))
        .join("\n");
}

/** Ability names in "Strength, Constitution" -> ["STR","CON"]. */
function abilitiesToAbbrev(text: string): string[] {
    const out: string[] = [];
    for (const part of text.split(/,|\band\b/)) {
        const key = part.trim().toLowerCase();
        if (ABBR[key]) out.push(ABBR[key]);
    }
    return out;
}

// ---------------------------------------------------------------------------
// primary abilities (Multiclassing.md prerequisites)
// ---------------------------------------------------------------------------

/**
 * // NOTE: hardcoded fallback used when Multiclassing.md can't be read/parsed. Fighter's
 * prereq is "Strength 13 or Dexterity 13"; the served data resolves the ambiguity to DEX,
 * so we override Fighter -> DEX after parsing (first-named ability would give STR).
 */
const PRIMARY_FALLBACK: Record<string, string> = {
    Barbarian: "STR", Bard: "CHA", Cleric: "WIS", Druid: "WIS", Fighter: "DEX", Monk: "DEX",
    Paladin: "STR", Ranger: "DEX", Rogue: "DEX", Sorcerer: "CHA", Warlock: "CHA", Wizard: "INT",
};

function parsePrimaryAbilities(): Record<string, string> {
    const result: Record<string, string> = { ...PRIMARY_FALLBACK };
    try {
        const md = normalizeMarkdown(fs.readFileSync(path.join(SRC_2014, "03_Characterization", "Multiclassing.md"), "utf8"));
        const table = findTable(parseTables(md), "Multiclassing Prerequisites");
        if (table) {
            for (const row of table.rows) {
                const cls = titleCase(row[0] ?? "");
                if (!CLASS_NAMES.includes(cls)) continue;
                const first = (row[1] ?? "").trim().split(/\s+/)[0]?.toLowerCase();
                if (first && ABBR[first]) result[cls] = ABBR[first];
            }
        }
    } catch { /* fall back to the constant map */ }
    result.Fighter = "DEX"; // see NOTE above
    return result;
}

// ---------------------------------------------------------------------------
// proficiencies / skills / equipment (5.1 layout)
// ---------------------------------------------------------------------------

function parseProficiencyList(value: string | undefined, stripWeapons: boolean): string[] {
    if (!value) return [];
    const v = value.trim();
    if (/^none$/i.test(v) || /choose|of your choice/i.test(v)) return [];
    return v.split(",")
        .map(p => p.trim())
        .filter(Boolean)
        .map(p => (stripWeapons ? p.replace(/\s+weapons?$/i, "") : p))
        .map(titleCase);
}

function parseSkillChoice(value: string | undefined): ChoiceDetailJson | null {
    if (!value) return null;
    // NOTE: the Fighter skills line has a stray comma ("Animal, Handling"); repair it locally.
    const line = value.replace(/Animal,\s*Handling/i, "Animal Handling");
    const amtMatch = line.match(/choose\s+(?:any\s+)?(\w+)/i);
    const amount = amtMatch ? (WORD_NUM[amtMatch[1].toLowerCase()] ?? (parseInt(amtMatch[1], 10) || 0)) : 0;
    const fromMatch = line.match(/from\s+(.+)$/i);
    let options: string[] = [];
    if (fromMatch) {
        options = fromMatch[1]
            .split(",")
            .map(s => s.replace(/^\s*and\s+/i, "").replace(/\.$/, "").trim())
            .filter(Boolean);
    }
    return { options, amount };
}

interface EquipmentResult {
    choices: Record<string, ChoiceDetailJson>;
    startingEquipment: StartingEquipmentJson[];
}

function parseEquipment(body: string): EquipmentResult {
    const optionKeys: string[] = [];
    const items: string[] = [];
    const choices: Record<string, ChoiceDetailJson> = {};
    let n = 0;
    for (const raw of body.split("\n")) {
        const line = raw.trim();
        if (!line.startsWith("- ")) continue;
        const text = line.slice(2).trim();
        if (/\(\*[a-z]\*\)/i.test(text)) {
            // a choice bullet: "(*a*) a rapier, (*b*) a longsword, or (*c*) any simple weapon"
            const opts = text.split(/\(\*[a-z]\*\)/i)
                .map(chunk => {
                    let c = chunk.trim();
                    c = c.replace(/[,]+$/, "").trim();
                    c = c.replace(/\bor$/i, "").trim();
                    c = c.replace(/[,]+$/, "").trim();
                    return c;
                })
                .filter(Boolean);
            if (opts.length) {
                n++;
                const key = `start_${n}`;
                choices[key] = { options: opts, amount: 1 };
                optionKeys.push(key);
            }
        } else {
            // a fixed bullet: split conjunctions into individual items
            for (const part of text.split(/\s+and\s+/i)) {
                const item = part.replace(/^(a|an|the)\s+/i, "").trim();
                if (item) items.push(item);
            }
        }
    }
    const startingEquipment: StartingEquipmentJson[] = [];
    if (optionKeys.length) startingEquipment.push({ optionKeys });
    if (items.length) startingEquipment.push({ items });
    return { choices, startingEquipment };
}

// ---------------------------------------------------------------------------
// spellcasting
// ---------------------------------------------------------------------------

interface ColumnInfo {
    levelIdx: number;
    featuresIdx: number;
    cantripsIdx: number;
    spellsKnownIdx: number;
    spellSlotsIdx: number;      // Warlock pact "Spell Slots"
    slotLevelIdx: number;       // Warlock pact "Slot Level"
    ordinalCols: { idx: number; slotLevel: number }[];
    extraCols: { idx: number; header: string }[]; // -> classSpecific
}

function analyzeColumns(table: MdTable): ColumnInfo {
    const info: ColumnInfo = {
        levelIdx: -1, featuresIdx: -1, cantripsIdx: -1, spellsKnownIdx: -1,
        spellSlotsIdx: -1, slotLevelIdx: -1, ordinalCols: [], extraCols: [],
    };
    table.headers.forEach((h, idx) => {
        const key = h.trim().toLowerCase();
        const ord = ordinalSlotLevel(h);
        if (key === "level") info.levelIdx = idx;
        else if (key === "features") info.featuresIdx = idx;
        else if (key === "cantrips known") info.cantripsIdx = idx;
        else if (key === "spells known") info.spellsKnownIdx = idx;
        else if (key === "spell slots") info.spellSlotsIdx = idx;
        else if (key === "slot level") info.slotLevelIdx = idx;
        else if (ord !== null) info.ordinalCols.push({ idx, slotLevel: ord });
        else if (!RESERVED_HEADERS.has(key) && key !== "proficiency bonus") info.extraCols.push({ idx, header: h });
    });
    return info;
}

function numericCell(cell: string | undefined): number | null {
    if (!cell) return null;
    const t = cell.trim();
    if (!/^\d+$/.test(t)) return null;
    const n = parseInt(t, 10);
    return n > 0 ? n : null;
}

interface SpellcastingBuild {
    spellcasting?: SpellcastingJson;
}

function buildSpellcasting(className: string, table: MdTable, cols: ColumnInfo, md: string): SpellcastingBuild {
    const isPact = cols.spellSlotsIdx >= 0 && cols.slotLevelIdx >= 0;
    const hasOrdinals = cols.ordinalCols.length > 0;
    if (!isPact && !hasOrdinals) return {};

    const maxOrdinal = cols.ordinalCols.reduce((m, c) => Math.max(m, c.slotLevel), 0);
    const casterType = isPact ? CASTER_TYPE.Pact : (maxOrdinal >= 6 ? CASTER_TYPE.Full : CASTER_TYPE.Half);

    const slots: Record<string, SpellslotsJson> = {};
    const spellsKnown: Record<string, number> = {};

    for (const row of table.rows) {
        const lvl = parseLevel(row[cols.levelIdx] ?? "");
        if (lvl === null) continue;
        const slot: SpellslotsJson = {};
        const cantrips = cols.cantripsIdx >= 0 ? numericCell(row[cols.cantripsIdx]) : null;
        if (cantrips !== null) slot.cantrips_known = cantrips;

        if (isPact) {
            const count = numericCell(row[cols.spellSlotsIdx]);
            const slotLevel = parseLevel(row[cols.slotLevelIdx] ?? "");
            if (count !== null && slotLevel !== null) {
                (slot as Record<string, number>)[`spell_slots_level_${slotLevel}`] = count;
            }
        } else {
            for (const c of cols.ordinalCols) {
                const v = numericCell(row[c.idx]);
                if (v !== null) (slot as Record<string, number>)[`spell_slots_level_${c.slotLevel}`] = v;
            }
        }
        slots[String(lvl)] = slot;

        if (cols.spellsKnownIdx >= 0) {
            const known = numericCell(row[cols.spellsKnownIdx]);
            if (known !== null) spellsKnown[String(lvl)] = known;
        }
    }

    const knownType = cols.spellsKnownIdx >= 0 ? "number" : "calc";
    const spellcasting: SpellcastingJson = {
        known_type: knownType,
        metadata: { slots, casterType },
    };
    if (knownType === "number") {
        spellcasting.spells_known = spellsKnown;
    } else {
        // prepared caster: derive stat from "<Ability> is your spellcasting ability"
        const abilMatch = md.match(/(Intelligence|Wisdom|Charisma)\s+is your spellcasting ability/i);
        const stat = abilMatch ? ABBR[abilMatch[1].toLowerCase()] : ABBR[PRIMARY_FALLBACK[className].toLowerCase()] ?? "INT";
        const level = maxOrdinal >= 6 ? "full" : "half";
        spellcasting.spells_known_calc = level === "half"
            ? { stat, level, roundUp: false }
            : { stat, level };
    }
    return { spellcasting };
}

// ---------------------------------------------------------------------------
// class features
// ---------------------------------------------------------------------------

/** Build a nameKey -> Section map of the class feature sections (H3s before the subclass H2). */
function classFeatureSections(sections: Section[], h2Start: number): Map<string, Section> {
    const map = new Map<string, Section>();
    for (const s of walk(sections)) {
        if (s.level >= 3 && s.start < h2Start) {
            const key = nameKey(s.title);
            if (key && !map.has(key)) map.set(key, s); // first occurrence wins (Warlock's dup "Eldritch Invocations")
        }
    }
    return map;
}

function buildFeatures(table: MdTable, cols: ColumnInfo, sectionMap: Map<string, Section>): Record<string, FeatureDetailJson[]> {
    const features: Record<string, FeatureDetailJson[]> = {};
    for (let l = 1; l <= 20; l++) features[String(l)] = [];

    for (const row of table.rows) {
        const lvl = parseLevel(row[cols.levelIdx] ?? "");
        if (lvl === null || lvl < 1 || lvl > 20) continue;
        const cell = row[cols.featuresIdx] ?? "";
        for (const name of splitFeatures(cell)) {
            const sec = matchSection(matchBase(name), sectionMap);
            let description: string;
            if (sec) description = cleanWhitespace(sectionText(sec, true));
            else description = "See your subclass."; // placeholder rows ("Path feature", "Divine Domain Feature", ...)
            features[String(lvl)].push({ id: "", name, description });
        }
    }
    return features;
}

// ---------------------------------------------------------------------------
// classSpecific
// ---------------------------------------------------------------------------

function buildClassSpecific(table: MdTable, cols: ColumnInfo): Record<string, Record<string, string>> {
    const out: Record<string, Record<string, string>> = {};
    for (const col of cols.extraCols) {
        const rec: Record<string, string> = {};
        for (const row of table.rows) {
            const lvl = parseLevel(row[cols.levelIdx] ?? "");
            if (lvl === null) continue;
            rec[String(lvl)] = (row[col.idx] ?? "").trim();
        }
        out[col.header] = rec; // key = raw column header, matching the served file ("Rages", "Ki Points", ...)
    }
    return out;
}

// ---------------------------------------------------------------------------
// subclasses
// ---------------------------------------------------------------------------

const SUBCLASS_PREFIXES = [
    "Path of the ", "Path of ", "College of ", "Circle of the ", "Circle of ",
    "Way of the ", "Way of ", "Oath of ", "School of ", "Order of the ", "The ",
];
const SUBCLASS_SUFFIXES = [" Domain", " Bloodline"];

function shortenSubclassName(title: string): string {
    let t = title.trim();
    for (const p of SUBCLASS_PREFIXES) if (t.startsWith(p)) { t = t.slice(p.length); break; }
    for (const s of SUBCLASS_SUFFIXES) if (t.endsWith(s)) { t = t.slice(0, -s.length); break; }
    return t.trim();
}

/** Collect spell names from any "... Spells" table in a block. */
function collectSpellNames(block: string): string[] {
    const names: string[] = [];
    const seen = new Set<string>();
    for (const t of parseTables(block)) {
        const levelIdx = t.headers.findIndex(h => /level/i.test(h));
        const spellIdx = t.headers.findIndex((h, i) => i !== levelIdx && /spell/i.test(h));
        if (spellIdx < 0) continue;
        for (const row of t.rows) {
            for (const nm of (row[spellIdx] ?? "").split(",").map(s => s.trim()).filter(Boolean)) {
                const key = nm.toLowerCase();
                if (!seen.has(key)) { seen.add(key); names.push(nm); }
            }
        }
    }
    return names;
}

function buildSubclass(className: string, h2: Section): SubclassJson {
    const section = h2.children[0]; // exactly one subclass per class in SRD 5.1
    const name = shortenSubclassName(section.title);
    const description = cleanWhitespace(stripTables(section.body));

    const features: Record<string, FeatureDetailJson[]> = {};
    const addFeature = (lvl: number, f: FeatureDetailJson) => {
        (features[String(lvl)] ??= []).push(f);
    };

    let minLevel = 99;
    let firstAtMin: FeatureDetailJson | undefined;
    const entryLevel = SUBCLASS_ENTRY_LEVEL[className] ?? 1;

    // Recurse so deeper sub-headings become their own features instead of being folded into the
    // parent's text (Oath of Devotion's "##### Purity of Spirit" is a real 15th-level feature).
    const emitFeature = (sec: Section, inheritedLvl: number) => {
        const lvl = firstMentionedLevel(sec.body) ?? inheritedLvl;
        const feature: FeatureDetailJson = {
            id: "",
            name: sec.title,
            description: cleanWhitespace(sec.body),
        };
        // Domain/Circle spell tables inside this feature's own section -> metadata.spells on it.
        const ownSpells = collectSpellNames(sec.body);
        if (ownSpells.length) feature.metadata = { spells: ownSpells };
        addFeature(lvl, feature);
        if (lvl < minLevel) { minLevel = lvl; firstAtMin = feature; }
        for (const grandchild of sec.children) emitFeature(grandchild, lvl);
    };
    for (const child of section.children) emitFeature(child, entryLevel);

    // Spell table sitting in the subclass intro (e.g. Cleric Life Domain) -> the granting (lowest-level) feature.
    const introSpells = collectSpellNames(section.body);
    if (introSpells.length && firstAtMin && !firstAtMin.metadata?.spells) {
        firstAtMin.metadata = { ...(firstAtMin.metadata ?? {}), spells: introSpells };
    }

    return { id: "", name, parent_class: className, description, features };
}

// ---------------------------------------------------------------------------
// per-class assembly
// ---------------------------------------------------------------------------

function parseClass(className: string, primary: string): { cls: ClassJson; sub: SubclassJson } {
    const md = readClass(className);
    const sections = sectionize(md);
    const tables = parseTables(md);

    const progression = findTable(tables, `The ${className}`)
        ?? tables.find(t => t.headers.some(h => /^level$/i.test(h)) && t.headers.some(h => /^features$/i.test(h)));
    if (!progression) throw new Error(`classes2014: no progression table for ${className}`);
    const cols = analyzeColumns(progression);

    // subclass H2 (single per file)
    let h2: Section | undefined;
    for (const s of walk(sections)) if (s.level === 2) { h2 = s; break; }
    if (!h2) throw new Error(`classes2014: no subclass H2 for ${className}`);

    const sectionMap = classFeatureSections(sections, h2.start);
    const features = buildFeatures(progression, cols, sectionMap);

    // hit die
    const hdMatch = md.match(/Hit Dice:\*\*\s*1d(\d+)/i);
    const hit_die = hdMatch ? hdMatch[1] : "";

    // proficiencies / skills / saving throws from "#### Proficiencies"
    let profSection: Section | undefined, equipSection: Section | undefined;
    for (const s of walk(sections)) {
        if (s.level === 4 && /^proficiencies$/i.test(s.title) && !profSection) profSection = s;
        if (s.level === 4 && /^equipment$/i.test(s.title) && !equipSection) equipSection = s;
    }
    const profFields = profSection ? labeledFields(profSection.body) : {};
    const proficiencies: ProficienciesJson = {
        armor: parseProficiencyList(profFields["Armor"], false),
        weapons: parseProficiencyList(profFields["Weapons"], true),
        tools: parseProficiencyList(profFields["Tools"], false),
        skills: [],
    };
    const saving_throws = abilitiesToAbbrev(profFields["Saving Throws"] ?? "");

    const choices: Record<string, ChoiceDetailJson> = {};
    const skillChoice = parseSkillChoice(profFields["Skills"]);
    if (skillChoice) choices.skills = skillChoice;

    const equip = equipSection ? parseEquipment(equipSection.body) : { choices: {}, startingEquipment: [] };
    Object.assign(choices, equip.choices);

    const { spellcasting } = buildSpellcasting(className, progression, cols, md);
    const classSpecific = buildClassSpecific(progression, cols);

    const cls: ClassJson = {
        id: "",
        name: className,
        hit_die,
        primary_ability: primary,
        saving_throws,
        starting_equipment: equip.startingEquipment,
        proficiencies,
        ...(spellcasting ? { spellcasting } : {}),
        start_choices: null as unknown as Record<string, string>, // served file stores null here
        features,
        choices,
        classSpecific,
    };

    const sub = buildSubclass(className, h2);
    return { cls, sub };
}

// ---------------------------------------------------------------------------
// entrypoint
// ---------------------------------------------------------------------------

export function parseClasses2014(): { classes: ClassJson[]; subclasses: SubclassJson[] } {
    const primaries = parsePrimaryAbilities();
    const classes: ClassJson[] = [];
    const subclasses: SubclassJson[] = [];
    for (const name of CLASS_NAMES) {
        const { cls, sub } = parseClass(name, primaries[name]);
        classes.push(cls);
        subclasses.push(sub);
    }
    return { classes, subclasses };
}
