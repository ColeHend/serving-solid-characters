import { Character } from "../../../models/character.model";
import characterManager from "../dndInfo/useCharacters";
import {addACFeature, removeACFeature} from "./commands/useACFeature";
import { AddCurrencyFeature, RemoveCurrencyFeature } from "./commands/useCurrencyFeature";
import { addExpertiseFeature, removeExpertiseFeature } from "./commands/useExpertiseFeature";
import { AddFeature ,RemoveFeature } from "./commands/useFeatures";
import { AddItemFeature, RemoveItemFeature } from "./commands/useItemFeature";
import { addLanguageFeature, removeLanguageFeature } from "./commands/useLanguagesFeature";
import { addProficienciesFeature, RemoveProficienciesFeature } from "./commands/useProficienciesFeature";
import { addSpeedFeature, removeSpeedFeature } from "./commands/useSpeedFeature";
import { AddSpellFeature, RemoveSpellFeature } from "./commands/useSpellFeature";
import { addStatFeature, removeStatFeature } from "./commands/useStatFeature";
import { MadFeature } from "./madModels";

// this hook should return a character with its MAD attributes applied, so that the character sheet can be rendered with the MAD features included. It should also be memoized to prevent unnecessary recalculations when the character or MAD features haven't changed.
export function useMadCharacters(character: Character, madFeatures: MadFeature[]): Character {
   return madFeatures.reduce((updatedCharacter, feature) => addMadFeature(updatedCharacter, feature), character);
}

/** * Applies a MadFeature to a character, modifying the character's attributes based on the command and value specified in the feature.
 * @param character The character to which to apply the MadFeatu);
            break;
        case 'RemoveCurrency':re.
 * @param feature The MadFeature containing the command and value that specifies how to modify the character.
 * @returns The updated character after applying the MadFeature.
 */
export function addMadFeature(character: Character, feature: MadFeature): Character {
    switch (feature.command) {
        case 'AddSpells':
            character = AddSpellFeature(character, feature);
            break;
        case 'RemoveSpells':
            character = RemoveSpellFeature(character, feature);
            break;
        case 'AddItems':
            character = AddItemFeature(character, feature);
            break;
        case 'RemoveItems':
            character = RemoveItemFeature(character, feature);
            break;
        case 'AddCurrency':
            character = AddCurrencyFeature(character, feature);
            break;
        case 'RemoveCurrency':
            character = RemoveCurrencyFeature(character, feature);
            break;
        case "AddArmorClass":
            character = addACFeature(character, feature);
            break;
        case "RemoveArmorClass":
            character = removeACFeature(character, feature); 
            break;
        case "AddProficiencies":
            character = addProficienciesFeature(character, feature);
            break;
        case "RemoveProficiencies":
            character = RemoveProficienciesFeature(character, feature);
            break;
        case "AddExpertise":
            character = addExpertiseFeature(character, feature);
            break;
        case "RemoveExpertise":
            character = removeExpertiseFeature(character, feature);
            break;
        // case "AddFeats":
        //     break;
        // case "RemoveFeats":
        //     break;
        case "AddFeatures":
            character = AddFeature(character, feature);
            break;
        case "RemoveFeatures":             
            character = RemoveFeature(character, feature);
            break;
        case "AddLanguages":
            character = addLanguageFeature(character, feature);
            break;
        case "RemoveLanguages":
            character = removeLanguageFeature(character, feature);
            break;
        case "AddResistances":
            break;
        case "RemoveResistances":
            break;
        case "AddVulnerabilities":
            break;
        case "RemoveVulnerabilities":
            break;
        case "AddImmunities":
            break;
        case "RemoveImmunities":
            break;
        case "AddSavingThrows":
            break;
        case "RemoveSavingThrows":
            break;
        case "AddStats":
            character = addStatFeature(character, feature);
            break; 
        case "RemoveStats":
            character = removeStatFeature(character, feature);
            break; // ----- 
        case "Addspeed":
            character = addSpeedFeature(character, feature);
            break;
        case "Removespeed":
            character = removeSpeedFeature(character, feature);
            break;
        default:
            break;
    }
    return character;
}

/**
 *  Custom hook that applies a spell feature to a character based on the provided character name and spell ID. 
 *  The function retrieves the relevant MadFeature for the specified character and spell, 
 *  then updates the character's spells accordingly by either adding or removing the spell feature.
 * 
 * @param characterName 
 * @param spellID 
 */
export function useSpellFeature(characterName: string, spellID: string): Character | undefined {
    let character = characterManager.getCharacter(characterName);

    if (!character) {
        console.error(`Character with the name ${characterName} couldn't be found!`);
        return;
    }

    // search for applicable mad features for the character and spell

    character.features.forEach(feature => {
        let mads = feature?.metadata?.mads;
        
        if (mads && mads.command === "AddSpells" && mads.value['id'] === spellID) {
            character = AddSpellFeature(character as any, mads);
        } else if (mads && mads.command === "RemoveSpells" && mads.value['id'] === spellID) {
            character = RemoveSpellFeature(character as any, mads);
        }

    });

    return character;
}



