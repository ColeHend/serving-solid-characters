import { Character } from "../../../../models/character.model";
import { MadFeature } from "../madModels";
import { DebugConsole } from "../../DebugConsole";
import { resolvePbFraction } from "./pbFraction";

const getProficencyBonus = (level: number) => {
    return Math.ceil(level/ 4) + 1;
}

const updateCharacter = (skillstring: string, proficiencyBounsChoice: string, opperator: "+"|"-", character: Character) => {
    const skillsToChange = skillstring.split(",").map(s => s.trim());

    // resolvePbFraction floors (D&D rounds down) and resolves unknown fractions to 0 —
    // Half PB at level 5 grants +1, never a fractional +1.5 on the sheet.
    const bonus = resolvePbFraction(proficiencyBounsChoice, getProficencyBonus(character.level));
    const signedBonus = opperator === "+" ? bonus : -bonus;

    return skillsToChange.reduce((updatedCharacter, skill) => {
        const entry = updatedCharacter.proficiencies.skills[skill];
        if (!entry) {
            DebugConsole.warn(`AllProficiencies: character has no skill entry for "${skill}"`);
            return updatedCharacter;
        }
        entry.value += signedBonus;
        return updatedCharacter;
    }, character);
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
   
    return updateCharacter(skillstring, proficiencyBounsChoice, "+", character);
}

const removeAllProficiencyFeature = (character: Character, feature: MadFeature) => {
    const skillstring = feature.value?.['allProficiencies'];
    const proficiencyBounsChoice = feature.value?.["proficiencyBonusChoice"];

    return updateCharacter(skillstring, proficiencyBounsChoice, "-", character);
}

function useAllProficiencyFeature (character: Character ): Character | undefined {
    
    if (!character) {
        DebugConsole.error(`Character couldn't be found!`);
        return;
    }
    
    const updated = character.features.reduce((updatedChar,feature) => {
        const mads = feature?.metadata?.mads as MadFeature[];

        return mads.reduce((updatedCharacter, mads) => {
            switch (mads.command) {
                case "AddAllProficiencies":
                    updatedCharacter = addAllProficiencyFeature(updatedCharacter, mads);
                    break;
                case "RemoveAllProficiencies":
                    updatedCharacter = removeAllProficiencyFeature(updatedCharacter, mads);
                    break;
            }

            return updatedCharacter;
        }, updatedChar);
    }, character);
    
    return updated;
}

export default useAllProficiencyFeature;
export { addAllProficiencyFeature, removeAllProficiencyFeature }