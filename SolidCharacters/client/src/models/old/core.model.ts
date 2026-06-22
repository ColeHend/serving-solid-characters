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

export enum ChangeSubTypes {
	Set,
	Die,
	Stat,
	SetAndDie
}

export enum TypeRestrictions {
	SpellOnly = 0,
	MeleeOnly,
	RangedOnly,
	RangeReduced,
}

export enum CasterType {
  None,
  Third,
  Half,
  Full
};

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

export interface Feature<T, K> {
    info:  Info<K>;
	metadata: FeatureMetadata
    name:  string;
	choices?: Choice<T>[];
    value: T;
}

export interface FeatureMetadata {
		changes?: CharacterChange[];
}
export interface CharacterChange {
	type: CharacterChangeTypes; 
	subType: ChangeSubTypes;
	restriction?: TypeRestrictions;
	abilityScores?: AbilityScores[];
	value: number;
	dieSize?: number;
}
export interface Info<T> {
    className:    string;
    subclassName: string;
    level:        number;
    type:         FeatureTypes;
    other:        T;
}

export interface Choice<T>
{
    choose:  number;
    type:    FeatureTypes;
    choices: T[];
}

export interface Description {
    desc: string[];
    name: string;
}