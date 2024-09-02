import { SpellsKnown } from "../components/homebrew/create/parts/subclasses/subclasses";
import { CastingStat } from "../shared/models/stats";
import type { Choice, StartingEquipment, Feature, Info, Description } from "./core.model";
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
    subclassLevels: number[];
    spellcasting?: ClassCasting
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
    spellcasting?: SubclassCasting
}
interface Spellcasting {
    name: string;
    spellsKnownCalc: SpellsKnown | string;
    spellsKnownRoundup?: boolean;
    spellcastingAbility: CastingStat | string;
    casterType: string;
    info: Array<Description>
}
export interface SubclassCasting extends Spellcasting {
    castingLevels: {
        spellcasting: {[key: string]: number;};
        level: number;
    }[];
}
export interface ClassCasting extends Spellcasting {
    level: number;
}