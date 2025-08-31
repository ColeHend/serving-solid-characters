import { Choices } from "./core";
import { FeatureDetail } from "./features";
import { Spellcasting } from "./spellcasting";

export interface Subclass {
  name: string;
  parent_class: string;
  description: string;
  features: Record<number, FeatureDetail[]>;
  choices?: Choices;
  spellcasting?: Spellcasting;
  /**
   * Internal persistence key combining parent class + name (lowercased) to guarantee uniqueness.
   * Added in DB schema v2. Not part of exported payloads.
   */
  storage_key?: string;
 }
 
 