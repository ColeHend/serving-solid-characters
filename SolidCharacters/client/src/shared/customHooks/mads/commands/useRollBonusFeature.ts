import { AdvantageRollType, Character, PbFraction, RollBonus } from "../../../../models/character.model";
import { Stats } from "../../dndInfo/useCharacters";
import { getAbilityModifier } from "../../utility/tools/dndMath";
import { MadFeature } from "../madModels";
import { DebugConsole } from "../../DebugConsole";
import { PB_FRACTIONS, resolvePbFraction } from "./pbFraction";

const ROLL_TYPES: readonly AdvantageRollType[] = ["SavingThrow", "WeaponAttack", "SpellAttack", "Initiative", "AbilityCheck"];
const STAT_KEYS = ["str", "dex", "con", "int", "wis", "cha"];

const parseRollBonus = (feature: MadFeature): RollBonus | null => {
    const rollType = feature.value?.['rollType']?.trim() as AdvantageRollType;

    if (!ROLL_TYPES.includes(rollType)) {
        return null;
    }

    const rawBonus = feature.value?.['bonus']?.trim() ?? "";
    const bonus = rawBonus !== "" && !isNaN(Number(rawBonus)) ? Number(rawBonus) : undefined;

    const rawPb = feature.value?.['proficiencyBonus']?.trim();
    const proficiencyBonus = PB_FRACTIONS.includes(rawPb as PbFraction) ? (rawPb as PbFraction) : undefined;

    const rawStatBonus = feature.value?.['statBonus']?.trim().toLowerCase();
    const statBonus = rawStatBonus && STAT_KEYS.includes(rawStatBonus) ? (rawStatBonus as RollBonus["statBonus"]) : undefined;

    // a bonus with no flat value, PB fraction, or ability modifier has nothing to grant
    if (bonus === undefined && !proficiencyBonus && !statBonus) {
        return null;
    }

    const stat = feature.value?.['stat']?.trim().toLowerCase();
    const condition = feature.value?.['condition']?.trim();

    return {
        rollType,
        bonus,
        proficiencyBonus,
        statBonus,
        stat: stat && STAT_KEYS.includes(stat) ? (stat as RollBonus["stat"]) : undefined,
        condition: condition || undefined,
    };
}

const sameRollBonus = (a: RollBonus, b: RollBonus): boolean =>
    a.rollType === b.rollType &&
    (a.bonus ?? 0) === (b.bonus ?? 0) &&
    (a.proficiencyBonus ?? "") === (b.proficiencyBonus ?? "") &&
    (a.statBonus ?? "") === (b.statBonus ?? "") &&
    (a.stat ?? "") === (b.stat ?? "") &&
    (a.condition ?? "").toLowerCase() === (b.condition ?? "").toLowerCase();

const addRollBonusFeature = (character: Character, feature: MadFeature): Character => {
    const entry = parseRollBonus(feature);

    if (!entry) {
        DebugConsole.error("Invalid or missing rollType/bonus for AddRollBonus command");
        return character;
    }

    // old DB rows predate this field
    character.rollBonuses = character.rollBonuses ?? [];

    if (character.rollBonuses.some(b => sameRollBonus(b, entry))) {
        return character;
    }

    character.rollBonuses.push(entry);

    return character;
}

const removeRollBonusFeature = (character: Character, feature: MadFeature): Character => {
    const entry = parseRollBonus(feature);

    if (!entry) {
        DebugConsole.error("Invalid or missing rollType/bonus for RemoveRollBonus command");
        return character;
    }

    // stat/condition narrow the match only when provided
    character.rollBonuses = (character.rollBonuses ?? []).filter(b =>
        !(b.rollType === entry.rollType &&
          (b.bonus ?? 0) === (entry.bonus ?? 0) &&
          (b.proficiencyBonus ?? "") === (entry.proficiencyBonus ?? "") &&
          (b.statBonus ?? "") === (entry.statBonus ?? "") &&
          (!entry.stat || b.stat === entry.stat) &&
          (!entry.condition || (b.condition ?? "").toLowerCase() === entry.condition.toLowerCase())));

    return character;
}

/**
 * The concrete modifier a RollBonus grants, resolving PB fractions against the character's
 * proficiency bonus (D&D rounds down). A fixed bonus wins over a PB fraction when both are
 * present; a statBonus ability's modifier (resolved against `stats`) is ADDED on top.
 */
const rollBonusAmount = (bonus: RollBonus, proficiencyBonus: number, stats?: Stats): number => {
    const base = bonus.bonus !== undefined ? bonus.bonus : resolvePbFraction(bonus.proficiencyBonus, proficiencyBonus);
    const statMod = bonus.statBonus && stats ? getAbilityModifier(stats[bonus.statBonus] ?? 10) : 0;
    return base + statMod;
}

export { addRollBonusFeature, removeRollBonusFeature, parseRollBonus, rollBonusAmount };
