import { Character } from "../../../../models/character.model";
import { MadFeature } from "../madModels";

export const AddItemFeature = (character: Character, feature: MadFeature): Character => {
    const itemName = feature.value?.['name'] ?? '';
    if (itemName) character.items.inventory.push(itemName);
    return character;
};

export const RemoveItemFeature = (character: Character, feature: MadFeature): Character => {
    const itemName = feature.value?.['name'] ?? '';
    if (itemName) character.items.inventory = character.items.inventory.filter(i => i !== itemName);
    return character;
}