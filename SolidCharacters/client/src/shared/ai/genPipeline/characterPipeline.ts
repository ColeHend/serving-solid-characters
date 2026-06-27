import { produceConceptBrief } from "./conceptBrief";
import { summarize } from "./carryForward";
import { produceFoundation, applyFoundation } from "./foundation";
import { produceAbilityScores, produceTraining, applyTraining } from "./trainedIn";
import { produceCapabilities, produceSpells } from "./capabilities";
import { produceLoadout, applyLoadout } from "./loadout";
import { produceNarrative, applyNarrative } from "./narrative";
import { computeCharacterStats } from "./compute";
import { assembleCharacter } from "./assembleCharacter";
import { repairBudgetFor, type CharacterPipelineHost } from "./orchestrator";
import { PipelinePhase } from "./types";
import type { ConceptBrief, PipelineRun, PipelineStatus, RunStepOptions, StepContext, WorkingCharacter } from "./types";

/**
 * The Character pipeline (plan §7, §13 M5). Net-new surface: there is no AI character-creation tool today,
 * so this builds a `WorkingCharacter` step by step and assembles it into the `Character` model the app
 * persists. It reuses ALL the M0–M4 infrastructure — the same step worker, concept brief, carry-forward
 * summary, validators, compute primitives, checkpoints, and `GenPipelineCard` — differing only in its
 * phases and the assemble/save target.
 *
 * Phases (1–7): Concept → Foundation → Trained-in (scores → code-computed modifiers → skills/saves) →
 * Capabilities (features, + spells if a caster) → Loadout → Narrative → Compute (AC/HP/DCs in code) +
 * assemble. There is no ratification gate and no LLM critic (plan §7, §12) — the reliability comes from the
 * decomposition + per-step repair, exactly as for the class.
 *
 * RESILIENCE mirrors the class loops: the LOAD-BEARING steps (concept, foundation, ability scores) fail the
 * run because everything downstream needs them; the rest (training, capabilities, spells, loadout,
 * narrative) are best-effort — a character missing its bonds is far better than a 7-step build that aborts,
 * and the assembler fills sensible defaults (a name from class+lineage, 10s for unrolled scores, AC 10+Dex).
 */

/** The phases this pipeline walks, in order. `phaseIndex` into this list drives the "Phase X of Y" UI. */
const PHASES = [
    PipelinePhase.Concept, PipelinePhase.Foundation, PipelinePhase.TrainedIn,
    PipelinePhase.Capabilities, PipelinePhase.Loadout, PipelinePhase.Narrative, PipelinePhase.Compute,
];
const TOTAL = PHASES.length;

/** Phase indices into PHASES (named so the body reads clearly). */
const CONCEPT_PHASE = 0;
const FOUNDATION_PHASE = 1;
const TRAINED_IN_PHASE = 2;
const CAPABILITIES_PHASE = 3;
const LOADOUT_PHASE = 4;
const NARRATIVE_PHASE = 5;
const COMPUTE_PHASE = 6;

export async function runCharacterPipeline(seed: string, host: CharacterPipelineHost): Promise<void> {
    const working: WorkingCharacter = {};
    const opts: RunStepOptions = { repairBudget: repairBudgetFor(host.usageLevel), signal: host.signal };

    const emit = (index: number, status: PipelineStatus, extra?: Partial<PipelineRun>) =>
        host.onProgress({ pipelineType: "character", phase: PHASES[index], phaseIndex: index, totalPhases: TOTAL, status, ...extra });

    /** Fresh character-scoped context for a step: the brief plus the carry-forward digest of everything so far. */
    const charCtx = (): StepContext => ({ brief, summary: summarize(working, "character") });

    let brief: ConceptBrief;

    try {
        // ── Phase 1 — concept anchor ───────────────────────────────────────────
        emit(CONCEPT_PHASE, "running");
        const briefResult = await produceConceptBrief(seed, "character", host.ai, opts, host.runner);
        if (host.signal.aborted) return void emit(CONCEPT_PHASE, "aborted");
        if (!briefResult.ok || !briefResult.value) {
            return fail(host, emit, CONCEPT_PHASE, briefResult.errors[0] ?? "Couldn't draft a concept for the character.");
        }
        brief = briefResult.value;
        host.onCheckpoint?.(CONCEPT_PHASE, working, brief);

        // ── Phase 2 — mechanical foundation ────────────────────────────────────
        emit(FOUNDATION_PHASE, "running");
        const foundationResult = await produceFoundation(seed, brief, charCtx(), host.ai, opts, host.runner);
        if (host.signal.aborted) return void emit(FOUNDATION_PHASE, "aborted");
        if (!foundationResult.ok || !foundationResult.value) {
            return fail(host, emit, FOUNDATION_PHASE, foundationResult.errors[0] ?? "Couldn't decide the character's class and lineage.");
        }
        applyFoundation(working, foundationResult.value);
        host.onCheckpoint?.(FOUNDATION_PHASE, working, brief);

        // ── Phase 3 — trained-in (scores → code modifiers → skills/saves) ──────
        emit(TRAINED_IN_PHASE, "running", { note: "Rolling ability scores…" });
        const scoresResult = await produceAbilityScores(working.abilityPriority ?? [], charCtx(), host.ai, opts, host.runner);
        if (host.signal.aborted) return void emit(TRAINED_IN_PHASE, "aborted");
        if (!scoresResult.ok || !scoresResult.value) {
            return fail(host, emit, TRAINED_IN_PHASE, scoresResult.errors[0] ?? "Couldn't assign the character's ability scores.");
        }
        working.abilityScores = scoresResult.value;
        host.onCheckpoint?.(TRAINED_IN_PHASE, working, brief);

        // Code step: modifiers + proficiency bonus are derived in compute.ts (not asked of the model); they
        // ride into the next step via the carry-forward summary, which renders each score with its modifier.
        emit(TRAINED_IN_PHASE, "running", { note: "Choosing skills & saving throws…" });
        const trainingResult = await produceTraining(charCtx(), host.ai, opts, host.runner);
        if (host.signal.aborted) return void emit(TRAINED_IN_PHASE, "aborted");
        if (trainingResult.ok && trainingResult.value) {
            applyTraining(working, trainingResult.value);   // resilient: a character with no chosen skills still assembles
            host.onCheckpoint?.(TRAINED_IN_PHASE, working, brief);
        }

        // ── Phase 4 — capabilities (features, + spells if a caster) ────────────
        emit(CAPABILITIES_PHASE, "running");
        const capsResult = await produceCapabilities(working.level ?? 1, charCtx(), host.ai, opts, host.runner);
        if (host.signal.aborted) return void emit(CAPABILITIES_PHASE, "aborted");
        if (capsResult.ok && capsResult.value) {
            working.casterType = capsResult.value.casterType;
            working.features = capsResult.value.features;
            host.onCheckpoint?.(CAPABILITIES_PHASE, working, brief);
        }
        if (working.casterType && working.casterType !== "none") {
            emit(CAPABILITIES_PHASE, "running", { note: "Choosing spells…" });
            const spellsResult = await produceSpells(working.casterType, working.level ?? 1, charCtx(), host.ai, opts, host.runner);
            if (host.signal.aborted) return void emit(CAPABILITIES_PHASE, "aborted");
            if (spellsResult.ok && spellsResult.value) {
                working.spells = spellsResult.value;
                host.onCheckpoint?.(CAPABILITIES_PHASE, working, brief);
            }
        }

        // ── Phase 5 — loadout ──────────────────────────────────────────────────
        emit(LOADOUT_PHASE, "running");
        const loadoutResult = await produceLoadout(charCtx(), host.ai, opts, host.runner);
        if (host.signal.aborted) return void emit(LOADOUT_PHASE, "aborted");
        if (loadoutResult.ok && loadoutResult.value) {
            applyLoadout(working, loadoutResult.value);   // resilient: no loadout → unarmored (AC 10+Dex)
            host.onCheckpoint?.(LOADOUT_PHASE, working, brief);
        }

        // ── Phase 6 — narrative (and the character's name) ─────────────────────
        emit(NARRATIVE_PHASE, "running");
        const narrativeResult = await produceNarrative(charCtx(), host.ai, opts, host.runner);
        if (host.signal.aborted) return void emit(NARRATIVE_PHASE, "aborted");
        if (narrativeResult.ok && narrativeResult.value) {
            applyNarrative(working, narrativeResult.value);   // resilient: assembler falls back to a class+lineage name
            host.onCheckpoint?.(NARRATIVE_PHASE, working, brief);
        }

        // ── Phase 7 — compute (AC/HP/DCs in code) + assemble ───────────────────
        emit(COMPUTE_PHASE, "running");
        working.derived = computeCharacterStats(working);
        const character = assembleCharacter(working);
        if (host.signal.aborted) return void emit(COMPUTE_PHASE, "aborted");
        host.onCheckpoint?.(COMPUTE_PHASE, working, brief);
        emit(COMPUTE_PHASE, "completed");
        host.onComplete(character);
    } catch (e) {
        if (host.signal.aborted) return;
        fail(host, emit, CONCEPT_PHASE, e instanceof Error ? e.message : String(e));
    }
}

type Emit = (index: number, status: PipelineStatus, extra?: Partial<PipelineRun>) => void;

/** Emit a terminal error for the given phase and notify the host. Returns void for `return fail(...)` use. */
function fail(host: CharacterPipelineHost, emit: Emit, phaseIndex: number, message: string): void {
    emit(phaseIndex, "error", { error: message });
    host.onError(message);
}
