import { Character } from "../../../../models/character.model";
import { MadFeature } from "../madModels";
import { DebugConsole } from "../../DebugConsole";

const addVulnerabilityFeature = (character: Character, feature: MadFeature) => {
    const type = feature.value?.["vulnerability"];

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
    const type = feature.value?.["vulnerability"];

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

    character.features.forEach(feature => {
        const mads = (feature.metadata?.mads ?? []) as MadFeature[];

        for (const mad of mads) {
            switch (mad.command) {
                case "AddVulnerabilities":
                    character = addVulnerabilityFeature(character, mad);
                    break;

                case "RemoveVulnerabilities":
                    character = removeVulnerabilityFeature(character, mad);
                    break;
            }
        }
    })

    return character;
}

export default useVulnerabilitiesFeature;
export { addVulnerabilityFeature, removeVulnerabilityFeature };