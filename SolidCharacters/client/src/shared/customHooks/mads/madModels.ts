/**
 * Utility type to construct add/remove command strings for a given category.
 * For example, `AddSpells` or `RemoveSpells` when `T` is `'Spells'`.
 */
type AddRemove<T extends string> = `Add${T}` | `Remove${T}`;

/**
 * Comparison operators used in prerequisites when evaluating character values.
 * 
 * @example greater than, less than, less than or equal to, greater than or equal to, equal to, not equal to.
 */
type OperationType = "<" | ">" | ">=" | "<=" | "===" | "!==" | "includes" | "excludes";

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
    AddRemove<'AllProficiencies'> |
    AddRemove<'ClassFeature'> |
    AddRemove<'Advantage'> |
    AddRemove<'Attacks'> |
    AddRemove<'Uses'> |
    AddRemove<'Movement'> |
    AddRemove<'Senses'> |
    AddRemove<'HitPoints'> |
    AddRemove<'RollBonus'> |
    AddRemove<'Actions'> |
    AddRemove<'ArmorProficiencies'> |
    AddRemove<'WeaponProficiencies'> |
    AddRemove<'ToolProficiencies'>;

export interface MadFeature {
    command: MadCommands;
    value: Record<string, string>;
    type: MadType;
    prerequisites?: Madprerequisite[];
    group: number;
}

export enum MadType {
    /** changes on the character sheet */ 
    Character = 0,
    /** more detailed information about the feat/feature like numberOFUses, recharge info, etc */ 
    Info = 1,
}

/** One pickable sub-option of a feature (Eldritch Invocation, Maneuver, Metamagic…); a chosen option grants its description and mads. */
export interface FeatureOption {
    name: string;
    description: string;
    prerequisites?: OptionPrerequisite;
    mads?: MadFeature[];
}

export interface OptionPrerequisite {
    /** Minimum level in the owning class (total level for non-class features). */
    minLevel?: number;
    /** Feature (or other chosen option) the character must have, matched by name. */
    requiredFeature?: string;
    /** Display-only prerequisite text, e.g. "Pact of the Blade feature". */
    text?: string;
}

export interface OptionsConfig {
    /** What one option is called, e.g. "Invocation", "Maneuver". */
    label?: string;
    count?: number;
    /** Level-scaled pick count as "level:count" pairs, e.g. "2:2,5:3,7:4". */
    countScaling?: string;
}

export interface Madprerequisite {
    /**
     * The key on the character to check the prerequisite against. For example, if the prerequisite is "Strength Score >= 15", the value would be "Strength Score".
     */
    value: string;
    
    /**
     * The operation to compare the character's value to the keyValue. For example, if the prerequisite is "Strength Score >= 15", the operation would be ">=".
     */
    operation: OperationType;
    
    /**
     * The value to compare the character's value to. For example, if the prerequisite is "Strength Score >= 15", the keyValue would be 15.
     */
    keyValue: string;

    /**
     * the group number for "or" prerequisites, prerequisites with the same group number are "or" prerequisites, prerequisites with opposite are "and" prerequisites;
     */
    group: number;
}