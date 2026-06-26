/**
 * Tiny deep-set/patch helper for the edit_homebrew diff flow. No json-patch library is installed, and
 * the homebrew entities are plain JSON trees, so a ~self-contained walker is enough.
 *
 * A patch is a list of PatchOps, each addressing a field by a dot/bracket path:
 *   "range"                  → top-level field
 *   "features.3.0.description" / "features[3][0].description" → nested array/record (Record<level, Feat[]>)
 *
 * Discipline mirrors the rest of the AI dispatch layer: the input is untrusted model output, so a bad
 * path is REJECTED (collected, with a reason) rather than thrown — the diff card surfaces rejections and
 * applies only the ops that landed. applyPatch never mutates `base`; it deep-clones first.
 */

export type PatchOpKind = "set" | "add" | "remove";

export interface PatchOp {
    /** Dot/bracket path to the field, e.g. "range" or "features.3.0.description". */
    path: string;
    op: PatchOpKind;
    /** New value for "set"; the element to append for "add". Ignored for "remove". */
    value?: unknown;
}

export interface RejectedOp {
    op: PatchOp;
    reason: string;
}

export interface ApplyPatchResult<T> {
    next: T;
    applied: PatchOp[];
    rejected: RejectedOp[];
}

type AnyRecord = Record<string | number, unknown>;

/** Split a dot/bracket path into segments; all-digit segments become numbers (array/record indices). */
export function parsePath(path: string): (string | number)[] {
    const normalized = String(path).replace(/\[(\w+)\]/g, ".$1");   // a[0].b → a.0.b
    const segs: (string | number)[] = [];
    for (const raw of normalized.split(".")) {
        if (raw === "") continue;
        segs.push(/^\d+$/.test(raw) ? Number(raw) : raw);
    }
    return segs;
}

/** Read the value at a path, or undefined if any segment is missing. */
export function getAtPath(obj: unknown, segs: (string | number)[]): unknown {
    let cur: unknown = obj;
    for (const s of segs) {
        if (cur == null || typeof cur !== "object") return undefined;
        cur = (cur as AnyRecord)[s];
    }
    return cur;
}

const VALID_OPS: PatchOpKind[] = ["set", "add", "remove"];

/** Keys that would let untrusted model output walk into the prototype chain and pollute Object.prototype. */
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/** Apply a single op to the (already-cloned) root. Returns null on success or a reason string on reject. */
function applyOne(root: unknown, op: PatchOp): string | null {
    if (!op || typeof op.path !== "string") return "missing path";
    if (!VALID_OPS.includes(op.op)) return `unknown op "${String(op?.op)}"`;
    const segs = parsePath(op.path);
    if (!segs.length) return "empty path";
    // Refuse prototype-pollution paths: the input is untrusted model output, and walking into
    // __proto__/constructor/prototype with bracket access mutates the GLOBAL Object.prototype
    // (structuredClone does not protect against this — cur["__proto__"] is the live prototype).
    if (segs.some(s => typeof s === "string" && DANGEROUS_KEYS.has(s))) return `unsafe path segment in "${op.path}"`;

    // Walk to the parent of the last segment, creating intermediate containers for set/add.
    let cur: unknown = root;
    for (let i = 0; i < segs.length - 1; i++) {
        const key = segs[i];
        if (cur == null || typeof cur !== "object") return `cannot descend into "${op.path}"`;
        const container = cur as AnyRecord;
        if (container[key] == null) {
            if (op.op === "remove") return `path "${op.path}" does not exist`;
            container[key] = typeof segs[i + 1] === "number" ? [] : {};
        }
        cur = container[key];
    }

    const last = segs[segs.length - 1];
    if (cur == null || typeof cur !== "object") return `cannot write into "${op.path}"`;
    const parent = cur as AnyRecord;

    switch (op.op) {
        case "set":
            parent[last] = op.value;
            return null;
        case "add": {
            const target = parent[last];
            if (Array.isArray(target)) { target.push(op.value); return null; }
            if (typeof target === "string") { parent[last] = target + String(op.value); return null; }
            if (target == null) { parent[last] = [op.value]; return null; }
            return `cannot add to non-array/string at "${op.path}"`;
        }
        case "remove": {
            if (Array.isArray(parent) && typeof last === "number") {
                if (last < 0 || last >= parent.length) return `index ${last} out of range at "${op.path}"`;
                parent.splice(last, 1);
                return null;
            }
            if (Object.prototype.hasOwnProperty.call(parent, last)) { delete parent[last]; return null; }
            return `path "${op.path}" does not exist`;
        }
    }
}

/**
 * Apply an ordered list of patch ops to a deep clone of `base`. Bad ops are collected in `rejected`
 * (with a human-readable reason) instead of throwing, so the caller can apply what landed and warn on
 * the rest. Order is preserved; a later op sees the effect of earlier ones.
 */
export function applyPatch<T>(base: T, ops: PatchOp[]): ApplyPatchResult<T> {
    const next = structuredClone(base);
    const applied: PatchOp[] = [];
    const rejected: RejectedOp[] = [];
    for (const op of Array.isArray(ops) ? ops : []) {
        const reason = applyOne(next, op);
        if (reason) rejected.push({ op, reason });
        else applied.push(op);
    }
    return { next, applied, rejected };
}
