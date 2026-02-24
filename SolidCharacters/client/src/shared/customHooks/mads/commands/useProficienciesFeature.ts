import { C } from "@vite-pwa/assets-generator/shared/assets-generator.DnoqiTld";
import { Character } from "../../../../models/character.model";
import { MadFeature } from "../madModels";

const addProficienciesFeature = (character: Character, feature: MadFeature) => {
    const newProficiencies = feature.value['proficiencies']?.split(',').map(p => p.trim()) || [];

    if (newProficiencies.length === 0) {
        console.error("No proficiencies provided for AddProficiencies command");
        
        return character;
    }

    newProficiencies.forEach(proficiency => {

        if (proficiency ) {
            const old = character.proficiencies.skills[`${proficiency}`];
       
            character.proficiencies.skills[`${proficiency}`] = {
                stat: old.stat,
                value: old.value,
                proficient: true,
                expertise: old.expertise,
            }
        }

    });

    return character;
}

const RemoveProficienciesFeature = (character: Character, feature: MadFeature) => {
    const newProficiencies = feature.value['proficiencies']?.split(',').map(p => p.trim()) || [];

    if (newProficiencies.length === 0) {
        console.error("No proficiencies provided for RemoveProficiencies command");
        
        return character;
    }

    newProficiencies.forEach(proficiency => {

        if (proficiency ) {
            const old = character.proficiencies.skills[`${proficiency}`];
       
            character.proficiencies.skills[`${proficiency}`] = {
                stat: old.stat,
                value: old.value,
                proficient: false,
                expertise: old.expertise,
            }
        }

    });

    return character;
}

export { addProficienciesFeature, RemoveProficienciesFeature };