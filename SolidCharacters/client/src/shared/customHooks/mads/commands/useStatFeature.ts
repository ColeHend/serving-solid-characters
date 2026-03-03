import { Character } from "../../../../models/character.model";
import { MadFeature } from "../madModels";
import { DebugConsole } from "../../DebugConsole";

const addStatFeature = (character: Character, feature: MadFeature) => {
    const statName = feature.value?.["stat"]?.trim() ?? "";
    const statValue = +feature.value?.["statValue"];

    if (!statName) {
        DebugConsole.error("No stat name provided for AddStats command");
        return character;
    }

    if (isNaN(statValue)) {
        DebugConsole.error("Invalid stat value provided for AddStats command");
        return character;
    }

    if (character.stats?.[statName as keyof Character["stats"]] !== undefined) {
        character.stats[statName as keyof Character["stats"]] += statValue;

        return character;
    } else {
        DebugConsole.warn(`Stat ${statName} does not exist on character. Skipping AddStats command.`);
        return character;
    }
    
}

const removeStatFeature = (character: Character, feature: MadFeature) => {
    const statName = feature.value?.["stat"]?.trim() ?? "";
    const statValue = +feature.value?.["statValue"];

    if (!statName) {
        DebugConsole.error("No stat name provided for RemoveStats command");
        return character;
    }

    if (isNaN(statValue)) {
        DebugConsole.error("Invalid stat value provided for RemoveStats command");
        return character;
    }

    if (character.stats?.[statName as keyof Character["stats"]] !== undefined) {
        character.stats[statName as keyof Character["stats"]] -= statValue;

        return character;
    } else {
        DebugConsole.warn(`Stat ${statName} does not exist on character. Skipping RemoveStats command.`);
        return character;
    }
}

function useStatFeature(character: Character) {

    if (!character) {
        DebugConsole.error("No character was found");
        return;
    }

    character.features.forEach(feature => {
        const MadFeature = feature.metadata?.mads as MadFeature;

        switch (MadFeature?.command) {
            case "AddStats":
                character = addStatFeature(character, MadFeature);
                break;

            case "RemoveStats":
                character = removeStatFeature(character, MadFeature);
                break;
        }
    })

    return character;
} 

export default useStatFeature;
export { addStatFeature, removeStatFeature };