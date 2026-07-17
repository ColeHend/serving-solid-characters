import { Choices } from "./core";
import { FeatureDetail } from "./features";
import { Spellcasting } from "./spellcasting";

export interface Subclass {
  name: string;
  /** Provenance label, e.g. "SRD 5.1", "SRD 5.2", or a user-supplied sourcebook; undefined means plain homebrew. */
  source?: string;
  parentClass: string;
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
 
 