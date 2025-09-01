import { Proficiencies } from "./classes";
import { ChoiceDetail } from "./core";
import { FeatureDetail } from "./features";
import { StartingEquipment } from "./items";
/**
 * Background model
 * @author Cole Henrichs
 * @date 6/6/2024
 * @export
 * @interface Background
 * @property {string} name - Name of the background
 * @property {string} desc - Description of the background
 * @property {Proficiencies} proficiencies - Proficiencies granted by the background
 * @property {StartingEquipment[]} startEquipment - Starting equipment granted by the background
 * @property {string[]} [abilityOptions] - Optional ability score improvements
 * @property {string} [feat] - Optional feat granted by the background
 * @property {ChoiceDetail} [languages] - Optional language choices granted by the background
 * @property {FeatureDetail[]} [features] - Optional features granted by the background
 */
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