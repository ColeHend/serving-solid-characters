import { Character } from "../../../../models/character.model";
import { MadFeature } from "../madModels";
import { Feat, FeatureDetail, MadFeature as MadFeat } from "../../../../models/generated";
import { DebugConsole } from "../../DebugConsole";
import { useDndFeature } from "../../dndInfo/useDndFeatures";

const { allFeatures } = useDndFeature();


const AddFeature = (character: Character, feature: MadFeature) => {
    const featureName = feature.value?.['name']?.trim() ?? "";

    const features = allFeatures();

    const featureToAdd = features.find(f => f.name === featureName);

    if (!featureToAdd) {
        DebugConsole.error(`Feature ${featureName} not found in DnD features list`);
        return character;
    }

    if (character.features.some( f => f.name === featureToAdd.name)) {
        DebugConsole.warn(`Character already has feature ${featureToAdd.name}, skipping AddFeature command`);
        return character;
    }
    
    character.features.push(featureToAdd as FeatureDetail);

    return character;   
}

const RemoveFeature = (character: Character, feature: MadFeature) => {
    const featureNameToRemove = feature.value?.['name']?.trim() ?? "";

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
            const madFeature = feature.metadata.mads as MadFeature[];

            madFeature.forEach(mads => {
                switch (mads.command) {
                    case 'AddFeatures':
                        AddFeature(character, mads);
                        break;
                    case 'RemoveFeatures':
                        RemoveFeature(character, mads);
                        break;
                    default:
                        break;
                }
            })
            
        }
    });

    return character;
}

export default useFeatures;
export { AddFeature, RemoveFeature };