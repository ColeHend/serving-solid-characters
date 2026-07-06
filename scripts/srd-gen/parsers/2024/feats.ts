import fs from "node:fs";
import path from "node:path";
import { SRC_2024 } from "../../config.ts";
import { normalizeMarkdown } from "../../md/normalize.ts";
import { sectionize, walk, type Section } from "../../md/sections.ts";
import { firstItalicLine } from "../../md/inline.ts";
import { cleanWhitespace } from "../../lib/util.ts";
import type { FeatJson, PrerequisiteJson } from "../../types.ts";

// PrerequisiteType (SolidCharacters.Domain/Models/enums.cs):
// 0 String, 1 Level, 2 Class, 3 Subclass, 4 Feat, 5 Race, 6 Item, 7 Stat.
const PREREQ = { String: 0, Level: 1, Stat: 7 } as const;

const ABBR: Record<string, string> = {
    strength: "STR", dexterity: "DEX", constitution: "CON",
    intelligence: "INT", wisdom: "WIS", charisma: "CHA",
};

function readSource(): string {
    return normalizeMarkdown(fs.readFileSync(path.join(SRC_2024, "05_Feats.md"), "utf8"));
}

/** Parse the parenthetical "(Prerequisite: Level 4+, Strength or Dexterity 13+)" text into prerequisite rows. */
function parsePrerequisites(text: string): PrerequisiteJson[] {
    const out: PrerequisiteJson[] = [];
    for (const rawPart of text.split(",")) {
        const part = rawPart.trim();
        if (!part) continue;

        const level = part.match(/Level\s+(\d+)/i);
        if (level) {
            out.push({ type: PREREQ.Level, value: level[1] });
            continue;
        }

        // "Strength or Dexterity 13+" → Stat prereq. The value string is display-only in the
        // client (featView renders it; nothing parses it back), so an either-or requirement is
        // kept losslessly as "STR:13 or DEX:13".
        const stat = part.match(/(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)((?:\s+or\s+(?:Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma))*)\s+(\d+)/i);
        if (stat) {
            const score = stat[3];
            const abilities = [stat[1], ...(stat[2].match(/Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma/gi) ?? [])];
            out.push({ type: PREREQ.Stat, value: abilities.map(a => `${ABBR[a.toLowerCase()]}:${score}`).join(" or ") });
            continue;
        }

        // "Fighting Style Feature" / "Spellcasting Feature" → free-text feature requirement.
        const feature = part.match(/^(.+?)\s*Feature$/i);
        out.push({ type: PREREQ.String, value: feature ? `${feature[1].trim()} feature` : part });
    }
    return out;
}

function parseFeat(section: Section): FeatJson {
    const name = section.title;
    const body = section.body;
    const italic = firstItalicLine(body) ?? "";

    // "General Feat (Prerequisite: Level 4+)" → category "General Feat", prereq text "Level 4+".
    const meta = italic.match(/^([^(]+?)\s*(?:\(Prerequisite:\s*(.+?)\)\s*)?$/i);
    const category = (meta?.[1] ?? italic).trim();
    const prerequisites = meta?.[2] ? parsePrerequisites(meta[2]) : [];

    // Description = feat body after the italic category/prereq line; benefit runs (**X.**) kept intact.
    const lines = body.split("\n");
    const italicIdx = lines.findIndex(l => {
        const t = l.trim();
        return /^\*[^*].*\*$/.test(t) || /^_[^_].*_$/.test(t);
    });
    const description = cleanWhitespace(lines.slice(italicIdx >= 0 ? italicIdx + 1 : 0).join("\n"));

    return {
        id: "",
        details: {
            id: "",
            name,
            description,
            metadata: { category },
        },
        prerequisites,
    };
}

export function parseFeats2024(): FeatJson[] {
    const roots = sectionize(readSource());
    const feats: FeatJson[] = [];

    // Category sections are the H3s ending in "Feats" (Origin/General/Fighting Style/Epic Boon).
    // "Parts of a Feat" (which holds the malformed `***Benefit.**` marker) is excluded — it has
    // no feat H4 children — so that stray marker never reaches the parser.
    for (const section of walk(roots)) {
        if (section.level !== 3 || !/Feats$/i.test(section.title)) continue;
        for (const feat of section.children) {
            if (feat.level !== 4) continue;
            feats.push(parseFeat(feat));
        }
    }
    return feats;
}
