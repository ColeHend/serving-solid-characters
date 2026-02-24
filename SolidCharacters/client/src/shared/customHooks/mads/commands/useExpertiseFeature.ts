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

export { addExpertiseFeature, removeExpertiseFeature };