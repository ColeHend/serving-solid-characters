import { Character } from "../../../../models/character.model";
import { MadFeature } from "../madModels";
import { DebugConsole } from "../../DebugConsole";

const getProficencyBonus = (level: number) => {
    return Math.ceil(level/ 4) + 1;
}

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
    const skillstring = feature.value?.['allProficiencies'];
    const proficiencyBounsChoice = feature.value?.["proficiencyBonusChoice"];
   
    const skillsToChange = skillstring.split(",").map(s => s.trim());
    
    let bonus: number;

    switch (proficiencyBounsChoice) {
        case "Third PB":
            bonus = getProficencyBonus(character.level)/3;
            break;

        case "Half PB":
            bonus = getProficencyBonus(character.level)/2;
            break;

        case "Full PB":
            bonus = getProficencyBonus(character.level);
            break;
    }

    skillsToChange.reduce((updatedCharacter, skill) => {
        updatedCharacter.proficiencies.skills[skill].value += bonus;

        return updatedCharacter;
    }, character)

    // const skillsToAdd = JSON.parse(jsonString) as Record<string, number>;

    // const skillNames = Object.keys(skillsToAdd);

    // skillNames.forEach(skill => {
    //     const proficiencyLevel = skillsToAdd[skill];

    //     if (character.proficiencies.skills[skill]) {
    //         character.proficiencies.skills[skill].value += proficiencyLevel;
    //     }
    // });
 
    return character;
}

const removeAllProficiencyFeature = (character: Character, feature: MadFeature) => {
    const jsonString = feature.value?.['allProficiencies'];
   
    const skillsToAdd = JSON.parse(jsonString) as Record<string, number>;

    const skillNames = Object.keys(skillsToAdd);

    skillNames.forEach(skill => {
        const proficiencyLevel = skillsToAdd[skill];

        if (character.proficiencies.skills[skill]) {
            character.proficiencies.skills[skill].value -= proficiencyLevel;
        }
    });
 
    return character;
}

function useAllProficiencyFeature (character: Character ): Character | undefined {
    
    if (!character) {
        DebugConsole.error(`Character couldn't be found!`);
        return;
    }
    
    character.features.forEach(feature => {
        const mads = feature?.metadata?.mads as MadFeature[];

        mads.reduce((updatedCharacter, mads) => {
            switch (mads.command) {
                case "AddAllProficiencies":
                    updatedCharacter = addAllProficiencyFeature(updatedCharacter, mads);
                    break;
                case "RemoveAllProficiencies":
                    updatedCharacter = removeAllProficiencyFeature(updatedCharacter, mads);
                    break;
            }

            return updatedCharacter;
        }, character);
    });
    
    return character;
}

export default useAllProficiencyFeature;
export { addAllProficiencyFeature, removeAllProficiencyFeature }