import { Character } from "../../../../models/character.model";
import { FeatureDetail } from "../../../../models/generated";
import { getProficiencyBonus } from "../../utility/tools/dndMath";
import { MadFeature } from "../madModels";
import { resolvePbFraction } from "./pbFraction";

export const SHORT_REST = "Short Rest";
export const LONG_REST = "Long Rest";
export type RechargeType = typeof SHORT_REST | typeof LONG_REST;

export interface FeatureUsage {
    max: number;
    recharge: RechargeType;
}

/**
 * Uses is an Info-type command: it marks the OWNING feature as limited-use rather than
 * mutating the sheet, so applying it to a character is a no-op. The view reads the
 * definition via featureUsage() and tracks spent counts in character.featureUses.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const addUsesFeature = (character: Character, _feature: MadFeature): Character => character;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const removeUsesFeature = (character: Character, _feature: MadFeature): Character => character;

const normalizeRecharge = (raw?: string): RechargeType =>
    raw?.toLowerCase().includes("short") ? SHORT_REST : LONG_REST;

/**
 * The limited-use definition for a feature: an AddUses command on the feature wins,
 * falling back to metadata.uses/recharge. Null when the feature is not limited-use.
 * A fixed amount wins over a PB fraction; the fraction resolves against `level`
 * (a PB-scaled feature on a character of unknown level counts as level 1).
 */
export function featureUsage(feature: FeatureDetail, level?: number): FeatureUsage | null {
    const mads = (feature.metadata?.mads ?? []) as MadFeature[];
    const usesMad = mads.find(m => m.command === "AddUses");

    if (usesMad) {
        const max = Number(usesMad.value?.['amount']);
        if (Number.isFinite(max) && max > 0) {
            return { max, recharge: normalizeRecharge(usesMad.value?.['recharge']) };
        }
        const pbMax = resolvePbFraction(usesMad.value?.['proficiencyBonus']?.trim(), getProficiencyBonus(level ?? 1));
        if (pbMax > 0) {
            return { max: pbMax, recharge: normalizeRecharge(usesMad.value?.['recharge']) };
        }
    }

    const metaUses = Number(feature.metadata?.uses);
    if (Number.isFinite(metaUses) && metaUses > 0) {
        return { max: metaUses, recharge: normalizeRecharge(feature.metadata?.recharge) };
    }

    return null;
}

/**
 * Clears spent use counts for a rest: a long rest restores everything, a short rest
 * restores only the features whose recharge is Short Rest.
 */
export function resetFeatureUses(
    character: Character,
    rest: RechargeType,
    limitedFeatures: { name: string; recharge: RechargeType }[],
): Character {
    if (rest === LONG_REST) {
        character.featureUses = {};
        return character;
    }

    const shortRestNames = new Set(limitedFeatures.filter(f => f.recharge === SHORT_REST).map(f => f.name));
    character.featureUses = Object.fromEntries(
        Object.entries(character.featureUses ?? {}).filter(([name]) => !shortRestNames.has(name)));

    return character;
}

export { addUsesFeature, removeUsesFeature };
