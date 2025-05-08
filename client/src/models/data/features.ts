import { Modifier } from "../../shared/customHooks/character/buildCharacter";
import { Prerequisite, PrerequisiteType } from "./core";
export enum ActionType {
  unknown = 0,
  action = 1,
  bonusAction = 2,
  reaction = 3,
  freeAction = 4,
  ritual = 5,
  other = 6,
}
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
  name: string;                // Feature name
  category: string;            // "Racial Trait" | "Class Feature" | "Feat" | "Item" | etc.
  description: string;         // Feature description text

  usage?: UsageInfo;           // Usage limitations (omitted if unlimited use)
  grantedSpells?: SpellGrant[]; // Spells granted by this feature (if any)
  options?: FeatureOption[];    // List of optional sub-features (choices) if any
}

export interface UsageInfo {
  maxUses?: number;            // Maximum uses (if fixed number)
  usesFormula?: string;        // Formula for uses if dynamic (e.g., "PB", "LEVEL/2", "CHA mod")
  recharge: string;            // Recharge timing, e.g. "LongRest", "ShortRest", "Dawn", "Special"
}

export interface SpellGrant {
  spellName: string;           // Name of the granted spell
  levelAcquired: number;       // Level at which this spell is granted (1 if immediately available)
}

export interface FeatureOption {
  name: string;                // Option name
  description: string;
  actionType: ActionType;         // Option description or effect
  usage?: UsageInfo;           // (optional) usage info if this option has limited uses
  grantedSpells?: SpellGrant[]; // (optional) any spells this option grants
  modifiers?: Modifier[];      // (optional) any modifiers this option applies
}

// interface Modifier {
//   /** What is affected: e.g. "STR", "AC", "Save:DEX", "AttackRoll:Melee", 
//       "Skill:Stealth", "Damage:Radiant" … */
//   target: string;

//   /** The mathematical or rules operation:
//       "bonus", "set", "replace", "advantage", "disadvantage",
//       "expertise", "proficiency", "multiply", etc. */
//   operation: string;

//   /** Numeric or formula string. 0 for advantage/disadvantage/expertise. */
//   value?: number | string;

//   /** Optional – when it applies: "Permanent" (default), 
//       "WhileWearingArmor", "Rage", "Concentrating", "Turn", etc. */
//   condition?: string;
// }