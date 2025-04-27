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
  proficiencies: Proficiencies;
  spellcasting?: Spellcasting;
  starting_equipment: StartingEquipment[];
  features?: Record<number, FeatureDetail[]>;
  classSpecific?: Record<string, Record<number, string>>;
  choices?: Choices;
  metadata?: ClassMetadata;
}

export interface ClassMetadata {
  subclassLevels: number[];
  subclassName: string;
  subclassPos: "before" | "after" | string;
}

export interface Proficiencies {
  armor: string[];
  weapons: string[];
  tools: string[];
  skills: string[];
}