import { Character } from "../../../../models/character.model";
import { MadFeature } from "../madModels";
import { DebugConsole } from "../../DebugConsole";

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
        DebugConsole.error("No character provided to useItemFeature");
        return;
    }

    character.features.forEach(feature => {
        const mads = feature.metadata?.mads ?? [];

        for (const mad of mads) {
            if (mad.command === 'AddItems') {
                character = AddItemFeature(character, mad as MadFeature);
            } else if (mad.command === 'RemoveItems') {
                character = RemoveItemFeature(character, mad as MadFeature);
            }
        }
    });

    return character;
}

export default useItemFeature;
export { AddItemFeature, RemoveItemFeature }