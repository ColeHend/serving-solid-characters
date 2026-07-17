/* eslint-disable @typescript-eslint/no-explicit-any */
import { Character } from "../../../models/character.model";
import { Madprerequisite } from "./madModels";

function meetsPrerequisite(character: Character, prerequisite: Madprerequisite): boolean {
    // Optional Character fields (details, builder, ...) can be undefined; comparisons
    // with undefined are false, matching the old inline behavior.
    const value = character[prerequisite.keyValue as keyof Character];
    switch (prerequisite.operation) {
        case "<":
            return value !== undefined && value < prerequisite.value;
        case ">":
            return value !== undefined && value > prerequisite.value;
        case "<=":
            return value !== undefined && value <= prerequisite.value;
        case ">=":
            return value !== undefined && value >= prerequisite.value;
        case "===":
            return value === prerequisite.value;
        case "!==":
            return value !== prerequisite.value;
        case "includes":
            if (Array.isArray(value)) {
                return (value as unknown as any[]).includes(prerequisite.value);
            }
            return false;
        case "excludes":
            if (Array.isArray(value)) {
                return !(value as unknown as any[]).includes(prerequisite.value);
            }
            return false;
    }
    return false;
}

export function checkPrerequisites(character: Character, preReqs: Madprerequisite[]): boolean {
    return preReqs.every(prerequisite => {
            if (prerequisite.group === 0) {
                return meetsPrerequisite(character, prerequisite);
            } else if (prerequisite.group === 1) {
                return preReqs
                .filter(pr => pr.group === 1)
                .some(p => meetsPrerequisite(character, p));
            }
        })

}
