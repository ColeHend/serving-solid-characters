import { Stats } from "../shared";
import { MadFeature } from "../shared/customHooks/mads/madModels";
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
  public ArmorClass: number = 0;
  public Speed: number = 0;
  public className: string = '';
  public subclass: string[] = [];
  public background: string = '';
  public alignment: string = '';
  public features: FeatureDetail[] = [];
  public proficiencies: CharacterProficiency = {
    skills: {},
    other: {}
  };
  public savingThrows: CharacterSavingThrow[] = [];
  public resistances: DamageAffinity[] = [];
  public vulnerabilities: DamageAffinity[] = [];
  public immunities: DamageAffinity[] = [];
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

export interface DamageAffinity {
  type: string;
  value: boolean;
}

export interface CharacterSavingThrow {
  stat: keyof Stats;
  proficient: boolean;
}

// -- Character Form Models --

type halfCharacter = Omit<Character,"levels"|"race"|"proficiencies"|"health"|"stats"|"items"|"level"|"spells"|"features"> 

export interface CharacterForm extends halfCharacter {
  race: string;
  maxHP: number;
  currentHP: number;
  tempHP: number;
  PP: number;
  GP: number;
  EP: number;
  SP: number;
  CP: number;
  lineage: string;
  clsGold: number;
  backgrndGold: number;
  backgrndItemChoice: string|null;
  classItemChoice: string|null;
  BackgrndFeat: string;
}