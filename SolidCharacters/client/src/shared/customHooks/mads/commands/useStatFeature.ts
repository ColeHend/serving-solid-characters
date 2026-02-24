import { Character } from "../../../../models/character.model";
import { MadFeature } from "../madModels";

const addStatFeature = (character: Character, feature: MadFeature) => {
    const statName = feature.value?.["stat"]?.trim() ?? "";
    const statValue = +feature.value?.["statValue"];

    if (!statName) {
        console.error("No stat name provided for AddStats command");
        return character;
    }

    if (isNaN(statValue)) {
        console.error("Invalid stat value provided for AddStats command");
        return character;
    }

    if (character.stats?.[statName as keyof Character["stats"]] !== undefined) {
        character.stats[statName as keyof Character["stats"]] += statValue;

        return character;
    } else {
        console.warn(`Stat ${statName} does not exist on character. Skipping AddStats command.`);
        return character;
    }
    
}

const removeStatFeature = (character: Character, feature: MadFeature) => {
    const statName = feature.value?.["stat"]?.trim() ?? "";
    const statValue = +feature.value?.["statValue"];

    if (!statName) {
        console.error("No stat name provided for RemoveStats command");
        return character;
    }

    if (isNaN(statValue)) {
        console.error("Invalid stat value provided for RemoveStats command");
        return character;
    }

    if (character.stats?.[statName as keyof Character["stats"]] !== undefined) {
        character.stats[statName as keyof Character["stats"]] -= statValue;

        return character;
    } else {
        console.warn(`Stat ${statName} does not exist on character. Skipping RemoveStats command.`);
        return character;
    }
}

export { addStatFeature, removeStatFeature };