import { Character } from "../../../../models/character.model";
import { MadFeature } from "../madModels";
import { MadFeature as MadFeat } from "../../../../models/generated";
import { DebugConsole } from "../../DebugConsole";

const AddFeature = (character: Character, feature: MadFeature) => {
    const newFeatureName = feature.value?.['feature']?.trim() ?? "";
    
    if (!newFeatureName) {
        DebugConsole.error("No feature name provided for AddFeature command");
        return character;
    }

    // if (!character.features.some( f => f.name === newFeatureName)) {
    //     character.features.push({
    //         name: newFeatureName,
    //         description: newFeatureDescription,
    //         metadata: {
    //             mads: feature as MadFeat,
    //         }
    //     });
    // }

    return character;   
}

const RemoveFeature = (character: Character, feature: MadFeature) => {
    const featureNameToRemove = feature.value?.['feature']?.trim() ?? "";

    if (!featureNameToRemove) {
        DebugConsole.error("No feature name provided for RemoveFeature command");
        return character;
    }

    character.features = character.features.filter(f => f.name !== featureNameToRemove);

    return character;   
}

function useFeatures (character: Character) {
    
    if (!character) {
        DebugConsole.error("No character provided to useFeatures");
        return;
    }

    character.features.forEach(feature => {
        if (feature.metadata?.mads) {
            const madFeature = feature.metadata.mads as MadFeature;
            
            switch (madFeature.command) {
                case 'AddFeatures':
                    AddFeature(character, madFeature);
                    break;
                case 'RemoveFeatures':
                    RemoveFeature(character, madFeature);
                    break;
                default:
                    break;
            }
        }
    });

    return character;
}

export default useFeatures;
export { AddFeature, RemoveFeature };