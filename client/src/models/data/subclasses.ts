import { Choices } from "./core";
import { FeatureDetail } from "./features";

export interface Subclass {
  name: string;
  parent_class: string;
  description: string;
  features: Record<number, FeatureDetail[]>;
  choices?: Choices;
 }
 
 