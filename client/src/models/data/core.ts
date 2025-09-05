export interface Prerequisite {
	type: PrerequisiteType;
	value: string;
}
export enum PrerequisiteType {
  String = 0,
  Level,
  Class,
  Subclass,
  Feat,
  Race,
  Item,
  Stat
}

export enum FeatureTypes {
	Class = 0,
	Subclass,
	Feat,
	Race,
	Background,
	Language,
	AbilityScore,
	CharacterLevel,
	Classes,
	Item,
	Weapon,
	Armor,
	Subrace
};

export interface Choices {
  [key: string]: ChoiceDetail;
}

export interface ChoiceDetail {
  options: string[];
  amount: number;
 }

export enum CharacterChangeTypes {
	AbilityScore = 0,
	HP,
	Speed,
	AC,
	Initiative,
	Save,
	AttackRoll,
	Spell,
	SpellSlot
}

export enum SetMethod {
  Set,
  Add,
  Subtract,
  Multiply,
  Divide,
}

export enum IncreaseMethod {
  number,
  die,
  stat,

}

export enum AbilityScores {
	STR = 0,
	DEX,
	CON,
	INT,
	WIS,
	CHA,
	CHOICE,
	ALL
}

export enum TypeRestrictions {
	SpellOnly = 0,
	MeleeOnly,
	RangedOnly,
	RangeReduced,
}

export enum MovementTypes {
	Walk = 0,
	Swim,
	Fly,
	Climb,
	Burrow
}

export interface StatBonus {
  stat: AbilityScores, 
  value: number
};