import { describe, it, expect } from "vitest";
import { summarize } from "./carryForward";
import type { WorkingCharacter, WorkingClass } from "./types";

describe("summarize — class", () => {
    it("lists name, die, primary ability, caster type, and features in level order", () => {
        const cls: WorkingClass = {
            name: "Stormwarden",
            hitDie: "d8",
            primaryAbility: "STR",
            casterType: "full",
            features: [
                { name: "Reckless", level: 2, description: "x" },
                { name: "Rage", level: 1, description: "x" },
            ],
            subclasses: [{ name: "Path of Thunder", features: [] }],
        };
        const s = summarize(cls, "class");
        expect(s).toContain("Class «Stormwarden»");
        expect(s).toContain("d8");
        expect(s).toContain("primary STR");
        expect(s).toContain("full caster");
        expect(s).toContain("features: Rage (L1), Reckless (L2)");
        expect(s).toContain("subclasses: Path of Thunder");
    });

    it("omits empty sections and falls back for an unnamed class", () => {
        expect(summarize({}, "class")).toBe("Class «(unnamed)»");
    });
});

describe("summarize — character", () => {
    it("renders identity, ability scores with mods, skills, and saves", () => {
        const ch: WorkingCharacter = {
            level: 5,
            lineage: "Hill Dwarf",
            className: "Barbarian",
            background: "Soldier",
            abilityScores: { str: 16, con: 15 },
            skills: ["Athletics", "Intimidation"],
            savingThrows: ["str", "con"],
        };
        const s = summarize(ch, "character");
        expect(s).toContain("L5 Hill Dwarf Barbarian (Soldier)");
        expect(s).toContain("STR16(+3)/CON15(+2)");
        expect(s).toContain("skills: Athletics, Intimidation");
        expect(s).toContain("saves: STR, CON");
    });

    it("handles a sparse character", () => {
        expect(summarize({ className: "Rogue" }, "character")).toBe("Rogue");
    });
});
