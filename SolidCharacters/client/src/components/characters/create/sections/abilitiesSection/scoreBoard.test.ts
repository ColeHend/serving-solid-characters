import { describe, expect, it } from "vitest";
import { remainingPool, resolveScoreDrop } from "./scoreBoard";

describe("resolveScoreDrop", () => {
  it("assigns a pool value dropped on a box", () => {
    expect(resolveScoreDrop({ kind: "pool", value: 15 }, { kind: "box", statKey: "str" })).toEqual({
      type: "assign",
      key: "str",
      value: 15,
    });
  });

  it("swaps two boxes when an assigned value is dropped on another box", () => {
    expect(
      resolveScoreDrop({ kind: "box", statKey: "str", value: 15 }, { kind: "box", statKey: "dex" }),
    ).toEqual({ type: "swap", a: "str", b: "dex" });
  });

  it("does nothing when a box value is dropped on its own box", () => {
    expect(
      resolveScoreDrop({ kind: "box", statKey: "str", value: 15 }, { kind: "box", statKey: "str" }),
    ).toBeNull();
  });

  it("clears a box value dropped back on the pool", () => {
    expect(resolveScoreDrop({ kind: "box", statKey: "wis", value: 10 }, { kind: "pool" })).toEqual({
      type: "clear",
      key: "wis",
    });
  });

  it("ignores a pool chip dropped back on the pool", () => {
    expect(resolveScoreDrop({ kind: "pool", value: 15 }, { kind: "pool" })).toBeNull();
  });

  it("ignores drops on empty space", () => {
    expect(resolveScoreDrop({ kind: "pool", value: 15 }, undefined)).toBeNull();
  });
});

describe("remainingPool", () => {
  it("removes assigned values from the pool", () => {
    expect(remainingPool([15, 14, 13, 12, 10, 8], [15, 13, 0, 0, 0, 0])).toEqual([14, 12, 10, 8]);
  });

  it("removes duplicates one at a time (rolled pools can repeat values)", () => {
    expect(remainingPool([12, 12, 12, 10, 9, 9], [12, 9, 0, 0, 0, 0])).toEqual([12, 12, 10, 9]);
  });

  it("ignores assigned values that are not in the pool", () => {
    expect(remainingPool([15, 14], [20, 0])).toEqual([15, 14]);
  });
});
