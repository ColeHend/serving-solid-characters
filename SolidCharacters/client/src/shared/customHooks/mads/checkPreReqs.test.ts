import { describe, it, expect } from "vitest";
import type { Character } from "../../../models/character.model";
import { checkPrerequisites } from "./checkPreReqs";
import { Madprerequisite } from "./madModels";
import { AddItemFeature } from "./commands/useItemFeature";
import { MadFeature, MadType } from "./madModels";

function makeCharacter(overrides: Partial<Character> = {}): Character {
    return {
        name: "Test",
        level: 10,
        languages: ["Common", "Elvish"],
        items: {
            inventory: [], equipped: [], attuned: [],
            currency: { platinumPieces: 0, goldPieces: 0, electrumPieces: 0, sliverPieces: 0, copperPieces: 0 },
        },
        ...overrides,
    } as Character;
}

const prereq = (overrides: Partial<Madprerequisite>): Madprerequisite =>
    ({ value: "level", operation: ">=", keyValue: "5", group: 0, ...overrides });

describe("checkPrerequisites", () => {
    it("passes vacuously with no prerequisites", () => {
        expect(checkPrerequisites(makeCharacter(), [])).toBe(true);
    });

    it("reads `value` as the character key and `keyValue` as the comparand", () => {
        expect(checkPrerequisites(makeCharacter(), [prereq({ value: "level", keyValue: "5" })])).toBe(true);
        expect(checkPrerequisites(makeCharacter(), [prereq({ value: "level", keyValue: "15" })])).toBe(false);
    });

    it("compares numerically when both sides are numeric (\"10\" >= \"9\")", () => {
        // Lexical comparison would call "10" < "9"; numeric must win.
        expect(checkPrerequisites(makeCharacter({ level: 10 }), [prereq({ keyValue: "9" })])).toBe(true);
        expect(checkPrerequisites(makeCharacter({ level: 10 }), [prereq({ operation: "<", keyValue: "9" })])).toBe(false);
    });

    it("fails ordered comparisons against missing character keys", () => {
        expect(checkPrerequisites(makeCharacter(), [prereq({ value: "notAField" })])).toBe(false);
    });

    it("treats a missing group as an AND-term instead of failing the whole check", () => {
        const noGroup = prereq({ keyValue: "5" });
        delete (noGroup as Partial<Madprerequisite>).group;
        expect(checkPrerequisites(makeCharacter(), [noGroup])).toBe(true);
    });

    it("treats unknown group numbers as AND-terms", () => {
        expect(checkPrerequisites(makeCharacter(), [prereq({ group: 2, keyValue: "5" })])).toBe(true);
        expect(checkPrerequisites(makeCharacter(), [prereq({ group: 2, keyValue: "15" })])).toBe(false);
    });

    it("passes group-1 members when ANY group-1 prerequisite holds", () => {
        const met = prereq({ group: 1, keyValue: "5" });
        const unmet = prereq({ group: 1, keyValue: "15" });
        expect(checkPrerequisites(makeCharacter(), [met, unmet])).toBe(true);
        expect(checkPrerequisites(makeCharacter(), [unmet, prereq({ group: 1, keyValue: "20" })])).toBe(false);
    });

    it("ANDs group-0 terms with the group-1 OR block", () => {
        const and = prereq({ group: 0, keyValue: "15" });
        const or = prereq({ group: 1, keyValue: "5" });
        expect(checkPrerequisites(makeCharacter(), [and, or])).toBe(false);
    });

    it("supports includes/excludes on array fields", () => {
        expect(checkPrerequisites(makeCharacter(), [prereq({ value: "languages", operation: "includes", keyValue: "Common" })])).toBe(true);
        expect(checkPrerequisites(makeCharacter(), [prereq({ value: "languages", operation: "excludes", keyValue: "Dwarvish" })])).toBe(true);
        expect(checkPrerequisites(makeCharacter(), [prereq({ value: "languages", operation: "includes", keyValue: "Dwarvish" })])).toBe(false);
    });
});

describe("AddItemFeature prerequisites", () => {
    const itemMad = (prerequisites: Madprerequisite[]): MadFeature => ({
        command: "AddItems", value: { ID: "Rope" }, type: MadType.Character, prerequisites, group: 0,
    });

    it("grants the item when there are no prerequisites", () => {
        const character = AddItemFeature(makeCharacter(), itemMad([]));
        expect(character.items.inventory).toContainEqual({ name: "Rope" });
    });

    it("grants the item when prerequisites are met", () => {
        const character = AddItemFeature(makeCharacter(), itemMad([prereq({ keyValue: "5" })]));
        expect(character.items.inventory).toContainEqual({ name: "Rope" });
    });

    it("withholds the item when prerequisites are unmet", () => {
        const character = AddItemFeature(makeCharacter(), itemMad([prereq({ keyValue: "15" })]));
        expect(character.items.inventory).not.toContainEqual({ name: "Rope" });
    });
});
