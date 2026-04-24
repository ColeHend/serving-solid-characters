import { Character } from "../../../../models/character.model";
import { FeatureDetail } from "../../../../models/generated";
import { useDnDFeats } from "../../dndInfo/info/all/feats";
import { MadFeature } from "../madModels";
import { DebugConsole } from "../../DebugConsole";
import { createNewId } from "../../utility/tools/idGen";

const srdFeats = useDnDFeats();

const AddFeat = (character: Character, feature: MadFeature) => {
    const featID = feature.value?.["featID"].trim() ?? "";

    if (featID === "") {
        DebugConsole.error("No feat ID was provoided!");
        return character;
    }

    const feat = getFeat(featID);

    if (feat) {
        const newFeature: FeatureDetail = {
            id: createNewId(),
            name: feat.details.name,
            description: feat.details.description,
            choiceKey: feat.details.choiceKey,
            metadata: feat.details.metadata,
        }

        character.features.push(newFeature);
    }


    return character;
}

const RemoveFeat = (character: Character, feature: MadFeature) => {
    const featID = feature.value?.["featID"].trim() ?? "";

    if (featID === "") {
        DebugConsole.error("No feat ID was provoided!");
        return character;
    }

    const feat = getFeat(featID);

    if (feat) {
        character.features = character.features.filter(f => f.name !== feat?.details.name);
    }
    
    return character;
}

function useFeat (character:Character) {

    if (!character) {
        DebugConsole.error("No character was found!");
        return;
    }

    const updatedCharacter = character.features.reduce((updatedChar,feature) => {
        const madFeature = feature.metadata?.mads as MadFeature[];

        return madFeature.reduce((updatedCharacter, Feature) => {
            switch (Feature.command) {
                case "AddFeats":
                    updatedCharacter = AddFeat(character, Feature);
                    break;
 
                case "RemoveFeats":
                    updatedCharacter = RemoveFeat(character, Feature);
                    break;
            }

            return updatedCharacter;
        }, updatedChar);

    }, character)

    return updatedCharacter;
}

function getFeat(ID: string) {

    if (ID === "") return;

    const feats = srdFeats();

    return feats.find(f => f.id === ID);
}

export default useFeat;
export { AddFeat, RemoveFeat}