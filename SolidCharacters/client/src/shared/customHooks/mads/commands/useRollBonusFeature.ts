import { AdvantageRollType, Character, PbFraction, RollBonus } from "../../../../models/character.model";
import { MadFeature } from "../madModels";
import { DebugConsole } from "../../DebugConsole";

const ROLL_TYPES: readonly AdvantageRollType[] = ["SavingThrow", "WeaponAttack", "SpellAttack", "Initiative", "AbilityCheck"];
const PB_FRACTIONS: readonly PbFraction[] = ["Third PB", "Half PB", "Full PB"];
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

    // a bonus with neither a flat value nor a PB fraction has nothing to grant
    if (bonus === undefined && !proficiencyBonus) {
        return null;
    }

    const stat = feature.value?.['stat']?.trim().toLowerCase();
    const condition = feature.value?.['condition']?.trim();

    return {
        rollType,
        bonus,
        proficiencyBonus,
        stat: stat && STAT_KEYS.includes(stat) ? (stat as RollBonus["stat"]) : undefined,
        condition: condition || undefined,
    };
}

const sameRollBonus = (a: RollBonus, b: RollBonus): boolean =>
    a.rollType === b.rollType &&
    (a.bonus ?? 0) === (b.bonus ?? 0) &&
    (a.proficiencyBonus ?? "") === (b.proficiencyBonus ?? "") &&
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
          (!entry.stat || b.stat === entry.stat) &&
          (!entry.condition || (b.condition ?? "").toLowerCase() === entry.condition.toLowerCase())));

    return character;
}

/**
 * The concrete modifier a RollBonus grants, resolving PB fractions against the character's
 * proficiency bonus (D&D rounds down). A fixed bonus wins when both are present.
 */
const rollBonusAmount = (bonus: RollBonus, proficiencyBonus: number): number => {
    if (bonus.bonus !== undefined) return bonus.bonus;
    switch (bonus.proficiencyBonus) {
        case "Full PB": return proficiencyBonus;
        case "Half PB": return Math.floor(proficiencyBonus / 2);
        case "Third PB": return Math.floor(proficiencyBonus / 3);
        default: return 0;
    }
}

export { addRollBonusFeature, removeRollBonusFeature, parseRollBonus, rollBonusAmount };
