import { SpellsKnown } from "../../components/homebrew/create/parts/subclasses/SpellsKnown";
import { CastingStat } from "../../shared/models/stats";
import type { Feature, Info, Description } from "./core.model";
import { Spell } from "../data/spell";

export interface LevelEntity {
    info: Info<string>;
    level: number;
    profBonus: number;
    features: Feature<string, string>[];
    classSpecific: {[key: string]: string;};
    spellcasting?: Spellslots;
}
interface Spellslots {
    cantrips_known?: number;
    spells_known?: number;
    spell_slots_level_0?: number;
    spell_slots_level_1?: number;
    spell_slots_level_2?: number;
    spell_slots_level_3?: number;
    spell_slots_level_4?: number;
    spell_slots_level_5?: number;
    spell_slots_level_6?: number;
    spell_slots_level_7?: number;
    spell_slots_level_8?: number;
    spell_slots_level_9?: number;
};
export interface Subclass {
    id: number;
    name: string;
    desc: string[];
    subclassFlavor: string;
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
        spellcasting: Spellslots;
        level: number;
    }[];
}
