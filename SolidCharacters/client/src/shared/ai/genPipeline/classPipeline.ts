import { produceConceptBrief } from "./conceptBrief";
import { summarize, summarizeSubclass } from "./carryForward";
import { produceSkeleton, applySkeleton } from "./skeleton";
import { produceChassis, applyChassis } from "./chassis";
import { baseFeatureLevels, produceFeature } from "./features";
import { produceSubclassBrief, subclassFeatureLevels, subclassNames } from "./subclasses";
import { assembleClassPreviews } from "./assemble";
import { repairBudgetFor, type PipelineHost } from "./orchestrator";
import { PipelinePhase } from "./types";
import type { ConceptBrief, PipelineRun, PipelineStatus, RunStepOptions, StepContext, WorkingClass, WorkingSubclass } from "./types";

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
 */

/** The phases this pipeline walks, in order. `phaseIndex` into this list drives the "Phase X of Y" UI. */
const PHASES = [
    PipelinePhase.DesignBrief, PipelinePhase.Skeleton, PipelinePhase.Chassis,
    PipelinePhase.Features, PipelinePhase.Subclasses, PipelinePhase.Assemble,
];
const TOTAL = PHASES.length;

/** Phase indices into PHASES (kept named so the loops read clearly). */
const FEATURES_PHASE = 3;
const SUBCLASSES_PHASE = 4;
const ASSEMBLE_PHASE = 5;

/** Bound the approve/refine loop so a user who keeps refining (or a model that keeps drifting) can't spin forever. */
const MAX_RATIFY_ROUNDS = 5;

export async function runClassPipeline(seed: string, host: PipelineHost): Promise<void> {
    const working: WorkingClass = {};
    const opts: RunStepOptions = { repairBudget: repairBudgetFor(host.usageLevel), signal: host.signal };

    const emit = (index: number, status: PipelineStatus, extra?: Partial<PipelineRun>) =>
        host.onProgress({ pipelineType: "class", phase: PHASES[index], phaseIndex: index, totalPhases: TOTAL, status, ...extra });

    /** Fresh class-scoped context for a step: the brief plus the carry-forward digest of everything so far. */
    const classCtx = (): StepContext => ({ brief, summary: summarize(working, "class") });

    let brief: ConceptBrief;

    try {
        // ── Phase A — design brief ─────────────────────────────────────────────
        emit(0, "running");
        const briefResult = await produceConceptBrief(seed, "class", host.ai, opts, host.runner);
        if (host.signal.aborted) return void emit(0, "aborted");
        if (!briefResult.ok || !briefResult.value) {
            return fail(host, emit, 0, briefResult.errors[0] ?? "Couldn't draft a design brief for the class.");
        }
        brief = briefResult.value;
        host.onCheckpoint?.(0, working, brief);

        // ── Phase B — skeleton (ratified) ──────────────────────────────────────
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

        // ── Phase C — chassis ──────────────────────────────────────────────────
        emit(2, "running");
        const chassisResult = await produceChassis(brief, classCtx(), host.ai, opts, host.runner);
        if (host.signal.aborted) return void emit(2, "aborted");
        if (!chassisResult.ok || !chassisResult.value) {
            return fail(host, emit, 2, chassisResult.errors[0] ?? "Couldn't build the class chassis.");
        }
        applyChassis(working, chassisResult.value);
        host.onCheckpoint?.(2, working, brief);

        // ── Phase D — features (loop) ──────────────────────────────────────────
        if (await runFeatureLoop(working, brief, host, opts, classCtx, emit)) return;   // aborted mid-loop

        // ── Phase E — subclasses (loop) ────────────────────────────────────────
        if (await runSubclassLoop(working, brief, host, opts, classCtx, emit)) return;  // aborted mid-loop

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
    for (let i = 0; i < levels.length; i++) {
        if (host.signal.aborted) { emit(FEATURES_PHASE, "aborted"); return true; }
        const level = levels[i];
        emit(FEATURES_PHASE, "running", { note: `Feature ${i + 1} of ${levels.length} — level ${level}…` });

        const res = await produceFeature(level, working.features ?? [], classCtx(), host.ai, opts, host.runner);
        if (host.signal.aborted) { emit(FEATURES_PHASE, "aborted"); return true; }
        if (res.ok && res.value) {
            (working.features ??= []).push(res.value);
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

        const briefRes = await produceSubclassBrief(i, count, subclassNames(working), classCtx(), host.ai, opts, host.runner);
        if (host.signal.aborted) { emit(SUBCLASSES_PHASE, "aborted"); return true; }
        if (!briefRes.ok || !briefRes.value) continue;   // couldn't anchor it — skip this subclass

        const sub: WorkingSubclass = { name: briefRes.value.name, brief: briefRes.value.brief, features: [] };
        (working.subclasses ??= []).push(sub);
        host.onCheckpoint?.(SUBCLASSES_PHASE, working, brief);

        const ownerLabel = `the «${sub.name}» subclass`;
        for (let j = 0; j < featureLevels.length; j++) {
            if (host.signal.aborted) { emit(SUBCLASSES_PHASE, "aborted"); return true; }
            const level = featureLevels[j];
            emit(SUBCLASSES_PHASE, "running", { note: `${sub.name}: feature ${j + 1} of ${featureLevels.length} — level ${level}…` });

            const ctx: StepContext = { brief, summary: summarizeSubclass(working, sub) };
            const fRes = await produceFeature(level, sub.features, ctx, host.ai, opts, host.runner, ownerLabel);
            if (host.signal.aborted) { emit(SUBCLASSES_PHASE, "aborted"); return true; }
            if (fRes.ok && fRes.value) {
                sub.features.push(fRes.value);
                host.onCheckpoint?.(SUBCLASSES_PHASE, working, brief);
            }
            // else: skip this subclass feature (resilient).
        }
    }
    return false;
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
