import { describe, it, expect, vi } from "vitest";

const spells = Array.from({ length: 6 }, (_, i) => ({ name: `Spell ${i}`, level: "1", school: "Evocation", description: `Effect ${i}.` }));
spells.push({ name: "Fireball", level: "3", school: "Evocation", description: "A bright streak flashes to a point and blossoms into flame, 8d6 fire damage." });

vi.mock("../../customHooks/homebrewManager", () => ({
    homebrewManager: {
        spells: () => spells,
        items: () => [], magicItems: () => [], feats: () => [],
        backgrounds: () => [], races: () => [], subclasses: () => [], classes: () => [],
    },
}));
// Stub the SRD loaders so importing lookupTools doesn't pull Dexie into the test.
vi.mock("../../customHooks/dndInfo/info/srd/spells", () => ({ loadSrdSpells: async () => ({ rows: [], ok: true }) }));
vi.mock("../../customHooks/dndInfo/info/srd/classes", () => ({ loadSrdClasses: async () => ({ rows: [], ok: true }) }));
vi.mock("../../customHooks/dndInfo/info/srd/races", () => ({ loadSrdRaces: async () => ({ rows: [], ok: true }) }));
vi.mock("../../customHooks/dndInfo/info/srd/feats", () => ({ loadSrdFeats: async () => ({ rows: [], ok: true }) }));
vi.mock("../../customHooks/dndInfo/info/srd/backgrounds", () => ({ loadSrdBackgrounds: async () => ({ rows: [], ok: true }) }));
vi.mock("../../customHooks/dndInfo/info/srd/items", () => ({ loadSrdItems: async () => ({ rows: [], ok: true }) }));
vi.mock("../../customHooks/dndInfo/info/srd/magicItems", () => ({ loadSrdMagicItems: async () => ({ rows: [], ok: true }) }));
vi.mock("../../customHooks/dndInfo/info/srd/subclasses", () => ({ loadSrdSubclasses: async () => ({ rows: [], ok: true }) }));

import { runLookupTool } from "./lookupTools";
import type { AiToolCall } from "../types";

const lookup = (name: string, input: Record<string, unknown>): AiToolCall => ({ id: "t1", name, input });

describe("runLookupTool (homebrew)", () => {
    it("returns a names-only list when many match", async () => {
        const r = await runLookupTool(lookup("lookup_homebrew", { kind: "spell", query: "spell" }));
        expect(r.isError).toBe(false);
        expect(r.content).toMatch(/matches/i);
        expect(r.content).toContain("Spell 0");
    });

    it("returns a detailed summary for an exact single match", async () => {
        const r = await runLookupTool(lookup("lookup_homebrew", { kind: "spell", query: "Fireball" }));
        expect(r.content).toContain("Fireball");
        expect(r.content).toMatch(/8d6/);
    });

    it("reports no match cleanly", async () => {
        const r = await runLookupTool(lookup("lookup_homebrew", { kind: "spell", query: "nonexistent" }));
        expect(r.isError).toBe(false);
        expect(r.content).toMatch(/no homebrew spell matches/i);
    });

    it("rejects an unknown kind", async () => {
        const r = await runLookupTool(lookup("lookup_homebrew", { kind: "potion", query: "x" }));
        expect(r.isError).toBe(true);
    });
});
