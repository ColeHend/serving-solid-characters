import { Character } from "../../../../models/character.model";
import { MadFeature, MadType } from "../madModels";
import { DebugConsole } from "../../DebugConsole";

const AddItemFeature = (character: Character, feature: MadFeature): Character => {
    const itemName = feature.value?.['ID'] ?? '';

    const preReqs = feature.prerequisites ?? [];

    if (preReqs.length > 0) {
        const cond = preReqs.some(preReq => {
            // if (preReq.group === 0) {
            //     preReq.
            // }
        });
        if (!cond) {

            return character;
        }    
    }

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