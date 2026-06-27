/**
 * Staged generation pipeline — shared infrastructure (milestone M0). See StagedGenPipeline.Plan.md.
 *
 * Public surface for the orchestrator + UI built in later milestones. The state machine
 * (orchestrator.ts, classPipeline.ts, characterPipeline.ts) lands in M1+.
 */
export * from "./types";
export * from "./compute";
export * from "./carryForward";
export * from "./validate";
export * from "./stepWorker";
export * from "./conceptBrief";
export { pipelineCheckpointManager } from "./checkpoint/pipelineCheckpointManager";
export type { NewCheckpoint } from "./checkpoint/pipelineCheckpointManager";
