import Dexie from "dexie";
import type { PipelineCheckpoint } from "../types";

/**
 * Dedicated Dexie database for in-flight pipeline checkpoints (plan §9). Deliberately SEPARATE from
 * `chatHistoryDB` so the conversation's intentional sanitization (`sanitizePreviewsForStore`,
 * `balancedHistory`) stays untouched — partial pipeline state lives here, not on `SavedConversation`.
 *
 * `conversationId` and `updatedAt` are indexed so resume can look up "the in-flight checkpoint for this
 * chat" and the manager can list most-recent-first.
 */
class PipelineCheckpointDB extends Dexie {
    checkpoints!: Dexie.Table<PipelineCheckpoint, string>;

    constructor(name: string) {
        super(name);
        this.version(1).stores({ checkpoints: "id, conversationId, updatedAt" });
    }
}

const pipelineCheckpointDB = new PipelineCheckpointDB("dnd_pipelineCheckpoints");

export default pipelineCheckpointDB;
