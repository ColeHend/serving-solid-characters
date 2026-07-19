import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(HERE, "..", "..");

export const SRC_2014 = path.join(REPO_ROOT, "Docs", "dnd.srd.5.1-main");
export const SRC_2024 = path.join(REPO_ROOT, "Docs", "dndsrd5.2_markdown-main", "src");
export const DATA_ROOT = path.join(REPO_ROOT, "SolidCharacters.Repository", "data", "srd");
export const OUT_2014 = path.join(DATA_ROOT, "2014");
export const OUT_2024 = path.join(DATA_ROOT, "2024");

/**
 * Count gates. `eq` must match exactly; `min` guards the previously-truncated files
 * (an equality gate would "pass" a still-truncated parse).
 */
export const COUNT_GATES: Record<string, Record<string, { eq?: number; min?: number }>> = {
    "2014": {
        classes: { eq: 12 },
        subclasses: { eq: 12 },
        races: { eq: 9 },
        subraces: { min: 4 },
        spells: { eq: 319 },
        backgrounds: { eq: 1 },
        feats: { eq: 2 },        // Grappler (parsed) + Ability Score Improvement (curated injection)
        items: { min: 100 },
        weapons: { min: 35 },
        armor: { min: 12 },
        magic_items: { min: 230 },
        rules: { min: 20 },      // curated 2014 set (24 authored)
        monsters: { min: 310 },  // 318 per-file source; 2 are non-statblock docs (template/NPC-customizing)
    },
    "2024": {
        classes: { eq: 12 },
        subclasses: { eq: 12 },
        races: { eq: 9 },
        subraces: { eq: 0 },
        spells: { min: 320 },
        backgrounds: { eq: 4 },
        feats: { min: 16 },
        items: { min: 60 },
        magic_items: { min: 200 },
        weapon_masteries: { min: 30 },
        rules: { min: 140 },     // parsed from 08_RulesGlossary.md (156 entries)
        monsters: { min: 320 },  // 12_MonstersA-Z.md (235) + 13_Animals.md (94)
    },
};
