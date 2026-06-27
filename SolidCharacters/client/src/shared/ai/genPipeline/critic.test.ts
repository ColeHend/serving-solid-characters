import { describe, it, expect, vi } from "vitest";
import type { ReviewIssue, ReviewSeverity, ReviewVerdict } from "../readiness/types";
import type { HomebrewPreview } from "../tools/toolDispatcher";
import type { WorkingClass } from "./types";

// assemble.ts → toolDispatcher → classRefs all read homebrewManager.classes(); stub it so the synthetic
// previews build without a real store.
vi.mock("../../customHooks/homebrewManager", () => ({ homebrewManager: { classes: () => [] } }));

import { critiqueClass, type ClassReviewer } from "./critic";

/**
 * Phase-F critic unit tests (plan §13 M3, §14): `critiqueClass` wraps the finished class as a synthetic
 * preview, runs an injected reviewer over it (class + each subclass), and maps a BLOCKING verdict that names
 * a feature back onto that feature so the orchestrator regenerates ONLY it. Warnings don't block; a clean
 * review yields nothing to regenerate.
 */

const WORKING: WorkingClass = {
    name: "Stormwarden", hitDie: "d10", primaryAbility: "STR",
    savingThrows: ["STR", "CON"],
    proficiencies: { armor: [], weapons: ["Martial weapons"], tools: [], skills: ["Athletics", "Intimidation"] },
    startingEquipment: [], casterType: "none",
    features: [
        { name: "Storm", level: 2, description: "A modest jolt: deal 1d6 thunder damage once per turn." },
        { name: "Storm's Charge", level: 1, description: "Gain 1 Charge when you take damage; spend it for +1d6 thunder." },
        { name: "Cataclysm", level: 5, description: "Deal 100d6 thunder damage to every creature you can see." },
    ],
    subclasses: [
        { name: "Path of Thunder", brief: "Channels the storm outward.", features: [
            { name: "Thunderclap", level: 3, description: "Push creatures within 10 feet 15 feet away." },
        ] },
    ],
};

const issue = (message: string, severity: ReviewSeverity = "error", field?: string): ReviewIssue => ({ severity, message, field });
const verdict = (issues: ReviewIssue[]): ReviewVerdict => ({ passId: "p", label: "Critic", pass: issues.length === 0, issues });
const PASS: ReviewVerdict = verdict([]);

/** A reviewer that returns canned verdicts by preview kind (class vs subclass). */
function reviewerBy(forClass: ReviewVerdict[], forSubclass: ReviewVerdict[] = [PASS]): ClassReviewer {
    return async (preview: HomebrewPreview) => (preview.kind === "class" ? forClass : forSubclass);
}

describe("critiqueClass", () => {
    it("flags a base-class feature named in a blocking verdict", async () => {
        const reviewer = reviewerBy([verdict([issue("Cataclysm is far stronger than a level-5 feature.", "error", "Cataclysm")])]);

        const res = await critiqueClass(WORKING, reviewer, { dndSystem: "both", blockingSeverity: "error" });

        expect(res.blocked).toBe(true);
        expect(res.flagged).toHaveLength(1);
        expect(res.flagged[0]).toMatchObject({ name: "Cataclysm", level: 5, subclass: undefined });
        expect(res.flagged[0].reason).toContain("stronger");
    });

    it("matches the longest feature name (Storm's Charge, not Storm) from the message alone", async () => {
        const reviewer = reviewerBy([verdict([issue("Storm's Charge generates unbounded resources.", "error")])]);

        const res = await critiqueClass(WORKING, reviewer, { dndSystem: "both", blockingSeverity: "error" });

        expect(res.flagged.map(f => f.name)).toEqual(["Storm's Charge"]);
    });

    it("does not flag a warning when the blocking threshold is error", async () => {
        const reviewer = reviewerBy([verdict([issue("Cataclysm reads a little strong.", "warning", "Cataclysm")])]);

        const res = await critiqueClass(WORKING, reviewer, { dndSystem: "both", blockingSeverity: "error" });

        expect(res.flagged).toEqual([]);
        expect(res.blocked).toBe(false);
    });

    it("maps a flagged subclass feature back to its subclass", async () => {
        const reviewer = reviewerBy([PASS], [verdict([issue("Thunderclap knocks prone with no save.", "error", "Thunderclap")])]);

        const res = await critiqueClass(WORKING, reviewer, { dndSystem: "both", blockingSeverity: "error" });

        expect(res.flagged).toHaveLength(1);
        expect(res.flagged[0]).toMatchObject({ name: "Thunderclap", level: 3, subclass: "Path of Thunder" });
    });

    it("reports nothing to regenerate for a clean class", async () => {
        const res = await critiqueClass(WORKING, reviewerBy([PASS], [PASS]), { dndSystem: "both", blockingSeverity: "error" });

        expect(res.flagged).toEqual([]);
        expect(res.blocked).toBe(false);
        expect(res.verdicts.length).toBeGreaterThan(0);   // the verdicts still surface for the UI
    });

    it("ignores a blocking issue that names no known feature (fail-open)", async () => {
        const reviewer = reviewerBy([verdict([issue("The class has an unintended dead level at 7.", "error")])]);

        const res = await critiqueClass(WORKING, reviewer, { dndSystem: "both", blockingSeverity: "error" });

        expect(res.flagged).toEqual([]);   // nothing to regenerate…
        expect(res.blocked).toBe(true);    // …but the verdict is still recorded as blocking
    });
});
