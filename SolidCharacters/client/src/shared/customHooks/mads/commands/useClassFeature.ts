import { Character } from "../../../../models/character.model";
import { FeatureDetail } from "../../../../models/generated";
import { MadFeature } from "../madModels";
import { DebugConsole } from "../../DebugConsole";

const addClassFeature = (character: Character, feature: MadFeature): Character => {
    const name = feature.value?.['name']?.trim() ?? "";

    if (!name) {
        DebugConsole.error("No name provided for AddClassFeature command");
        return character;
    }

    if (character.features.some(f => (f.name ?? "").toLowerCase() === name.toLowerCase())) {
        DebugConsole.warn(`Character already has feature ${name}, skipping AddClassFeature command`);
        return character;
    }

    const newFeature: FeatureDetail = {
        id: "",
        name,
        description: feature.value?.['description'] ?? "",
    };

    const category = feature.value?.['category']?.trim();
    if (category) {
        newFeature.metadata = { category };
    }

    character.features.push(newFeature);

    return character;
}

const removeClassFeature = (character: Character, feature: MadFeature): Character => {
    const name = feature.value?.['name']?.trim() ?? "";

    if (!name) {
        DebugConsole.error("No name provided for RemoveClassFeature command");
        return character;
    }

    character.features = character.features.filter(f => (f.name ?? "").toLowerCase() !== name.toLowerCase());

    return character;
}

export { addClassFeature, removeClassFeature };
