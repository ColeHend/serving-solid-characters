import { Character } from "../../../../models/character.model";
import { MadFeature } from "../madModels";
import { DebugConsole } from "../../DebugConsole";

const addProficienciesFeature = (character: Character, feature: MadFeature) => {
    const newProficiencies = feature.value['proficiencies']?.split(',').map(p => p.trim()) || [];

    if (newProficiencies.length === 0) {
        DebugConsole.error("No proficiencies provided for AddProficiencies command");
        
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
        DebugConsole.error("No proficiencies provided for RemoveProficiencies command");
        
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

function useProficienciesFeature (character: Character) {

    if (!character) {
        DebugConsole.error("No character provided to useProficienciesFeature");
        return;
    }

    character.features.forEach(feature => {
        const mads = feature.metadata?.mads ?? [];

        for (const mad of mads as MadFeature[]) {
            if (mad.command === 'AddProficiencies') {
                character = addProficienciesFeature(character, mad);
            } else if (mad.command === 'RemoveProficiencies') {
                character = RemoveProficienciesFeature(character, mad);
            }
        }
    });

    return character;
};

export default useProficienciesFeature;
export { addProficienciesFeature, RemoveProficienciesFeature };