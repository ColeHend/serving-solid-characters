import { Character } from "../../../models/character.model";
import {addACFeature, removeACFeature} from "./commands/useACFeature";
import { addAllProficiencyFeature ,removeAllProficiencyFeature } from "./commands/useAllProficiencyFeature";
import { AddCurrencyFeature, RemoveCurrencyFeature } from "./commands/useCurrencyFeature";
import { addExpertiseFeature, removeExpertiseFeature } from "./commands/useExpertiseFeature";
import { AddFeat, RemoveFeat } from "./commands/useFeat";
import { AddFeature ,RemoveFeature } from "./commands/useFeatures";
import { addImmunities, removeImmunities } from "./commands/useImmunitiesFeature";
import { AddItemFeature, RemoveItemFeature } from "./commands/useItemFeature";
import { addLanguageFeature, removeLanguageFeature } from "./commands/useLanguagesFeature";
import { addProficienciesFeature, RemoveProficienciesFeature } from "./commands/useProficienciesFeature";
import { addResistanceFeature, removeResistanceFeature } from "./commands/useResistanceFeature";
import { addSavingThrowFeature, removeSavingThrowFeature } from "./commands/useSavingThrowFeature";
import { addSpeedFeature, removeSpeedFeature } from "./commands/useSpeedFeature";
import { AddSpellFeature, RemoveSpellFeature } from "./commands/useSpellFeature";
import { addStatFeature, removeStatFeature } from "./commands/useStatFeature";
import { addVulnerabilityFeature, removeVulnerabilityFeature } from "./commands/useVulnerabilitiesFeature";
import { MadFeature } from "./madModels";

// this hook should return a character with its MAD attributes applied, so that the character sheet can be rendered with the MAD features included. It should also be memoized to prevent unnecessary recalculations when the character or MAD features haven't changed.
export function useMadCharacters(character: Character, madFeatures: MadFeature[]): Character {
   return madFeatures.reduce((updatedCharacter, feature) => addMadFeature(updatedCharacter, feature), character);
}

/**
 * Applies a MadFeature to a character, modifying the character's attributes based on the command and value specified in the feature.
 * @param character The character to which to apply the MadFeature.
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
            character = addResistanceFeature(character, feature);
            break;
        case "RemoveResistances":
            character = removeResistanceFeature(character, feature);
            break;
        case "AddVulnerabilities":
            character = addVulnerabilityFeature(character, feature);
            break;
        case "RemoveVulnerabilities":
            character = removeVulnerabilityFeature(character, feature);
            break;
        case "AddImmunities":
            character = addImmunities(character, feature);
            break;
        case "RemoveImmunities":
            character = removeImmunities(character, feature);
            break;
        case "AddSavingThrows":
            character = addSavingThrowFeature(character, feature);
            break;
        case "RemoveSavingThrows":
            character = removeSavingThrowFeature(character, feature);
            break;
        case "AddStats":
            character = addStatFeature(character, feature);
            break; 
        case "RemoveStats":
            character = removeStatFeature(character, feature);
            break; // ----- 
        case "AddSpeed":
            character = addSpeedFeature(character, feature);
            break;
        case "RemoveSpeed":
            character = removeSpeedFeature(character, feature);
            break;
        case "AddAllProficiencies":
            character = addAllProficiencyFeature(character, feature);
            break;
        case "RemoveAllProficiencies":
            character = removeAllProficiencyFeature(character, feature);
            break;
        case "AddFeats":
            character = AddFeat(character, feature);
            break;
        case "RemoveFeats":
            character = RemoveFeat(character, feature);
            break;
        default:
            break;
    }
    return character;
}



