import { Character } from "../../../../models/character.model";
import { MadFeature } from "../madModels";
import { DebugConsole } from "../../DebugConsole";

const addSpeedFeature = (character: Character, feature: MadFeature): Character => {
    const speedIncrease = feature.value?.['speed'];

    character.ArmorClass += +speedIncrease;

    return character;
}

const removeSpeedFeature = (character: Character, feature: MadFeature): Character => {
    const speedIncrease = feature.value?.['speed'];

    character.ArmorClass -= +speedIncrease;

    return character;
}

function useSpeedFeature (character: Character) {
    
    if (!character) {
        DebugConsole.error("No character was found!");
        return;
    }

    character.features.forEach(feature => {
        const mads = feature.metadata?.mads ?? [];

        for (const mad of mads) {
            switch (mad.command) {
                case "AddSpeed":
                    character = addSpeedFeature(character, mad as MadFeature);
                    break;

                case "RemoveSpeed":
                    character = removeSpeedFeature(character, mad as MadFeature);
                    break;
            }
        }
    })

    return character;
}

export default useSpeedFeature;
export {addSpeedFeature, removeSpeedFeature};