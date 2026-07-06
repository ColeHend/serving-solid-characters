import fs from "node:fs";
import path from "node:path";
import { SRC_2014 } from "../../config.ts";
import { normalizeMarkdown } from "../../md/normalize.ts";
import { sectionize } from "../../md/sections.ts";
import { labeledFields } from "../../md/inline.ts";
import { cleanWhitespace } from "../../lib/util.ts";
import type { BackgroundJson, FeatureDetailJson, ProficienciesJson, StartingEquipmentJson, ChoiceDetailJson } from "../../types.ts";

// Same Standard+Exotic 5.1 language list the served backgrounds.json offers for "of your choice".
const ALL_LANGUAGES = [
    "Common", "Dwarvish", "Elvish", "Giant", "Gnomish", "Goblin", "Halfling", "Orc",
    "Abyssal", "Celestial", "Draconic", "Deep Speech", "Infernal", "Primordial", "Sylvan", "Undercommon",
];

const NUMBER_WORDS: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
};

function proseOneLine(s: string): string {
    return s.replace(/\s+/g, " ").trim();
}

/** Split a comma-separated list while respecting parentheses, stripping a leading "and". */
function splitList(s: string): string[] {
    const parts: string[] = [];
    let depth = 0;
    let cur = "";
    for (const ch of s) {
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
    return parts.map(p => p.replace(/^and\s+/i, "").trim()).filter(Boolean);
}

function parseSkills(line: string | undefined): string[] {
    if (!line) return [];
    return line.split(",").map(s => s.trim()).filter(Boolean);
}

function parseLanguages(line: string | undefined): ChoiceDetailJson | undefined {
    if (!line) return undefined;
    // e.g. "Two of your choice" → { options: <all>, amount: 2 }
    const m = line.match(/^(\w+)/);
    const amount = m ? (NUMBER_WORDS[m[1].toLowerCase()] ?? (parseInt(m[1], 10) || 1)) : 1;
    return { options: [...ALL_LANGUAGES], amount };
}

export function parseBackgrounds2014(): BackgroundJson[] {
    const raw = fs.readFileSync(path.join(SRC_2014, "03_Characterization", "Backgrounds.md"), "utf8");
    const md = normalizeMarkdown(raw);
    const roots = sectionize(md);

    const backgrounds: BackgroundJson[] = [];
    // Real backgrounds are the H2 sections (the H1 intro's H3s are Proficiencies/Languages/etc.).
    const h1 = roots.find(s => s.level === 1);
    const h2s = (h1 ? h1.children : roots).filter(s => s.level === 2);

    for (const bg of h2s) {
        const fields = labeledFields(bg.body);
        const desc = proseOneLine(bg.body.split(/\n\s*\n/).find(p => p.trim() && !/^[-•*]/.test(p.trim())) ?? "");

        const proficiencies: ProficienciesJson = {
            armor: [],
            weapons: [],
            tools: parseSkills(fields["Tool Proficiencies"]),
            skills: parseSkills(fields["Skill Proficiencies"]),
        };

        const equipment: StartingEquipmentJson[] = [];
        if (fields["Equipment"]) equipment.push({ items: splitList(fields["Equipment"]) });

        // Feature: "### Feature: <Name>" child.
        const features: FeatureDetailJson[] = [];
        const featureSection = bg.children.find(c => /^feature:/i.test(c.title));
        if (featureSection) {
            const name = featureSection.title.replace(/^feature:\s*/i, "").trim();
            features.push({ id: "", name, description: cleanWhitespace(featureSection.body).replace(/\n{3,}/g, "\n\n").trim() });
        }

        const languages = parseLanguages(fields["Languages"]);

        backgrounds.push({
            id: "",
            name: bg.title,
            desc,
            proficiencies,
            startEquipment: equipment,
            ...(languages ? { languages } : {}),
            features,
        });
    }

    return backgrounds;
}
