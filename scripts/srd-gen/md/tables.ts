import { cleanTitle } from "./normalize.ts";

export interface MdTable {
    /** "Core Barbarian Traits" from `Table: Core Barbarian Traits` (5.2) or "The Barbarian" from `**Table- The Barbarian**` (5.1). Empty for uncaptioned tables. */
    caption: string;
    headers: string[];
    rows: string[][];
    /** For 5.1 equipment tables: rows.length-aligned category labels from embedded bold rows like `| **Simple Melee Weapons** | | |`. */
    rowCategories: string[];
    /** True when the header row is empty (`| | |`) — the 5.2 key/value style. */
    keyValue: boolean;
}

const CAPTION_51 = /^\*\*Table[-–—:]\s*(.+?)\*\*\s*$/;
const CAPTION_52 = /^Table:\s*(.+?)\s*$/;
const SEPARATOR = /^\s*\|?[\s:|-]+\|?\s*$/; // |---|---| style rows

function splitRow(line: string): string[] {
    let t = line.trim();
    if (t.startsWith("|")) t = t.slice(1);
    if (t.endsWith("|")) t = t.slice(0, -1);
    return t.split("|").map(c => c.trim());
}

function isTableLine(line: string): boolean {
    const t = line.trim();
    return t.startsWith("|") && t.includes("|", 1);
}

/**
 * Extract every pipe table from a block of markdown, handling all conventions in the two SRD trees:
 * - captions `**Table- X**` (5.1, possibly with a blank line before the table) and `Table: X` (5.2, sometimes with NO blank line before the header)
 * - separator rows, trailing fully-empty rows (5.1), empty header rows (5.2 key/value tables)
 * - embedded bold category rows `| **Simple Melee Weapons** | | |` (5.1 equipment) exposed via rowCategories
 */
export function parseTables(md: string): MdTable[] {
    const lines = md.split("\n");
    const tables: MdTable[] = [];
    let pendingCaption = "";
    let captionDistance = 99;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const cap51 = line.match(CAPTION_51);
        const cap52 = line.match(CAPTION_52);
        if (cap51 || cap52) {
            pendingCaption = cleanTitle((cap51 ?? cap52)![1]);
            captionDistance = 0;
            continue;
        }
        if (!isTableLine(line)) {
            if (line.trim() !== "") captionDistance++;
            if (captionDistance > 2) pendingCaption = "";
            continue;
        }

        // collect the whole table
        const block: string[] = [];
        while (i < lines.length && isTableLine(lines[i])) {
            block.push(lines[i]);
            i++;
        }
        i--;

        const rawRows = block.filter(l => !SEPARATOR.test(l)).map(splitRow);
        if (!rawRows.length) continue;

        const headers = rawRows[0];
        const keyValue = headers.every(h => h === "");
        const rows: string[][] = [];
        const rowCategories: string[] = [];
        let currentCategory = "";
        for (const row of rawRows.slice(1)) {
            if (row.every(c => c === "")) continue; // 5.1 trailing empty row
            const boldOnly = row[0].match(/^\*\*(.+)\*\*$/);
            if (boldOnly && row.slice(1).every(c => c === "")) {
                currentCategory = cleanTitle(boldOnly[1]);
                continue;
            }
            rows.push(row.map(c => c.replace(/\*\*/g, "").trim()));
            rowCategories.push(currentCategory);
        }

        tables.push({ caption: pendingCaption, headers: headers.map(cleanTitle), rows, rowCategories, keyValue });
        pendingCaption = "";
        captionDistance = 99;
    }
    return tables;
}

/** A key/value table (5.2 "Core X Traits") as a record: { "Primary Ability": "Strength", ... }. */
export function keyValueRecord(t: MdTable): Record<string, string> {
    const rec: Record<string, string> = {};
    for (const row of t.rows) {
        if (row.length >= 2 && row[0]) rec[row[0]] = row.slice(1).filter(Boolean).join(" | ");
    }
    return rec;
}

/** Find the first table whose caption contains `needle` (case-insensitive). */
export function findTable(tables: MdTable[], needle: string): MdTable | undefined {
    const n = needle.toLowerCase();
    return tables.find(t => t.caption.toLowerCase().includes(n));
}
