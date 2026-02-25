import { Character } from "../../../../models/character.model";
import { MadFeature } from "../madModels";

// add spell feature

/**
 * Adds a spell feature to a character based on the provided MadFeature. The function checks for the presence of a spell name in the feature's value and, if found, adds it to the character's spells array with a default prepared status of false.
 * @param character The character to which the spell feature will be added
 * @param feature The spell feature to add
 * @returns {Character} The updated character with the new spell feature added.
 */
const AddSpellFeature = (character: Character, feature: MadFeature): Character => {
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
const RemoveSpellFeature = (character: Character, feature: MadFeature): Character => {
    const spellName = feature.value?.['name'] ?? '';
    if (spellName) character.spells = character.spells.filter(s => s.name !== spellName);
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
function useSpellFeature(character: Character, spellID: string): Character | undefined {

    if (!character) {
        console.error(`Character couldn't be found!`);
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


export default useSpellFeature;
export { AddSpellFeature, RemoveSpellFeature };
