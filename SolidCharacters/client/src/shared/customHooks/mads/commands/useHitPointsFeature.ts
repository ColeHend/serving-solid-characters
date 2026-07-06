import { Character } from "../../../../models/character.model";
import { MadFeature } from "../madModels";
import { DebugConsole } from "../../DebugConsole";

/**
 * The hit-point-maximum delta a HitPoints command applies. perLevel = "true" scales the
 * amount by character level ("your hit point maximum increases by 1 every time you gain
 * a level"). levels.length is read directly because DB-revived characters are plain
 * objects without the Character.level getter; a level-less character counts as level 1.
 */
const hitPointDelta = (character: Character, feature: MadFeature): number | null => {
    const amount = +(feature.value?.["amount"] ?? "");
    if (isNaN(amount)) return null;

    const perLevel = feature.value?.["perLevel"]?.trim().toLowerCase() === "true";
    return perLevel ? amount * Math.max(character.levels?.length ?? 0, 1) : amount;
};

const addHitPointsFeature = (character: Character, feature: MadFeature): Character => {
    const delta = hitPointDelta(character, feature);

    if (delta === null) {
        DebugConsole.error("Invalid or missing amount for AddHitPoints command");
        return character;
    }

    character.health = character.health ?? { max: 0, current: 0, temp: 0 };
    character.health.max += delta;

    return character;
};

const removeHitPointsFeature = (character: Character, feature: MadFeature): Character => {
    const delta = hitPointDelta(character, feature);

    if (delta === null) {
        DebugConsole.error("Invalid or missing amount for RemoveHitPoints command");
        return character;
    }

    character.health = character.health ?? { max: 0, current: 0, temp: 0 };
    character.health.max = Math.max(0, character.health.max - delta);

    return character;
};

export { addHitPointsFeature, removeHitPointsFeature };
