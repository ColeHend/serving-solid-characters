import { Character } from "../../../../models/character.model";
import { MadFeature } from "../madModels";

const AddItemFeature = (character: Character, feature: MadFeature): Character => {
    const itemName = feature.value?.['name'] ?? '';

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
        console.error("No character provided to useItemFeature");
        return;
    }

    character.features.forEach(feature => {
        let mads = feature.metadata?.mads;

        if (mads) {
            if (mads.command === 'AddItems') {
                character = AddItemFeature(character, mads);
            } else if (mads.command === 'RemoveItems') {
                character = RemoveItemFeature(character, mads);
            }
        }
    });

    return character;
}

export default useItemFeature;
export { AddItemFeature, RemoveItemFeature }