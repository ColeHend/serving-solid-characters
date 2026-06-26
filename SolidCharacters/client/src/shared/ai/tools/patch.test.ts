import { describe, it, expect } from "vitest";
import { applyPatch, parsePath, getAtPath, PatchOp } from "./patch";

describe("parsePath", () => {
    it("splits dotted paths and numbers numeric segments", () => {
        expect(parsePath("range")).toEqual(["range"]);
        expect(parsePath("features.3.0.description")).toEqual(["features", 3, 0, "description"]);
    });
    it("normalizes bracket notation", () => {
        expect(parsePath("features[3][0].description")).toEqual(["features", 3, 0, "description"]);
    });
});

describe("getAtPath", () => {
    it("reads nested values and returns undefined for missing segments", () => {
        const obj = { features: { 3: [{ description: "burn" }] } };
        expect(getAtPath(obj, parsePath("features.3.0.description"))).toBe("burn");
        expect(getAtPath(obj, parsePath("features.9.0.description"))).toBeUndefined();
    });
});

describe("applyPatch", () => {
    it("does not mutate the base object", () => {
        const base = { range: "150 feet" };
        const { next } = applyPatch(base, [{ path: "range", op: "set", value: "200 feet" }]);
        expect(base.range).toBe("150 feet");
        expect(next.range).toBe("200 feet");
    });

    it("sets a top-level field", () => {
        const { next, applied, rejected } = applyPatch({ range: "150" }, [{ path: "range", op: "set", value: "200" }]);
        expect(next.range).toBe("200");
        expect(applied).toHaveLength(1);
        expect(rejected).toHaveLength(0);
    });

    it("sets a nested numeric (Record<level, Feat[]>) path", () => {
        const base = { features: { 3: [{ name: "Burning Rage", description: "old" }] } };
        const { next } = applyPatch(base, [{ path: "features.3.0.description", op: "set", value: "new" }]);
        expect(next.features[3][0].description).toBe("new");
    });

    it("creates intermediate containers (array for numeric next segment)", () => {
        const base: { features?: Record<number, unknown[]> } = {};
        const { next } = applyPatch(base, [{ path: "features.6.0", op: "set", value: { name: "Heat Shield" } }]);
        expect(Array.isArray(next.features![6])).toBe(true);
        expect(next.features![6][0]).toEqual({ name: "Heat Shield" });
    });

    it("adds to an array and appends to a string", () => {
        const base = { traits: ["a"], desc: "hello" };
        const { next } = applyPatch(base, [
            { path: "traits", op: "add", value: "b" },
            { path: "desc", op: "add", value: " world" },
        ]);
        expect(next.traits).toEqual(["a", "b"]);
        expect(next.desc).toBe("hello world");
    });

    it("removes an object key and an array index", () => {
        const base = { feat: "Tough", traits: ["a", "b", "c"] };
        const { next } = applyPatch(base, [
            { path: "feat", op: "remove" },
            { path: "traits.1", op: "remove" },
        ]);
        expect("feat" in next).toBe(false);
        expect(next.traits).toEqual(["a", "c"]);
    });

    it("rejects prototype-pollution paths without mutating Object.prototype", () => {
        const ops: PatchOp[] = [
            { path: "__proto__.polluted", op: "set", value: "YES" },
            { path: "constructor.prototype.polluted2", op: "set", value: "YES" },
            { path: "features[0].__proto__.x", op: "set", value: "YES" },
        ];
        const { applied, rejected } = applyPatch({}, ops);
        expect(applied).toHaveLength(0);
        expect(rejected).toHaveLength(3);
        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
        expect(({} as Record<string, unknown>).polluted2).toBeUndefined();
        expect(({} as Record<string, unknown>).x).toBeUndefined();
    });

    it("rejects bad paths without throwing, applying the rest", () => {
        const base = { range: "150" };
        const ops: PatchOp[] = [
            { path: "range", op: "set", value: "200" },
            { path: "", op: "set", value: "x" },
            { path: "missing.deep", op: "remove" },
            { path: "range", op: "bogus" as PatchOp["op"], value: "y" },
        ];
        const { next, applied, rejected } = applyPatch(base, ops);
        expect(next.range).toBe("200");
        expect(applied).toHaveLength(1);
        expect(rejected).toHaveLength(3);
    });
});
