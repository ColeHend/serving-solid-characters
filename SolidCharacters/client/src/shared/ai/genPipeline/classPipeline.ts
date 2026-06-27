import { produceConceptBrief } from "./conceptBrief";
import { summarize } from "./carryForward";
import { produceSkeleton, applySkeleton } from "./skeleton";
import { produceChassis, applyChassis } from "./chassis";
import { assembleClassPreview } from "./assemble";
import { repairBudgetFor, type PipelineHost } from "./orchestrator";
import { PipelinePhase } from "./types";
import type { ConceptBrief, PipelineRun, PipelineStatus, RunStepOptions, WorkingClass } from "./types";

/**
 * The Homebrew Class pipeline, M1 thin slice (plan §6, §13): Phase A (design brief) → Phase B (skeleton,
 * RATIFIED by the user) → Phase C (chassis) → assemble + emit a savable preview. Features, subclasses, the
 * critic, and full 1-20 progression land in M2/M3; this proves the spine end-to-end, including the human
 * ratification gate, on a single level-1 class.
 *
 * Pure orchestration: every model call goes through the injectable step workers and every side effect goes
 * through the `PipelineHost` callbacks, so the whole driver is testable with a scripted runner and spies.
 */

/** The phases this slice walks, in order. `phaseIndex` into this list drives the "Phase X of Y" UI. */
const PHASES = [PipelinePhase.DesignBrief, PipelinePhase.Skeleton, PipelinePhase.Chassis, PipelinePhase.Assemble];
const TOTAL = PHASES.length;

/** Bound the approve/refine loop so a user who keeps refining (or a model that keeps drifting) can't spin forever. */
const MAX_RATIFY_ROUNDS = 5;

export async function runClassPipeline(seed: string, host: PipelineHost): Promise<void> {
    const working: WorkingClass = {};
    const opts: RunStepOptions = { repairBudget: repairBudgetFor(host.usageLevel), signal: host.signal };

    const emit = (index: number, status: PipelineStatus, extra?: Partial<PipelineRun>) =>
        host.onProgress({ pipelineType: "class", phase: PHASES[index], phaseIndex: index, totalPhases: TOTAL, status, ...extra });

    try {
        // ── Phase A — design brief ─────────────────────────────────────────────
        emit(0, "running");
        const briefResult = await produceConceptBrief(seed, "class", host.ai, opts, host.runner);
        if (host.signal.aborted) return void emit(0, "aborted");
        if (!briefResult.ok || !briefResult.value) {
            return fail(host, emit, 0, briefResult.errors[0] ?? "Couldn't draft a design brief for the class.");
        }
        const brief: ConceptBrief = briefResult.value;
        host.onCheckpoint?.(0, working, brief);

        // ── Phase B — skeleton (ratified) ──────────────────────────────────────
        let refinement = "";
        let approved = false;
        for (let round = 0; round < MAX_RATIFY_ROUNDS && !approved; round++) {
            emit(1, "running");
            const skeletonResult = await produceSkeleton(
                seed, refinement, brief, { brief, summary: summarize(working, "class") }, host.ai, opts, host.runner);
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
        const chassisResult = await produceChassis(brief, { brief, summary: summarize(working, "class") }, host.ai, opts, host.runner);
        if (host.signal.aborted) return void emit(2, "aborted");
        if (!chassisResult.ok || !chassisResult.value) {
            return fail(host, emit, 2, chassisResult.errors[0] ?? "Couldn't build the class chassis.");
        }
        applyChassis(working, chassisResult.value);
        host.onCheckpoint?.(2, working, brief);

        // ── Assemble + emit a savable preview ─────────────────────────────────
        emit(3, "running");
        const preview = assembleClassPreview(working, host.dndSystem);
        if (host.signal.aborted) return void emit(3, "aborted");
        emit(3, "completed", { currentPreview: preview });
        host.onComplete(preview);
    } catch (e) {
        if (host.signal.aborted) return;
        fail(host, emit, 0, e instanceof Error ? e.message : String(e));
    }
}

/** Emit a terminal error for the given phase and notify the host. Returns void for `return fail(...)` use. */
function fail(
    host: PipelineHost,
    emit: (index: number, status: PipelineStatus, extra?: Partial<PipelineRun>) => void,
    phaseIndex: number,
    message: string,
): void {
    emit(phaseIndex, "error", { error: message });
    host.onError(message);
}
