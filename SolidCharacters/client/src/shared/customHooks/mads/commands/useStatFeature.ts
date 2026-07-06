import { Character } from "../../../../models/character.model";
import { MadFeature } from "../madModels";
import { DebugConsole } from "../../DebugConsole";

const addStatFeature = (character: Character, feature: MadFeature) => {
    const statName = feature.value?.["stat"]?.trim() ?? "";
    const statValue = +feature.value?.["statValue"];
    const mode = feature.value?.["mode"]?.trim() ?? "increase";

    if (!statName) {
        DebugConsole.error("No stat name provided for AddStats command");
        return character;
    }

    // choice-form commands are resolved to a concrete stat in collectMadFeatures;
    // an unresolved one reaching here means the player hasn't picked yet — do nothing.
    if (statName === "choice") {
        DebugConsole.warn("Unresolved choice-form AddStats reached the handler. Skipping.");
        return character;
    }

    if (isNaN(statValue)) {
        DebugConsole.error("Invalid stat value provided for AddStats command");
        return character;
    }

    if (character.stats?.[statName as keyof Character["stats"]] !== undefined) {
        if (mode === "set") {
            character.stats[statName as keyof Character["stats"]] = statValue;
        } else {
            character.stats[statName as keyof Character["stats"]] += statValue;
        }

        return character;
    } else {
        DebugConsole.warn(`Stat ${statName} does not exist on character. Skipping AddStats command.`);
        return character;
    }

}

const removeStatFeature = (character: Character, feature: MadFeature) => {
    const statName = feature.value?.["stat"]?.trim() ?? "";
    const statValue = +feature.value?.["statValue"];
    const mode = feature.value?.["mode"]?.trim() ?? "increase";

    if (!statName) {
        DebugConsole.error("No stat name provided for RemoveStats command");
        return character;
    }

    if (statName === "choice") {
        DebugConsole.warn("Unresolved choice-form RemoveStats reached the handler. Skipping.");
        return character;
    }

    // a "set" can't be meaningfully subtracted — revoking one is out of scope for Remove
    if (mode === "set") {
        DebugConsole.warn("RemoveStats with mode=set is not supported. Skipping.");
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
        const MadFeatures = feature.metadata?.mads as MadFeature[];

        MadFeatures.reduce((updatedCharacter, MadFeature) => {
            switch (MadFeature?.command) {
                case "AddStats":
                    character = addStatFeature(character, MadFeature);
                    break;
    
                case "RemoveStats":
                    character = removeStatFeature(character, MadFeature);
                    break;
            }

            return updatedCharacter;
        }, character)

    })

    return character;
} 

export default useStatFeature;
export { addStatFeature, removeStatFeature };