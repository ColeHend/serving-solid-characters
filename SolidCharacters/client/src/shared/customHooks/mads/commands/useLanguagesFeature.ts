import { Character } from "../../../../models/character.model";
import { MadFeature } from "../madModels";

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
        console.error("No character provided to useLanguageFeature");
        return;
    }

    character.features.forEach(feature => {
        let mads = feature.metadata?.mads;

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