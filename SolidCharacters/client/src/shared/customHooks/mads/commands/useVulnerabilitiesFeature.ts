import { Character } from "../../../../models/character.model";
import { MadFeature } from "../madModels";
import { DebugConsole } from "../../DebugConsole";

const addVulnerabilityFeature = (character: Character, feature: MadFeature) => {
    const type = feature.value?.["damageType"];

    if (!type) {
        DebugConsole.error("No vulnerability type provided for AddVulnerability command");
        return character;
    }

    if (!character.vulnerabilities.some(v => v.type.toLowerCase() === type.toLowerCase())) {
        character.vulnerabilities.push({ type, value: true });
    }

    return character;
}

const removeVulnerabilityFeature = (character: Character, feature: MadFeature) => {
    const type = feature.value?.["damageType"];

    if (!type) {
        DebugConsole.error("No vulnerability type provided for RemoveVulnerability command");
        return character;
    }

    character.vulnerabilities = character.vulnerabilities.filter(v => v.type.toLowerCase() !== type.toLowerCase());

    return character;
}

function useVulnerabilitiesFeature(character: Character) {

    if (!character) {
        DebugConsole.error("No character was found!");
        return;
    }

    const updated = character.features.reduce((updatedChar,feature) => {
        const MadFeature = feature.metadata?.mads as MadFeature[];

        return MadFeature.reduce((updatedCharacter, feature) => {
            switch (feature.command) {
                case "AddVulnerabilities":
                    updatedCharacter = addVulnerabilityFeature(updatedCharacter, feature);
                    break;

                case "RemoveVulnerabilities":
                    updatedCharacter = removeVulnerabilityFeature(updatedCharacter, feature);
                    break;
                default:
                    break;
            }

            return updatedCharacter
        }, updatedChar);
    }, character)

    return updated;
}

export default useVulnerabilitiesFeature;
export { addVulnerabilityFeature, removeVulnerabilityFeature };