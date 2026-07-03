import { Character } from "../../../../models/character.model";
import { MadFeature } from "../madModels";
import { DebugConsole } from "../../DebugConsole";

const addAttacksFeature = (character: Character, feature: MadFeature): Character => {
    const amount = Number(feature.value?.['amount']);

    if (!Number.isFinite(amount)) {
        DebugConsole.error("Invalid or missing amount for AddAttacks command");
        return character;
    }

    character.attacksPerAction = (character.attacksPerAction ?? 1) + amount;

    return character;
}

const removeAttacksFeature = (character: Character, feature: MadFeature): Character => {
    const amount = Number(feature.value?.['amount']);

    if (!Number.isFinite(amount)) {
        DebugConsole.error("Invalid or missing amount for RemoveAttacks command");
        return character;
    }

    character.attacksPerAction = Math.max(1, (character.attacksPerAction ?? 1) - amount);

    return character;
}

export { addAttacksFeature, removeAttacksFeature };
