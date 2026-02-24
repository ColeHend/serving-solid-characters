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

export { addLanguageFeature, removeLanguageFeature };