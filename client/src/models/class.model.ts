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
    subclasses: Subclass[];
		spellcasting?: ClassCasting
		classMetadata: ClassMetadata;
	}
export interface ClassMetadata {
	subclassLevels: number[];
	subclassType: string;
	subclassTypePosition: 'before' | 'after' | string;
}
export interface LevelEntity {
    info: Info<string>;
    level: number;
    profBonus: number;
    features: Feature<string, string>[];
    classSpecific: {[key: string]: string;};
    spellcasting?: {[key: string]: number;};
}
export interface Subclass {
    id: number;
    name: string;
    desc: string[];
    features: Feature<string, string>[];
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