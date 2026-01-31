import { Prerequisite, PrerequisiteType } from "./core";

export interface Feat {
  details: FeatureDetail;
  prerequisites: Prerequisite[];
}
export interface FeatureDetail {
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
 }

 