/**
 * 2014 (SRD 5.1) spell parser.
 *
 * One markdown file per spell in 07_Spells/Spells_Each/*.md:
 *   ### <Name>
 *   *3rd-level evocation*  /  *Evocation cantrip*  /  *2nd-level abjuration (ritual)*
 *   **Casting Time:** / **Range:** / **Components:** / **Duration:**
 *   <description paragraphs>
 *   ***At Higher Levels***. <higher-level text>
 *
 * Class membership comes from 07_Spells/Spell_Lists.md ("## <Class> Spells" → "#### <level>" → bullets).
 * See CONTRACT.md "Spells".
 */
import fs from "node:fs";
import path from "node:path";
import { SRC_2014 } from "../../config.ts";
import { normalizeMarkdown, cleanTitle } from "../../md/normalize.ts";
import { sectionize, walk } from "../../md/sections.ts";
import { labeledFields, parseBoldItalicRuns } from "../../md/inline.ts";
import { cleanWhitespace, nameKey } from "../../lib/util.ts";
import type { SpellJson } from "../../types.ts";

const SPELLS_DIR = path.join(SRC_2014, "07_Spells", "Spells_Each");
const SPELL_LISTS = path.join(SRC_2014, "07_Spells", "Spell_Lists.md");

const DAMAGE_TYPES = [
    "acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic",
    "piercing", "poison", "psychic", "radiant", "slashing", "thunder",
];
const DT_ALT = DAMAGE_TYPES.join("|");

function cap(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/** First italic-only line ("*3rd-level evocation*") — NOT the ### heading and NOT a bold field. */
function findItalicLine(lines: string[]): string {
    for (const l of lines) {
        const t = l.trim();
        if (!t) continue;
        if (/^\*[^*].*\*$/.test(t) && !t.startsWith("**")) return t.replace(/^\*+|\*+$/g, "").trim();
    }
    return "";
}

/** "*3rd-level evocation*" / "*Evocation cantrip*" / "*2nd-level abjuration (ritual)*" → level/school/ritual. */
function parseLevelSchool(italic: string): { level: number; school: string; is_ritual: boolean } {
    const lower = italic.toLowerCase();
    const is_ritual = /\(ritual\)/.test(lower);
    const cantrip = lower.match(/^([a-z]+)\s+cantrip/);
    if (cantrip) return { level: 0, school: cap(cantrip[1]), is_ritual };
    const m = lower.match(/(\d+)(?:st|nd|rd|th)-level\s+([a-z]+)/);
    if (m) return { level: parseInt(m[1], 10), school: cap(m[2]), is_ritual };
    return { level: 0, school: "", is_ritual };
}

/** "V, S, M (a tiny ball of bat guano and sulfur)" → booleans + material text. */
function parseComponents(raw: string): {
    components: string;
    is_verbal: boolean;
    is_somatic: boolean;
    is_material: boolean;
    materials_needed?: string;
} {
    const components = cleanWhitespace(raw);
    const before = components.split("(")[0];
    const tokens = before.split(",").map(t => t.trim().toUpperCase());
    const is_verbal = tokens.includes("V");
    const is_somatic = tokens.includes("S");
    const is_material = tokens.includes("M");
    const mat = components.match(/M\s*\(([\s\S]*)\)\s*$/i);
    const materials_needed = is_material && mat ? cleanWhitespace(mat[1]) : undefined;
    return { components, is_verbal, is_somatic, is_material, materials_needed };
}

/**
 * Damage type of the spell's primary damage roll. Prefer a dice-adjacent phrase
 * ("8d6 fire damage" → "Fire"); fall back to the first "<type> damage" mention when a
 * dice roll exists somewhere in the body (avoids tagging pure resistance/immunity prose).
 */
function extractDamageType(desc: string): string {
    // 1) dice-adjacent primary roll: "8d6 fire damage"
    const m1 = desc.match(new RegExp(`\\b\\d+d\\d+\\s+(?:[a-z'-]+\\s+){0,2}?(${DT_ALT})\\s+damage`, "i"));
    if (m1) return cap(m1[1]);
    // 2) flat numeric damage: "taking 20 radiant damage" (Guardian of Faith etc.)
    const m2 = desc.match(new RegExp(`\\b\\d+\\s+(?:[a-z'-]+\\s+){0,2}?(${DT_ALT})\\s+damage`, "i"));
    if (m2) return cap(m2[1]);
    // 3) any typed-damage mention, but only when the spell actually rolls dice somewhere
    if (/\b\d+d\d+\b/.test(desc)) {
        const m3 = desc.match(new RegExp(`\\b(${DT_ALT})\\s+damage`, "i"));
        if (m3) return cap(m3[1]);
    }
    return "";
}

/** nameKey → sorted class names, from Spell_Lists.md. */
function buildClassMap(): Map<string, string[]> {
    const md = normalizeMarkdown(fs.readFileSync(SPELL_LISTS, "utf8"));
    const roots = sectionize(md);
    const sets = new Map<string, Set<string>>();
    for (const s of walk(roots)) {
        if (s.level !== 2) continue;
        const cm = s.title.match(/^(.+?)\s+Spells$/i);
        if (!cm) continue;
        const className = cm[1].trim();
        for (const node of walk([s])) {
            for (const line of node.body.split("\n")) {
                const bm = line.trim().match(/^[-*]\s+(.+)$/);
                if (!bm) continue;
                const key = nameKey(cleanTitle(bm[1]));
                if (!key) continue;
                if (!sets.has(key)) sets.set(key, new Set());
                sets.get(key)!.add(className);
            }
        }
    }
    const out = new Map<string, string[]>();
    for (const [k, v] of sets) out.set(k, [...v].sort());
    return out;
}

function parseOne(md: string, classMap: Map<string, string[]>): SpellJson {
    const lines = md.split("\n");

    const nameLine = lines.find(l => /^###\s+/.test(l)) ?? "";
    const name = cleanTitle(nameLine.replace(/^###\s+/, ""));

    const { level, school, is_ritual } = parseLevelSchool(findItalicLine(lines));

    const fields = labeledFields(md);
    const casting_time = cleanWhitespace(fields["Casting Time"] ?? "");
    const range = cleanWhitespace(fields["Range"] ?? "");
    const durationRaw = fields["Duration"] ?? "";
    const duration = cleanWhitespace(durationRaw).replace(/\.$/, "");
    const is_concentration = /concentration/i.test(durationRaw);

    const comp = parseComponents(fields["Components"] ?? fields["Component"] ?? "");

    // higherLevel from the "***At Higher Levels***." run (kept OUT of description).
    const ahl = parseBoldItalicRuns(md).find(r => /^at higher levels$/i.test(r.label.trim()));
    const higherLevel = ahl ? cleanWhitespace(ahl.text) : undefined;

    // Description: body between the header block and the At Higher Levels run.
    const descLines: string[] = [];
    let inHeader = true;
    for (const line of lines) {
        if (/^###\s/.test(line)) continue;
        if (inHeader) {
            const t = line.trim();
            if (t === "") continue;
            if (/^\*[^*].*\*$/.test(t) && !t.startsWith("**")) continue; // level/school italic line
            if (/^\*\*(Casting Time|Range|Components?|Duration)\s*:?\s*\*\*/i.test(t)) continue;
            inHeader = false;
        }
        if (/^\s*\*\*\*At Higher Levels\*\*\*/i.test(line)) break;
        descLines.push(line);
    }
    const description = cleanWhitespace(descLines.join("\n")).replace(/\n{2,}/g, "\n").trim();

    const spell: SpellJson = {
        id: "",
        name,
        description,
        duration,
        level,
        range,
        casting_time,
        components: comp.components,
        is_concentration,
        is_ritual,
        school,
        damage_type: extractDamageType(description),
        page: "",
        is_material: comp.is_material,
        is_somatic: comp.is_somatic,
        is_verbal: comp.is_verbal,
        ...(comp.materials_needed ? { materials_needed: comp.materials_needed } : {}),
        ...(higherLevel ? { higherLevel } : {}),
        classes: classMap.get(nameKey(name)) ?? [],
        subclasses: [], // SRD 5.1 lists are class-only.
    };
    return spell;
}

export function parseSpells2014(): SpellJson[] {
    const classMap = buildClassMap();
    const files = fs.readdirSync(SPELLS_DIR).filter(f => f.endsWith(".md"));
    const spells: SpellJson[] = [];
    for (const file of files) {
        const md = normalizeMarkdown(fs.readFileSync(path.join(SPELLS_DIR, file), "utf8"));
        spells.push(parseOne(md, classMap));
    }
    spells.sort((a, b) => a.name.localeCompare(b.name));
    return spells;
}
