import { createHash } from "node:crypto";

/** Stable namespace for deterministic ids minted by this generator (random constant, never change it). */
const UUID_NAMESPACE = "7b8f6a1e-3c2d-4e5f-9a0b-1c2d3e4f5a6b";

function uuidBytes(uuid: string): Buffer {
    return Buffer.from(uuid.replace(/-/g, ""), "hex");
}

/** RFC 4122 UUIDv5 (SHA-1, name-based). */
export function uuid5(name: string, namespace: string = UUID_NAMESPACE): string {
    const hash = createHash("sha1");
    hash.update(uuidBytes(namespace));
    hash.update(Buffer.from(name, "utf8"));
    const bytes = hash.digest().subarray(0, 16);
    bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
    const hex = bytes.toString("hex");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function slug(s: string): string {
    return s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Normalized name key used for id-stability + cross-referencing ("Sleight of Hand" === "sleight-of-hand"). */
export function nameKey(s: string): string {
    return slug(s.replace(/[’'`]/g, ""));
}

const ORDINALS: Record<string, number> = {};
for (let i = 1; i <= 30; i++) {
    const suffix = i % 10 === 1 && i % 100 !== 11 ? "st" : i % 10 === 2 && i % 100 !== 12 ? "nd" : i % 10 === 3 && i % 100 !== 13 ? "rd" : "th";
    ORDINALS[`${i}${suffix}`] = i;
}

/** "1st"/"20th"/"5" → int, or null when the cell isn't a level. */
export function parseLevel(cell: string): number | null {
    const t = cell.trim().toLowerCase();
    if (/^\d+$/.test(t)) return parseInt(t, 10);
    return ORDINALS[t] ?? null;
}

export function assert(cond: unknown, msg: string): asserts cond {
    if (!cond) throw new Error(`srd-gen: ${msg}`);
}

/** Title Case a heading fragment while keeping small words lowercased mid-phrase. */
export function cleanWhitespace(s: string): string {
    return s.replace(/[ \t]+/g, " ").replace(/ ?\n ?/g, "\n").trim();
}
