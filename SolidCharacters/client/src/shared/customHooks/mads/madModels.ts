import { Character } from "../../../models/character.model";

/**
 * Utility type to construct add/remove command strings for a given category.
 * For example, `AddSpells` or `RemoveSpells` when `T` is `'Spells'`.
 */
type AddRemove<T extends string> = `Add${T}` | `Remove${T}`;

/**
 * Comparison operators used in prerequisites when evaluating character values.
 */
type OperationType = "<" | ">" | ">=" | "<=";

/**
 * All possible commands that can be applied via a MAD feature. Each command
 * indicates adding or removing a particular aspect of a character (spells,
 * items, proficiencies, etc.).
 */
export type MadCommands = AddRemove<'Spells'> | 
    AddRemove<'Items'> |
    AddRemove<'Proficiencies'> |
    AddRemove<'Features'> | 
    AddRemove<'Currency'> | 
    AddRemove<'ArmorClass'> | 
    AddRemove<'Expertise'> | 
    AddRemove<'Feats'> | 
    AddRemove<'Languages'> | 
    AddRemove<'Resistances'> | 
    AddRemove<'Vulnerabilities'> | 
    AddRemove<'Immunities'> | 
    AddRemove<'SavingThrows'> | 
    AddRemove<'Stats'> | 
    AddRemove<'Speed'> |
    AddRemove<'AllProficiencies'>;

export interface MadFeature {
    command: MadCommands;
    value: Record<string, string>;
    type: MadType;
    prerequisites?: Madprerequisite[];
}

export enum MadType {
    /** changes on the character sheet */ 
    Character = "character",
    /** more detailed information about the feat/feature like numberOFUses, recharge info, etc */ 
    Info = "info"
}


export interface Madprerequisite {
    /**
     * The key on the character to check the prerequisite against. For example, if the prerequisite is "Strength Score >= 15", the value would be "Strength Score".
     */
    value: keyof Character;

    /**
     * The operation to compare the character's value to the keyValue. For example, if the prerequisite is "Strength Score >= 15", the operation would be ">=".
     */
    operation: OperationType;
    
    /**
     * The value to compare the character's value to. For example, if the prerequisite is "Strength Score >= 15", the keyValue would be 15.
     */
    keyValue: string;

    /**
     * the group number for "or" prerequisites, prerequisites with the same group number are "or" prerequisites, prerequisites with group 0 are "and" prerequisites;
     * 
     *  @example 
     * "for example, if the prerequisites are "Strength Score >= 15 or Dexterity Score >= 15", the group number for both prerequisites would be 1, if the prerequisites are "Strength Score >= 15 and Dexterity Score >= 15", the group number for both prerequisites would be 0."
     */
    group: number;
}