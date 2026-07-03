import { DEFAULT_HIGH_MAX_SCHEMA_RETRIES, DEFAULT_REVIEW_SETTINGS } from "../../../models/userSettings";
import { produceConceptBrief } from "./conceptBrief";
import { summarize, summarizeSubclass } from "./carryForward";
import { produceSkeleton, applySkeleton } from "./skeleton";
import { produceChassis, applyChassis } from "./chassis";
import { baseFeatureLevels, produceFeature } from "./features";
import { produceSubclassBrief, subclassFeatureLevels, subclassNames } from "./subclasses";
import { assembleClassPreviews } from "./assemble";
import { critiqueClass, type FlaggedFeature } from "./critic";
import { repairBudgetFor, type PipelineHost } from "./orchestrator";
import { HEAVY_STEP_MAX_TOKENS, PipelinePhase } from "./types";
import type { ReviewVerdict } from "../readiness/types";
import type { ConceptBrief, PipelineResume, PipelineRun, PipelineStatus, RunStepOptions, StepContext, WorkingClass, WorkingFeature, WorkingSubclass } from "./types";

/**
 * The Homebrew Class pipeline (plan §6, §13). M1 shipped the spine — Phase A (design brief) → Phase B
 * (skeleton, RATIFIED by the user) → Phase C (chassis). M2 adds the two loops that make a class FULL: Phase
 * D fills the level-2-to-20 feature progression one feature at a time, each call handed every feature
 * already decided so it extends rather than contradicts; Phase E builds each promised subclass (a mini-brief
 * then its own feature loop). The run then assembles the class and its subclasses into savable previews.
 *
 * Pure orchestration: every model call goes through the injectable step workers and every side effect goes
 * through the `PipelineHost` callbacks, so the whole driver is testable with a scripted runner and spies.
 *
 * The loops are RESILIENT: a single feature (or subclass) that can't pass its gate within the repair budget
 * is SKIPPED, not fatal — a class missing one mid-level feature is far better than aborting a 20-call build,
 * and the level-1 chassis feature guarantees the class always does something. Load-bearing steps (brief,
 * skeleton, chassis) still fail the run, because everything downstream is built on them.
 *
 * M3 adds Phase F (balance & consistency critic) before assembly: at the High usage level the finished class
 * is reviewed as a whole and a blocking verdict regenerates ONLY the feature it named (plan §6.F). At
 * Low/Medium the critic is skipped (a fast pass-through), so the strip still advances but no extra calls run.
 */

/**
 * The phases this pipeline walks, in order. `phaseIndex` into this list drives the "Phase X of Y" UI.
 * Exported so the progress card's strip and the resume-progress seed reuse the one canonical ordering.
 */
export const CLASS_PIPELINE_PHASES = [
    PipelinePhase.DesignBrief, PipelinePhase.Skeleton, PipelinePhase.Chassis,
    PipelinePhase.Features, PipelinePhase.Subclasses, PipelinePhase.Balance, PipelinePhase.Assemble,
    // Post-completion mechanics step: aiAssistant drives this index (never the orchestrator) once enrichment runs.
    PipelinePhase.MadsReview,
];
const PHASES = CLASS_PIPELINE_PHASES;
const TOTAL = PHASES.length;

/** Phase indices into PHASES (kept named so the loops read clearly). */
const FEATURES_PHASE = 3;
const SUBCLASSES_PHASE = 4;
const BALANCE_PHASE = 5;
const ASSEMBLE_PHASE = 6;

/** Bound the approve/refine loop so a user who keeps refining (or a model that keeps drifting) can't spin forever. */
const MAX_RATIFY_ROUNDS = 5;

/** True once the skeleton (Phase B) has been applied — `applySkeleton` always stamps the hit die. */
const hasSkeleton = (w: WorkingClass): boolean => !!w.hitDie;
/** True once the chassis (Phase C) has been applied — `applyChassis` always sets the proficiencies object. */
const hasChassis = (w: WorkingClass): boolean => !!w.proficiencies;

/**
 * Run (or RESUME) the Class pipeline. On a fresh run `working` starts empty and every phase runs. On resume
 * (plan §9, M6) `working`/`brief` come from the persisted checkpoint and each phase is SKIPPED when its
 * output is already present — skeleton/chassis by a presence flag, the feature/subclass loops by filling
 * only the levels/subclasses still missing. So a reloaded run finishes from where it stopped without
 * re-asking a decided step (notably never re-prompting the user to ratify an already-approved skeleton).
 */
export async function runClassPipeline(seed: string, host: PipelineHost, resume?: PipelineResume<WorkingClass>): Promise<void> {
    const working: WorkingClass = resume?.working ?? {};
    const opts: RunStepOptions = { repairBudget: repairBudgetFor(host.usageLevel), signal: host.signal };

    const emit = (index: number, status: PipelineStatus, extra?: Partial<PipelineRun>) =>
        host.onProgress({ pipelineType: "class", phase: PHASES[index], phaseIndex: index, totalPhases: TOTAL, status, ...extra });

    /** Fresh class-scoped context for a step: the brief plus the carry-forward digest of everything so far. */
    const classCtx = (): StepContext => ({ brief, summary: summarize(working, "class") });

    let brief: ConceptBrief;

    try {
        // ── Phase A — design brief (skip if resumed with one) ──────────────────
        if (resume?.brief) {
            brief = resume.brief;
        } else {
            emit(0, "running");
            const briefResult = await produceConceptBrief(seed, "class", host.ai, opts, host.runner);
            if (host.signal.aborted) return void emit(0, "aborted");
            if (!briefResult.ok || !briefResult.value) {
                return fail(host, emit, 0, briefResult.errors[0] ?? "Couldn't draft a design brief for the class.");
            }
            brief = briefResult.value;
            host.onCheckpoint?.(0, working, brief);
        }

        // ── Phase B — skeleton (ratified; skip if already approved on a prior run) ──
        if (!hasSkeleton(working)) {
            let refinement = "";
            let approved = false;
            for (let round = 0; round < MAX_RATIFY_ROUNDS && !approved; round++) {
                emit(1, "running");
                const skeletonResult = await produceSkeleton(
                    seed, refinement, brief, classCtx(), host.ai, opts, host.runner);
                if (host.signal.aborted) return void emit(1, "aborted");
                if (!skeletonResult.ok || !skeletonResult.value) {
                    return fail(host, emit, 1, skeletonResult.errors[0] ?? "Couldn't draft a class skeleton.");
                }
                const plan = skeletonResult.value;

                emit(1, "awaiting_user");
                const decision = await host.ratifySkeleton(plan);
                if (host.signal.aborted) return void emit(1, "aborted");
                if (decision.type === "reject") return void emit(1, "aborted");
                if (decision.type === "refine") { refinement = decision.text; continue; }
                applySkeleton(working, plan);
                approved = true;
            }
            if (!approved) return fail(host, emit, 1, "The skeleton wasn't approved.");
            host.onCheckpoint?.(1, working, brief);
        }

        // ── Phase C — chassis (skip if already built on a prior run) ───────────
        if (!hasChassis(working)) {
            emit(2, "running");
            const chassisResult = await produceChassis(brief, classCtx(), host.ai, { ...opts, maxTokens: HEAVY_STEP_MAX_TOKENS }, host.runner);
            if (host.signal.aborted) return void emit(2, "aborted");
            if (!chassisResult.ok || !chassisResult.value) {
                return fail(host, emit, 2, chassisResult.errors[0] ?? "Couldn't build the class chassis.");
            }
            applyChassis(working, chassisResult.value);
            host.onCheckpoint?.(2, working, brief);
        }

        // ── Phase D — features (loop) ──────────────────────────────────────────
        if (await runFeatureLoop(working, brief, host, opts, classCtx, emit)) return;   // aborted mid-loop

        // ── Phase E — subclasses (loop) ────────────────────────────────────────
        if (await runSubclassLoop(working, brief, host, opts, classCtx, emit)) return;  // aborted mid-loop

        // ── Phase F — balance & consistency critic (High only) ─────────────────
        if (await runCritic(working, brief, host, opts, emit)) return;                  // aborted mid-critic

        // ── Assemble + emit savable previews (class, then subclasses) ─────────
        emit(ASSEMBLE_PHASE, "running");
        const previews = assembleClassPreviews(working, host.dndSystem);
        if (host.signal.aborted) return void emit(ASSEMBLE_PHASE, "aborted");
        emit(ASSEMBLE_PHASE, "completed", { currentPreview: previews[0] });
        host.onComplete(previews);
    } catch (e) {
        if (host.signal.aborted) return;
        fail(host, emit, 0, e instanceof Error ? e.message : String(e));
    }
}

type Emit = (index: number, status: PipelineStatus, extra?: Partial<PipelineRun>) => void;

/**
 * Phase D: fill the base class's feature progression, one feature per level in `baseFeatureLevels`. Each
 * call sees the growing carry-forward summary (so a later feature builds on an earlier one) and is gated
 * against the features already decided (so no duplicate). Returns true if the run was aborted mid-loop.
 */
async function runFeatureLoop(
    working: WorkingClass, brief: ConceptBrief, host: PipelineHost,
    opts: RunStepOptions, classCtx: () => StepContext, emit: Emit,
): Promise<boolean> {
    emit(FEATURES_PHASE, "running");
    const levels = baseFeatureLevels(working);
    // Resume idempotency: a level already filled on a prior run is skipped, so the loop fills only the gap.
    const have = new Set((working.features ?? []).map(f => f.level));
    for (let i = 0; i < levels.length; i++) {
        if (host.signal.aborted) { emit(FEATURES_PHASE, "aborted"); return true; }
        const level = levels[i];
        if (have.has(level)) continue;
        emit(FEATURES_PHASE, "running", { note: `Feature ${i + 1} of ${levels.length} — level ${level}…` });

        const res = await produceFeature(level, working.features ?? [], classCtx(), host.ai, opts, host.runner);
        if (host.signal.aborted) { emit(FEATURES_PHASE, "aborted"); return true; }
        if (res.ok && res.value) {
            (working.features ??= []).push(res.value);
            have.add(level);
            host.onCheckpoint?.(FEATURES_PHASE, working, brief);
        }
        // else: skip this level (resilient) — the build continues with the features that succeeded.
    }
    return false;
}

/**
 * Phase E: for each subclass the skeleton promised, anchor it with a mini-brief, then run its own feature
 * loop at `subclassFeatureLevels`. A subclass we can't even name is skipped; an individual subclass feature
 * that fails its gate is skipped. Returns true if the run was aborted mid-loop.
 */
async function runSubclassLoop(
    working: WorkingClass, brief: ConceptBrief, host: PipelineHost,
    opts: RunStepOptions, classCtx: () => StepContext, emit: Emit,
): Promise<boolean> {
    emit(SUBCLASSES_PHASE, "running");
    const count = working.subclassCount ?? 0;
    const featureLevels = subclassFeatureLevels(working.subclassLevel ?? 0);

    for (let i = 0; i < count; i++) {
        if (host.signal.aborted) { emit(SUBCLASSES_PHASE, "aborted"); return true; }
        emit(SUBCLASSES_PHASE, "running", { note: `Subclass ${i + 1} of ${count}…` });

        // Resume idempotency: re-adopt a subclass already anchored on a prior run; otherwise anchor it now.
        let sub = (working.subclasses ?? [])[i];
        if (!sub) {
            const briefRes = await produceSubclassBrief(i, count, subclassNames(working), classCtx(), host.ai, opts, host.runner);
            if (host.signal.aborted) { emit(SUBCLASSES_PHASE, "aborted"); return true; }
            if (!briefRes.ok || !briefRes.value) continue;   // couldn't anchor it — skip this subclass

            sub = { name: briefRes.value.name, brief: briefRes.value.brief, features: [] };
            (working.subclasses ??= []).push(sub);
            host.onCheckpoint?.(SUBCLASSES_PHASE, working, brief);
        }

        // Fill only the feature levels this subclass is still missing (clean on both fresh runs and resume).
        const have = new Set(sub.features.map(f => f.level));
        const ownerLabel = `the «${sub.name}» subclass`;
        for (let j = 0; j < featureLevels.length; j++) {
            if (host.signal.aborted) { emit(SUBCLASSES_PHASE, "aborted"); return true; }
            const level = featureLevels[j];
            if (have.has(level)) continue;
            emit(SUBCLASSES_PHASE, "running", { note: `${sub.name}: feature ${j + 1} of ${featureLevels.length} — level ${level}…` });

            const ctx: StepContext = { brief, summary: summarizeSubclass(working, sub) };
            const fRes = await produceFeature(level, sub.features, ctx, host.ai, opts, host.runner, ownerLabel);
            if (host.signal.aborted) { emit(SUBCLASSES_PHASE, "aborted"); return true; }
            if (fRes.ok && fRes.value) {
                sub.features.push(fRes.value);
                have.add(level);
                host.onCheckpoint?.(SUBCLASSES_PHASE, working, brief);
            }
            // else: skip this subclass feature (resilient).
        }
    }
    return false;
}

/**
 * Phase F: the BALANCE & CONSISTENCY critic. At Low/Medium (or with no reviewer) this is a fast pass-through —
 * the plan reserves the LLM critic for High (§8). At High it wraps the finished class as a synthetic preview,
 * runs the readiness pipeline + a whole-class shape pass over it, and REGENERATES ONLY the features a blocking
 * verdict named, re-critiquing for a bounded number of rounds. Fail-open: an unmappable verdict is surfaced but
 * never blocks assembly, and a regeneration that fails its gate keeps the original feature. Returns true if aborted.
 */
async function runCritic(
    working: WorkingClass, brief: ConceptBrief, host: PipelineHost,
    opts: RunStepOptions, emit: Emit,
): Promise<boolean> {
    emit(BALANCE_PHASE, "running");
    // Low/Medium skip the critic entirely; the strip still advances so the UI stays honest.
    if (host.usageLevel !== "high" || !host.reviewer) { emit(BALANCE_PHASE, "completed"); return false; }

    const reviewer = host.reviewer;
    const blockingSeverity = host.ai.review?.blockingSeverity ?? DEFAULT_REVIEW_SETTINGS.blockingSeverity;
    // Reuse the High schema-retry cap as the auto-fix round bound (plan §8): regenerate → re-critique, bounded.
    const maxRounds = Math.max(1, host.ai.review?.maxSchemaRetries ?? DEFAULT_HIGH_MAX_SCHEMA_RETRIES);

    let verdicts: ReviewVerdict[] = [];
    for (let round = 0; round < maxRounds; round++) {
        if (host.signal.aborted) { emit(BALANCE_PHASE, "aborted"); return true; }
        const result = await critiqueClass(working, reviewer, { dndSystem: host.dndSystem, blockingSeverity });
        if (host.signal.aborted) { emit(BALANCE_PHASE, "aborted"); return true; }
        verdicts = result.verdicts;
        emit(BALANCE_PHASE, "running", { verdicts });
        if (!result.flagged.length) break;   // nothing mapped to a feature → stop (verdicts already surfaced)
        await regenerateFlagged(working, brief, result.flagged, host, opts, emit);
        if (host.signal.aborted) { emit(BALANCE_PHASE, "aborted"); return true; }
        host.onCheckpoint?.(BALANCE_PHASE, working, brief);
    }
    emit(BALANCE_PHASE, "completed", { verdicts });
    return false;
}

/** Regenerate each flagged feature in place (base class or its owning subclass), feeding the critic's complaint in. */
async function regenerateFlagged(
    working: WorkingClass, brief: ConceptBrief, flagged: FlaggedFeature[],
    host: PipelineHost, opts: RunStepOptions, emit: Emit,
): Promise<void> {
    for (const f of flagged) {
        if (host.signal.aborted) return;
        emit(BALANCE_PHASE, "running", { note: `Reworking ${f.name} (level ${f.level})…` });
        if (f.subclass) {
            const sub = (working.subclasses ?? []).find(s => s.name === f.subclass);
            if (sub) await regenerateFeatureInScope(sub.features, f, brief, () => summarizeSubclass(working, sub), `the «${sub.name}» subclass`, host, opts);
        } else {
            const features = (working.features ??= []);
            await regenerateFeatureInScope(features, f, brief, () => summarize(working, "class"), "this class", host, opts);
        }
    }
}

/**
 * Rewrite one flagged feature in `list`: drop it first (so neither the carry-forward summary nor the
 * duplicate gate still sees the old version), regenerate at the same level with the critic's complaint, then
 * slot the result back at its old position. A regeneration that can't pass its gate keeps the original — the
 * critic must never leave the class worse than it found it.
 */
async function regenerateFeatureInScope(
    list: WorkingFeature[], flagged: FlaggedFeature, brief: ConceptBrief,
    summaryFn: () => string, ownerLabel: string, host: PipelineHost, opts: RunStepOptions,
): Promise<void> {
    const idx = list.findIndex(x => x.name.trim().toLowerCase() === flagged.name.trim().toLowerCase());
    if (idx < 0) return;
    const original = list[idx];
    list.splice(idx, 1);
    const ctx: StepContext = { brief, summary: summaryFn() };
    const res = await produceFeature(flagged.level, list, ctx, host.ai, opts, host.runner, ownerLabel, flagged.reason);
    list.splice(idx, 0, res.ok && res.value ? res.value : original);
}

/** Emit a terminal error for the given phase and notify the host. Returns void for `return fail(...)` use. */
function fail(
    host: PipelineHost,
    emit: Emit,
    phaseIndex: number,
    message: string,
): void {
    emit(phaseIndex, "error", { error: message });
    host.onError(message);
}
