/**
 * Text normalization applied to every markdown file BEFORE parsing.
 * Fixes the mojibake in the 5.1 tree (soft-hyphen runs like "long-­‐‑lost"), unifies
 * newlines, and strips the 5.2 trailing-space hard breaks. Legitimate typography
 * (curly apostrophes, en dashes in ranges) is preserved — the served data already uses it.
 */
export function normalizeMarkdown(raw: string): string {
    return raw
        .replace(/\r\n?/g, "\n")
        // soft hyphen + the U+2010/U+2011 hyphens that ride along in the 5.1 mojibake runs
        .replace(/­/g, "")
        .replace(/[‐‑]/g, "-")
        // collapse the leftover "--" a mojibake run can produce mid-word (e.g. "long--lost")
        .replace(/([a-z])--([a-z])/g, "$1-$2")
        // stray fullwidth bracket seen in older converted data / sources
        .replace(/】/g, ")")
        .replace(/【/g, "(")
        // trailing whitespace (5.2 hard breaks) and BOM
        .replace(/^﻿/, "")
        .replace(/[ \t]+$/gm, "");
}

/** Strip markdown emphasis and heading residue from a title ("**Soldier**" → "Soldier"). */
export function cleanTitle(s: string): string {
    return s.replace(/\*+/g, "").replace(/#+\s*$/, "").replace(/\s+/g, " ").trim();
}

/** Remove markdown emphasis markers from body text while keeping the words. */
export function stripEmphasis(s: string): string {
    return s.replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1").replace(/_{1,3}([^_]+)_{1,3}/g, "$1");
}
