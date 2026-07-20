import { Character, GrantedAction } from "../../../../models/character.model";
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

export const normalizeRecharge = (raw?: string): RechargeType =>
    raw?.toLowerCase().includes("short") ? SHORT_REST : LONG_REST;

/**
 * Resolve an {amount | proficiencyBonus, recharge} uses spec: a fixed amount wins over a
 * PB fraction; the fraction resolves against `level` (unknown level counts as level 1).
 * Null when neither yields a positive max.
 */
function usageFromParts(
    amount: number | string | undefined,
    proficiencyBonus: string | undefined,
    recharge: string | undefined,
    level?: number,
): FeatureUsage | null {
    const max = Number(amount);
    if (Number.isFinite(max) && max > 0) {
        return { max, recharge: normalizeRecharge(recharge) };
    }
    const pbMax = resolvePbFraction(proficiencyBonus?.trim(), getProficiencyBonus(level ?? 1));
    if (pbMax > 0) {
        return { max: pbMax, recharge: normalizeRecharge(recharge) };
    }
    return null;
}

/**
 * The limited-use definition for a feature: an AddUses command on the feature wins,
 * falling back to metadata.uses/recharge. Null when the feature is not limited-use.
 */
export function featureUsage(feature: FeatureDetail, level?: number): FeatureUsage | null {
    const mads = (feature.metadata?.mads ?? []) as MadFeature[];
    const usesMad = mads.find(m => m.command === "AddUses");

    if (usesMad) {
        const fromMad = usageFromParts(
            usesMad.value?.['amount'], usesMad.value?.['proficiencyBonus'], usesMad.value?.['recharge'], level);
        if (fromMad) return fromMad;
    }

    const metaUses = Number(feature.metadata?.uses);
    if (Number.isFinite(metaUses) && metaUses > 0) {
        return { max: metaUses, recharge: normalizeRecharge(feature.metadata?.recharge) };
    }

    return null;
}

/**
 * The limited-use definition for a granted action: uses carried inline on the action win,
 * falling back to the granting feature's featureUsage (the SRD pairs a feature-level AddUses
 * with the action, linked by `source`). Null when the action is not limited-use.
 */
export function grantedActionUsage(
    action: GrantedAction,
    features: FeatureDetail[],
    level?: number,
): FeatureUsage | null {
    const inline = usageFromParts(action.uses, action.proficiencyBonus, action.recharge, level);
    if (inline) return inline;

    if (action.source) {
        const feat = features.find(f => f.name === action.source);
        if (feat) return featureUsage(feat, level);
    }

    return null;
}

/**
 * The featureUses pool a granted action spends from. An action with INLINE uses gets its own
 * prefixed pool — its max comes from the action, so sharing a counter with a like-named
 * limited-use feature (whose max may differ) would corrupt both trackers. A source-fallback
 * action shares its granting feature's pool, keeping the two trackers in sync.
 */
export const actionUsesKey = (action: GrantedAction): string =>
    (action.uses !== undefined || action.proficiencyBonus)
        ? `action:${action.name}`
        : (action.source || action.name);

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
