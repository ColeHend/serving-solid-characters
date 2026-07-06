import fs from "node:fs";
import path from "node:path";
import { SRC_2014 } from "../../config.ts";
import { normalizeMarkdown } from "../../md/normalize.ts";
import { sectionize, type Section } from "../../md/sections.ts";
import { parseBoldItalicRuns, type InlineRun } from "../../md/inline.ts";
import { cleanWhitespace } from "../../lib/util.ts";
import type {
    RaceJson,
    SubraceJson,
    StatBonusJson,
    AbilityBonusChoiceJson,
    ChoiceDetailJson,
    FeatJson,
} from "../../types.ts";

// The 9 species files, ordered to match the served 2014/races.json.
const RACE_FILES = [
    "Dwarf.md",
    "Elf.md",
    "Halfling.md",
    "Human.md",
    "Dragonborn.md",
    "Gnome.md",
    "Half-Elf.md",
    "Half-Orc.md",
    "Tiefling.md",
];

const ABIL: Record<string, number> = {
    Strength: 0, Dexterity: 1, Constitution: 2, Intelligence: 3, Wisdom: 4, Charisma: 5,
};

// Full 5.1 language list (Standard + Exotic, from Languages.md) in the order the served
// Human/Half-Elf `languageChoice.options` use. A free "extra language" choice offers this
// list minus Common and any language the race (or its parent) already knows.
const ALL_LANGUAGES = [
    "Common", "Dwarvish", "Elvish", "Giant", "Gnomish", "Goblin", "Halfling", "Orc",
    "Abyssal", "Celestial", "Draconic", "Deep Speech", "Infernal", "Primordial", "Sylvan", "Undercommon",
];

/** Collapse a prose paragraph (intro / age / alignment) to a single whitespace-normalized line. */
function proseOneLine(s: string): string {
    return s.replace(/\s+/g, " ").trim();
}

/** Trait/feature body: keep markdown mostly intact, but join blank-line paragraph breaks to single "\n". */
function traitBody(s: string): string {
    return cleanWhitespace(s).replace(/\n{2,}/g, "\n").trim();
}

function makeTrait(name: string, description: string): FeatJson {
    // NOTE: CONTRACT wants nested ids emitted as "" (id-stability pass fills them);
    // the served file omits details.id, but we follow the contract and include it.
    return {
        details: { id: "", name, description },
        prerequisites: [],
        id: "",
    } as unknown as FeatJson;
}

/** The prose that precedes the first `***Trait***` run in a section body. */
function extractIntro(body: string): string {
    const introLines: string[] = [];
    for (const line of body.split("\n")) {
        if (/^\*\*\*/.test(line.trim())) break;
        introLines.push(line);
    }
    return proseOneLine(introLines.join("\n"));
}

/** Named languages in appearance order from a Languages run's first sentence. */
function namedLanguages(runText: string): string[] {
    const firstSentence = runText.split(/\.\s/)[0];
    const found: { name: string; idx: number }[] = [];
    for (const lang of ALL_LANGUAGES) {
        const idx = firstSentence.indexOf(lang);
        if (idx >= 0) found.push({ name: lang, idx });
    }
    return found.sort((a, b) => a.idx - b.idx).map(f => f.name);
}

function languageOptions(known: string[]): string[] {
    const exclude = new Set(["Common", ...known]);
    return ALL_LANGUAGES.filter(l => !exclude.has(l));
}

interface ParsedAbilities {
    bonuses: StatBonusJson[];
    choice?: AbilityBonusChoiceJson;
}

function parseAbilities(text: string): ParsedAbilities {
    // "Your ability scores each increase by 1." → all six.
    if (/ability scores each increase by 1/i.test(text)) {
        return { bonuses: [0, 1, 2, 3, 4, 5].map(stat => ({ stat, value: 1 })) };
    }
    const bonuses: StatBonusJson[] = [];
    const re = /(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) score increases by (\d+)/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
        const key = m[1][0].toUpperCase() + m[1].slice(1).toLowerCase();
        bonuses.push({ stat: ABIL[key], value: parseInt(m[2], 10) });
    }
    let choice: AbilityBonusChoiceJson | undefined;
    // "two other ability scores of your choice increase by 1" → choose among the remaining five.
    const twoOther = /two other ability scores of your choice increase by (\d+)/i.exec(text);
    if (twoOther) {
        const taken = new Set(bonuses.map(b => b.stat));
        const value = parseInt(twoOther[1], 10);
        choice = {
            amount: 2,
            choices: [0, 1, 2, 3, 4, 5].filter(s => !taken.has(s)).map(stat => ({ stat, value })),
        };
    }
    return { bonuses, choice };
}

interface RaceCore {
    size: string;
    speed: number;
    languages: string[];
    languageChoice?: ChoiceDetailJson;
    abilityBonuses: StatBonusJson[];
    abilityBonusChoice?: AbilityBonusChoiceJson;
    traits: FeatJson[];
    descriptions: Record<string, string>;
}

/**
 * Turn a section's runs into the shared race/subrace core. `inheritedLanguages` are the
 * parent race's languages (for a subrace's free-language choice); pass [] for a main race.
 */
function buildCore(body: string, inheritedLanguages: string[]): RaceCore {
    const runs = parseBoldItalicRuns(body);
    const core: RaceCore = {
        size: "",
        speed: 0,
        languages: [],
        abilityBonuses: [],
        traits: [],
        descriptions: {},
    };

    for (const run of runs) {
        const label = run.label.toLowerCase();
        const text = run.text;
        if (label === "ability score increase") {
            const { bonuses, choice } = parseAbilities(text);
            core.abilityBonuses = bonuses;
            if (choice) core.abilityBonusChoice = choice;
        } else if (label === "speed") {
            const m = text.match(/(\d+)\s*feet/i);
            if (m) core.speed = parseInt(m[1], 10);
        } else if (label === "size") {
            const m = text.match(/\bsize is (\w+)/i);
            if (m) core.size = m[1][0].toUpperCase() + m[1].slice(1).toLowerCase();
            core.descriptions.sizeDescription = proseOneLine(text);
        } else if (label === "age") {
            core.descriptions.age = proseOneLine(text);
        } else if (label === "alignment") {
            core.descriptions.alignment = proseOneLine(text);
        } else if (label === "languages") {
            core.languages = namedLanguages(text);
            if (/extra language of your choice/i.test(text)) {
                core.languageChoice = { options: languageOptions([...core.languages, ...inheritedLanguages]), amount: 1 };
            }
            core.descriptions.languageDescription = proseOneLine(text);
        } else if (label === "extra language") {
            // Subrace free-language run (e.g. High Elf) with no named languages of its own.
            core.languageChoice = { options: languageOptions(inheritedLanguages), amount: 1 };
        } else {
            core.traits.push(makeTrait(run.label, traitBody(text)));
        }
    }
    return core;
}

export function parseRaces2014(): { races: RaceJson[]; subraces: SubraceJson[] } {
    const races: RaceJson[] = [];
    const subraces: SubraceJson[] = [];

    for (const file of RACE_FILES) {
        const raw = fs.readFileSync(path.join(SRC_2014, "01_Races", "Races_Each", file), "utf8");
        const md = normalizeMarkdown(raw);
        const roots = sectionize(md);
        const h1 = roots.find(s => s.level === 1);
        if (!h1) continue;
        const raceName = h1.title;

        // Main race body lives in the "### <Race> Traits" child (fall back to H1 body).
        const traitSection: Section | undefined = h1.children.find(c => c.level === 3);
        const mainBody = traitSection ? traitSection.body : h1.body;
        const intro = extractIntro(mainBody);
        const core = buildCore(mainBody, []);

        const descriptions: Record<string, string> = {};
        if (intro) descriptions.description = intro;
        if (core.descriptions.alignment) descriptions.alignment = core.descriptions.alignment;
        if (core.descriptions.age) descriptions.age = core.descriptions.age;
        if (core.descriptions.sizeDescription) descriptions.sizeDescription = core.descriptions.sizeDescription;
        if (core.descriptions.languageDescription) descriptions.languageDescription = core.descriptions.languageDescription;

        const race: RaceJson = {
            id: "",
            name: raceName,
            size: core.size,
            speed: core.speed,
            languages: core.languages,
            ...(core.languageChoice ? { languageChoice: core.languageChoice } : {}),
            abilityBonuses: core.abilityBonuses,
            ...(core.abilityBonusChoice ? { abilityBonusChoice: core.abilityBonusChoice } : {}),
            traits: core.traits,
            descriptions,
        };
        races.push(race);

        // Subraces: H2 children of the H1.
        for (const sub of h1.children.filter(c => c.level === 2)) {
            const subIntro = extractIntro(sub.body);
            const subCore = buildCore(sub.body, core.languages);
            // Subraces don't restate size/speed/languages in the 5.1 SRD — inherit the parent's.
            const subDescriptions: Record<string, string> = {
                description: subIntro,
                alignment: subCore.descriptions.alignment ?? "",
                age: subCore.descriptions.age ?? "",
                sizeDescription: subCore.descriptions.sizeDescription ?? "",
            };
            // 5.1 subrace headings sometimes drop the parent noun ("Lightfoot" → "Lightfoot Halfling").
            const subName = sub.title.includes(raceName) ? sub.title : `${sub.title} ${raceName}`;
            const subrace: SubraceJson = {
                id: "",
                name: subName,
                parentRace: raceName, // NOTE: parent NAME; the id-stability pass swaps in the id.
                size: subCore.size || core.size,
                speed: subCore.speed || core.speed,
                languages: subCore.languages,
                ...(subCore.languageChoice ? { languageChoice: subCore.languageChoice } : {}),
                abilityBonuses: subCore.abilityBonuses,
                ...(subCore.abilityBonusChoice ? { abilityBonusChoice: subCore.abilityBonusChoice } : {}),
                traits: subCore.traits,
                descriptions: subDescriptions,
            };
            subraces.push(subrace);
        }
    }

    return { races, subraces };
}
