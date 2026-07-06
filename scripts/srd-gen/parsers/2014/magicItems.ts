import fs from "node:fs";
import path from "node:path";
import { SRC_2014 } from "../../config.ts";
import { normalizeMarkdown } from "../../md/normalize.ts";
import { sectionize } from "../../md/sections.ts";
import { firstItalicLine } from "../../md/inline.ts";
import { cleanWhitespace } from "../../lib/util.ts";
import type { MagicItemJson } from "../../types.ts";

function proseOneLine(s: string): string {
    return s.replace(/\s+/g, " ").trim();
}

function titleCase(s: string): string {
    return s.split(/\s+/).filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
}

/** Index of the first comma that sits at parenthesis depth 0, or -1. */
function topLevelCommaIndex(s: string): number {
    let depth = 0;
    for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (ch === "(") depth++;
        else if (ch === ")") depth = Math.max(0, depth - 1);
        else if (ch === "," && depth === 0) return i;
    }
    return -1;
}

interface TypeLine {
    category: string;
    rarity: string;
    attunement?: string;
}

/**
 * Parse the italic type line: "Armor (medium or heavy, but not hide), uncommon",
 * "Wondrous item, rare (requires attunement)", "Weapon (any ammunition), uncommon (+1), ...".
 * category = leading words before the first "(" or top-level ","; rarity = the phrase after the
 * first top-level "," (attunement clause pulled out); compound rarities kept verbatim.
 */
function parseTypeLine(line: string): TypeLine {
    const idxParen = line.indexOf("(");
    const idxComma = topLevelCommaIndex(line);
    const catEnd = Math.min(
        idxParen === -1 ? Infinity : idxParen,
        idxComma === -1 ? Infinity : idxComma,
    );
    const category = titleCase((catEnd === Infinity ? line : line.slice(0, catEnd)).trim());

    let rarityPart = idxComma === -1 ? "" : line.slice(idxComma + 1).trim();

    let attunement: string | undefined;
    const att = rarityPart.match(/\(([^)]*attunement[^)]*)\)/i);
    if (att) {
        const inner = att[1].trim();
        attunement = inner[0].toUpperCase() + inner.slice(1);
        rarityPart = (rarityPart.slice(0, att.index) + rarityPart.slice(att.index! + att[0].length)).trim();
    }
    const rarity = rarityPart.replace(/\s+/g, " ").replace(/[,\s]+$/, "").trim();

    return { category, rarity, attunement };
}

function buildItem(name: string, body: string): MagicItemJson | null {
    const typeLineRaw = firstItalicLine(body);
    if (!typeLineRaw) return null;
    const { category, rarity, attunement } = parseTypeLine(typeLineRaw);

    // Paragraphs after the italic type line: first = desc, rest = effect.
    const paras = body.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    let start = 0;
    if (paras.length && /^\*[^*]/.test(paras[0])) start = 1; // skip the italic type-line paragraph
    const contentParas = paras.slice(start);

    const desc = proseOneLine(contentParas[0] ?? "");
    const effect = cleanWhitespace(contentParas.slice(1).join("\n\n")).replace(/\n{3,}/g, "\n\n").trim();

    const properties: MagicItemJson["properties"] = {};
    if (attunement) properties.attunement = attunement;
    if (effect) properties.effect = effect;
    const chargeMatch = body.match(/(\d+)\s+charges\b/i);
    if (chargeMatch) properties.charges = chargeMatch[1];

    return {
        id: "",
        name,
        desc,
        rarity,
        cost: "",
        category,
        weight: "",
        properties,
    };
}

export function parseMagicItems2014(): MagicItemJson[] {
    const items: MagicItemJson[] = [];

    // Per-file items (H3 name) under Magic_Items_Each.
    const eachDir = path.join(SRC_2014, "09_Magic_Items", "Magic_Items_Each");
    const files = fs.readdirSync(eachDir).filter(f => f.endsWith(".md")).sort();
    for (const file of files) {
        const md = normalizeMarkdown(fs.readFileSync(path.join(eachDir, file), "utf8"));
        const section = sectionize(md).find(s => s.level === 3) ?? sectionize(md)[0];
        if (!section) continue;
        // Each file is ONE item — take everything below the title heading, so embedded
        // sub-headings (Figurine of Wondrous Power's "#### Giant Fly" variants) stay in the body
        // instead of truncating it. Demote their hashes so they read as plain bold-ish lines.
        const lines = md.split("\n");
        const fullBody = lines.slice(section.start + 1).join("\n")
            .replace(/^#{3,6}\s+(.+)$/gm, "**$1.**")
            .trim();
        const item = buildItem(section.title, fullBody);
        if (item) items.push(item);
    }

    // Artifacts.md: concrete items live at H2 (e.g. Orb of Dragonkind).
    const artRaw = normalizeMarkdown(fs.readFileSync(path.join(SRC_2014, "09_Magic_Items", "Artifacts.md"), "utf8"));
    const artH1 = sectionize(artRaw).find(s => s.level === 1);
    const artItems = (artH1 ? artH1.children : sectionize(artRaw)).filter(s => s.level === 2);
    for (const sec of artItems) {
        // Only treat as an item if it has an italic type line (skips prose-only sections).
        if (!firstItalicLine(sec.body)) continue;
        const item = buildItem(sec.title, sec.body);
        if (item) items.push(item);
    }

    // NOTE: Sentient_Magic.md intentionally skipped — it defines rules/tables, not concrete items.
    return items;
}
