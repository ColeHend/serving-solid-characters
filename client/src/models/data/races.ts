import { AbilityScores, ChoiceDetail, StatBonus } from "./core";
import { Feat } from "./features";

export interface Race {
  id: string;
  name: string;
  size: string;
  speed: number;
  languages: string[];
  languageChoice?: ChoiceDetail;
  abilityBonuses: StatBonus[];
  abilityBonusChoice?: {amount: number, choices: StatBonus[]};
  traits: Feat[];
  traitChoice?: {amount: number, choices: Feat[]};
  descriptions?: {[type: string]: string};
}

export interface Subrace {
  id: string;
  name: string;
  parentRace: string;
  size: string;
  speed: number;
  languages: string[];
  languageChoice?: ChoiceDetail;
  abilityBonuses: StatBonus[];
  abilityBonusChoice?: {amount: number, choices: StatBonus[]};
  traits: Feat[];
  traitChoice?: {amount: number, choices: Feat[]};
  descriptions?: {[type: string]: string};
}