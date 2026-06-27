import { createNewId } from "../../../customHooks/utility/tools/idGen";
import pipelineCheckpointDB from "./checkpointDB";
import type { ConceptBrief, PipelineCheckpoint, PipelineType, WorkingEntity } from "../types";

/** The fields needed to start a new checkpoint; id + timestamps are filled by `create`. */
export interface NewCheckpoint {
    conversationId: string;
    pipelineType: PipelineType;
    /** The original generation seed, so resume can re-run any phase (concept/skeleton/foundation) that needs it. */
    seed: string;
    currentPhaseIndex: number;
    working: WorkingEntity;
    conceptBrief?: ConceptBrief;
}

/**
 * Load/save/discard for pipeline checkpoints (plan §9 — pattern of `homebrewManager5e`, minus the reactive
 * signal: checkpoints are written after each step and read once on resume, not subscribed to live). Plain
 * async over the dedicated Dexie table so it's directly testable under `fake-indexeddb`.
 */
class PipelineCheckpointManager {
    /** Create + persist a brand-new checkpoint (Phase A/1). Returns the stored row (with id + timestamps). */
    async create(input: NewCheckpoint): Promise<PipelineCheckpoint> {
        const now = Date.now();
        const checkpoint: PipelineCheckpoint = {
            id: createNewId(),
            conversationId: input.conversationId,
            pipelineType: input.pipelineType,
            seed: input.seed,
            currentPhaseIndex: input.currentPhaseIndex,
            working: input.working,
            conceptBrief: input.conceptBrief,
            createdAt: now,
            updatedAt: now,
        };
        await pipelineCheckpointDB.checkpoints.put(checkpoint);
        return checkpoint;
    }

    /** Upsert a checkpoint after a step, bumping `updatedAt`. Returns the stored row. */
    async save(checkpoint: PipelineCheckpoint): Promise<PipelineCheckpoint> {
        const updated: PipelineCheckpoint = { ...checkpoint, updatedAt: Date.now() };
        await pipelineCheckpointDB.checkpoints.put(updated);
        return updated;
    }

    /** The in-flight checkpoint for a conversation (most-recent if several), or undefined. */
    async get(conversationId: string): Promise<PipelineCheckpoint | undefined> {
        const rows = await pipelineCheckpointDB.checkpoints.where("conversationId").equals(conversationId).toArray();
        if (!rows.length) return undefined;
        return rows.reduce((latest, r) => (r.updatedAt > latest.updatedAt ? r : latest));
    }

    /** A checkpoint by its own id. */
    async getById(id: string): Promise<PipelineCheckpoint | undefined> {
        return pipelineCheckpointDB.checkpoints.get(id);
    }

    /** All checkpoints, most-recent first. */
    async list(): Promise<PipelineCheckpoint[]> {
        return pipelineCheckpointDB.checkpoints.orderBy("updatedAt").reverse().toArray();
    }

    /** Drop a checkpoint by id (on completion or abort). */
    async discard(id: string): Promise<void> {
        await pipelineCheckpointDB.checkpoints.delete(id);
    }

    /** Drop every checkpoint for a conversation (cleanup when a chat is deleted). */
    async discardForConversation(conversationId: string): Promise<void> {
        await pipelineCheckpointDB.checkpoints.where("conversationId").equals(conversationId).delete();
    }
}

export const pipelineCheckpointManager = new PipelineCheckpointManager();
export default pipelineCheckpointManager;
