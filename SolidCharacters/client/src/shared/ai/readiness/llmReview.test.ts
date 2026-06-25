import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AiSettings } from "../../../models/userSettings";
import type { HomebrewPreview } from "../toolDispatcher";
import type { ReviewContext } from "./types";
import type { ReviewPassSpec } from "./reviewSystemPrompt";

// Scripted provider: each test sets the stream of events the mocked streamChat yields.
const h = vi.hoisted(() => ({ events: [] as Record<string, unknown>[] }));
vi.mock("../providerFactory", () => ({
    buildProvider: () => ({
        kind: "local",
        async *streamChat() { for (const e of h.events) yield e; },
    }),
}));
vi.mock("../../customHooks/homebrewManager", () => ({ homebrewManager: { classes: () => [] } }));

import { runLlmReview } from "./llmReview";

const ai = { provider: "local", model: "m", localBaseUrl: "", enabled: true } as AiSettings;
const ctx: ReviewContext = { ai, dndSystem: "both" };
const spec: ReviewPassSpec = { passId: "balance", label: "Balance", criteria: "judge balance" };
const preview = { previewId: "p", toolCallId: "t", kind: "spell", title: "Bolt", entity: { description: "1d6 fire", level: "0" }, valid: true, errors: [] } as unknown as HomebrewPreview;

function reportReview(input: Record<string, unknown>) {
    return [
        { type: "tool_call_start", index: 0, id: "r1", name: "report_review" },
        { type: "tool_call_delta", index: 0, argsDelta: JSON.stringify(input) },
        { type: "tool_call_done", index: 0 },
        { type: "message_done", stopReason: "tool_use" },
    ];
}

beforeEach(() => { h.events = []; });

describe("runLlmReview", () => {
    it("parses a report_review verdict with issues", async () => {
        h.events = reportReview({ pass: false, severity: "error", issues: [{ message: "Overpowered for a cantrip.", field: "description" }] });
        const v = await runLlmReview(spec, preview, ctx);
        expect(v.pass).toBe(false);
        expect(v.issues).toHaveLength(1);
        expect(v.issues[0].message).toBe("Overpowered for a cantrip.");
        expect(v.issues[0].severity).toBe("error");
    });

    it("treats a clean pass=true verdict as passing with no issues", async () => {
        h.events = reportReview({ pass: true, severity: "info", issues: [] });
        const v = await runLlmReview(spec, preview, ctx);
        expect(v.pass).toBe(true);
        expect(v.issues).toEqual([]);
    });

    it("fails open (pass) when the model returns no tool call", async () => {
        h.events = [{ type: "text_delta", text: "I think it's fine" }, { type: "message_done", stopReason: "end_turn" }];
        const v = await runLlmReview(spec, preview, ctx);
        expect(v.pass).toBe(true);
        expect(v.issues).toEqual([]);
    });

    it("fails open on a stream error", async () => {
        h.events = [{ type: "error", error: "network" }];
        const v = await runLlmReview(spec, preview, ctx);
        expect(v.pass).toBe(true);
    });

    it("synthesizes an issue when pass=false but none was given", async () => {
        h.events = reportReview({ pass: false, severity: "warning" });
        const v = await runLlmReview(spec, preview, ctx);
        expect(v.pass).toBe(false);
        expect(v.issues).toHaveLength(1);
    });

    it("caps reported severity at the spec's maximum", async () => {
        h.events = reportReview({ pass: false, severity: "error", issues: [{ message: "minor wording" }] });
        const v = await runLlmReview({ ...spec, severity: "warning" }, preview, ctx);
        expect(v.issues[0].severity).toBe("warning");
    });
});
