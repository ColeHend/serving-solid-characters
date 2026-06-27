import { describe, it, expect } from "vitest";
import { CREATE_CLASS_TOOL, HOMEBREW_TOOLS, allowedKinds, filterPipelineTools, filterTools, requiredFieldsForKind } from "./toolSchemas";
import { HOMEBREW_KINDS } from "../refs/homebrewKind";
import { ToolPermissions } from "../../../models/userSettings";

// M4 moved create_class out of the model-facing HOMEBREW_TOOLS but kept the schema for the assemble path,
// so required-field lookups search both.
const reqOf = (toolName: string) =>
    ([...HOMEBREW_TOOLS, CREATE_CLASS_TOOL].find(t => t.name === toolName)?.inputSchema as { required?: string[] }).required ?? [];

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
        const result = filterTools(HOMEBREW_TOOLS, { mode: "deny", denied: ["spell"] });
        expect(result.map(t => t.name)).not.toContain("create_spell");
        expect(result.length).toBe(HOMEBREW_TOOLS.length - 1);
    });

    it("returns no tools when everything is denied", () => {
        expect(filterTools(HOMEBREW_TOOLS, { mode: "deny", denied: [...HOMEBREW_KINDS] })).toEqual([]);
    });
});

describe("M4 — create_class is no longer a one-shot, model-facing tool", () => {
    it("HOMEBREW_TOOLS does not offer create_class to the model", () => {
        expect(HOMEBREW_TOOLS.map(t => t.name)).not.toContain("create_class");
    });

    it("filterTools never yields create_class, even with class fully permitted", () => {
        expect(filterTools(HOMEBREW_TOOLS, { mode: "all" }).map(t => t.name)).not.toContain("create_class");
        expect(filterTools(HOMEBREW_TOOLS, { mode: "allow", allowed: ["class"] })).toEqual([]);
    });

    it("keeps the create_class schema for the internal assemble path (still complete)", () => {
        expect(CREATE_CLASS_TOOL.name).toBe("create_class");
        expect((CREATE_CLASS_TOOL.inputSchema as { required?: string[] }).required).toContain("features");
    });
});

describe("filterPipelineTools — staged class generation is gated by the class create permission", () => {
    it("offers generate_class when class creation is permitted", () => {
        expect(names(filterPipelineTools({ mode: "all" }))).toEqual(["generate_class"]);
        expect(names(filterPipelineTools(undefined))).toEqual(["generate_class"]);
    });

    it("withholds generate_class when class is denied", () => {
        expect(filterPipelineTools({ mode: "deny", denied: ["class"] })).toEqual([]);
    });

    it("withholds generate_class when the allow list omits class", () => {
        expect(filterPipelineTools({ mode: "allow", allowed: ["spell", "feat"] })).toEqual([]);
    });

    it("offers generate_class when class is explicitly allowed", () => {
        expect(names(filterPipelineTools({ mode: "allow", allowed: ["class"] }))).toEqual(["generate_class"]);
    });
});

describe("schema correctness fixes", () => {
    it("requires features on subclass and class (no more empty-feature entities)", () => {
        expect(reqOf("create_subclass")).toContain("features");
        expect(reqOf("create_class")).toContain("features");
    });

    it("requiredFieldsForKind reads the kind's create_* required list", () => {
        expect(requiredFieldsForKind("class")).toContain("features");
        expect(requiredFieldsForKind("spell")).toContain("description");
    });

    it("no tool description still says 'Fill EVERY field' (it contradicted the optional schema)", () => {
        expect(HOMEBREW_TOOLS.some(t => /fill every field/i.test(t.description))).toBe(false);
    });

    it("no field description repeats 'never leave empty' (canonical in the quality bar now)", () => {
        const fieldDescs = HOMEBREW_TOOLS.flatMap(t => {
            const props = (t.inputSchema as { properties?: Record<string, { description?: string }> }).properties ?? {};
            return Object.values(props).map(p => p.description ?? "");
        });
        expect(fieldDescs.some(d => /never leave empty/i.test(d))).toBe(false);
    });
});

describe("example themes are diversified (only the spell example is fire)", () => {
    it("limits fire/ember/cinder/ash flavor to create_spell", () => {
        const fireToolNames = HOMEBREW_TOOLS
            .filter(t => /\b(fire|ember|cinder|ashfall)\b/i.test(t.description))
            .map(t => t.name);
        expect(fireToolNames).toEqual(["create_spell"]);
    });
});
