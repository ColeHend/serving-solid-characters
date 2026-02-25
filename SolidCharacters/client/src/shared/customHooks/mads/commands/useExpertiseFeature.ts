import { Character } from "../../../../models/character.model";
import { MadFeature } from "../madModels";

const addExpertiseFeature = (character: Character, feature: MadFeature) => {
    const skillNames = feature.value?.["proficiencies"].split(",").map(p => p.trim()) ?? [];

    if (skillNames.length === 0) {
        console.error("No proficiencies provided for AddExpertise command");
        return character;
    }

    skillNames.forEach(skillName => {
        if (skillName) {
            const old = character.proficiencies.skills[`${skillName}`];
            const isProficient = old?.proficient ?? false;

            if (!isProficient) {
                console.warn(`Cannot add expertise to ${skillName} because character is not proficient in it.`);
                return;
            }

            character.proficiencies.skills[`${skillName}`] = {
                stat: old.stat,
                value: old.value,
                proficient: old.proficient,
                expertise: true,
            };
        }
    });

    return character;
}

const removeExpertiseFeature = (character: Character, feature: MadFeature) => {
    const skillNames = feature.value?.["proficiencies"].split(",").map(p => p.trim()) ?? [];

    if (skillNames.length === 0) {
        console.error("No proficiencies provided for RemoveExpertise command");
        return character;
    }

    skillNames.forEach(skillName => {
        if (skillName) {
            const old = character.proficiencies.skills[`${skillName}`];
            
            character.proficiencies.skills[`${skillName}`] = {
                stat: old.stat,
                value: old.value,
                proficient: old.proficient,
                expertise: false,
            };
        }
    });

    return character;
}

function useExpertiseFeature (character: Character) {
    if (!character) {
        console.error("No Character Found!");
        return;
    }

    character.features.forEach(feature => {
        let mads = feature.metadata?.mads;

        if (mads && mads.command === 'AddExpertise') {
            character = addExpertiseFeature(character, mads);
        } else if (mads && mads.command === 'RemoveExpertise') {
            character = removeExpertiseFeature(character, mads);
        }
    });

    return character;
}

export default useExpertiseFeature;
export { addExpertiseFeature, removeExpertiseFeature };