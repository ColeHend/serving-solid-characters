import { describe, it, expect } from "vitest";
import { subclassBelongsTo } from "./subclasses";

describe("subclassBelongsTo", () => {
    const barb2014 = { id: "id-2014", name: "Barbarian" };
    const barb2024 = { id: "id-2024", name: "Barbarian" };
    const homebrewClass = { id: "hb-id", name: "Stormwarden" };
    const idlessClass = { name: "Stormwarden" };

    it("matches by id when both sides carry one — same-named editions stay distinct", () => {
        const sub = { parentClass: "Barbarian", parentClassId: "id-2024" };
        expect(subclassBelongsTo(sub, barb2024)).toBe(true);
        expect(subclassBelongsTo(sub, barb2014)).toBe(false);
    });

    it("falls back to a case-insensitive name match when either side lacks an id", () => {
        // pre-migration homebrew subclass (no parentClassId) shows under both editions
        const legacySub = { parentClass: "barbarian" };
        expect(subclassBelongsTo(legacySub, barb2014)).toBe(true);
        expect(subclassBelongsTo(legacySub, barb2024)).toBe(true);

        // id-bearing subclass of an id-less homebrew class still matches by name
        const sub = { parentClass: "Stormwarden", parentClassId: "other-id" };
        expect(subclassBelongsTo(sub, idlessClass)).toBe(true);
        // ...but when BOTH sides carry ids, the id comparison wins even over a name match
        expect(subclassBelongsTo(sub, homebrewClass)).toBe(false);
    });

    it("rejects a missing class and mismatched names", () => {
        expect(subclassBelongsTo({ parentClass: "Barbarian" }, undefined)).toBe(false);
        expect(subclassBelongsTo({ parentClass: "Bard" }, barb2014)).toBe(false);
    });
});
