import { describe, it, expect } from "vitest";
import { toolCategory, COMPUTE_TOOL_NAMES, INTERACTIVE_TOOL_NAMES } from "./toolCategory";

describe("toolCategory", () => {
    it("classifies the compute tools", () => {
        for (const n of COMPUTE_TOOL_NAMES) expect(toolCategory(n)).toBe("compute");
    });
    it("classifies the interactive tools", () => {
        for (const n of INTERACTIVE_TOOL_NAMES) expect(toolCategory(n)).toBe("interactive");
    });
    it("defaults create_* and unknown names to homebrew (safety net)", () => {
        expect(toolCategory("create_spell")).toBe("homebrew");
        expect(toolCategory("create_class")).toBe("homebrew");
        expect(toolCategory("totally_made_up")).toBe("homebrew");
    });
});
