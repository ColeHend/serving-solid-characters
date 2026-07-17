import { Stats } from "../../../../shared/customHooks/dndInfo/useCharacters";

export type AbilityKey = keyof Stats;

export const ABILITY_KEYS: AbilityKey[] = ["str", "dex", "con", "int", "wis", "cha"];

export const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: "STR",
  dex: "DEX",
  con: "CON",
  int: "INT",
  wis: "WIS",
  cha: "CHA",
};

export const ABILITY_FULL_NAMES: Record<AbilityKey, string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};

export interface SkillDef {
  name: string;
  ability: AbilityKey;
}

/** The 18 5e skills in alphabetical order (both editions share the list). */
export const SKILLS: SkillDef[] = [
  { name: "Acrobatics", ability: "dex" },
  { name: "Animal Handling", ability: "wis" },
  { name: "Arcana", ability: "int" },
  { name: "Athletics", ability: "str" },
  { name: "Deception", ability: "cha" },
  { name: "History", ability: "int" },
  { name: "Insight", ability: "wis" },
  { name: "Intimidation", ability: "cha" },
  { name: "Investigation", ability: "int" },
  { name: "Medicine", ability: "wis" },
  { name: "Nature", ability: "int" },
  { name: "Perception", ability: "wis" },
  { name: "Performance", ability: "cha" },
  { name: "Persuasion", ability: "cha" },
  { name: "Religion", ability: "int" },
  { name: "Sleight of Hand", ability: "dex" },
  { name: "Stealth", ability: "dex" },
  { name: "Survival", ability: "wis" },
];

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
/** Higher-powered variant array some tables allow ("custom standard array"). */
export const EXTENDED_STANDARD_ARRAY = [17, 15, 13, 12, 10, 8];

export const POINT_BUY_BUDGET = 27;
export const POINT_BUY_MIN = 8;
export const POINT_BUY_MAX = 15;
/** Cost to reach a score from 8 (PHB point buy). */
export const POINT_BUY_COSTS: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9,
};

export const ABILITY_SCORE_MIN = 3;
export const ABILITY_SCORE_MAX = 20;
export const MAX_TOTAL_LEVEL = 20;

export const ALIGNMENTS = [
  "lawful good",
  "neutral good",
  "chaotic good",
  "lawful neutral",
  "true neutral",
  "chaotic neutral",
  "lawful evil",
  "neutral evil",
  "chaotic evil",
];

/** Standard + exotic languages offered by the language picker (same list the old creator used). */
export const LANGUAGES = [
  "Abyssal",
  "Celestial",
  "Deep Speech",
  "Draconic",
  "Dwarvish",
  "Elvish",
  "Giant",
  "Gnomish",
  "Goblin",
  "Halfling",
  "Infernal",
  "Orc",
  "Primordial",
  "Sylvan",
  "Undercommon",
];

/** Spellcasting ability per class — fallback when the class data carries no explicit casting stat. */
export const SPELL_ABILITY: Record<string, AbilityKey> = {
  wizard: "int",
  artificer: "int",
  cleric: "wis",
  druid: "wis",
  ranger: "wis",
  bard: "cha",
  sorcerer: "cha",
  warlock: "cha",
  paladin: "cha",
};
