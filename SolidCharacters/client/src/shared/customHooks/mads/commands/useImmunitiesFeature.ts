import { Character } from "../../../../models/character.model";
import { MadFeature } from "../madModels";
import { DebugConsole } from "../../DebugConsole";

const addImmunities = (character: Character, feature: MadFeature): Character => {
    const type = feature.value?.['immunity']?.trim() ?? "";

    if (!type) {
        DebugConsole.error("No immunity type provided for AddImmunities command");
        return character;
    }

    if (!character.immunities.some(i => i.type.toLowerCase() === type.toLowerCase())) {
        character.immunities.push({ type, value: true });
    }
    
    return character;
}

const removeImmunities = (character: Character, feature: MadFeature): Character => {
    const type = feature.value?.['immunity']?.trim() ?? "";

    if (!type) {
        DebugConsole.error("No immunity type provided for RemoveImmunities command");
        return character;
    }

    character.immunities = character.immunities.filter(i => i.type.toLowerCase() !== type.toLowerCase());
    
    return character;
}

function useImmunitiesFeature (character: Character) {
    
    if (!character) {
        DebugConsole.error("No character provided to useImmunitiesFeature");
        return;
    }

    character.features.forEach(feature => {
        const mads = (feature.metadata?.mads ?? []) as MadFeature[];

        for (const mad of mads) {
            switch (mad.command) {
                case "AddImmunities":
                    addImmunities(character, mad);
                    break;
                case "RemoveImmunities":
                    removeImmunities(character, mad);
                    break;
                default:
                    break;
            }
        }
    })

    return character;
}

export default useImmunitiesFeature;
export { addImmunities, removeImmunities };