import { Proficiencies } from "./classes";
import { ChoiceDetail } from "./core";
import { FeatureDetail } from "./features";
import { StartingEquipment } from "./items";

export interface Background {
  name: string;
  desc: string;
  proficiencies: Proficiencies;
  startEquipment: StartingEquipment[];
  abilityOptions?: string[];
  feat?: string;
  languages?: ChoiceDetail;
  features?: FeatureDetail[];
}