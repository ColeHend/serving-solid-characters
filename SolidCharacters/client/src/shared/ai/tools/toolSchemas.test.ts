import { describe, it, expect } from "vitest";
import { HOMEBREW_TOOLS, allowedKinds, filterTools } from "./toolSchemas";
import { HOMEBREW_KINDS } from "../refs/homebrewKind";
import { ToolPermissions } from "../../../models/userSettings";

const names = (tools: { name: string }[]) => tools.map(t => t.name).sort();

describe("allowedKinds", () => {
    it("returns every kind for mode 'all'", () => {
        expect(allowedKinds({ mode: "all" })).toEqual(HOMEBREW_KINDS);
    });

    it("returns every kind when permissions are undefined", () => {
        expect(allowedKinds(undefined)).toEqual(HOMEBREW_KINDS);
    });

    it("returns only the listed kinds for mode 'allow'", () => {
        expect(allowedKinds({ mode: "allow", allowed: ["spell", "feat"] })).toEqual(["spell", "feat"]);
    });

    it("treats a missing allow list as empty (nothing permitted)", () => {
        expect(allowedKinds({ mode: "allow" })).toEqual([]);
    });

    it("returns every kind except the denied ones for mode 'deny'", () => {
        const result = allowedKinds({ mode: "deny", denied: ["class", "subclass"] });
        expect(result).not.toContain("class");
        expect(result).not.toContain("subclass");
        expect(result).toContain("spell");
        expect(result.length).toBe(HOMEBREW_KINDS.length - 2);
    });

    it("returns nothing when every kind is denied", () => {
        expect(allowedKinds({ mode: "deny", denied: [...HOMEBREW_KINDS] })).toEqual([]);
    });

    it("preserves canonical kind order regardless of input order", () => {
        expect(allowedKinds({ mode: "allow", allowed: ["class", "spell"] })).toEqual(["spell", "class"]);
    });
});

describe("filterTools", () => {
    it("returns all create_* tools for mode 'all'", () => {
        expect(filterTools(HOMEBREW_TOOLS, { mode: "all" }).length).toBe(HOMEBREW_TOOLS.length);
    });

    it("maps allowed kinds to their create_* tool names", () => {
        const perms: ToolPermissions = { mode: "allow", allowed: ["spell", "magic_item"] };
        expect(names(filterTools(HOMEBREW_TOOLS, perms))).toEqual(["create_magic_item", "create_spell"]);
    });

    it("excludes denied kinds' tools", () => {
        const result = filterTools(HOMEBREW_TOOLS, { mode: "deny", denied: ["class"] });
        expect(result.map(t => t.name)).not.toContain("create_class");
        expect(result.length).toBe(HOMEBREW_TOOLS.length - 1);
    });

    it("returns no tools when everything is denied", () => {
        expect(filterTools(HOMEBREW_TOOLS, { mode: "deny", denied: [...HOMEBREW_KINDS] })).toEqual([]);
    });
});
