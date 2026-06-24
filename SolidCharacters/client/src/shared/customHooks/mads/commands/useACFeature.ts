import { Character } from "../../../../models/character.model";
import { MadFeature } from "../madModels";
import { DebugConsole } from "../../DebugConsole";
import { Stats } from "../../dndInfo/useCharacters";

const addACFeature = (character: Character, feature: MadFeature): Character => {
    const acBonus = feature.value?.['bonus'] ?? '';
    const stats = feature.value?.['stats'].split(',') ?? [];

    let totalBonus = 0;

    if (acBonus) {
        totalBonus += +acBonus;

        const statValues = stats.flatMap(stat => character.stats[stat as keyof Stats])
        
        statValues.forEach(value => {
            const bonus = Math.floor((value - 10)/2);

            totalBonus += bonus;
        })
    }
    
    character.ArmorClass += totalBonus;
    
    return character;
}

const removeACFeature = (character: Character, feature: MadFeature): Character => {
    const acBonus = feature.value?.['bonus'] ?? '';
    const stats = feature.value?.['stats'].split(',') ?? [];

    let totalBonus = 0;

    if (acBonus) {
        totalBonus += +acBonus;

        const statValues = stats.flatMap(stat => character.stats[stat as keyof Stats])
        
        statValues.forEach(value => {
            const bonus = Math.floor((value - 10)/2);

            totalBonus += bonus;
        })
    }

    character.ArmorClass -= totalBonus;

    return character;
}

function useACFeature (character: Character): Character | undefined {

    if (!character) {
        DebugConsole.error(`Character couldn't be found!`);
        return;
    }

    character.features.forEach(feature => {
        const madsArr = feature?.metadata?.mads as MadFeature[];

        madsArr.forEach((mads) => {
            if (mads && mads.command === "AddArmorClass" && mads.value['bonus']) {
                character = addACFeature(character, mads);
            } else if (mads && mads.command === "RemoveArmorClass" && mads.value['bonus']) {
                character = removeACFeature(character, mads);
            }
        })


    });
    
    return character;
}

export default useACFeature;
export { addACFeature, removeACFeature };