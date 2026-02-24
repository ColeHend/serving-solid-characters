type AddRemove<T extends string> = `Add${T}` | `Remove${T}`;

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
    AddRemove<'EldrichInvocations'>;

export interface MadFeature {
    command: MadCommands;
    value: Record<string, string>;
    type: MadType;
}


export enum MadType {
    // changes on the character sheet
    Character = "character",
    // more detailed information about the feat/feature like numberOFUses, recharge info, etc
    Info = "info"
}
