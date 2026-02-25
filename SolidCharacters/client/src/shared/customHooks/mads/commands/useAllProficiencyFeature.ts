import { Character } from "../../../../models/character.model";
import { MadFeature } from "../madModels";

/**
 * requires an amount value in the feature.value object, which determines how the character's proficiencies will be increased by the proficiency level 
 * (half, full or what ever you decide proficiency). The function calculates the proficiency bonus based on the character's level and divides it by the provided amount to determine 
 * how much to increase each proficiency. It then updates all of the character's skill proficiencies accordingly.
 * 
 * @param character the character to apply the feature to.
 * @param feature the MadFeature.
 * @returns the updated character.
 */
const addAllProficiencyFeature = (character: Character, feature: MadFeature) => {
    const AmntToDevide = +feature.value?.['amount'];

    if (isNaN(AmntToDevide) || AmntToDevide <= 0) {
        console.error("Invalid amount provided for AddProficiencies command");
        return character;
    }

    const CharacterLevel = character.level;
    const allSkills = Object.keys(character.proficiencies.skills);
    const proficiencyBonus = getProficiencyBonus(CharacterLevel);
    const proficiencyIncrease = Math.ceil(proficiencyBonus / AmntToDevide); 

    allSkills.forEach(skill => {

        character.proficiencies.skills[skill].value += proficiencyIncrease;
    });
 
    return character;
}

const removeAllProficiencyFeature = (character: Character, feature: MadFeature) => {
    const AmntToDevide = +feature.value?.['amount'];
    
    if (isNaN(AmntToDevide) || AmntToDevide <= 0) {
        console.error("Invalid amount provided for RemoveProficiencies command");
        return character;
    }

    const CharacterLevel = character.level;
    const allSkills = Object.keys(character.proficiencies.skills);
    const proficiencyBonus = getProficiencyBonus(CharacterLevel);
    const proficiencyDecrease = Math.ceil(proficiencyBonus / AmntToDevide);

    allSkills.forEach(skill => {
        character.proficiencies.skills[skill].value -= proficiencyDecrease;
        
        if (character.proficiencies.skills[skill].value < 0) {
            character.proficiencies.skills[skill].value = 0; // Ensure proficiency doesn't go below 0
        }
    });
 
    return character;
}

function getProficiencyBonus(level: number): number {
    return Math.ceil(level / 4) + 1;
}

function useAllProficiencyFeature (character: Character ): Character | undefined {
    
    if (!character) {
        console.error(`Character couldn't be found!`);
        return;
    }
    
    character.features.forEach(feature => {
        let mads = feature?.metadata?.mads;
        if (mads && mads.command === "AddAllProficiencies") {
            character = addAllProficiencyFeature(character as any, mads);
        } else if (mads && mads.command === "RemoveAllProficiencies") {
            character = removeAllProficiencyFeature(character as any, mads);
        }
    });
    
    return character;
}

export default useAllProficiencyFeature;
export { addAllProficiencyFeature, removeAllProficiencyFeature }