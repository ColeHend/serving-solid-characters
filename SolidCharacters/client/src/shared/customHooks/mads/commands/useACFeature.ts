import { Character } from "../../../../models/character.model";
import { MadFeature } from "../madModels";

const addACFeature = (character: Character, feature: MadFeature): Character => {
    const acBonus = feature.value?.['bonus'] ?? '';

    if (acBonus) {
        character.ArmorClass += +acBonus;
    }

    return character;
}

const removeACFeature = (character: Character, feature: MadFeature): Character => {
    const acBonus = feature.value?.['bonus'] ?? '';
    
    if (acBonus) {
        character.ArmorClass -= +acBonus;
    }

    return character;
}

function useACFeature (character: Character): Character | undefined {

    if (!character) {
        console.error(`Character couldn't be found!`);
        return;
    }

    character.features.forEach(feature => {
        let mads = feature?.metadata?.mads;

        if (mads && mads.command === "AddArmorClass" && mads.value['bonus']) {
            character = addACFeature(character as any, mads);
        } else if (mads && mads.command === "RemoveArmorClass" && mads.value['bonus']) {
            character = removeACFeature(character as any, mads);
        }

    });
    
    return character;
}

export default useACFeature;
export { addACFeature, removeACFeature };