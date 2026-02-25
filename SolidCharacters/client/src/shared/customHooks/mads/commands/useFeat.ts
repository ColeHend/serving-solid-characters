import { Character } from "../../../../models/character.model";
import { FeatureDetail } from "../../../../models/generated";
import { useDnDFeats } from "../../dndInfo/info/all/feats";
import { MadFeature } from "../madModels";

const srdFeats = useDnDFeats();

const AddFeat = (character: Character, feature: MadFeature) => {
    const featID = feature.value?.["featID"].trim() ?? "";

    if (featID === "") {
        console.error("No feat ID was provoided!");
        return character;
    }

    const feat = getFeat(featID);

    if (feat) {
        const newFeature: FeatureDetail = {
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
        console.error("No feat ID was provoided!");
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
        console.error("No character was found!");
        return;
    }

    character.features.forEach(feature => {
        const madFeature = feature.metadata?.mads;

        if (madFeature) {
            switch (madFeature.command) {
                case "AddFeats":
                    character = AddFeat(character, madFeature);
                    break;
 
                case "RemoveFeats":
                    character = RemoveFeat(character, madFeature);
                    break;
            }
        }
    })

    return character;
}

function getFeat(ID: string) {

    if (ID === "") return;

    const feats = srdFeats();

    return feats.find(f => f.id === ID);
}

export default useFeat;
export { AddFeat, RemoveFeat}