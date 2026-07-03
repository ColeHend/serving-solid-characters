import { describe, it, expect } from "vitest";
import { summarize, summarizeSubclass } from "./carryForward";
import type { WorkingCharacter, WorkingClass } from "./types";

describe("summarize — class", () => {
    it("lists name, die, primary ability, caster type, and features (with rules text) in level order", () => {
        const cls: WorkingClass = {
            name: "Stormwarden",
            hitDie: "d8",
            primaryAbility: "STR",
            casterType: "full",
            features: [
                { name: "Reckless", level: 2, description: "Attack with advantage; attacks against you also gain advantage.", resource: "Rage" },
                { name: "Rage", level: 1, description: "While raging you gain +2 melee damage." },
            ],
            subclasses: [{ name: "Path of Thunder", features: [] }],
        };
        const s = summarize(cls, "class");
        expect(s).toContain("Class «Stormwarden»");
        expect(s).toContain("d8");
        expect(s).toContain("primary STR");
        expect(s).toContain("full caster");
        // Features carry their rules text (so later features can coordinate numbers), level-ordered.
        expect(s).toContain("- Rage (L1): While raging you gain +2 melee damage.");
        expect(s).toContain("- Reckless (L2) [Rage]: Attack with advantage");
        expect(s.indexOf("Rage (L1)")).toBeLessThan(s.indexOf("Reckless (L2)"));
        expect(s).toContain("subclasses: Path of Thunder");
    });

    it("clips a runaway feature description to the digest budget", () => {
        const long = "A ".repeat(400).trim();
        const s = summarize({ name: "X", features: [{ name: "Big", level: 1, description: long }] }, "class");
        const line = s.split("\n").find(l => l.startsWith("- Big"))!;
        expect(line.length).toBeLessThan(250);
        expect(line.endsWith("…")).toBe(true);
    });

    it("omits empty sections and falls back for an unnamed class", () => {
        expect(summarize({}, "class")).toBe("Class «(unnamed)»");
    });
});

describe("summarizeSubclass", () => {
    it("includes base-class feature names so subclass features can't duplicate them", () => {
        const cls: WorkingClass = {
            name: "Stormwarden", hitDie: "d10", primaryAbility: "STR", coreMechanic: "Charge",
            features: [{ name: "Rage", level: 1, description: "x" }, { name: "Reckless", level: 2, description: "x" }],
        };
        const s = summarizeSubclass(cls, { name: "Path of Thunder", brief: "chained lightning", features: [] });
        expect(s).toContain("base features: Rage (L1), Reckless (L2)");
        expect(s).toContain("brief: chained lightning");
    });
});

describe("summarize — character", () => {
    it("renders identity, ability priority, ability scores with mods, skills, and saves", () => {
        const ch: WorkingCharacter = {
            level: 5,
            lineage: "Hill Dwarf",
            className: "Barbarian",
            background: "Soldier",
            abilityPriority: ["str", "con", "dex", "wis", "cha", "int"],
            abilityScores: { str: 16, con: 15 },
            skills: ["Athletics", "Intimidation"],
            savingThrows: ["str", "con"],
        };
        const s = summarize(ch, "character");
        expect(s).toContain("L5 Hill Dwarf Barbarian (Soldier)");
        // The ability-scores step is TOLD the priority lives in DECIDED SO FAR — it must actually be here.
        expect(s).toContain("ability priority: STR > CON > DEX > WIS > CHA > INT");
        expect(s).toContain("STR16(+3)/CON15(+2)");
        expect(s).toContain("skills: Athletics, Intimidation");
        expect(s).toContain("saves: STR, CON");
    });

    it("handles a sparse character", () => {
        expect(summarize({ className: "Rogue" }, "character")).toBe("Rogue");
    });
});
