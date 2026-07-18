import { describe, expect, it } from "vitest";
import { parseEquipmentChoice } from "./equipmentChoice";

describe("parseEquipmentChoice", () => {
  it("splits plain item lists with no coin", () => {
    expect(parseEquipmentChoice("Leather Armor, Longbow, Quiver")).toEqual({
      items: ["Leather Armor", "Longbow", "Quiver"],
      coin: null,
    });
  });

  it("extracts a trailing gold amount in its own denomination", () => {
    expect(parseEquipmentChoice("Greataxe, Explorer's Pack, 15 GP")).toEqual({
      items: ["Greataxe", "Explorer's Pack"],
      coin: { key: "gp", amount: 15 },
    });
  });

  it("keeps non-gold coins in their native denomination instead of fractional gp", () => {
    expect(parseEquipmentChoice("Robe, 10 SP")).toEqual({
      items: ["Robe"],
      coin: { key: "sp", amount: 10 },
    });
  });

  it("is case-insensitive about the coin abbreviation", () => {
    expect(parseEquipmentChoice("50 gp").coin).toEqual({ key: "gp", amount: 50 });
  });

  it("does not mistake item counts for coins", () => {
    expect(parseEquipmentChoice("Shortbow, 20 Arrows")).toEqual({
      items: ["Shortbow", "20 Arrows"],
      coin: null,
    });
  });

  it("handles a coin-only option", () => {
    expect(parseEquipmentChoice("11 GP")).toEqual({ items: [], coin: { key: "gp", amount: 11 } });
  });
});
