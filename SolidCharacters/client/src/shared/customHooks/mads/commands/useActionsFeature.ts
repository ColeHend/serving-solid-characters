import { ActionType, Character, GrantedAction, PbFraction } from "../../../../models/character.model";
import { MadFeature } from "../madModels";
import { DebugConsole } from "../../DebugConsole";
import { PB_FRACTIONS } from "./pbFraction";
import { normalizeRecharge } from "./useUsesFeature";

const ACTION_TYPES: readonly ActionType[] = ["action", "bonusAction", "reaction"];

const parseAction = (feature: MadFeature): GrantedAction | null => {
    const name = feature.value?.['name']?.trim() ?? "";
    const actionType = feature.value?.['actionType']?.trim() as ActionType;

    if (!name || !ACTION_TYPES.includes(actionType)) {
        return null;
    }

    const description = feature.value?.['description']?.trim();
    const source = feature.value?.['source']?.trim();

    const entry: GrantedAction = {
        name,
        actionType,
        description: description || undefined,
        source: source || undefined,
    };

    // Inline limited-use spec: a fixed amount wins over a PB fraction; a recharge
    // without either is meaningless and is dropped with the rest of the spec.
    const amount = Number(feature.value?.['amount']);
    const pbFraction = feature.value?.['proficiencyBonus']?.trim() as PbFraction;
    if (Number.isFinite(amount) && amount > 0) {
        entry.uses = amount;
    } else if (PB_FRACTIONS.includes(pbFraction)) {
        entry.proficiencyBonus = pbFraction;
    }
    if (entry.uses !== undefined || entry.proficiencyBonus) {
        entry.recharge = normalizeRecharge(feature.value?.['recharge']);
    }

    return entry;
}

const sameAction = (a: GrantedAction, b: GrantedAction): boolean =>
    a.name.toLowerCase() === b.name.toLowerCase() &&
    a.actionType === b.actionType;

const addActionsFeature = (character: Character, feature: MadFeature): Character => {
    const entry = parseAction(feature);

    if (!entry) {
        DebugConsole.error("Invalid or missing name/actionType for AddActions command");
        return character;
    }

    // old DB rows predate this field
    character.grantedActions = character.grantedActions ?? [];

    if (character.grantedActions.some(a => sameAction(a, entry))) {
        return character;
    }

    character.grantedActions.push(entry);

    return character;
}

const removeActionsFeature = (character: Character, feature: MadFeature): Character => {
    const entry = parseAction(feature);

    if (!entry) {
        DebugConsole.error("Invalid or missing name/actionType for RemoveActions command");
        return character;
    }

    character.grantedActions = (character.grantedActions ?? []).filter(a => !sameAction(a, entry));

    return character;
}

export { addActionsFeature, removeActionsFeature, parseAction };
