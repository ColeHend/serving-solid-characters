import { describe, it, expect, beforeEach } from "vitest";
import pipelineCheckpointDB from "./checkpointDB";
import { pipelineCheckpointManager } from "./pipelineCheckpointManager";
import type { WorkingClass } from "../types";

const working = (name: string): WorkingClass => ({ name, hitDie: "d8" });

describe("pipelineCheckpointManager", () => {
    beforeEach(async () => {
        await pipelineCheckpointDB.checkpoints.clear();
    });

    it("creates a checkpoint with an id and timestamps", async () => {
        const cp = await pipelineCheckpointManager.create({
            conversationId: "conv-1", pipelineType: "class", currentPhaseIndex: 0, working: working("Alpha"),
        });
        expect(cp.id).toBeTruthy();
        expect(cp.createdAt).toBeGreaterThan(0);
        expect(cp.updatedAt).toBe(cp.createdAt);
        expect(await pipelineCheckpointManager.getById(cp.id)).toEqual(cp);
    });

    it("saves a checkpoint after a step, advancing the phase and bumping updatedAt", async () => {
        const cp = await pipelineCheckpointManager.create({
            conversationId: "conv-2", pipelineType: "class", currentPhaseIndex: 0, working: working("Beta"),
        });
        const advanced = await pipelineCheckpointManager.save({
            ...cp, currentPhaseIndex: 1, working: { ...working("Beta"), primaryAbility: "STR" },
        });
        expect(advanced.currentPhaseIndex).toBe(1);
        expect(advanced.updatedAt).toBeGreaterThanOrEqual(cp.updatedAt);
        const stored = await pipelineCheckpointManager.getById(cp.id);
        expect((stored?.working as WorkingClass).primaryAbility).toBe("STR");
    });

    it("get() returns the most-recently-updated checkpoint for a conversation", async () => {
        const a = await pipelineCheckpointManager.create({
            conversationId: "conv-3", pipelineType: "class", currentPhaseIndex: 0, working: working("Old"),
        });
        const b = await pipelineCheckpointManager.create({
            conversationId: "conv-3", pipelineType: "character", currentPhaseIndex: 0, working: { name: "New" },
        });
        // bump b so it is unambiguously the latest
        await pipelineCheckpointManager.save({ ...b, currentPhaseIndex: 2 });
        const latest = await pipelineCheckpointManager.get("conv-3");
        expect(latest?.id).toBe(b.id);
        expect(latest?.currentPhaseIndex).toBe(2);
        expect(a.id).not.toBe(b.id);
    });

    it("returns undefined when no checkpoint exists for a conversation", async () => {
        expect(await pipelineCheckpointManager.get("nope")).toBeUndefined();
    });

    it("discards a checkpoint by id", async () => {
        const cp = await pipelineCheckpointManager.create({
            conversationId: "conv-4", pipelineType: "class", currentPhaseIndex: 0, working: working("Gamma"),
        });
        await pipelineCheckpointManager.discard(cp.id);
        expect(await pipelineCheckpointManager.getById(cp.id)).toBeUndefined();
    });

    it("discards every checkpoint for a conversation", async () => {
        await pipelineCheckpointManager.create({ conversationId: "conv-5", pipelineType: "class", currentPhaseIndex: 0, working: working("A") });
        await pipelineCheckpointManager.create({ conversationId: "conv-5", pipelineType: "class", currentPhaseIndex: 1, working: working("B") });
        await pipelineCheckpointManager.discardForConversation("conv-5");
        expect(await pipelineCheckpointManager.get("conv-5")).toBeUndefined();
    });
});
