import { Character } from "../../../../models/character.model";
import { MadFeature, MadType } from "../madModels";
import { DebugConsole } from "../../DebugConsole";
import { checkPrerequisites } from "../checkPreReqs";

const AddItemFeature = (character: Character, feature: MadFeature): Character => {
    const itemName = feature.value?.['ID'] ?? '';

    if (!checkPrerequisites(character, feature.prerequisites ?? [])) return character;

    if (itemName) character.items.inventory.push(itemName);

    return character;
};

const RemoveItemFeature = (character: Character, feature: MadFeature): Character => {
    const itemName = feature.value?.['name'] ?? '';
    
    if (itemName) character.items.inventory = character.items.inventory.filter(i => i !== itemName);
    
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