import { describe, it, expect, vi } from "vitest";

vi.mock("../customHooks/homebrewManager", () => ({ homebrewManager: { classes: () => [] } }));

import { buildPreview } from "./toolDispatcher";
import type { AiToolCall } from "./types";

const call = (name: string, input: Record<string, unknown>): AiToolCall => ({ id: "t1", name, input });

describe("buildPreview — description is a hard failure", () => {
    it("marks a spell with no description invalid", () => {
        const p = buildPreview(call("create_spell", { name: "Bolt", level: 0 }));
        expect(p.valid).toBe(false);
        expect(p.errors).toContain("Missing description.");
    });

    it("accepts a spell that has a description", () => {
        const p = buildPreview(call("create_spell", { name: "Bolt", description: "1d10 fire on a hit.", level: 0 }));
        expect(p.valid).toBe(true);
        expect(p.errors).not.toContain("Missing description.");
    });

    it("does not list description twice (hard error, not also a soft warning)", () => {
        const p = buildPreview(call("create_spell", { name: "Bolt", level: 0 }));
        expect((p.warnings ?? []).some(w => /description/i.test(w))).toBe(false);
    });

    it("requires a description on feats, magic items, backgrounds and subclasses", () => {
        expect(buildPreview(call("create_feat", { name: "X" })).errors).toContain("Missing description.");
        expect(buildPreview(call("create_magic_item", { name: "X", rarity: "Rare" })).errors).toContain("Missing description.");
        expect(buildPreview(call("create_background", { name: "X" })).errors).toContain("Missing description.");
        expect(buildPreview(call("create_subclass", { name: "X", parentClass: "Wizard" })).errors).toContain("Missing description.");
    });

    it("exempts races and classes (no single description field)", () => {
        const race = buildPreview(call("create_race", { name: "Emberkin", size: "Medium", speed: 30 }));
        expect(race.errors).not.toContain("Missing description.");
        expect(race.valid).toBe(true);

        const klass = buildPreview(call("create_class", { name: "Warden", hitDie: "d10", primaryAbility: "WIS", savingThrows: ["CON", "WIS"] }));
        expect(klass.errors).not.toContain("Missing description.");
        expect(klass.valid).toBe(true);
    });
});
