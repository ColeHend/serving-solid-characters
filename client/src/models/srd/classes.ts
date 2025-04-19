import { APIReference } from "./core";

/**
 * Represents the response from the GET /api/classes endpoint.
 */
export interface ClassesList {
  count: number;
  results: APIReference[];
}

/**
 * Represents an individual option in a proficiency choice.
 */
export interface Option {
  item: APIReference;
}

/**
 * Represents a set of options from which a choice can be made.
 * The D&D 5e API uses an "option_set" to describe choices.
 */
export interface OptionSet {
  option_set_type: string;
  options: Option[];
}

/**
 * Represents a proficiency choice.
 * For example: "Choose 2 from the following proficiencies"
 */
export interface ProficiencyChoice {
  choose: number;
  type: string;
  from: OptionSet;
}

/**
 * Represents a detailed D&D class as returned by GET /api/classes/{index}
 */
export interface SRDClass {
  index: string;
  name: string;
  /** The hit die value (e.g., 12 for Barbarian) */
  hit_die: number;
  /** A list of proficiency choice objects */
  proficiency_choices: ProficiencyChoice[];
  /** The proficiencies automatically granted to the class */
  proficiencies: APIReference[];
  /** The saving throws the class is proficient in */
  saving_throws: APIReference[];
  /** URL to the class levels resource */
  class_levels: string;
  /** List of subclasses available for this class */
  subclasses: APIReference[];
  /** The URL for this class resource */
  url: string;
}

export interface SRDSubclass {
  index: string;
  name: string;
  /** A reference to the parent class for this subclass */
  class: APIReference;
  /** URL for accessing the subclass levels resource */
  subclass_levels: string;
  /** A list of strings describing the subclass features or lore */
  desc: string[];
  /** A list of feature references associated with this subclass */
  features: APIReference[];
  /** The URL for this subclass resource */
  url: string;
}

export interface SRDClassLevel {
  level: number;
  prof_bonus: number;
  class: APIReference;
  subclass: APIReference;
  spellcasting: {
    cantrips_known: number;
    spells_known: number;
    spell_slots_level_1: number;
    spell_slots_level_2: number;
    spell_slots_level_3: number;
    spell_slots_level_4: number;
    spell_slots_level_5: number;
    spell_slots_level_6: number;
    spell_slots_level_7: number;
    spell_slots_level_8: number;
    spell_slots_level_9: number;
  };
  features: APIReference[];
  url: string;
  index: string;
  updated_at: string;
  class_specific: {
    [key: string]: string;
  };
}

export interface SRDSubLevel {
  level: string;
  features: APIReference[];
  class: APIReference;
  subclass: APIReference;
  url: string;
  index: string;
  updated_at: string;
}

export interface SRDFeature {
  index: string;
  name: string;
  class: APIReference;
  desc: string[];
  prerequisites: string[];
  url: string;
  level: number;
}