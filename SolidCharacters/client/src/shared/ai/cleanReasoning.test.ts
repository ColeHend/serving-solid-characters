import { describe, it, expect } from "vitest";
import { splitModelReasoning } from "./cleanReasoning";

describe("splitModelReasoning", () => {
    it("leaves a plain answer untouched", () => {
        const r = splitModelReasoning("I created Void-Sunder Gate for you.");
        expect(r.text).toBe("I created Void-Sunder Gate for you.");
        expect(r.reasoning).toBe("");
    });

    it("keeps only the final segment after a mangled <channel|> blob (the reported case)", () => {
        const raw = "thought The user wants a 9th-level teleport spell. I will summarize it.<channel|>I have created Void-Sunder Gate for you. It's a 9th-level Conjuration spell.";
        const r = splitModelReasoning(raw);
        expect(r.text).toBe("I have created Void-Sunder Gate for you. It's a 9th-level Conjuration spell.");
        expect(r.text).not.toContain("<channel|>");
        expect(r.text).not.toMatch(/^thought/);
        expect(r.reasoning).toContain("The user wants");
    });

    it("handles harmony channel markers, keeping the final channel", () => {
        const raw = "<|channel|>analysis<|message|>Let me think about balance.<|channel|>final<|message|>Here is your spell.";
        const r = splitModelReasoning(raw);
        expect(r.text).toBe("Here is your spell.");
        expect(r.reasoning).toContain("Let me think about balance.");
        expect(r.text).not.toContain("<|");
    });

    it("handles <think></think> tags", () => {
        const r = splitModelReasoning("<think>weigh the options</think>The answer.");
        expect(r.text).toBe("The answer.");
        expect(r.reasoning).toContain("weigh the options");
    });

    it("strips stray control tokens from the answer", () => {
        const r = splitModelReasoning("Answer<|end|>");
        expect(r.text).toBe("Answer");
    });

    it("yields empty text when the model produced only reasoning", () => {
        const r = splitModelReasoning("thinking out loud<channel|>");
        expect(r.text).toBe("");
        expect(r.reasoning).toContain("thinking out loud");
    });
});
