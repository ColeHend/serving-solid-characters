import { Stats } from "../shared";
import { useDnDRaces } from "../shared/customHooks/dndInfo/info/all/races";
import { FeatureDetail } from "./data";

export class Character {
  public name: string = '';
  public experience: number = 0;
  public ac: number = 10;
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
  public speed: number = 30;
  public proficiencies: CharacterProficiency = {
    skills: {},
    other: {}
  };
  public languages: string[] = [];
  public health: CharacterHealth = {
    max: 0,
    current: 0,
    temp: 0,
    hitDie: { total: 0, die: 0, used: 0 }
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
    attuned: []
  }
  public initiative: number = 0;

  public get size(): string {
    const races = useDnDRaces();
    const race = races().find(r => r.name === this.race.species);
    return race?.size || "Medium";
  }

  public get profiencyBonus(): number {
    const lvl = this.level;
    if (lvl >= 17) return 6;
    if (lvl >= 13) return 5;
    if (lvl >= 9) return 4;
    if (lvl >= 5) return 3;
    if (lvl >= 1) return 2;
    return 0;
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
  hitDie: {
    total: number;
    die: number;
    used: number;
  }
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
}

export type CharacterForm = Omit<Character,"levels"|"spells"|"race"|"proficiencies"|"health"|"stats"|"items"|"level">