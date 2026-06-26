import { describe, it, expect } from "vitest";
import { buildInteraction, interactionResultText } from "./interactions";
import type { AiToolCall } from "../types";

const call = (name: string, input: Record<string, unknown>): AiToolCall => ({ id: "tc1", name, input });

describe("buildInteraction — ask_user", () => {
    it("builds an ask card with index-based option ids", () => {
        const it = buildInteraction(call("ask_user", {
            prompt: "Pick", style: "directions",
            options: [{ label: "A", detail: "first" }, { label: "B" }], allowFreeText: true,
        }));
        expect(it.kind).toBe("ask");
        expect(it.title).toBe("Pick");
        expect(it.style).toBe("directions");
        expect(it.options).toEqual([
            { id: "opt-0", label: "A", detail: "first" },
            { id: "opt-1", label: "B", detail: undefined },
        ]);
        expect(it.allowFreeText).toBe(true);
    });
    it("forces free text when no options are given", () => {
        const it = buildInteraction(call("ask_user", { prompt: "Anything?" }));
        expect(it.options).toHaveLength(0);
        expect(it.allowFreeText).toBe(true);
    });
});

describe("buildInteraction — propose_plan", () => {
    it("builds a plan card with steps, constraints and rationale", () => {
        const it = buildInteraction(call("propose_plan", {
            goal: "Build X", steps: ["a", "b"], constraints: ["no spells"], rationale: "because",
        }));
        expect(it.kind).toBe("plan");
        expect(it.title).toBe("Build X");
        expect(it.steps).toEqual(["a", "b"]);
        expect(it.constraints).toEqual(["no spells"]);
        expect(it.body).toBe("because");
    });
});

describe("interactionResultText", () => {
    const ask = buildInteraction(call("ask_user", { prompt: "Pick", options: [{ label: "A", detail: "first" }] }));
    const plan = buildInteraction(call("propose_plan", { goal: "Build X", steps: ["a", "b"] }));

    it("option choice includes the label and detail", () => {
        expect(interactionResultText(ask, { type: "option", optionId: "opt-0", label: "A" })).toContain('"A" (first)');
    });
    it("free text carries the typed answer", () => {
        expect(interactionResultText(ask, { type: "freeText", text: "custom" })).toContain("custom");
    });
    it("plan approval embeds the goal and numbered steps", () => {
        const t = interactionResultText(plan, { type: "plan_accept" });
        expect(t).toContain("APPROVED");
        expect(t).toContain("Build X");
        expect(t).toContain("1. a");
        expect(t).toContain("2. b");
    });
    it("plan refine carries the change request", () => {
        expect(interactionResultText(plan, { type: "plan_refine", text: "add fire" })).toContain("add fire");
    });
    it("plan reject asks for a preference", () => {
        expect(interactionResultText(plan, { type: "plan_reject" })).toContain("rejected");
    });
});
