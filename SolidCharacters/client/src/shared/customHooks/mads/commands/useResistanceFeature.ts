import { Character } from "../../../../models/character.model";
import { MadFeature } from "../madModels";
import { DebugConsole } from "../../DebugConsole";

const addResistanceFeature = (character: Character, feature: MadFeature): Character => {
    const resistance = feature.value['resistance'].trim() ?? "";

    if (!resistance) {
        DebugConsole.error("No resistance provided for AddResistances command");
        return character;
    }

    if (!character.resistances.some(r => r.type.toLowerCase() === resistance.toLowerCase())) {
        character.resistances.push({ type: resistance, value: true });
    }
    
    
    return character;
}

const removeResistanceFeature = (character: Character, feature: MadFeature): Character => {
    const resistance = feature.value['resistance'].trim() ?? "";

    if (!resistance) {
        DebugConsole.error("No resistance provided for RemoveResistances command");
        return character;
    }

    character.resistances = character.resistances.filter(r => r.type.toLowerCase() !== resistance.toLowerCase());
    
    return character;
}

function useResistanceFeature (character: Character) {

    if (!character) {
        DebugConsole.error("No character was found!");
        return;
    }

    character.features.forEach(feature => {
        const MadFeature = feature.metadata?.mads as MadFeature;

        if (MadFeature) {
            switch (MadFeature.command) {
                case "AddResistances":
                    character = addResistanceFeature(character, MadFeature);
                    break;
                case "RemoveResistances":
                    character = removeResistanceFeature(character, MadFeature);
                    break;
            }
        }
    })

    return character;
}

export default useResistanceFeature;
export { addResistanceFeature, removeResistanceFeature };