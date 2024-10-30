import { Armor, Item, Weapon } from "../shared";

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
	SpellSlot,
	UseNumber
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

export enum FeatureUses {
	Stat,
	Proficiency,
	"Half Proficiency Rounded Up",
	NumPerRest
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

export enum MovementTypes {
	Walk = 0,
	Swim,
	Fly,
	Climb,
	Burrow
}

export enum WeaponTypes {}

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

export interface StartingEquipment {
    class: string;
    quantity: number;
    choice1: Choice<Item>[];
    choice2: Choice<Item>[];
    choice3: Choice<Item>[];
    choice4: Choice<Item>[];
}

export interface Description {
    desc: string[];
    name: string;
}