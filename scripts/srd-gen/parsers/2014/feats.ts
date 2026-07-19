import fs from "node:fs";
import path from "node:path";
import { SRC_2014 } from "../../config.ts";
import { normalizeMarkdown } from "../../md/normalize.ts";
import { sectionize } from "../../md/sections.ts";
import { cleanWhitespace } from "../../lib/util.ts";
import type { FeatJson, PrerequisiteJson } from "../../types.ts";
import { CURATED_FEATS_2014 } from "./featsData.ts";

// C# PrerequisiteType (enums.cs): String=0, Level=1, Class=2, Subclass=3, Feat=4, Race=5, Item=6, Stat=7.
const PREREQ = { String: 0, Level: 1, Stat: 7 } as const;

const ABBREV: Record<string, string> = {
    Strength: "STR", Dexterity: "DEX", Constitution: "CON",
    Intelligence: "INT", Wisdom: "WIS", Charisma: "CHA",
};

/** "Strength 13 or higher" → { type: Stat, value: "STR 13" } (matches served 2014 feats.json). */
function parsePrerequisites(line: string): PrerequisiteJson[] {
    const out: PrerequisiteJson[] = [];
    // Split on ", " and " and " to tolerate multi-clause prereqs.
    for (const clause of line.split(/\s*,\s*|\s+and\s+/i)) {
        const c = clause.trim();
        if (!c) continue;
        const stat = c.match(/(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s+(\d+)/i);
        if (stat) {
            const key = stat[1][0].toUpperCase() + stat[1].slice(1).toLowerCase();
            out.push({ type: PREREQ.Stat, value: `${ABBREV[key]} ${stat[2]}` });
            continue;
        }
        const level = c.match(/level\s+(\d+)/i);
        if (level) {
            out.push({ type: PREREQ.Level, value: level[1] });
            continue;
        }
        out.push({ type: PREREQ.String, value: c });
    }
    return out;
}

export function parseFeats2014(): FeatJson[] {
    const raw = fs.readFileSync(path.join(SRC_2014, "05_Feats", "Feats.md"), "utf8");
    const md = normalizeMarkdown(raw);
    const roots = sectionize(md);

    const feats: FeatJson[] = [];
    // Each feat is an H2 under the "# Feats" H1.
    const h1 = roots.find(s => s.level === 1);
    const h2s = (h1 ? h1.children : roots).filter(s => s.level === 2);

    for (const feat of h2s) {
        const lines = feat.body.split("\n");
        let prerequisites: PrerequisiteJson[] = [];
        const bodyLines: string[] = [];
        for (const line of lines) {
            const prereq = line.trim().match(/^\*+Prerequisite:\s*(.+?)\*+$/i);
            if (prereq) {
                prerequisites = parsePrerequisites(prereq[1]);
            } else {
                bodyLines.push(line);
            }
        }
        const description = cleanWhitespace(bodyLines.join("\n")).replace(/\n{3,}/g, "\n\n").trim();
        feats.push({
            id: "",
            details: { id: "", name: feat.title, description },
            prerequisites,
        } as unknown as FeatJson);
    }

    // Curated feats the 5.1 markdown lacks (clone so the id/stamp passes mutate a copy).
    return [...feats, ...structuredClone(CURATED_FEATS_2014)];
}
