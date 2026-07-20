/* eslint-disable @typescript-eslint/no-explicit-any */
import { Character } from "../../../models/character.model";
import { Madprerequisite } from "./madModels";

/** True when both operands are non-empty and numeric-coercible ("10", 10 — not "", null, "Fighter"). */
function bothNumeric(a: unknown, b: unknown): boolean {
    const usable = (x: unknown) => x !== null && x !== undefined && String(x).trim() !== "" && !Number.isNaN(Number(x));
    return usable(a) && usable(b);
}

function compareOrdered(actual: unknown, expected: string, op: "<" | ">" | "<=" | ">="): boolean {
    if (actual === undefined) return false;
    // "10" >= "9" must hold — compare numerically whenever both sides are numbers.
    const [a, b]: [any, any] = bothNumeric(actual, expected)
        ? [Number(actual), Number(expected)]
        : [actual, expected];
    switch (op) {
        case "<": return a < b;
        case ">": return a > b;
        case "<=": return a <= b;
        case ">=": return a >= b;
    }
}

function meetsPrerequisite(character: Character, prerequisite: Madprerequisite): boolean {
    // Per Madprerequisite: `value` names the character key, `keyValue` is the comparand.
    // Optional Character fields (details, builder, ...) can be undefined; comparisons
    // with undefined are false.
    const actual = character[prerequisite.value as keyof Character];
    switch (prerequisite.operation) {
        case "<":
        case ">":
        case "<=":
        case ">=":
            return compareOrdered(actual, prerequisite.keyValue, prerequisite.operation);
        case "===":
            return actual === prerequisite.keyValue;
        case "!==":
            return actual !== prerequisite.keyValue;
        case "includes":
            if (Array.isArray(actual)) {
                return (actual as unknown as any[]).includes(prerequisite.keyValue);
            }
            return false;
        case "excludes":
            if (Array.isArray(actual)) {
                return !(actual as unknown as any[]).includes(prerequisite.keyValue);
            }
            return false;
    }
    return false;
}

export function checkPrerequisites(character: Character, preReqs: Madprerequisite[]): boolean {
    return preReqs.every(prerequisite => {
        // Missing/unknown group numbers behave as AND-terms (group 0); group-1 members
        // pass when ANY group-1 prerequisite holds ("or" semantics).
        if ((prerequisite.group ?? 0) === 1) {
            return preReqs
                .filter(pr => (pr.group ?? 0) === 1)
                .some(p => meetsPrerequisite(character, p));
        }
        return meetsPrerequisite(character, prerequisite);
    });
}
