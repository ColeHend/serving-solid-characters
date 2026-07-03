import { AdvantageMode, AdvantageRollType, Character, RollAdvantage } from "../../../../models/character.model";
import { MadFeature } from "../madModels";
import { DebugConsole } from "../../DebugConsole";

const ROLL_TYPES: readonly AdvantageRollType[] = ["SavingThrow", "WeaponAttack", "SpellAttack", "Initiative", "AbilityCheck"];
const MODES: readonly AdvantageMode[] = ["advantage", "disadvantage"];
const STAT_KEYS = ["str", "dex", "con", "int", "wis", "cha"];

const parseRollAdvantage = (feature: MadFeature): RollAdvantage | null => {
    const rollType = feature.value?.['rollType']?.trim() as AdvantageRollType;
    const mode = feature.value?.['mode']?.trim().toLowerCase() as AdvantageMode;

    if (!ROLL_TYPES.includes(rollType) || !MODES.includes(mode)) {
        return null;
    }

    const stat = feature.value?.['stat']?.trim().toLowerCase();
    const condition = feature.value?.['condition']?.trim();

    return {
        rollType,
        mode,
        stat: stat && STAT_KEYS.includes(stat) ? (stat as RollAdvantage["stat"]) : undefined,
        condition: condition || undefined,
    };
}

const sameAdvantage = (a: RollAdvantage, b: RollAdvantage): boolean =>
    a.rollType === b.rollType &&
    a.mode === b.mode &&
    (a.stat ?? "") === (b.stat ?? "") &&
    (a.condition ?? "").toLowerCase() === (b.condition ?? "").toLowerCase();

const addAdvantageFeature = (character: Character, feature: MadFeature): Character => {
    const entry = parseRollAdvantage(feature);

    if (!entry) {
        DebugConsole.error("Invalid or missing rollType/mode for AddAdvantage command");
        return character;
    }

    // old DB rows predate this field
    character.rollAdvantages = character.rollAdvantages ?? [];

    if (character.rollAdvantages.some(a => sameAdvantage(a, entry))) {
        return character;
    }

    character.rollAdvantages.push(entry);

    return character;
}

const removeAdvantageFeature = (character: Character, feature: MadFeature): Character => {
    const entry = parseRollAdvantage(feature);

    if (!entry) {
        DebugConsole.error("Invalid or missing rollType/mode for RemoveAdvantage command");
        return character;
    }

    // stat/condition narrow the match only when provided
    character.rollAdvantages = (character.rollAdvantages ?? []).filter(a =>
        !(a.rollType === entry.rollType &&
          a.mode === entry.mode &&
          (!entry.stat || a.stat === entry.stat) &&
          (!entry.condition || (a.condition ?? "").toLowerCase() === entry.condition.toLowerCase())));

    return character;
}

export { addAdvantageFeature, removeAdvantageFeature };
