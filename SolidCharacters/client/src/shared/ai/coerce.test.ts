import { describe, it, expect } from "vitest";
import { boolean, list, num, optNum, reqNum, str, strList } from "./coerce";

describe("coerce", () => {
    it("str passes strings, stringifies non-null, defaults null/undefined", () => {
        expect(str("hi")).toBe("hi");
        expect(str(5)).toBe("5");
        expect(str(null)).toBe("");
        expect(str(undefined, "d")).toBe("d");
    });

    it("num accepts numbers and numeric strings, else default", () => {
        expect(num(3)).toBe(3);
        expect(num("3")).toBe(3);
        expect(num("3rd", 0)).toBe(0);     // unparseable → default (drives the level/speed warnings)
        expect(num(undefined, 30)).toBe(30);
    });

    it("optNum rejects non-finite; reqNum is null when unparseable", () => {
        expect(optNum(Infinity, 1)).toBe(1);
        expect(reqNum("x")).toBeNull();
        expect(reqNum("7")).toBe(7);
    });

    // The bug this module fixes: boolean used to be `v === true` in toolDispatcher (rejecting "true")
    // but `v === true || v === "true"` in computeTools — so "concentration":"true" silently diverged.
    it("boolean accepts the boolean true AND the string \"true\"", () => {
        expect(boolean(true)).toBe(true);
        expect(boolean("true")).toBe(true);
        expect(boolean(false)).toBe(false);
        expect(boolean("false")).toBe(false);
        expect(boolean(undefined)).toBe(false);
    });

    it("list passes arrays else empty; strList trims and drops blanks", () => {
        expect(list([1, 2])).toEqual([1, 2]);
        expect(list("nope")).toEqual([]);
        expect(strList([" a ", "", "b", 3])).toEqual(["a", "b", "3"]);
    });
});
