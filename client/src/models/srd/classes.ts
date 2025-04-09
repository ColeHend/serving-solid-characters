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
export interface DnDClass {
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
