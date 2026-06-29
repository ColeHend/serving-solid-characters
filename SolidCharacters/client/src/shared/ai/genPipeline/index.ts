/**
 * Staged generation pipeline. See StagedGenPipeline.Plan.md.
 *
 * M0 shipped the shared infrastructure (types, compute, carry-forward, step worker, validators, concept
 * brief, checkpoints). M1 adds the Class thin slice: the skeleton (Phase B) + chassis (Phase C) steps, the
 * assemble step, and the standalone orchestrator that drives Phase A → B (ratified) → C → assemble. M2 adds
 * the feature loop (Phase D) and the subclass loop (Phase E) that fill out a full 1–20 class. M5 adds the
 * net-new Character pipeline (Phases 1–7): foundation, trained-in, capabilities, loadout, narrative, and the
 * code-computed derived stats, assembling to the `Character` model.
 */
export * from "./types";
export * from "./compute";
export * from "./carryForward";
export * from "./validate";
export * from "./stepWorker";
export * from "./conceptBrief";
export * from "./skeleton";
export * from "./chassis";
export * from "./features";
export * from "./subclasses";
export * from "./assemble";
export * from "./critic";
export * from "./orchestrator";
export * from "./classPipeline";
export * from "./foundation";
export * from "./trainedIn";
export * from "./capabilities";
export * from "./loadout";
export * from "./narrative";
export * from "./assembleCharacter";
export * from "./characterPipeline";
export { pipelineCheckpointManager } from "./checkpoint/pipelineCheckpointManager";
export type { NewCheckpoint } from "./checkpoint/pipelineCheckpointManager";
