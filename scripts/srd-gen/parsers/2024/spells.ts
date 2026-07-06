import fs from "node:fs";
import path from "node:path";
import { SRC_2024 } from "../../config.ts";
import { normalizeMarkdown } from "../../md/normalize.ts";
import { sectionize, walk, type Section } from "../../md/sections.ts";
import { firstItalicLine, labeledFields } from "../../md/inline.ts";
import { cleanWhitespace } from "../../lib/util.ts";
import type { SpellJson } from "../../types.ts";

const DAMAGE_TYPES = [
    "Acid", "Bludgeoning", "Cold", "Fire", "Force", "Lightning",
    "Necrotic", "Piercing", "Poison", "Psychic", "Radiant", "Slashing", "Thunder",
];
const DAMAGE_RE = new RegExp(`(?:\\d+d\\d+|\\d+)\\s+(${DAMAGE_TYPES.join("|")})\\s+damage`, "i");

function readSource(): string {
    return normalizeMarkdown(fs.readFileSync(path.join(SRC_2024, "07_Spells.md"), "utf8"));
}

/** The spell type line, e.g. "Level 2 Evocation (Wizard)" or "Evocation Cantrip (Sorcerer, Wizard)". */
function isSpellTypeLine(italic: string | null): boolean {
    return !!italic && /^(Level\s+\d+\s+\w+|\w+\s+Cantrip)\b/i.test(italic);
}

/** The "Using a Higher-Level Spell Slot" / "Cantrip Upgrade" run marker (tolerant of the malformed `**Using…._**`). */
function isHigherLevelMarker(line: string): boolean {
    const t = line.trim();
    return /^[*_]+\s*(Using a Higher-Level Spell Slot|Cantrip Upgrade)/i.test(t);
}

// A header-field marker: `**Casting Time:**` … (colon required, so body runs like `**Duration.**`
// with a trailing period are NOT mistaken for headers). "Component" (singular) is tolerated.
const HEADER_LABEL = "(?:Casting Time|Range|Components?|Duration)";
const HEADER_AT_LINE_START = new RegExp(`^\\s*\\*\\*_?${HEADER_LABEL}\\s*:`, "i");

/**
 * A few spells jam several header fields onto one line (Forcecage) or trail the description prose
 * straight after the Duration value with no break (Fly, Greater Invisibility, Knock, Moonbeam).
 * Put each header marker at the start of its own line so field extraction stays line-based.
 */
function normalizeHeaderLines(body: string): string {
    return body.replace(new RegExp(`([^\\n])(\\s*)(\\*\\*_?${HEADER_LABEL}\\s*:)`, "gi"), "$1\n$3");
}

/** Separate a duration value from any description prose printed on the same line (Fly, etc.). */
function splitDuration(value: string): { duration: string; prose: string } {
    // ",?" — one spell (Protection from Evil and Good) writes "Concentration up to 10 minutes" with no comma
    const re = /^(Instantaneous|Until dispelled(?: or triggered)?|Special|Permanent|Concentration(?:,? up to \d+ (?:round|minute|hour|day)s?)?|\d+ (?:round|minute|hour|day)s?)/i;
    const m = value.match(re);
    if (!m) return { duration: value.trim(), prose: "" };
    return { duration: m[0].trim(), prose: value.slice(m[0].length).trim() };
}

/** Extract the four header fields, the body prose, and the higher-level-slot run (pulled OUT of the prose). */
function parseBody(body: string): {
    casting_time: string;
    range: string;
    components: string;
    duration: string;
    description: string;
    higherLevel?: string;
} {
    const norm = normalizeHeaderLines(body);
    const fields = labeledFields(norm);
    const casting_time = (fields["Casting Time"] ?? "").trim();
    const range = (fields["Range"] ?? "").trim();
    const components = (fields["Components"] ?? fields["Component"] ?? "").trim();
    const { duration, prose } = splitDuration((fields["Duration"] ?? "").trim());

    const lines = norm.split("\n");
    let headerEnd = -1;
    lines.forEach((l, i) => {
        if (HEADER_AT_LINE_START.test(l)) headerEnd = i;
    });

    let hlIdx = -1;
    for (let i = headerEnd + 1; i < lines.length; i++) {
        if (isHigherLevelMarker(lines[i])) {
            hlIdx = i;
            break;
        }
    }

    const afterLines = lines.slice(headerEnd + 1, hlIdx === -1 ? undefined : hlIdx);
    // Prose that trailed the Duration value belongs at the front of the description.
    const description = cleanWhitespace([prose, afterLines.join("\n")].filter(Boolean).join("\n\n"));

    let higherLevel: string | undefined;
    if (hlIdx >= 0) {
        const raw = lines.slice(hlIdx).join("\n");
        higherLevel = cleanWhitespace(
            raw.replace(/^[*_]*\s*(Using a Higher-Level Spell Slot|Cantrip Upgrade)\.?[*_]*\.?\s*/i, ""),
        );
    }
    return { casting_time, range, components, duration, description, higherLevel };
}

function extractDamageType(description: string): string {
    const m = description.match(DAMAGE_RE);
    if (!m) return "";
    const t = m[1];
    return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

function parseSpell(section: Section): SpellJson {
    const name = section.title; // `#### **Aid**` → "Aid" (cleanTitle strips emphasis)
    const body = section.body;
    const italic = firstItalicLine(body)!;

    // Classes = the last parenthesised group; the head is "Level N School" or "School Cantrip".
    const parens = [...italic.matchAll(/\(([^)]*)\)/g)];
    const classes = parens.length
        ? parens[parens.length - 1][1].split(",").map(c => c.trim()).filter(Boolean)
        : [];
    const head = italic.replace(/\([^)]*\)/g, "").trim();
    let level: number;
    let school: string;
    if (/cantrip/i.test(head)) {
        level = 0;
        school = head.replace(/cantrip/i, "").trim();
    } else {
        const m = head.match(/Level\s+(\d+)\s+(.+)/i)!;
        level = parseInt(m[1], 10);
        school = m[2].trim();
    }

    const { casting_time, range, components, duration, description, higherLevel } = parseBody(body);

    const compHead = components.replace(/\([^)]*\)/g, "");
    const is_verbal = /\bV\b/.test(compHead);
    const is_somatic = /\bS\b/.test(compHead);
    const is_material = /\bM\b/.test(compHead);
    const matMatch = components.match(/\bM\b\s*\((.*)\)\s*$/);
    const materials_needed = matMatch ? matMatch[1].trim() : "";

    const spell: SpellJson = {
        id: "",
        name,
        description,
        duration,
        level,
        range,
        casting_time,
        components,
        is_concentration: /concentration/i.test(duration),
        is_ritual: /ritual/i.test(casting_time),
        school,
        damage_type: extractDamageType(description),
        page: "",
        is_material,
        is_somatic,
        is_verbal,
        materials_needed,
        classes,
        subclasses: [],
    };
    if (higherLevel) spell.higherLevel = higherLevel;
    return spell;
}

export function parseSpells2024(): SpellJson[] {
    const roots = sectionize(readSource());
    const descSection = [...walk(roots)].find(s => s.level === 2 && /^Spell Descriptions/i.test(s.title));
    if (!descSection) return [];

    const spells: SpellJson[] = [];
    // Any section under "Spell Descriptions" whose body opens with a spell type line is a spell.
    // This captures every H4 spell PLUS the stray H3 "Freezing Sphere", and skips the letter-group
    // headers ("A Spells", …) whose bodies have no type line.
    for (const s of walk([descSection])) {
        if (isSpellTypeLine(firstItalicLine(s.body))) spells.push(parseSpell(s));
    }
    return spells;
}
