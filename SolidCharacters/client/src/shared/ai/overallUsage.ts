import Dexie from "dexie";
import { Accessor, createSignal } from "solid-js";
import type { TokenUsage, UsageTotals } from "./types";

/**
 * The PERSISTENT, cross-conversation token total — the meter the budget cap is enforced against, and the
 * "overall used" figure shown next to the cap (with a Reset button). Unlike the per-conversation
 * `sessionUsage` (shared/ai/usage.ts), this survives New chat and reload; it only ever zeroes when the user
 * hits Reset. Kept in its own single-row Dexie DB so it never bloats settings or chat history.
 */
interface UsageTotalsRow extends UsageTotals {
    id: string;
}

const ROW_ID = "overall";

class UsageTotalsDB extends Dexie {
    totals!: Dexie.Table<UsageTotalsRow, string>;

    constructor(name: string) {
        super(name);
        this.version(1).stores({ totals: "id" });
    }
}

const usageTotalsDB = new UsageTotalsDB("dnd_usageTotals");

const zero = (): UsageTotals => ({ inputTokens: 0, outputTokens: 0, requestCount: 0 });

const [overallUsageSig, setOverallUsage] = createSignal<UsageTotals>(zero());

/** Reactive overall (cross-conversation, reload-surviving) token total. */
export const overallUsage: Accessor<UsageTotals> = overallUsageSig;

let loaded = false;
let loading: Promise<void> | null = null;

async function load(): Promise<void> {
    try {
        const row = await usageTotalsDB.totals.get(ROW_ID);
        if (row) {
            setOverallUsage({
                inputTokens: row.inputTokens,
                outputTokens: row.outputTokens,
                requestCount: row.requestCount,
                estimated: row.estimated,
            });
        }
        loaded = true;
    } catch (e) {
        console.error("Failed to load overall token usage", e);
    }
}

/** Hydrate the overall total from IndexedDB once (idempotent; dedups concurrent callers). */
export function ensureOverallUsageLoaded(): Promise<void> {
    if (loaded) return Promise.resolve();
    if (loading) return loading;
    loading = load().finally(() => { loading = null; });
    return loading;
}

let writeTimer: ReturnType<typeof setTimeout> | undefined;

/** Debounced write-through — a 20-step pipeline shouldn't hit IndexedDB 20 times. */
function persistSoon(): void {
    if (writeTimer) clearTimeout(writeTimer);
    writeTimer = setTimeout(() => {
        writeTimer = undefined;
        void usageTotalsDB.totals.put({ id: ROW_ID, ...overallUsageSig() }).catch(e =>
            console.error("Failed to persist overall token usage", e));
    }, 400);
}

/** Fold one completed request into the overall total. Called from recordUsage (shared/ai/usage.ts). */
export function recordOverall(u: TokenUsage): void {
    setOverallUsage(t => ({
        inputTokens: t.inputTokens + (u.inputTokens || 0),
        outputTokens: t.outputTokens + (u.outputTokens || 0),
        requestCount: t.requestCount + 1,
        estimated: t.estimated || u.estimated || undefined,
    }));
    persistSoon();
}

/** The Reset button — zero the overall total and persist immediately. Also clears any active soft-block. */
export function resetOverall(): void {
    setOverallUsage(zero());
    if (writeTimer) { clearTimeout(writeTimer); writeTimer = undefined; }
    loaded = true;   // an explicit reset supersedes any pending initial load
    void usageTotalsDB.totals.put({ id: ROW_ID, ...zero() }).catch(e =>
        console.error("Failed to persist overall token usage reset", e));
}

/** Combined input+output for any totals-ish object. */
export const combinedUsed = (t: { inputTokens: number; outputTokens: number }): number =>
    t.inputTokens + t.outputTokens;

export type CapState = "unlimited" | "ok" | "warn" | "over";

/** Cap colour/label state. cap<=0 ⇒ unlimited; ≥85% ⇒ warn; ≥100% ⇒ over. Shared by the header + the block. */
export function capStatus(usedCombined: number, cap: number): CapState {
    if (!cap || cap <= 0) return "unlimited";
    if (usedCombined >= cap) return "over";
    if (usedCombined >= cap * 0.85) return "warn";
    return "ok";
}

/** The enforcement check: a positive cap has been reached by the overall total. cap 0/undefined ⇒ never. */
export function capReached(cap: number | undefined): boolean {
    return !!cap && cap > 0 && combinedUsed(overallUsageSig()) >= cap;
}
