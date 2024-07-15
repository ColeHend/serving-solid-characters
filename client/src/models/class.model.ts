import type { Choice, StartingEquipment, Feature, Info } from "./core.model";
import { Spell } from "./spell.model";

export interface DnDClass {
    id: number;
    name: string;
    hitDie: number;
    proficiencies: string[];
    proficiencyChoices: Choice<string>[];
    savingThrows: string[];
    startingEquipment: StartingEquipment;
    classLevels: LevelEntity[];
    features: Feature<unknown, string>[];
    subclasses: Subclass[];
    spellcasting?: {
        level: number;
        name: string;
        spellcastingAbility: string;
        casterType: string;
        info: Array<{name: string, desc: string[]}>
    }
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
    id: number;
    name: string;
    subclassFlavor: string;
    desc: string[];
    features: Feature<unknown, string>[];
    class: string;
    spells: Spell[];
}