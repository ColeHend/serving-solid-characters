import { PbFraction } from "../../../../models/character.model";

export const PB_FRACTIONS: readonly PbFraction[] = ["Third PB", "Half PB", "Full PB"];

/**
 * Resolve a PB-fraction choice ("Third PB"/"Half PB"/"Full PB") against a concrete
 * proficiency bonus (D&D rounds down). Unknown/absent fractions resolve to 0.
 */
export const resolvePbFraction = (fraction: string | undefined, proficiencyBonus: number): number => {
    switch (fraction) {
        case "Full PB": return proficiencyBonus;
        case "Half PB": return Math.floor(proficiencyBonus / 2);
        case "Third PB": return Math.floor(proficiencyBonus / 3);
        default: return 0;
    }
};
