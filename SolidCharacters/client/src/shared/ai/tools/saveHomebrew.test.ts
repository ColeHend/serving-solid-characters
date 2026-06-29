import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Class5E } from "../../../models/generated";
import type { srdSubclass } from "../../../models/data/generated";

/**
 * `saveHomebrew` must report HONESTLY: it used to always return `{ok:true}` even when the homebrewManager
 * persisted nothing (a dedup no-op or a swallowed DB error), which made a failed save look successful (the
 * card vanished, the decision log recorded it) while nothing was written. These tests pin the new contract:
 * a manager add that resolves `false`/`null` or rejects ⇒ `{ok:false}`; a real persist ⇒ `{ok:true}`.
 */

const { addClassMock, addSubclassMock } = vi.hoisted(() => ({ addClassMock: vi.fn(), addSubclassMock: vi.fn() }));

vi.mock("../../customHooks/homebrewManager", () => ({
    homebrewManager: {
        classes: () => [], subclasses: () => [], feats: () => [], spells: () => [], items: () => [],
        magicItems: () => [], backgrounds: () => [], races: () => [],
        findSubclass: () => undefined,
        addClass: addClassMock,
        addSubclass: addSubclassMock,
    },
}));

import { saveHomebrew, type HomebrewPreview } from "./toolDispatcher";

const classPreview = (): HomebrewPreview => ({
    previewId: "p1", toolCallId: "t1", kind: "class", title: "Tester",
    entity: { name: "Tester" } as Class5E, valid: true, errors: [],
});
const subclassPreview = (): HomebrewPreview => ({
    previewId: "p2", toolCallId: "t2", kind: "subclass", title: "Tester Path",
    entity: { name: "Tester Path", parentClass: "Tester" } as srdSubclass, valid: true, errors: [],
});

describe("saveHomebrew — honest results", () => {
    beforeEach(() => { addClassMock.mockReset(); addSubclassMock.mockReset(); });

    it("reports success when the class actually persisted", async () => {
        addClassMock.mockResolvedValue(true);
        const r = await saveHomebrew(classPreview());
        expect(r.ok).toBe(true);
        expect(addClassMock).toHaveBeenCalledOnce();
    });

    it("reports failure (not phantom success) when the manager returns false", async () => {
        addClassMock.mockResolvedValue(false);
        const r = await saveHomebrew(classPreview());
        expect(r.ok).toBe(false);
    });

    it("reports failure when the manager returns null (dedup no-op)", async () => {
        addSubclassMock.mockResolvedValue(null);
        const r = await saveHomebrew(subclassPreview());
        expect(r.ok).toBe(false);
    });

    it("reports failure with the error message when the manager rejects", async () => {
        addClassMock.mockRejectedValue(new Error("DB write failed"));
        const r = await saveHomebrew(classPreview());
        expect(r.ok).toBe(false);
        expect(r.message).toContain("DB write failed");
    });

    it("reports success when the subclass persisted", async () => {
        addSubclassMock.mockResolvedValue(true);
        const r = await saveHomebrew(subclassPreview());
        expect(r.ok).toBe(true);
        expect(addSubclassMock).toHaveBeenCalledOnce();
    });

    it("refuses to save (and never calls the manager) when the entity is invalid", async () => {
        const r = await saveHomebrew({ ...classPreview(), valid: false, errors: ["Missing primary ability."] });
        expect(r.ok).toBe(false);
        expect(addClassMock).not.toHaveBeenCalled();
    });
});
