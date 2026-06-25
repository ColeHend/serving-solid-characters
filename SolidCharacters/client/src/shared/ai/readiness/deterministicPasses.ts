import { Background, Spell } from "../../../models/generated";
import { srdSubclass } from "../../../models/data/generated";
import { HomebrewPreview } from "../toolDispatcher";
import { OFFICIAL_CLASSES, knownClassNames, norm } from "../classRefs";
import { featResolves, srdFeatsReady } from "../featRefs";
import { ReviewIssue, ReviewVerdict } from "./types";

export { OFFICIAL_CLASSES };

/**
 * Deterministic (zero-cost, zero-latency) readiness passes. These run in code, not the model — they
 * catch the failure classes small local models judge worst (missing fields, dangling references, wrong
 * terminology). Each returns a ReviewVerdict; blocking is decided centrally from issue severity.
 */

/**
 * schema_validate / schema_validate_final — reuse buildPreview's verdict already computed on the
 * preview (`valid` + `errors`, mirroring the manual editors' hard blockers). No new logic.
 */
export function schemaVerdict(preview: HomebrewPreview, passId: "schema_validate" | "schema_validate_final"): ReviewVerdict {
    const label = passId === "schema_validate" ? "Schema validation" : "Schema re-check";
    const issues: ReviewIssue[] = preview.valid
        ? []
        : preview.errors.map(e => ({ severity: "error" as const, message: e }));
    return { passId, label, pass: preview.valid, issues };
}

/**
 * broken_reference — flag cross-entity references that don't resolve. A subclass with no/unknown parent
 * class is structurally broken (error → blocks). A spell listing an unknown class is softer (warning).
 * Conservative on purpose: only references we can authoritatively resolve are checked, to avoid
 * false-positive blocking on legitimate work-in-progress homebrew.
 */
export function brokenReferenceVerdict(preview: HomebrewPreview): ReviewVerdict {
    const issues: ReviewIssue[] = [];

    if (preview.kind === "subclass") {
        const parent = (preview.entity as srdSubclass).parentClass?.trim();
        if (parent && !knownClassNames().has(norm(parent))) {
            issues.push({
                severity: "error",
                field: "parentClass",
                message: `Parent class "${parent}" doesn't match any official or homebrew class. Create that class first, or fix the name.`,
            });
        }
    }

    if (preview.kind === "spell") {
        const known = knownClassNames();
        for (const cls of (preview.entity as Spell).classes ?? []) {
            if (cls?.trim() && !known.has(norm(cls))) {
                issues.push({
                    severity: "warning",
                    field: "classes",
                    message: `Spell lists class "${cls}", which isn't a known class. Check the spelling or create that class.`,
                });
            }
        }
    }

    // A 2024 background's granted `feat` is resolved by name in the character build; a name that matches
    // no real feat yields a feature with an empty description (mechanically inert). Warn (don't block),
    // and only when the SRD feats are loaded so we don't false-warn on a real feat we haven't cached yet.
    if (preview.kind === "background") {
        const feat = (preview.entity as Background).feat?.trim();
        if (feat && srdFeatsReady() && !featResolves(feat)) {
            issues.push({
                severity: "warning",
                field: "feat",
                message: `Granted feat "${feat}" doesn't match any known feat; the character would get an empty feature. Check the spelling, pick an existing feat, or create that feat first.`,
            });
        }
    }

    // A base class has no cross-entity reference to resolve here (primaryAbility completeness is handled
    // in toolDispatcher's class checks, not as a broken reference).

    return { passId: "broken_reference", label: "Broken references", pass: issues.length === 0, issues };
}

/** Non-5e terminology → correction. Case-insensitive whole-word/phrase matches. */
const TERMINOLOGY: { pattern: RegExp; wrong: string; right: string }[] = [
    { pattern: /\bsaving roll\b/i, wrong: "saving roll", right: "saving throw" },
    { pattern: /\bsave roll\b/i, wrong: "save roll", right: "saving throw" },
    { pattern: /\bto[- ]hit roll\b/i, wrong: "to-hit roll", right: "attack roll" },
    { pattern: /\bto[- ]hit\b/i, wrong: "to-hit", right: "attack roll / attack bonus" },
    { pattern: /\bhit points? of damage\b/i, wrong: "hit points of damage", right: "damage" },
    { pattern: /\bhealth points?\b/i, wrong: "health points", right: "hit points" },
    { pattern: /\bmana\b/i, wrong: "mana", right: "spell slots" },
    { pattern: /\bcooldown\b/i, wrong: "cooldown", right: "a recharge / per-rest limit" },
    { pattern: /\bcrit chance\b/i, wrong: "crit chance", right: "critical hit range" },
    { pattern: /\bd20 roll\b/i, wrong: "d20 roll", right: "ability check / attack roll / saving throw" },
];

/** Placeholder/leftover text that should never ship in finished content. */
const PLACEHOLDERS: { pattern: RegExp; label: string }[] = [
    { pattern: /\bTODO\b/i, label: "TODO" },
    { pattern: /\b(?:XXX|FIXME)\b/i, label: "XXX/FIXME" },
    { pattern: /\blorem ipsum\b/i, label: "lorem ipsum" },
    { pattern: /\[(?:insert|todo|fill[ -]?in|placeholder)[^\]]*\]/i, label: "a bracketed placeholder" },
    { pattern: /\b(?:placeholder|tbd)\b/i, label: "placeholder/TBD" },
];

/** The first placeholder label found in some free text, or null. Shared by the linter + buildPreview. */
export function findPlaceholder(text: string): string | null {
    for (const p of PLACEHOLDERS) if (p.pattern.test(text)) return p.label;
    return null;
}

/** All free-text on an entity the linter should scan (name + description + feature text). */
export function entityText(preview: HomebrewPreview): string {
    const e = preview.entity as unknown as Record<string, unknown>;
    const parts: string[] = [preview.title];
    const push = (v: unknown) => { if (typeof v === "string") parts.push(v); };
    push(e.description); push(e.desc);
    if (e.details && typeof e.details === "object") push((e.details as Record<string, unknown>).description);
    // Leveled or named feature collections.
    const feats = e.features;
    if (Array.isArray(feats)) for (const f of feats) push((f as Record<string, unknown>)?.description);
    else if (feats && typeof feats === "object") {
        for (const arr of Object.values(feats as Record<string, unknown>)) {
            if (Array.isArray(arr)) for (const f of arr) push((f as Record<string, unknown>)?.description);
        }
    }
    const traits = (preview.entity as { traits?: { details?: { description?: string } }[] }).traits;
    if (Array.isArray(traits)) for (const t of traits) push(t?.details?.description);
    return parts.filter(Boolean).join("\n");
}

/**
 * linter — deterministic terminology + placeholder lint over the entity's free text. Findings are
 * warnings (wording), so they surface on the card without blocking Save.
 */
export function linterVerdict(preview: HomebrewPreview): ReviewVerdict {
    const text = entityText(preview);
    const issues: ReviewIssue[] = [];
    for (const t of TERMINOLOGY) {
        if (t.pattern.test(text)) {
            issues.push({ severity: "warning", message: `Uses "${t.wrong}" — D&D 5e says "${t.right}".`, suggestedFix: `Replace "${t.wrong}" with "${t.right}".` });
        }
    }
    for (const p of PLACEHOLDERS) {
        if (p.pattern.test(text)) {
            // Placeholder text ("TODO", "[insert...]") is a hard defect, not just wording — block on it
            // (buildPreview also blocks placeholders independently of usageLevel, so Low/Medium are covered).
            issues.push({ severity: "error", message: `Contains ${p.label} — replace it with real content before saving.` });
        }
    }
    return { passId: "linter", label: "Terminology", pass: issues.length === 0, issues };
}
