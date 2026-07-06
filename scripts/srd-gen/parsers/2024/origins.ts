import fs from "node:fs";
import path from "node:path";
import { SRC_2024 } from "../../config.ts";
import { normalizeMarkdown, stripEmphasis } from "../../md/normalize.ts";
import { sectionize, walk, type Section } from "../../md/sections.ts";
import { labeledFields } from "../../md/inline.ts";
import { cleanWhitespace } from "../../lib/util.ts";
import type {
    RaceJson,
    BackgroundJson,
    FeatJson,
    FeatureMetadataJson,
    StatBonusJson,
    StartingEquipmentJson,
} from "../../types.ts";

// The 9 species and 4 backgrounds are matched by NAME (not heading depth) because the
// source has heading-level inconsistencies — e.g. `## **Soldier**` sits at H2 while the
// other backgrounds are H4, and species are `####`. Matching by known name is robust.
const SPECIES = ["Dragonborn", "Dwarf", "Elf", "Gnome", "Goliath", "Halfling", "Human", "Orc", "Tiefling"];
const BACKGROUNDS = ["Acolyte", "Criminal", "Sage", "Soldier"];

// NOTE: The 5.2 species descriptions carry NO "Languages" trait (2024 rules grant languages
// via background, not species). The served races.json nonetheless assigns each species a
// thematic language; per task guidance we preserve that convention here.
const SPECIES_LANGUAGES: Record<string, string[]> = {
    Dragonborn: ["Common", "Draconic"],
    Dwarf: ["Common", "Dwarvish"],
    Elf: ["Common", "Elvish"],
    Gnome: ["Common", "Gnomish"],
    Goliath: ["Common", "Giant"],
    Halfling: ["Common", "Halfling"],
    Human: ["Common"],
    Orc: ["Common", "Orc"],
    Tiefling: ["Common", "Infernal"],
};

/** { amount: 3, choices: STR..CHA each +1 } — the 2024 "choose your increases" boilerplate on every species. */
function abilityBonusChoice(): { amount: number; choices: StatBonusJson[] } {
    return { amount: 3, choices: [0, 1, 2, 3, 4, 5].map(stat => ({ stat, value: 1 })) };
}

/** Drop apostrophes and collapse whitespace to match the served item/proficiency spelling ("Thieves' Tools" → "Thieves Tools"). */
function stripApos(s: string): string {
    return s.replace(/[’'‘`]/g, "").replace(/\s+/g, " ").trim();
}

function readSource(): string {
    return normalizeMarkdown(fs.readFileSync(path.join(SRC_2024, "04_CharacterOrigins.md"), "utf8"));
}

/** First section (depth-first) whose cleaned title equals `name`. */
function findSection(all: Section[], name: string): Section | undefined {
    return all.find(s => s.title === name);
}

// ── Species ────────────────────────────────────────────────────────────────

interface TraitRun {
    name: string;
    lines: string[];
}

/**
 * Split a species' trait body into `**Trait.**` runs. Pipe tables (Draconic Ancestors /
 * Elven Lineages / Fiendish Legacies) are routed INTO the owning trait's run by matching the
 * table caption's first word to a trait name's first word — this keeps the Fiendish Legacies
 * table (printed after Otherworldly Presence in the source) inside the Fiendish Legacy trait.
 */
function splitTraitRuns(body: string): TraitRun[] {
    const runs: TraitRun[] = [];
    const boldRe = /^\*\*_?([^*_]+?)[.:]?_?\*\*[.:]?\s*/;
    const lines = body.split("\n");
    let cur: TraitRun | null = null;

    const findOwner = (caption: string): TraitRun | undefined => {
        const cw = caption.trim().split(/\s+/)[0].toLowerCase();
        return runs.find(r => r.name.split(/\s+/)[0].toLowerCase() === cw);
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const capM = line.trim().match(/^Table:\s*(.+)$/i);

        // A table block: an optional `Table: X` caption then contiguous pipe rows.
        if (capM || /^\s*\|/.test(line)) {
            let caption = "";
            const blockLines: string[] = [];
            if (capM) {
                caption = capM[1].trim();
                blockLines.push(`Table: ${caption}`);
                i++;
                while (i < lines.length && lines[i].trim() === "") i++;
            }
            while (i < lines.length && /^\s*\|/.test(lines[i])) {
                blockLines.push(lines[i]);
                i++;
            }
            i--; // step back onto the last consumed line
            const owner = caption ? findOwner(caption) : undefined;
            const target = owner ?? cur; // owner only differs for the Tiefling case (already-seen run)
            if (target) target.lines.push(...blockLines);
            continue;
        }

        const m = line.match(boldRe);
        if (m && !line.startsWith("***")) {
            if (cur) runs.push(cur);
            cur = { name: m[1].trim(), lines: [] };
            const rest = line.slice(m[0].length).trim();
            if (rest) cur.lines.push(rest);
        } else if (cur) {
            if (/^#{1,6}\s/.test(line)) {
                runs.push(cur);
                cur = null;
            } else {
                cur.lines.push(line);
            }
        }
    }
    if (cur) runs.push(cur);
    return runs;
}

/** Recharge only when the trait states a limited use ("Once you use…", "number of times equal…", "expended uses"). */
function detectRecharge(text: string): string | undefined {
    const limited = /once you use|can't (?:use|do so)|number of times equal|expended uses|regain (?:all )?expended/i.test(text);
    if (!limited) return undefined;
    if (/short (?:or long )?rest/i.test(text)) return "short";
    if (/long rest/i.test(text)) return "long";
    return undefined;
}

function parseSpecies(section: Section): RaceJson {
    const name = section.title;
    const fields = labeledFields(section.body);
    const sizeText = (fields["Size"] ?? "").trim();
    const size = sizeText.match(/\b(Small|Medium|Large)\b/)?.[1] ?? "Medium";
    const speed = parseInt((fields["Speed"] ?? "").replace(/[^\d]/g, ""), 10) || 0;

    // Traits begin after the "As a X, you have (these|the following) special traits." line.
    const bodyLines = section.body.split("\n");
    const introIdx = bodyLines.findIndex(l => /have (?:these|the following) special traits/i.test(l));
    const traitBody = introIdx >= 0 ? bodyLines.slice(introIdx + 1).join("\n") : section.body;

    const traits: FeatJson[] = splitTraitRuns(traitBody).map(run => {
        const description = cleanWhitespace(run.lines.join("\n"));
        const recharge = detectRecharge(description);
        const metadata: FeatureMetadataJson | undefined = recharge ? { recharge } : undefined;
        return {
            id: "",
            details: { id: "", name: run.name, description, ...(metadata ? { metadata } : {}) },
            prerequisites: [],
        };
    });

    const descriptions: Record<string, string> = {};
    if (fields["Creature Type"]) descriptions.creatureType = fields["Creature Type"].trim();
    if (sizeText) descriptions.physical = sizeText;

    const race: RaceJson = {
        id: "",
        name,
        size,
        speed,
        languages: SPECIES_LANGUAGES[name] ?? ["Common"],
        abilityBonuses: [],
        traits,
        descriptions,
        abilityBonusChoice: abilityBonusChoice(),
    };
    if (name === "Human") race.languageChoice = { options: ["Any"], amount: 1 };
    return race;
}

// ── Backgrounds ──────────────────────────────────────────────────────────────

/** "Insight and Religion" / "Sleight of Hand and Stealth" → ["Insight","Religion"] etc. */
function splitList(value: string): string[] {
    return value
        .split(/,| and /i)
        .map(s => s.trim())
        .filter(Boolean);
}

function parseEquipment(value: string): StartingEquipmentJson[] {
    const eq = stripEmphasis(value); // "Choose A or B: (A) …; or (B) 50 GP"
    const m = eq.match(/\(A\)\s*(.+?);\s*or\s*\(B\)\s*(.+)$/i);
    if (!m) return [];
    const items = (chunk: string) => chunk.split(",").map(stripApos).filter(Boolean);
    return [
        { optionKeys: ["A"], items: items(m[1]) },
        { optionKeys: ["B"], items: items(m[2]) },
    ];
}

function parseToolProficiency(value: string): string[] {
    let tool = stripEmphasis(value).replace(/\s*\(see [^)]*\)\s*$/i, "").trim();
    // "Choose one kind of Gaming Set" → "Gaming Set (choose one kind)" (matches served spelling).
    const choose = tool.match(/^Choose one kind of (.+)$/i);
    if (choose) tool = `${choose[1].trim()} (choose one kind)`;
    return tool ? [stripApos(tool)] : [];
}

function parseBackground(section: Section): BackgroundJson {
    const name = section.title;
    const fields = labeledFields(section.body);

    const feat = (fields["Feat"] ?? "").replace(/\s*\(see [^)]*\)\s*$/i, "").trim();
    const skills = splitList(fields["Skill Proficiencies"] ?? "");
    const tools = parseToolProficiency(fields["Tool Proficiency"] ?? "");
    const abilityOptions = splitList(fields["Ability Scores"] ?? "");

    return {
        id: "",
        name,
        // No per-background intro prose exists in the source; match the served synthetic desc.
        desc: `${name} background from the 2024 SRD`,
        proficiencies: { armor: [], weapons: [], tools, skills },
        startEquipment: parseEquipment(fields["Equipment"] ?? ""),
        abilityOptions,
        feat,
        features: [],
    };
}

export function parseOrigins2024(): { races: RaceJson[]; backgrounds: BackgroundJson[] } {
    const all = [...walk(sectionize(readSource()))];

    const races: RaceJson[] = [];
    for (const name of SPECIES) {
        const s = findSection(all, name);
        if (s) races.push(parseSpecies(s));
    }

    const backgrounds: BackgroundJson[] = [];
    for (const name of BACKGROUNDS) {
        const s = findSection(all, name);
        if (s) backgrounds.push(parseBackground(s));
    }

    return { races, backgrounds };
}
