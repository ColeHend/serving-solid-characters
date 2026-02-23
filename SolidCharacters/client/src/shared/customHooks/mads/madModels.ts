type AddRemove<T extends string> = `Add${T}` | `Remove${T}`;

export type MadCommands = AddRemove<'Spells'> | 
    AddRemove<'Items'> |
    AddRemove<'Proficiencies'> |
    AddRemove<'Features'> | 
    AddRemove<'Currency'>;

export interface MadFeature {
    command: MadCommands;
    value: Record<string, string>;
}