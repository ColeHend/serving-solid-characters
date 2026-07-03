import { AiSettings, DEFAULT_REVIEW_SETTINGS } from "../../../models/userSettings";
import type { Character } from "../../../models/character.model";
import { assembleVerdicts } from "../readiness/pipeline";
import { runLlmReview } from "../readiness/llmReview";
import { CHARACTER_CONSISTENCY_SPEC, CLASS_BALANCE_CONSISTENCY_SPEC } from "../readiness/reviewSystemPrompt";
import { isBlocked, ReviewSeverity, ReviewVerdict, severityRank } from "../readiness/types";
import { HomebrewPreview } from "../tools/toolDispatcher";
import { assembleClassPreview, assembleSubclassPreviews } from "./assemble";
import type { WorkingClass, WorkingFeature, WorkingSubclass } from "./types";

/**
 * Phase F (plan §6, §13 M3): the BALANCE & CONSISTENCY critic. After the class is fully built it is wrapped
 * as a synthetic `HomebrewPreview` and run through the existing readiness pipeline (`assembleVerdicts`: the
 * deterministic gates + the `balance` LLM pass), plus one extra pass that judges the whole-class SHAPE — the
 * power curve, dead levels, and coherence with the core mechanic.
 *
 * Crucially this is NOT a whole-class regenerate: a blocking verdict that names a specific feature maps back
 * to that one feature, so the orchestrator regenerates ONLY the flagged piece (plan §6 "regenerate flagged
 * only"). Everything else stands. The critic is QUALITY, not a hard gate — fail-open: if no flagged feature
 * can be identified, the build still proceeds (the verdicts are surfaced for the user regardless).
 */

/** A feature the critic wants regenerated, tagged with its scope so the orchestrator rewrites it in place. */
export interface FlaggedFeature {
    /** The flagged feature's exact name (used to locate it in its scope). */
    name: string;
    /** The level it sits at (passed to the regeneration step). */
    level: number;
    /** The subclass it belongs to, or undefined for a base-class feature. */
    subclass?: string;
    /** The reviewer's complaint, fed to the regeneration so the rewrite fixes that specific problem. */
    reason: string;
}

/** The critic's output: every verdict (for the UI), the features to regenerate, and whether anything blocks. */
export interface CriticResult {
    verdicts: ReviewVerdict[];
    flagged: FlaggedFeature[];
    /** True if any verdict carries an issue at/above the blocking severity (even one we couldn't map). */
    blocked: boolean;
}

/**
 * Produce verdicts for a synthetic preview. Injectable so the orchestrator + tests can drive the critic
 * without a provider; production uses {@link buildClassReviewer} (the real readiness pipeline).
 */
export type ClassReviewer = (preview: HomebrewPreview) => Promise<ReviewVerdict[]>;

/**
 * The production reviewer: run the full readiness pipeline over the preview, then append the class-shape
 * consistency pass. Aborts cleanly mid-way (returns what it has) when the run is cancelled.
 */
export function buildClassReviewer(ai: AiSettings, dndSystem: string, signal?: AbortSignal): ClassReviewer {
    const ctx = { ai, dndSystem, signal };
    return async (preview) => {
        const verdicts = await assembleVerdicts(preview, ctx);
        if (signal?.aborted) return verdicts;
        const consistency = await runLlmReview(CLASS_BALANCE_CONSISTENCY_SPEC, preview, ctx);
        return [...verdicts, consistency];
    };
}

/**
 * The character pipeline's end-of-build critic (spec §5.5 — skipped at M5, run at usage HIGH only). One
 * LLM pass over the assembled character: the per-step gates already validate structure, so this judges
 * only what they can't see — whether the fiction and the mechanics agree. Injectable like ClassReviewer
 * (tests stub it; production wires {@link buildCharacterReviewer}). Fail-open: any error → no verdicts.
 * Informational only — a character saves regardless; the verdicts surface on the pipeline card.
 */
export type CharacterReviewer = (character: Character) => Promise<ReviewVerdict[]>;

export function buildCharacterReviewer(ai: AiSettings, dndSystem: string, signal?: AbortSignal): CharacterReviewer {
    return async (character) => {
        try {
            const subject = {
                kind: "character" as const,
                title: character.name?.trim() || "(unnamed character)",
                entity: character as object,
            };
            const verdict = await runLlmReview(CHARACTER_CONSISTENCY_SPEC, subject, { ai, dndSystem, signal });
            return [verdict];
        } catch {
            return [];
        }
    };
}

/** Find the feature whose name appears in an issue's `field`/`message` (longest name first, so "Storm's Fury" beats "Storm"). */
function matchFeature(field: string, message: string, features: WorkingFeature[]): WorkingFeature | undefined {
    const hay = `${field} ${message}`.toLowerCase();
    return [...features]
        .filter(f => f.name?.trim())
        .sort((a, b) => b.name.length - a.name.length)
        .find(f => hay.includes(f.name.trim().toLowerCase()));
}

/** Map a preview's blocking issues onto the features they name (deduped by feature, first complaint wins). */
function flaggedFrom(
    verdicts: ReviewVerdict[], features: WorkingFeature[], subclass: string | undefined, threshold: number,
): FlaggedFeature[] {
    const flagged: FlaggedFeature[] = [];
    const seen = new Set<string>();
    for (const v of verdicts) {
        for (const issue of v.issues) {
            if (severityRank(issue.severity) < threshold) continue;
            const f = matchFeature(issue.field ?? "", issue.message, features);
            if (!f) continue;
            const key = f.name.trim().toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            flagged.push({ name: f.name, level: f.level, subclass, reason: issue.message });
        }
    }
    return flagged;
}

/**
 * Run the critic over the whole assembled class: the base class (its features) plus each subclass (its own
 * features), since subclasses are separate entities with separate previews. Returns the aggregated verdicts
 * and the flagged features to regenerate.
 */
export async function critiqueClass(
    working: WorkingClass,
    reviewer: ClassReviewer,
    opts: { dndSystem: string; blockingSeverity?: ReviewSeverity },
): Promise<CriticResult> {
    const threshold = severityRank(opts.blockingSeverity ?? DEFAULT_REVIEW_SETTINGS.blockingSeverity ?? "error");
    const allVerdicts: ReviewVerdict[] = [];
    const flagged: FlaggedFeature[] = [];

    // ----- base class -----
    const classPreview = assembleClassPreview(working, opts.dndSystem);
    const classVerdicts = await reviewer(classPreview);
    allVerdicts.push(...classVerdicts);
    flagged.push(...flaggedFrom(classVerdicts, working.features ?? [], undefined, threshold));

    // ----- subclasses (each a separate preview) -----
    const subs: WorkingSubclass[] = (working.subclasses ?? []).filter(s => (s.name ?? "").trim());
    const subPreviews = assembleSubclassPreviews(working, opts.dndSystem);
    for (let i = 0; i < subPreviews.length && i < subs.length; i++) {
        const sub = subs[i];
        const subVerdicts = await reviewer(subPreviews[i]);
        allVerdicts.push(...subVerdicts);
        flagged.push(...flaggedFrom(subVerdicts, sub.features ?? [], sub.name, threshold));
    }

    return { verdicts: allVerdicts, flagged, blocked: isBlocked(allVerdicts, opts.blockingSeverity ?? "error") };
}
