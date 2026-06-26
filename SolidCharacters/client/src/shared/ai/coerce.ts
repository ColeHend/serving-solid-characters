/**
 * Shared coercers for UNTRUSTED model tool-call JSON. Previously these were copy-pasted into
 * toolDispatcher/computeTools/interactions/lookupTools/llmReview and had already DRIFTED — notably
 * `boolean`, which accepted the string "true" in some files but not others, so `"concentration":"true"`
 * silently became false on a spell but true on a compute tool. One source of truth fixes that and keeps
 * the semantics from diverging again. Leaf module (no app imports) so it can't create cycles.
 */

/** A string field: passes strings through, stringifies non-null non-strings, else the default. */
export const str = (v: unknown, d = ""): string => (typeof v === "string" ? v : v == null ? d : String(v));

/** A numeric field: accepts numbers and numeric strings, else the default. */
export const num = (v: unknown, d = 0): number => {
    if (typeof v === "number") return v;
    if (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v))) return Number(v);
    return d;
};

/** Optional numeric: like num but rejects non-finite numbers (NaN/Infinity). */
export const optNum = (v: unknown, d: number): number => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v))) return Number(v);
    return d;
};

/** A required numeric field: null when absent or unparseable, so the caller can flag it. */
export const reqNum = (v: unknown): number | null => {
    const n = optNum(v, NaN);
    return Number.isFinite(n) ? n : null;
};

/** True for the boolean `true` OR the string "true" — models commonly emit stringified booleans. */
export const boolean = (v: unknown): boolean => v === true || v === "true";

/** An array field: passes arrays through, else an empty array. */
export const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** A string-array field: trimmed, blank entries dropped. */
export const strList = (v: unknown): string[] => list(v).map(x => str(x).trim()).filter(s => s.length > 0);
