import { Character } from "../../../../models/character.model";
import { MadFeature } from "../madModels";

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
        console.error("No character was found!");
        return;
    }

    character.features.forEach(feature => {
        const MadFeature = feature.metadata?.mads;

        if (MadFeature) {
            switch (MadFeature.command) {
                case "AddSpeed":
                    character = addSpeedFeature(character, MadFeature);
                    break;

                case "RemoveSpeed":
                    character = removeSpeedFeature(character, MadFeature);
                    break;
            }
        }
    })

    return character;
}

export default useSpeedFeature;
export {addSpeedFeature, removeSpeedFeature};