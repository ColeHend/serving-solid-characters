import { describe, it, expect, vi, beforeEach } from "vitest";
import type { HomebrewPreview } from "../tools/toolDispatcher";
import type { HomebrewKind } from "../refs/homebrewKind";

// homebrewManager subscribes to IndexedDB on construction; mock it so broken-reference checks read a
// controllable class list and the real store never boots in tests.
const h = vi.hoisted(() => ({ classes: [] as { name: string }[] }));
vi.mock("../../customHooks/homebrewManager", () => ({ homebrewManager: { classes: () => h.classes } }));

import { brokenReferenceVerdict, linterVerdict, schemaVerdict } from "./deterministicPasses";

function preview(kind: HomebrewKind, entity: unknown, extra: Partial<HomebrewPreview> = {}): HomebrewPreview {
    return {
        previewId: "p1", toolCallId: "t1", kind, title: (entity as { name?: string }).name ?? "X",
        entity: entity as HomebrewPreview["entity"], valid: true, errors: [], ...extra,
    };
}

beforeEach(() => { h.classes = []; });

describe("schemaVerdict", () => {
    it("passes a valid preview with no issues", () => {
        const v = schemaVerdict(preview("spell", { name: "Bolt" }), "schema_validate");
        expect(v.pass).toBe(true);
        expect(v.issues).toEqual([]);
    });

    it("fails an invalid preview, surfacing each error", () => {
        const p = preview("race", { name: "" }, { valid: false, errors: ["Missing name.", "Missing size."] });
        const v = schemaVerdict(p, "schema_validate");
        expect(v.pass).toBe(false);
        expect(v.issues.map(i => i.message)).toEqual(["Missing name.", "Missing size."]);
        expect(v.issues.every(i => i.severity === "error")).toBe(true);
    });

    it("labels the final re-check distinctly", () => {
        expect(schemaVerdict(preview("spell", { name: "X" }), "schema_validate_final").label).toBe("Schema re-check");
    });
});

describe("brokenReferenceVerdict", () => {
    it("passes a subclass whose parent is an official class", () => {
        const v = brokenReferenceVerdict(preview("subclass", { name: "Path", parentClass: "Barbarian" }));
        expect(v.pass).toBe(true);
    });

    it("errors (blocking) on a subclass with an unknown parent class", () => {
        const v = brokenReferenceVerdict(preview("subclass", { name: "Path", parentClass: "Wzard" }));
        expect(v.pass).toBe(false);
        expect(v.issues[0].severity).toBe("error");
        expect(v.issues[0].field).toBe("parentClass");
    });

    it("resolves a parent against the user's homebrew classes", () => {
        h.classes = [{ name: "Warden" }];
        expect(brokenReferenceVerdict(preview("subclass", { name: "X", parentClass: "Warden" })).pass).toBe(true);
    });

    it("warns (non-blocking) on a spell that lists an unknown class", () => {
        const v = brokenReferenceVerdict(preview("spell", { name: "Bolt", classes: ["Wizard", "Banana"] }));
        expect(v.pass).toBe(false);
        expect(v.issues).toHaveLength(1);
        expect(v.issues[0].severity).toBe("warning");
    });

    it("passes a spell whose classes are all known", () => {
        expect(brokenReferenceVerdict(preview("spell", { name: "Bolt", classes: ["Wizard", "Cleric"] })).pass).toBe(true);
    });
});

describe("linterVerdict", () => {
    it("flags non-5e terminology with a suggested fix", () => {
        const v = linterVerdict(preview("spell", { name: "Bolt", description: "The target must make a saving roll." }));
        expect(v.pass).toBe(false);
        expect(v.issues[0].severity).toBe("warning");
        expect(v.issues[0].suggestedFix).toContain("saving throw");
    });

    it("flags placeholder text", () => {
        const v = linterVerdict(preview("feat", { name: "Stub", details: { description: "TODO write this" } }));
        expect(v.pass).toBe(false);
        expect(v.issues.some(i => /TODO/i.test(i.message))).toBe(true);
    });

    it("passes clean rules text", () => {
        const v = linterVerdict(preview("spell", { name: "Bolt", description: "Make a ranged spell attack; on a hit the target takes 1d10 fire damage." }));
        expect(v.pass).toBe(true);
    });
});
