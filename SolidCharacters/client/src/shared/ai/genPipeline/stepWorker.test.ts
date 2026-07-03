import { describe, it, expect } from "vitest";
import { num } from "../coerce";
import type { AiToolDef } from "../types";
import type { AiSettings } from "../../../models/userSettings";
import type { SubAgentResult } from "../subAgent";
import { runStep, StepModelRunner } from "./stepWorker";
import type { ConceptBrief, StepSpec } from "./types";

// ── A minimal step under test: "produce a positive integer n". ──
const TOOL: AiToolDef = {
    name: "fill_n",
    description: "Provide n.",
    inputSchema: { type: "object", additionalProperties: false, properties: { n: { type: "number" } }, required: ["n"] },
};

const STEP: StepSpec<{ n: number }> = {
    id: "test-step",
    tool: TOOL,
    system: "Produce a single positive integer.",
    task: "Provide a positive integer n.",
    parse: raw => {
        const n = num(raw.n, NaN);
        return { value: { n }, errors: Number.isFinite(n) && n > 0 ? [] : ["n must be a positive number"] };
    },
};

const AI = { provider: "local", model: "test", localBaseUrl: "", enabled: true } as AiSettings;

// ── Stub runner: returns scripted SubAgentResults in order, recording each task string it was given. ──
function scriptedRunner(responses: SubAgentResult[]) {
    let i = 0;
    const calls: string[] = [];
    const runner: StepModelRunner = async (_spec, task) => {
        calls.push(task);
        const r = responses[Math.min(i, responses.length - 1)];
        i++;
        return r;
    };
    return { runner, calls, get count() { return i; } };
}

const toolCall = (input: Record<string, unknown>): SubAgentResult => ({ text: "", toolCalls: [{ id: "c1", name: "fill_n", input }], ok: true });
const prose = (): SubAgentResult => ({ text: "here you go", toolCalls: [], ok: true });
const errored = (): SubAgentResult => ({ text: "", toolCalls: [], ok: false });

describe("runStep", () => {
    it("returns the gated value on a clean first attempt", async () => {
        const sr = scriptedRunner([toolCall({ n: 5, fits_concept: "serves the concept" })]);
        const res = await runStep(STEP, {}, AI, {}, sr.runner);
        expect(res.ok).toBe(true);
        expect(res.value).toEqual({ n: 5 });
        expect(res.attempts).toBe(1);
        expect(res.fitsConcept).toBe("serves the concept");
    });

    it("repairs a forced-bad step: re-runs with the gate errors appended, then passes", async () => {
        const sr = scriptedRunner([toolCall({ n: -1 }), toolCall({ n: 7 })]);
        const res = await runStep(STEP, {}, AI, { repairBudget: 1 }, sr.runner);
        expect(res.ok).toBe(true);
        expect(res.value).toEqual({ n: 7 });
        expect(res.attempts).toBe(2);
        // the repair attempt must carry the prior failure's reason
        expect(sr.calls[1]).toContain("FIX THESE PROBLEMS");
        expect(sr.calls[1]).toContain("n must be a positive number");
    });

    it("surfaces the last failing attempt when the repair budget is exhausted", async () => {
        const sr = scriptedRunner([toolCall({ n: -1 }), toolCall({ n: -2 })]);
        const res = await runStep(STEP, {}, AI, { repairBudget: 1 }, sr.runner);
        expect(res.ok).toBe(false);
        expect(res.attempts).toBe(2);
        expect(res.value).toEqual({ n: -2 });
        expect(res.errors.length).toBeGreaterThan(0);
    });

    it("treats a prose (no tool call) turn as a step failure and repairs", async () => {
        const sr = scriptedRunner([prose(), toolCall({ n: 3 })]);
        const res = await runStep(STEP, {}, AI, { repairBudget: 1 }, sr.runner);
        expect(res.ok).toBe(true);
        expect(res.value).toEqual({ n: 3 });
        expect(res.attempts).toBe(2);
        expect(sr.calls[1]).toContain("You did not call the tool last time");
    });

    it("flags noToolCall when the model never calls the tool within budget", async () => {
        const sr = scriptedRunner([prose(), prose()]);
        const res = await runStep(STEP, {}, AI, { repairBudget: 1 }, sr.runner);
        expect(res.ok).toBe(false);
        expect(res.noToolCall).toBe(true);
    });

    it("treats a provider error like a missing tool call", async () => {
        const sr = scriptedRunner([errored(), toolCall({ n: 2 })]);
        const res = await runStep(STEP, {}, AI, { repairBudget: 1 }, sr.runner);
        expect(res.ok).toBe(true);
        expect(res.value).toEqual({ n: 2 });
    });

    it("honors repairBudget 0 (single attempt, no repair)", async () => {
        const sr = scriptedRunner([toolCall({ n: -1 })]);
        const res = await runStep(STEP, {}, AI, { repairBudget: 0 }, sr.runner);
        expect(res.attempts).toBe(1);
        expect(res.ok).toBe(false);
    });

    it("returns immediately (no model calls) when the signal is already aborted", async () => {
        const ctrl = new AbortController();
        ctrl.abort();
        const sr = scriptedRunner([toolCall({ n: 5 })]);
        const res = await runStep(STEP, {}, AI, { signal: ctrl.signal }, sr.runner);
        expect(res.aborted).toBe(true);
        expect(res.ok).toBe(false);
        expect(sr.count).toBe(0);
    });

    it("salvages a JSON object the model wrote as text (```json block) instead of calling the tool", async () => {
        const sr = scriptedRunner([{ text: "Sure!\n```json\n{ \"n\": 9 }\n```", toolCalls: [], ok: true }]);
        const res = await runStep(STEP, {}, AI, {}, sr.runner);
        expect(res.ok).toBe(true);
        expect(res.value).toEqual({ n: 9 });
        expect(res.attempts).toBe(1);   // salvaged on the first turn — no wasted retry
    });

    it("salvages a bare JSON object embedded in prose", async () => {
        const sr = scriptedRunner([{ text: "Here it is: { \"n\": 8 } — done.", toolCalls: [], ok: true }]);
        const res = await runStep(STEP, {}, AI, {}, sr.runner);
        expect(res.ok).toBe(true);
        expect(res.value).toEqual({ n: 8 });
    });

    it("retries a prose reply on its OWN budget, not the (exhausted) gate-repair budget", async () => {
        // repairBudget 0 → no gate repairs; but prose replies still retry via the default toolCallRetries (2).
        const sr = scriptedRunner([prose(), prose(), toolCall({ n: 4 })]);
        const res = await runStep(STEP, {}, AI, { repairBudget: 0 }, sr.runner);
        expect(res.ok).toBe(true);
        expect(res.value).toEqual({ n: 4 });
        expect(res.attempts).toBe(3);
    });

    it("ends with an actionable message when the model never calls the tool", async () => {
        const sr = scriptedRunner([prose(), prose(), prose(), prose()]);
        const res = await runStep(STEP, {}, AI, {}, sr.runner);
        expect(res.ok).toBe(false);
        expect(res.noToolCall).toBe(true);
        expect(res.errors[0]).toContain("replied with text instead of filling in fill_n");
    });

    it("honors toolCallRetries 0 (a single prose reply fails immediately)", async () => {
        const sr = scriptedRunner([prose(), toolCall({ n: 1 })]);
        const res = await runStep(STEP, {}, AI, { toolCallRetries: 0 }, sr.runner);
        expect(res.attempts).toBe(1);
        expect(res.ok).toBe(false);
        expect(res.noToolCall).toBe(true);
    });

    it("injects the brief, carry-forward summary, and scoped homebrew into the task", async () => {
        const brief: ConceptBrief = {
            concept: "C", tone: "T", power_tier: "P",
            motifs: ["m1", "m2"], themes: ["th"], naming_style: "N", constraints: [],
        };
        const sr = scriptedRunner([toolCall({ n: 1 })]);
        await runStep(STEP, { brief, summary: "DECIDED DETAIL", scopedHomebrew: "HOMEBREW DEF" }, AI, {}, sr.runner);
        const task = sr.calls[0];
        expect(task).toContain("CONCEPT BRIEF");
        expect(task).toContain("Concept: C");
        expect(task).toContain("Motifs: m1, m2");
        expect(task).toContain("DECIDED SO FAR");
        expect(task).toContain("DECIDED DETAIL");
        expect(task).toContain("RELEVANT HOMEBREW");
        expect(task).toContain("HOMEBREW DEF");
        // fill_n's schema doesn't declare fits_concept (additionalProperties:false), so the closing line
        // must not demand it — demanding an undeclared field contradicts the schema and wastes budget.
        expect(task).not.toContain("fits_concept");
    });

    it("demands fits_concept only when the tool schema declares it", async () => {
        const fitsTool: AiToolDef = {
            ...TOOL,
            inputSchema: {
                type: "object", additionalProperties: false,
                properties: { n: { type: "number" }, fits_concept: { type: "string" } }, required: ["n"],
            },
        };
        const sr = scriptedRunner([toolCall({ n: 1 })]);
        await runStep({ ...STEP, tool: fitsTool }, {}, AI, {}, sr.runner);
        expect(sr.calls[0]).toContain("fits_concept");
    });
});
