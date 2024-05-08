import type { Choice, StartingEquipment, Feature, Info } from "./core.model";
import { Spell } from "./spell.model";

export interface DnDClass {
    name: string;
    hitDie: number;
    proficiencies: string[];
    proficiencyChoices: Choice<string>[];
    savingThrows: string[];
    startingEquipment: StartingEquipment;
    classLevels: LevelEntity[];
    features: Feature<unknown, string>[];
    subclasses: Subclass[];
}
export interface LevelEntity {
    info: Info<string>;
    level: number;
    profBonus: number;
    features: Feature<unknown, string>[];
    classSpecific: {[key: string]: string;};
    spellcasting?: {[key: string]: number;};
}
export interface Subclass {
    name: string;
    subclassFlavor: string;
    description: string[];
    features: Feature<unknown, string>[];
    class: string;
    spells: Spell[];
}