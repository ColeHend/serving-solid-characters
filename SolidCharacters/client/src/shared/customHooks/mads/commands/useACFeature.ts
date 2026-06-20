import { Character } from "../../../../models/character.model";
import { MadFeature } from "../madModels";
import { DebugConsole } from "../../DebugConsole";

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
        DebugConsole.error(`Character couldn't be found!`);
        return;
    }

    character.features.forEach(feature => {
        const mads = (feature?.metadata?.mads ?? []) as MadFeature[];

        for (const mad of mads) {
            if (mad.command === "AddArmorClass" && mad.value['bonus']) {
                character = addACFeature(character, mad);
            } else if (mad.command === "RemoveArmorClass" && mad.value['bonus']) {
                character = removeACFeature(character, mad);
            }
        }

    });
    
    return character;
}

export default useACFeature;
export { addACFeature, removeACFeature };