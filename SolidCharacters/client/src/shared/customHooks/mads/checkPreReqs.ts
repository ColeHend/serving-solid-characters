/* eslint-disable @typescript-eslint/no-explicit-any */
import { Character } from "../../../models/character.model";
import { Madprerequisite } from "./madModels";

export function checkPrerequisites(character: Character, preReqs: Madprerequisite[]): boolean {
    return preReqs.every(prerequisite => {
            if (prerequisite.group === 0) {
    
                switch (prerequisite.operation) {
                    case "<":
                        return character[prerequisite.keyValue as keyof Character] < prerequisite.value;
                    case ">":
                        return character[prerequisite.keyValue as keyof Character] > prerequisite.value;
                    case "<=":
                        return character[prerequisite.keyValue as keyof Character] <= prerequisite.value;
                    case ">=":
                        return character[prerequisite.keyValue as keyof Character] >= prerequisite.value;
                    case "===":
                        return character[prerequisite.keyValue as keyof Character] === prerequisite.value;
                    case "!==":
                        return character[prerequisite.keyValue as keyof Character] !== prerequisite.value;
                    case "includes":
                        if (Array.isArray(character[prerequisite.keyValue as keyof Character])) {
                            return (character[prerequisite.keyValue as keyof Character] as unknown as any[]).includes(prerequisite.value);
                        }
                        return false;
                    case "excludes":
                        if (Array.isArray(character[prerequisite.keyValue as keyof Character])) {
                            return !(character[prerequisite.keyValue as keyof Character] as unknown as any[]).includes(prerequisite.value);
                        }
                        return false;
                }
            } else if (prerequisite.group === 1) {
    
                return preReqs
                .filter(pr => pr.group === 1)
                .some(p => {
                    switch (p.operation) {
                        case "<":
                            return character[p.keyValue as keyof Character] < p.value;
                        case ">":
                            return character[p.keyValue as keyof Character] > p.value;
                        case "<=":
                            return character[p.keyValue as keyof Character] <= p.value;
                        case ">=":
                            return character[p.keyValue as keyof Character] >= p.value;
                        case "===":
                            return character[p.keyValue as keyof Character] === p.value;
                        case "!==":
                            return character[p.keyValue as keyof Character] !== p.value;
                        case "includes":
                            if (Array.isArray(character[p.keyValue as keyof Character])) {
                                return (character[p.keyValue as keyof Character] as unknown as any[]).includes(p.value);
                            }
                            return false;
                        case "excludes":
                            if (Array.isArray(character[p.keyValue as keyof Character])) {
                                return !(character[p.keyValue as keyof Character] as unknown as any[]).includes(p.value);
                            }
                            return false;
                    }
                });
            }
        })
    
}