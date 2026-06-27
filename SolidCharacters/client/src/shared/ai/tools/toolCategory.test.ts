import { describe, it, expect } from "vitest";
import { toolCategory, COMPUTE_TOOL_NAMES, INTERACTIVE_TOOL_NAMES, PIPELINE_TOOL_NAMES } from "./toolCategory";

describe("toolCategory", () => {
    it("classifies the compute tools", () => {
        for (const n of COMPUTE_TOOL_NAMES) expect(toolCategory(n)).toBe("compute");
    });
    it("classifies the interactive tools", () => {
        for (const n of INTERACTIVE_TOOL_NAMES) expect(toolCategory(n)).toBe("interactive");
    });
    it("routes the staged-generation seed tools to the pipeline path", () => {
        for (const n of PIPELINE_TOOL_NAMES) expect(toolCategory(n)).toBe("pipeline");
        expect(toolCategory("generate_class")).toBe("pipeline");
    });
    it("defaults create_* and unknown names to homebrew (safety net)", () => {
        expect(toolCategory("create_spell")).toBe("homebrew");
        // create_class stays a homebrew-path name: it is still dispatched internally by the assemble step,
        // even though it is no longer offered to the model directly (M4).
        expect(toolCategory("create_class")).toBe("homebrew");
        expect(toolCategory("totally_made_up")).toBe("homebrew");
    });
});
