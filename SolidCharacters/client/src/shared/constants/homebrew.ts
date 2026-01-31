// Shared homebrew editor constants (sizes, abilities etc.)
// Centralizing so races, subraces, backgrounds editors stay in sync.

export const SIZE_TOKENS = ['Tiny','Small','Medium','Large','Huge','Gargantuan'] as const;
export type SizeToken = typeof SIZE_TOKENS[number];

// Ability order should align with Stat enum ordering (STR..CHA)
export const ABILITY_SHORT = ['STR','DEX','CON','INT','WIS','CHA'] as const;
export type AbilityCode = typeof ABILITY_SHORT[number];

export function isAbilityCode(v: string): v is AbilityCode { return (ABILITY_SHORT as readonly string[]).includes(v); }
