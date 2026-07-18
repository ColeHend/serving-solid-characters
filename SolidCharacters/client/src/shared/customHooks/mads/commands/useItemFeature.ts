import { Character, itemRefName } from "../../../../models/character.model";
import { MadFeature, MadType } from "../madModels";
import { DebugConsole } from "../../DebugConsole";
import { checkPrerequisites } from "../checkPreReqs";

const AddItemFeature = (character: Character, feature: MadFeature): Character => {
    const itemName = feature.value?.['ID'] ?? '';

    // A choice-form command must be resolved to a concrete pick (collectMadFeatures) before it applies.
    if (itemName === 'choice') {
        DebugConsole.warn("Unresolved choice-form AddItems command reached the handler — skipping");
        return character;
    }

    if (!checkPrerequisites(character, feature.prerequisites ?? [])) return character;

    // Mad-granted items are name-shaped (the command's ID field holds a display name).
    if (itemName) character.items.inventory.push({ name: itemName });

    return character;
};

const RemoveItemFeature = (character: Character, feature: MadFeature): Character => {
    const itemName = feature.value?.['name'] ?? '';
    
    if (itemName) character.items.inventory = character.items.inventory.filter(i => itemRefName(i) !== itemName);
    
    return character;
}

function useItemFeature (character: Character) {

    if (!character) {
        DebugConsole.error("No character provided to useItemFeature");
        return;
    }

    const updated = character.features.reduce((updatedCharacter,feature) => {
        const madFeatures = feature.metadata?.mads as MadFeature[];

        return madFeatures.reduce((updatedChar,mads) => {
            if (mads.type === MadType.Character) {
                if (mads.command === 'AddItems' ) {
                    updatedChar = AddItemFeature(character, mads);
                } else if (mads.command === 'RemoveItems') {
                    updatedChar = RemoveItemFeature(character, mads);
                }
            }
            
            return updatedChar
        }, updatedCharacter)
    },character);

    return updated;
}

export default useItemFeature;
export { AddItemFeature, RemoveItemFeature }