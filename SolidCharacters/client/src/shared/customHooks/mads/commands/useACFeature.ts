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

export { addACFeature, removeACFeature };