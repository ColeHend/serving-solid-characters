import { describe, it, expect, beforeEach } from "vitest";
import {
    capReached, capStatus, combinedUsed, overallUsage, recordOverall, resetOverall,
} from "./overallUsage";

/**
 * The persistent overall total (the cap's meter) and the cap helpers. The signal updates synchronously;
 * the debounced Dexie write-through is fire-and-forget and not asserted here.
 */

beforeEach(() => resetOverall());

describe("overall total", () => {
    it("recordOverall accumulates in/out and bumps requestCount", () => {
        recordOverall({ inputTokens: 100, outputTokens: 50 });
        recordOverall({ inputTokens: 10, outputTokens: 5 });
        expect(overallUsage()).toMatchObject({ inputTokens: 110, outputTokens: 55, requestCount: 2 });
        expect(combinedUsed(overallUsage())).toBe(165);
    });

    it("resetOverall zeroes the total", () => {
        recordOverall({ inputTokens: 7, outputTokens: 3 });
        resetOverall();
        expect(overallUsage()).toEqual({ inputTokens: 0, outputTokens: 0, requestCount: 0 });
    });

    it("estimated is sticky", () => {
        recordOverall({ inputTokens: 5, outputTokens: 5, estimated: true });
        expect(overallUsage().estimated).toBe(true);
    });
});

describe("capStatus", () => {
    it("is unlimited at cap 0 regardless of usage", () => {
        expect(capStatus(1_000_000, 0)).toBe("unlimited");
    });
    it("warns at ≥85% and flips over at ≥100%", () => {
        expect(capStatus(0, 100)).toBe("ok");
        expect(capStatus(84, 100)).toBe("ok");
        expect(capStatus(85, 100)).toBe("warn");
        expect(capStatus(99, 100)).toBe("warn");
        expect(capStatus(100, 100)).toBe("over");
        expect(capStatus(150, 100)).toBe("over");
    });
});

describe("capReached (enforcement)", () => {
    it("never trips on a 0/undefined cap", () => {
        recordOverall({ inputTokens: 5000, outputTokens: 5000 });
        expect(capReached(0)).toBe(false);
        expect(capReached(undefined)).toBe(false);
    });

    it("trips only once the overall total reaches the cap; an in-flight record still lands after", () => {
        recordOverall({ inputTokens: 40, outputTokens: 59 });   // 99 combined
        expect(capReached(100)).toBe(false);
        recordOverall({ inputTokens: 1, outputTokens: 0 });     // 100 combined
        expect(capReached(100)).toBe(true);
        // A request already in flight is allowed to complete and is still counted.
        recordOverall({ inputTokens: 50, outputTokens: 50 });
        expect(combinedUsed(overallUsage())).toBe(200);
    });
});
