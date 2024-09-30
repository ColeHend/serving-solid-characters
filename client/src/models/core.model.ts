import { Armor, Item, Weapon } from "../shared";


export enum FeatureTypes {
	Class,
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
};

export interface Feature<T, K> {
    info:  Info<K>;
    name:  string;
		choices?: Choice<T>[];
    value: T;
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