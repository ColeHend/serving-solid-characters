import { Character } from "../../../../models/character.model";
import { MadFeature } from "../madModels";
import { DebugConsole } from "../../DebugConsole";

const addProficienciesFeature = (character: Character, feature: MadFeature) => {
    const newProficiency = feature.value['proficiency'];

    if (newProficiency === "") {
        DebugConsole.error("No proficiency provided for AddProficiencies command");

        return character;
    }

    // choice-form commands are resolved to concrete skills in collectMadFeatures; an
    // unresolved "choice" must never index the skills record (there is no such skill)
    if (newProficiency === "choice") {
        DebugConsole.warn("Unresolved choice-form AddProficiencies reached the handler; skipping");

        return character;
    }

    const old = character.proficiencies.skills[`${newProficiency}`];

    character.proficiencies.skills[`${newProficiency}`] = {
        stat: old.stat,
        value: old.value,
        proficient: true,
        expertise: old.expertise,
    }


    return character;
}

const RemoveProficienciesFeature = (character: Character, feature: MadFeature) => {
    const newProficiency = feature.value['proficiency'];

    if (newProficiency === "") {
        DebugConsole.error("No proficiency provided for AddProficiencies command");

        return character;
    }

    if (newProficiency === "choice") {
        DebugConsole.warn("Unresolved choice-form RemoveProficiencies reached the handler; skipping");

        return character;
    }

    const old = character.proficiencies.skills[`${newProficiency}`];

    character.proficiencies.skills[`${newProficiency}`] = {
        stat: old.stat,
        value: old.value,
        proficient: false,
        expertise: old.expertise,
    }


    return character;
}

function useProficienciesFeature (character: Character) {

    if (!character) {
        DebugConsole.error("No character provided to useProficienciesFeature");
        return;
    }

    const updated = character.features.reduce((updatedCharacter,feature) => {
        const mads = feature.metadata?.mads as MadFeature[];
        
        return mads.reduce((updatedChar,mads) => {
            if (mads) {
                if (mads.command === 'AddProficiencies') {
                    updatedChar = addProficienciesFeature(character, mads);
                } else if (mads.command === 'RemoveProficiencies') {
                    updatedChar = RemoveProficienciesFeature(character, mads);
                }
            }   

            return updatedChar
        }, updatedCharacter)

    }, character);

    return updated;
};

export default useProficienciesFeature;
export { addProficienciesFeature, RemoveProficienciesFeature };