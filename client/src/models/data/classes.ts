import { Choices } from "./core";
import { FeatureDetail } from "./features";
import { StartingEquipment } from "./items";
import { Spellcasting } from "./spellcasting";

export interface Class5E {
  id: number;
  name: string;
  hit_die: string;
  primary_ability: string;
  saving_throws: string[];
  startChoices?: StartChoices;
  starting_equipment: StartingEquipment[];
  proficiencies: Proficiencies;
  spellcasting?: Spellcasting;
  features?: Record<number, FeatureDetail[]>;
  choices?: Choices;
  classSpecific?: {
    [key: string]: Record<number, string>;
  }
}

export interface StartChoices {
  weapon?: string;
  armor?: string;
  tool?: string;
  skill?: string[];
  equipment?: string;
}

export interface Proficiencies {
  armor: string[];
  weapons: string[];
  tools: string[];
  skills: string[];
}