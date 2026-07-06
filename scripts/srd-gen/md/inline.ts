import { cleanWhitespace } from "../lib/util.ts";

export interface InlineRun {
    label: string;
    text: string;
}

/**
 * Extract 5.1-style inline runs: paragraphs beginning `***Label***. text...`
 * (race traits, weapon properties, "At Higher Levels"). A run's text continues
 * until the next run, heading, or table.
 */
export function parseBoldItalicRuns(md: string): InlineRun[] {
    const runs: InlineRun[] = [];
    // Tolerate ***Label***. / ***Label.*** / ***Label:*** and following text on the same or next lines.
    const re = /^\*\*\*([^*]+?)[.:]?\*\*\*[.:]?\s*/;
    const lines = md.split("\n");
    let current: InlineRun | null = null;
    for (const line of lines) {
        const m = line.match(re);
        if (m) {
            if (current) runs.push({ ...current, text: cleanWhitespace(current.text) });
            current = { label: m[1].trim(), text: line.slice(m[0].length) };
        } else if (current) {
            // a heading, a pipe table, a table CAPTION ("**Table- Armor**" / "Table: X"), or a
            // standalone bold section header ("**Equipment Packs**") ends the run
            if (/^#{1,6}\s/.test(line) || /^\s*\|/.test(line) || /^\*\*Table[-–—:]/.test(line.trim()) || /^Table:\s/.test(line.trim()) || /^\*\*[^*]+\*\*$/.test(line.trim())) {
                runs.push({ ...current, text: cleanWhitespace(current.text) });
                current = null;
            } else {
                current.text += "\n" + line;
            }
        }
    }
    if (current) runs.push({ ...current, text: cleanWhitespace(current.text) });
    return runs;
}

/**
 * Extract 5.2-style bold runs: paragraphs beginning `**Label.** text` or `**Label:** text`.
 * Used for species traits and feat benefits. `**_Label._**` (5.2 upcast lines) also matches.
 */
export function parseBoldRuns(md: string): InlineRun[] {
    const runs: InlineRun[] = [];
    const re = /^\*\*_?([^*_]+?)[.:]?_?\*\*[.:]?\s*/;
    const lines = md.split("\n");
    let current: InlineRun | null = null;
    for (const line of lines) {
        const m = line.match(re);
        if (m && !line.startsWith("***")) {
            if (current) runs.push({ ...current, text: cleanWhitespace(current.text) });
            current = { label: m[1].trim(), text: line.slice(m[0].length) };
        } else if (current) {
            if (/^#{1,6}\s/.test(line) || /^\s*\|/.test(line)) {
                runs.push({ ...current, text: cleanWhitespace(current.text) });
                current = null;
            } else {
                current.text += "\n" + line;
            }
        }
    }
    if (current) runs.push({ ...current, text: cleanWhitespace(current.text) });
    return runs;
}

/** `**Label:** value` single-line fields (spell headers, species Size/Speed lines). Returns first match per label. */
export function labeledFields(md: string): Record<string, string> {
    const rec: Record<string, string> = {};
    const re = /^[-•]?\s*\*\*_?([^*_]+?)_?\s*:?\s*\*\*\s*:?\s*(.+)$/;
    for (const line of md.split("\n")) {
        const m = line.trim().match(re);
        if (m) {
            const label = m[1].replace(/:$/, "").trim();
            if (!(label in rec)) rec[label] = m[2].trim();
        }
    }
    return rec;
}

/** First italic-only line in a block (spell "*Level 2 Evocation (Wizard)*", magic item type line). */
export function firstItalicLine(md: string): string | null {
    for (const line of md.split("\n")) {
        const t = line.trim();
        if (!t) continue;
        const m = t.match(/^\*_?([^*].*?)_?\*$/) ?? t.match(/^_([^_].*?)_$/);
        if (m) return m[1].trim();
        // stop at first non-empty, non-italic content line
        if (!/^\*/.test(t)) return null;
        return null;
    }
    return null;
}
