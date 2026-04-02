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

    character.features.forEach(feature => {
        const madFeatures = feature.metadata?.mads as MadFeature[];

        madFeatures.forEach(mads => {
            if (mads.type === MadType.Character) {
                if (mads.command === 'AddItems' ) {
                    character = AddItemFeature(character, mads);
                } else if (mads.command === 'RemoveItems') {
                    character = RemoveItemFeature(character, mads);
                }
            }
        })
    });

    return character;
}

export default useItemFeature;
export { AddItemFeature, RemoveItemFeature }