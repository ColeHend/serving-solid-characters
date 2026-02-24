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

export {addSpeedFeature, removeSpeedFeature};