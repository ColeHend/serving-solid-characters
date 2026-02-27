import { Character } from "../../../../models/character.model";
import { MadFeature } from "../madModels";

const addVulnerabilityFeature = (character: Character, feature: MadFeature) => {
    const type = feature.value?.["vulnerability"];

    if (!type) {
        console.error("No vulnerability type provided for AddVulnerability command");
        return character;
    }

    if (!character.vulnerabilities.some(v => v.type.toLowerCase() === type.toLowerCase())) {
        character.vulnerabilities.push({ type, value: true });
    }

    return character;
}

const removeVulnerabilityFeature = (character: Character, feature: MadFeature) => {
    const type = feature.value?.["vulnerability"];

    if (!type) {
        console.error("No vulnerability type provided for RemoveVulnerability command");
        return character;
    }

    character.vulnerabilities = character.vulnerabilities.filter(v => v.type.toLowerCase() !== type.toLowerCase());

    return character;
}

function useVulnerabilitiesFeature(character: Character) {

    if (!character) {
        console.error("No character was found!");
        return;
    }

    character.features.forEach(feature => {
        const MadFeature = feature.metadata?.mads;

        if (MadFeature) {
            switch (MadFeature.command) {
                case "AddVulnerabilities":
                    character = addVulnerabilityFeature(character, MadFeature);
                    break;

                case "RemoveVulnerabilities":
                    character = removeVulnerabilityFeature(character, MadFeature);
                    break;
            }
        }
    })

    return character;
}

export default useVulnerabilitiesFeature;
export { addVulnerabilityFeature, removeVulnerabilityFeature };