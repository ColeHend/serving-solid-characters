import { FeatureOption, Item, Spellslots, StatBonus } from "../../../models/data";
export type Stat = "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";
export interface Character {
  name: string;
  level: number;
  condition: string;
  hp: CharacterHP;
  pb: number;
  race: string;
  ac: number;
  resist: string[];
  move: CharacterMovement;
  classes: string[];
  actions: CharacterActions;
  proficiencies: CharacterProficiencies;
  items: Item[];
  skills: Record<string, CharacterSkill>;
  stats: Record<Stat, CharacterStat>;
  saves: Record<Stat, number>;
  equip: CharacterEquipItems;
  advantageOn: Record<string, boolean | null>;
  features: Array<FeatureOption>;
  spellcasting?: CharacterSpellcasting;
  metadata?: CharacterMetadata;
}
type CharacterSelections = 'race' | 'subrace' | 'session';
export interface CharacterMetadata {
  selected: SingleSelection & MultiSelection
}
type SingleSelection = Record<CharacterSelections, CharacterSelectionTrack>;
type MultiSelection = Record<"classes" | "subclasses", CharacterSelectionTrack[]>;
export interface CharacterSelectionTrack {
  id: string;
  statBonuses?: StatBonus[];
  features?: FeatureOption[];
  proficiencies?: CharacterProficiencies;
  spells?: string[];
  languages?: string[];
  choices?: Record<string, string>;
  items?: {
    weapons?: Item[];
    tools?: Item[];
    items?: Item[];
  }
};
export interface CharacterSkill {
  name: string;
  value: number;
  proficient: boolean;
  expertise: boolean;
  advantage?: boolean;
  disadvantage?: boolean;
}

export interface CharacterMovement {
  walk: number;
  swim: number;
  fly: number;
  climb: number;
  burrow: number;
  total: number;
}

export interface CharacterActions {
  action: Array<string>;
  bonus: Array<string>;
  reaction: Array<string>;
  free: Array<string>;
  ritual: Array<string>;
  other: Array<string>;
}

export interface CharacterHP {
  max: number;
  current: number;
  temp: number;
  deathSaves: {
    success: number;
    failure: number;
  };
}

export interface CharacterStat {
  base: number;
  total?: number;
  mod: number;
  advantage?: boolean;
  disadvantage?: boolean;
}

export interface CharacterProficiencies {
  weapons: string[];
  armor: string[];
  tools: string[];
  saves: string[];
  languages: string[];
}
export interface CharacterEquipItems {
  helm?: Item;
  armor?: Item;
  shield?: Item;
  weapons?: Item[];
  tools?: Item[];
  items?: Item[];
}
export interface EquipItemBonus {
  name: string;
  type: string;
  dieVal?: number;
  value: number;
}

export interface CharacterSpellcasting {
  concentration: string;
  save: number;
  roll: number;
  spells_known: Array<string>;
  spell_slots: {
    current: Spellslots;
    max: Spellslots;
  };
  spellbook?: Array<string>;
}