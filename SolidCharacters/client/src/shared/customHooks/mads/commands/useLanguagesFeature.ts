import { Character } from "../../../../models/character.model";
import { MadFeature } from "../madModels";
import { DebugConsole } from "../../DebugConsole";

const addLanguageFeature = (character: Character, feature: MadFeature): Character => {
    const language = feature.value?.['name'] ?? '';
    
    if (language && !character.languages.includes(language)) {
        character.languages.push(language);
    } 

    return character;
}

const removeLanguageFeature = (character: Character, feature: MadFeature): Character => {
    const language = feature.value?.['name'] ?? '';
    
    if (language && character.languages.includes(language)) {
        character.languages = character.languages.filter(l => l !== language);
    }

    return character;

}

function useLanguageFeature (character: Character) {
    
    if (!character) {
        DebugConsole.error("No character provided to useLanguageFeature");
        return;
    }

    character.features.forEach(feature => {
        const mads = feature.metadata?.mads as MadFeature;

        if (mads) {
            if (mads.command === 'AddLanguages') {
                character = addLanguageFeature(character, mads);
            } else if (mads.command === 'RemoveLanguages') {
                character = removeLanguageFeature(character, mads);
            }
        }
    });

    return character;
};

export default useLanguageFeature;
export { addLanguageFeature, removeLanguageFeature };