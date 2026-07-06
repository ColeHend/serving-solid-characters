import { Character } from "../../../../models/character.model";
import { MadFeature, MadType } from "../madModels";
import { DebugConsole } from "../../DebugConsole";

const addSpeedFeature = (character: Character, feature: MadFeature): Character => {
    const speedValue = +(feature.value?.['speed'] ?? "");
    const mode = feature.value?.['mode']?.trim().toLowerCase() ?? "increase";

    if (isNaN(speedValue)) {
        DebugConsole.error("Invalid or missing speed value for AddSpeed command");
        return character;
    }

    // "your walking speed becomes N" → set; the default increases it
    if (mode === "set") {
        character.Speed = speedValue;
    } else {
        character.Speed += speedValue;
    }

    return character;
}

const removeSpeedFeature = (character: Character, feature: MadFeature): Character => {
    const speedValue = +(feature.value?.['speed'] ?? "");
    const mode = feature.value?.['mode']?.trim().toLowerCase() ?? "increase";

    if (isNaN(speedValue)) {
        DebugConsole.error("Invalid or missing speed value for RemoveSpeed command");
        return character;
    }

    // a "set" can't be meaningfully subtracted — revoking one is out of scope for Remove
    if (mode === "set") {
        DebugConsole.warn("RemoveSpeed with mode=set is not supported. Skipping.");
        return character;
    }

    character.Speed -= speedValue;

    return character;
}

function useSpeedFeature (character: Character) {
    
    if (!character) {
        DebugConsole.error("No character was found!");
        return;
    }

    character.features.forEach(feature => {
        const MadFeature = feature.metadata?.mads as MadFeature[];

        MadFeature.forEach(mads => {
            if (mads.type === MadType.Character) {
                switch (mads.command) {
                    case "AddSpeed":
                        character = addSpeedFeature(character, mads);
                        break;
    
                    case "RemoveSpeed":
                        character = removeSpeedFeature(character, mads);
                        break;
                }
            }

        })
    })

    return character;
}

export default useSpeedFeature;
export {addSpeedFeature, removeSpeedFeature};