import { MadFeature } from "../../shared/customHooks/mads/madModels";
import { Prerequisite } from "./core";

export interface Feat {
  details: FeatureDetail;
  prerequisites: Prerequisite[];
}
export interface FeatureDetail {
  /** Stable identity for choice-form mads (statChoiceKey) — persisted since the wizards
   *  stopped stripping it; absent only on legacy rows saved before then. */
  id?: string;
  name: string;
  description: string;
  choiceKey?: string;
  metadata?: FeatureMetadata;
 }

 interface FeatureMetadata {
  uses?: number;
  recharge?: string;
  spells?: string[];
  category?: string;
  mads?: MadFeature;
 }

 