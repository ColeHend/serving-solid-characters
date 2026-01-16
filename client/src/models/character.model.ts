import { Stats } from "../shared";
import { FeatureDetail } from "./data";

export class Character {
  public name: string = '';
  public get level() {
    return this.levels.length;
  };
  public levels: CharacterLevel[] = [];
  public spells: CharacterSpell[] = [];
  public race: CharacterRace = {
    species: "",
    features: []
  }
  public className: string = '';
  public subclass: string = '';
  public background: string = '';
  public alignment: string = '';
  public proficiencies: CharacterProficiency = {
    skills: {},
    other: {}
  };
  public languages: string[] = [];
  public health: CharacterHealth = {
    max: 0,
    current: 0,
    temp: 0
  };
  public stats: Stats = {
    str: 0,
    dex: 0,
    con: 0,
    int: 0,
    wis: 0,
    cha: 0
  }
  public items: CharacterGear = {
    inventory: [],
    equipped: [],
    attuned: [],
    currency: {
      platinumPieces: 0,
      goldPieces: 0,
      electrumPieces: 0,
      sliverPieces: 0,
      copperPieces: 0
    }

  }
}
export interface CharacterProficiency {
	skills: Record<string, CharacterSkillProficiency>
	other: Record<string, boolean>;
}
export interface CharacterSkillProficiency {
	stat: keyof Stats;
	value: number;
	proficient: boolean;
	expertise: boolean;
}
export interface CharacterRace {
	species: string;
	subrace?: string;
	age?: string;
	size?: string;
	speed?: string;
	features: FeatureDetail[];
}
export interface CharacterHealth {
	max: number;
	current: number;
	temp: number;
}
export interface CharacterSpell {
	name: string;
	prepared: boolean;
}
export interface CharacterLevel {
	class: string;
	subclass?: string;
	level: number;
	hitDie: number;
	features: FeatureDetail[];
}
export interface CharacterGear {
	inventory: string[];
	equipped: string[];
	attuned: string[];
  currency: CharacterCurrency;
}

export interface CharacterCurrency {
  platinumPieces: number;
  goldPieces: number;
  electrumPieces: number;
  sliverPieces: number;
  copperPieces: number;
}

type halfCharacter = Omit<Character,"levels"|"race"|"proficiencies"|"health"|"stats"|"items"|"level"|"spells"> 

export interface CharacterForm extends halfCharacter {
  race: string;
  maxHP: number;
  currentHP: number;
  tempHP: number;
  inventory: string[];
  equipped: string[];
  attuned: string[];
  PP: number;
  GP: number;
  EP: number;
  SP: number;
  CP: number;
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIS: number;
  CHA: number;
  spells: string[];
  lineage: string
}