import { describe, it, expect, beforeEach } from "vitest";
import {
    addUsage, estimateInputTokens, estimateMessageTokens, estimateTokens, estimateUsage,
    recordUsage, resetSessionUsage, sessionUsage,
} from "./usage";
import type { AiMessage } from "./types";

/**
 * The shared token estimator (used both for history windowing and the provider-usage fallback) and the
 * per-conversation session ledger. `recordUsage` also feeds the persistent overall total, but here we only
 * assert the session signal — the overall store has its own spec.
 */

beforeEach(() => resetSessionUsage());

describe("estimator", () => {
    it("estimateTokens is char/4 rounded up", () => {
        expect(estimateTokens("")).toBe(0);
        expect(estimateTokens("abcd")).toBe(1);
        expect(estimateTokens("abcde")).toBe(2);
    });

    it("estimateMessageTokens EXCLUDES base64 media (a huge image can't dwarf the text count)", () => {
        const bloated: AiMessage = { role: "user", text: "hi", images: [{ data: "x".repeat(100_000), mediaType: "image/png" }] };
        // ~7 tokens of text + one flat 768/image cost — nowhere near 100_000/4 = 25_000.
        expect(estimateMessageTokens(bloated)).toBeLessThan(2000);
        expect(estimateMessageTokens(bloated)).toBeGreaterThan(700);
    });

    it("estimateInputTokens folds in system + tools + messages", () => {
        const base = estimateInputTokens([{ role: "user", text: "hello there" }]);
        const withSystem = estimateInputTokens([{ role: "user", text: "hello there" }], "a system prompt");
        expect(withSystem).toBeGreaterThan(base);
    });

    it("estimateUsage is always flagged estimated", () => {
        const u = estimateUsage([{ role: "user", text: "hi" }], "sys", 40);
        expect(u.estimated).toBe(true);
        expect(u.outputTokens).toBe(Math.ceil(40 / 4));
        expect(u.inputTokens).toBeGreaterThan(0);
    });
});

describe("addUsage", () => {
    it("sums two usages and is estimated if either side is", () => {
        expect(addUsage({ inputTokens: 10, outputTokens: 5 }, { inputTokens: 1, outputTokens: 2 }))
            .toEqual({ inputTokens: 11, outputTokens: 7 });
        expect(addUsage(undefined, { inputTokens: 3, outputTokens: 4, estimated: true }))
            .toEqual({ inputTokens: 3, outputTokens: 4, estimated: true });
    });
});

describe("session ledger", () => {
    it("recordUsage accumulates in/out and bumps requestCount", () => {
        recordUsage({ inputTokens: 100, outputTokens: 50 });
        recordUsage({ inputTokens: 10, outputTokens: 5 });
        expect(sessionUsage()).toMatchObject({ inputTokens: 110, outputTokens: 55, requestCount: 2 });
    });

    it("estimated is sticky — one estimated request flags the whole total", () => {
        recordUsage({ inputTokens: 100, outputTokens: 50 });                    // exact
        expect(sessionUsage().estimated).toBeFalsy();
        recordUsage({ inputTokens: 5, outputTokens: 5, estimated: true });       // one estimate
        expect(sessionUsage().estimated).toBe(true);
    });

    it("resetSessionUsage(seed) restores exactly; no-arg zeroes", () => {
        recordUsage({ inputTokens: 7, outputTokens: 3 });
        resetSessionUsage({ inputTokens: 999, outputTokens: 111, requestCount: 4 });
        expect(sessionUsage()).toEqual({ inputTokens: 999, outputTokens: 111, requestCount: 4 });
        resetSessionUsage();
        expect(sessionUsage()).toEqual({ inputTokens: 0, outputTokens: 0, requestCount: 0 });
    });
});
