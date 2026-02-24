import { addSnackbar } from "coles-solid-library";
import { Character } from "../../../../models/character.model";
import characterManager from "../../dndInfo/useCharacters";
import { MadFeature } from "../madModels";
import { addMadFeature } from "../useMadCharacters";

// add spell feature

/**
 * Adds a spell feature to a character based on the provided MadFeature. The function checks for the presence of a spell name in the feature's value and, if found, adds it to the character's spells array with a default prepared status of false.
 * @param character The character to which the spell feature will be added
 * @param feature The spell feature to add
 * @returns {Character} The updated character with the new spell feature added.
 */
export const AddSpellFeature = (character: Character, feature: MadFeature): Character => {
    const spellName = feature.value?.['name'] ?? '';
    if (spellName) {
        character.spells = [...character.spells, {
            name: spellName,
            prepared: false,
        }];
    }
    return character;
}

// remove spell feature

/**
 * Removes a spell feature from a character based on the provided MadFeature. The function checks for the presence of a spell name in the feature's value and, if found, filters it out from the character's spells array.
 * @param character The character from which the spell feature will be removed.
 * @param feature The spell feature to remove, containing the name of the spell to be removed.
 * @returns {Character} The updated character with the specified spell feature removed.
 */
export const RemoveSpellFeature = (character: Character, feature: MadFeature): Character => {
    const spellName = feature.value?.['name'] ?? '';
    if (spellName) character.spells = character.spells.filter(s => s.name !== spellName);
    return character;
}


