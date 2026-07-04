import { describe, it, expect } from "vitest";
import { num } from "../coerce";
import type { AiToolDef, TokenUsage } from "../types";
import type { AiSettings } from "../../../models/userSettings";
import type { SubAgentResult } from "../subAgent";
import { runStep, StepModelRunner } from "./stepWorker";
import type { StepSpec } from "./types";

/** runStep must SUM the token usage of every attempt (a step that burns a repair costs both attempts). */

const TOOL: AiToolDef = {
    name: "fill_n",
    description: "Provide n.",
    inputSchema: { type: "object", additionalProperties: false, properties: { n: { type: "number" } }, required: ["n"] },
};
const STEP: StepSpec<{ n: number }> = {
    id: "test-step", tool: TOOL, system: "s", task: "t",
    parse: raw => { const n = num(raw.n, NaN); return { value: { n }, errors: Number.isFinite(n) && n > 0 ? [] : ["bad"] }; },
};
const AI = { provider: "local", model: "test", localBaseUrl: "", enabled: true } as AiSettings;

const call = (n: number, usage?: TokenUsage): SubAgentResult => ({ text: "", toolCalls: [{ id: "c", name: "fill_n", input: { n } }], ok: true, usage });

function scripted(responses: SubAgentResult[]): StepModelRunner {
    let i = 0;
    return async () => responses[Math.min(i++, responses.length - 1)];
}

describe("runStep — usage summing", () => {
    it("returns the single attempt's usage on a clean pass", async () => {
        const res = await runStep(STEP, {}, AI, {}, scripted([call(5, { inputTokens: 12, outputTokens: 6 })]));
        expect(res.ok).toBe(true);
        expect(res.usage).toEqual({ inputTokens: 12, outputTokens: 6 });
    });

    it("SUMS usage across a gate-repair (fail then pass)", async () => {
        const res = await runStep(STEP, {}, AI, { repairBudget: 1 }, scripted([
            call(-1, { inputTokens: 10, outputTokens: 5 }),   // gate fail → repair
            call(5, { inputTokens: 20, outputTokens: 8 }),    // pass
        ]));
        expect(res.ok).toBe(true);
        expect(res.usage).toEqual({ inputTokens: 30, outputTokens: 13 });
    });

    it("carries the accumulated usage even when the step ultimately fails", async () => {
        const res = await runStep(STEP, {}, AI, { repairBudget: 1 }, scripted([
            call(-1, { inputTokens: 4, outputTokens: 2 }),
            call(-1, { inputTokens: 4, outputTokens: 2 }),
        ]));
        expect(res.ok).toBe(false);
        expect(res.usage).toEqual({ inputTokens: 8, outputTokens: 4 });
    });
});
