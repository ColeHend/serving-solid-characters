import { Character, CharacterSavingThrow } from "../../../../models/character.model"
import { Stats } from "../../dndInfo/useCharacters";
import { MadFeature } from "../madModels"
import { DebugConsole } from "../../DebugConsole";

const addSavingThrowFeature = (character: Character, feature: MadFeature): Character => {
    const stat = feature.value?.["stat"] as keyof Stats ?? "";

    if (!stat) {
        DebugConsole.error("Missing stat value for AddSavingThrows command");
        return character;
    }

    if (character.savingThrows.some(st => st.stat === stat)) {
        DebugConsole.warn(`Character already has a saving throw for ${stat}`);
        return character;
    }

    const newSavingThrow: CharacterSavingThrow = {
        stat,
        proficient: true
    };

    character.savingThrows.push(newSavingThrow);

    return character;
}

const removeSavingThrowFeature = (character: Character, feature: MadFeature): Character => {
    const stat = feature.value?.["stat"] as keyof Stats ?? "";

    if (!stat) {
        DebugConsole.error("Missing stat value for RemoveSavingThrows command");
        return character;
    }

    if (!character.savingThrows.some(st => st.stat === stat)) {
        DebugConsole.warn(`Character does not have a saving throw for ${stat} to remove`);
        return character;
    }

    character.savingThrows = character.savingThrows.filter(st => st.stat !== stat);

    return character;
}

function useSavingThrowFeature (character: Character) {

    if (!character) {
        DebugConsole.error("No character was found!");
        return;
    }

    character.features.forEach(feature => {
        const MadFeature = feature.metadata?.mads as MadFeature;

        if (MadFeature) {
            switch (MadFeature.command) {
                case "AddSavingThrows":
                    character = addSavingThrowFeature(character, MadFeature);
                    break;
                
                case "RemoveSavingThrows":
                    character = removeSavingThrowFeature(character, MadFeature);
                    break;
            }
        }
    })

    return character;
}

export default useSavingThrowFeature;
export { addSavingThrowFeature, removeSavingThrowFeature };