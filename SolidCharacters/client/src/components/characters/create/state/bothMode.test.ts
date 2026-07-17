import { describe, expect, it } from "vitest";
import {
  editionSideOf,
  filterPool,
  hasVariantOnSide,
  isLegacy,
  preferCurrent,
  resolveVariant,
  withVariantFirst,
} from "./bothMode";

interface Row {
  name?: string;
  legacy?: boolean;
  tag?: string;
}

const legacyHuman: Row = { name: "Human", legacy: true, tag: "2014" };
const currentHuman: Row = { name: "Human", tag: "2024" };
const halfElf: Row = { name: "Half-Elf", legacy: true };
const aasimar: Row = { name: "Aasimar" };
const homebrew: Row = { name: "Catfolk" };

const merged = [legacyHuman, halfElf, currentHuman, aasimar, homebrew];

describe("preferCurrent", () => {
  it("picks the current row over the legacy one regardless of order", () => {
    expect(preferCurrent([legacyHuman, currentHuman])?.tag).toBe("2024");
    expect(preferCurrent([currentHuman, legacyHuman])?.tag).toBe("2024");
  });

  it("falls back to the only variant, and to undefined for none", () => {
    expect(preferCurrent([halfElf])).toBe(halfElf);
    expect(preferCurrent([])).toBeUndefined();
    expect(isLegacy(preferCurrent([halfElf]))).toBe(true);
  });
});

describe("editionSideOf", () => {
  it("anchors legacy for a 2014-only name and current for a 2024-only name", () => {
    expect(editionSideOf(merged, "Half-Elf")).toBe(true);
    expect(editionSideOf(merged, "Aasimar")).toBe(false);
  });

  it("does not anchor names that exist on both sides, are missing, or blank", () => {
    expect(editionSideOf(merged, "Human")).toBeUndefined();
    expect(editionSideOf(merged, "Warforged")).toBeUndefined();
    expect(editionSideOf(merged, "")).toBeUndefined();
  });

  it("treats homebrew (no legacy flag) as current", () => {
    expect(editionSideOf(merged, "Catfolk")).toBe(false);
  });

  it("supports a custom name selector (feats key on details.name)", () => {
    const feats = [{ legacy: true, details: { name: "Alert" } }];
    expect(editionSideOf(feats, "Alert", (f) => f.details?.name)).toBe(true);
  });
});

describe("hasVariantOnSide", () => {
  it("checks the requested side and accepts anything when unconstrained", () => {
    expect(hasVariantOnSide(merged, "Human", true)).toBe(true);
    expect(hasVariantOnSide(merged, "Aasimar", true)).toBe(false);
    expect(hasVariantOnSide(merged, "Aasimar", false)).toBe(true);
    expect(hasVariantOnSide(merged, "Aasimar", undefined)).toBe(true);
  });
});

describe("filterPool", () => {
  it("keeps everything (both variants side by side) when no side is anchored", () => {
    expect(filterPool(merged, undefined)).toBe(merged);
  });

  it("narrows to the legacy side, surfacing the legacy variant of collided names", () => {
    const pool = filterPool(merged, true);
    expect(pool.map((r) => r.name).sort()).toEqual(["Half-Elf", "Human"]);
    expect(pool.find((r) => r.name === "Human")?.tag).toBe("2014");
  });

  it("narrows to the current side, where homebrew also lives", () => {
    const pool = filterPool(merged, false);
    expect(pool.map((r) => r.name).sort()).toEqual(["Aasimar", "Catfolk", "Human"]);
  });
});

describe("resolveVariant", () => {
  it("resolves the current variant when unconstrained", () => {
    expect(resolveVariant(merged, "Human", undefined)?.tag).toBe("2024");
  });

  it("resolves the edition-side variant when a side is anchored", () => {
    expect(resolveVariant(merged, "Human", true)?.tag).toBe("2014");
    expect(resolveVariant(merged, "Human", false)?.tag).toBe("2024");
  });

  it("falls back to the current variant when the anchored side has no row", () => {
    expect(resolveVariant(merged, "Aasimar", true)).toBe(aasimar);
  });

  it("returns undefined for blank or unknown names", () => {
    expect(resolveVariant(merged, "", true)).toBeUndefined();
    expect(resolveVariant(merged, "Warforged", undefined)).toBeUndefined();
  });
});

describe("withVariantFirst", () => {
  it("prepends the resolved variant so first-match lookups hit it", () => {
    expect(withVariantFirst(merged, legacyHuman)[0]).toBe(legacyHuman);
    expect(withVariantFirst(merged, undefined)).toBe(merged);
  });
});
