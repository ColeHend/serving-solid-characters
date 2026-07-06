/**
 * 2024 (SRD 5.2) magic-items parser — src/10_MagicItems.md.
 *
 * Every concrete item is an H4 under "## Magic Items A–Z" whose first body line is an italic
 * type/rarity line (e.g. `*Armor (Any Medium or Heavy), Uncommon (Requires Attunement)*`).
 * Rules-section H4s lack that line and are excluded. See CONTRACT.md "Magic items" 2024.
 */
import fs from "node:fs";
import path from "node:path";
import { SRC_2024 } from "../../config.ts";
import type { MagicItemJson } from "../../types.ts";
import { normalizeMarkdown } from "../../md/normalize.ts";
import { sectionize, walk, type Section } from "../../md/sections.ts";
import { parseBoldRuns } from "../../md/inline.ts";
import { cleanWhitespace } from "../../lib/util.ts";

const CATEGORY_WORDS = ["Wondrous Item", "Armor", "Weapon", "Potion", "Ring", "Rod", "Staff", "Wand", "Scroll"];

/** GP value per simple rarity (Table: Magic Item Rarities and Values). Artifact = Priceless → "". */
const RARITY_COST: Record<string, string> = {
    common: "100 GP",
    uncommon: "400 GP",
    rare: "4,000 GP",
    "very rare": "40,000 GP",
    legendary: "200,000 GP",
};

// NOTE: no shared paren-aware splitter in md/*, so it lives here.
/** Split once at the first top-level (depth-0) comma. */
function splitFirstTopLevelComma(s: string): [string, string] {
    let depth = 0;
    for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (ch === "(") depth++;
        else if (ch === ")") depth = Math.max(0, depth - 1);
        else if (ch === "," && depth === 0) return [s.slice(0, i).trim(), s.slice(i + 1).trim()];
    }
    return [s.trim(), ""];
}

/** True when the italic type line begins with a known magic-item category word. */
function isTypeLine(line: string): boolean {
    return CATEGORY_WORDS.some(w => new RegExp(`^${w}\\b`, "i").test(line.trim()));
}

// NOTE: firstItalicLine() anchors to `$`, so it drops items whose type line shares its line with
// prose (`*Wondrous Item, Rare (Requires Attunement)* While wearing this belt…`). Extract the
// LEADING italic run locally and hand the trailing prose back to the description.
function splitTypeLine(body: string): { typeLine: string; rest: string } | null {
    const lines = body.split("\n");
    const idx = lines.findIndex(l => l.trim() !== "");
    if (idx < 0) return null;
    const m = lines[idx].trim().match(/^\*_?([^*]+?)_?\*(.*)$/);
    if (!m) return null;
    const trailing = m[2].trim();
    const restLines = [...lines.slice(0, idx), ...(trailing ? [trailing] : []), ...lines.slice(idx + 1)];
    return { typeLine: m[1].trim(), rest: cleanWhitespace(restLines.join("\n")) };
}

/** A charge descriptor when the item is charge-based, else undefined. */
function extractCharges(body: string): string | undefined {
    const run = parseBoldRuns(body).find(r => /charges/i.test(r.label));
    if (run) return cleanWhitespace(`${run.label}. ${run.text}`);
    const m = body.match(/(This [^.]*\bhas\b[^.]*\bcharges?\b[^.]*\.)/i);
    if (m) return cleanWhitespace(m[1]);
    return undefined;
}

function parseItem(s: Section): MagicItemJson | null {
    const split = splitTypeLine(s.body);
    if (!split || !isTypeLine(split.typeLine)) return null;

    const [category, rest] = splitFirstTopLevelComma(split.typeLine);

    // pull the "(Requires Attunement…)" parenthetical out of the rarity part
    let rarityPart = rest;
    let attunement: string | undefined;
    const att = rarityPart.match(/\((Requires Attunement[^)]*)\)/i);
    if (att) {
        attunement = att[1].trim();
        rarityPart = (rarityPart.slice(0, att.index) + rarityPart.slice(att.index! + att[0].length)).trim();
    }
    const rarity = rarityPart.replace(/[,\s]+$/, "").trim();

    // cost only when the rarity is a single, unambiguous tier
    const cost = RARITY_COST[rarity.toLowerCase()] ?? "";

    const properties: MagicItemJson["properties"] = {};
    if (attunement) properties.attunement = attunement;
    const charges = extractCharges(s.body);
    if (charges) properties.charges = charges;

    return {
        id: "",
        name: s.title,
        desc: split.rest,
        rarity,
        cost,
        category,
        weight: "",
        properties,
    };
}

export function parseMagicItems2024(): MagicItemJson[] {
    const raw = fs.readFileSync(path.join(SRC_2024, "10_MagicItems.md"), "utf8");
    const md = normalizeMarkdown(raw);
    const sections = sectionize(md);

    // Only H4 sections after the "Magic Items A–Z" listing heading are candidate items.
    let azStart = Number.POSITIVE_INFINITY;
    for (const s of walk(sections)) {
        if (/^magic items a[-–—]z$/i.test(s.title.trim())) {
            azStart = s.start;
            break;
        }
    }

    const items: MagicItemJson[] = [];
    for (const s of walk(sections)) {
        if (s.level !== 4 || s.start <= azStart) continue;
        const item = parseItem(s);
        if (item) items.push(item);
    }
    return items;
}
