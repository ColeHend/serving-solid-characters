import { ActionType, Character, GrantedAction } from "../../../../models/character.model";
import { MadFeature } from "../madModels";
import { DebugConsole } from "../../DebugConsole";

const ACTION_TYPES: readonly ActionType[] = ["action", "bonusAction", "reaction"];

const parseAction = (feature: MadFeature): GrantedAction | null => {
    const name = feature.value?.['name']?.trim() ?? "";
    const actionType = feature.value?.['actionType']?.trim() as ActionType;

    if (!name || !ACTION_TYPES.includes(actionType)) {
        return null;
    }

    const description = feature.value?.['description']?.trim();
    const source = feature.value?.['source']?.trim();

    return {
        name,
        actionType,
        description: description || undefined,
        source: source || undefined,
    };
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
