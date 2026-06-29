import { describe, it, expect, beforeEach } from "vitest";
import { str } from "../coerce";
import type { AiSettings } from "../../../models/userSettings";
import type { AiToolDef } from "../types";
import type { SubAgentResult } from "../subAgent";
import { runStep, StepModelRunner } from "./stepWorker";
import { summarize } from "./carryForward";
import { pipelineCheckpointManager } from "./checkpoint/pipelineCheckpointManager";
import pipelineCheckpointDB from "./checkpoint/checkpointDB";
import type { ConceptBrief, StepSpec, WorkingClass } from "./types";

/**
 * M0 acceptance (plan §13): a throwaway 2-step stub pipeline runs, repairs a forced-bad step, and
 * checkpoints. This wires the real `runStep` + `carryForward.summarize` + `pipelineCheckpointManager`
 * together over a stub model runner — exactly the shape the real orchestrator (M1) will take, minus the
 * phase machine.
 */

const AI = { provider: "local", model: "stub", localBaseUrl: "", enabled: true } as AiSettings;

const VALID_HIT_DICE = new Set(["d6", "d8", "d10", "d12"]);
const VALID_ABILITIES = new Set(["STR", "DEX", "CON", "INT", "WIS", "CHA"]);

const HIT_DIE_TOOL: AiToolDef = {
    name: "set_hit_die", description: "Set the class hit die.",
    inputSchema: { type: "object", additionalProperties: false, properties: { hit_die: { type: "string" } }, required: ["hit_die"] },
};
const PRIMARY_TOOL: AiToolDef = {
    name: "set_primary_ability", description: "Set the class primary ability.",
    inputSchema: { type: "object", additionalProperties: false, properties: { primary_ability: { type: "string" } }, required: ["primary_ability"] },
};

const hitDieStep: StepSpec<{ hitDie: string }> = {
    id: "chassis-hit-die", tool: HIT_DIE_TOOL, system: "Pick a hit die.", task: "Choose the hit die.",
    parse: raw => {
        const hitDie = str(raw.hit_die).trim().toLowerCase();
        return { value: { hitDie }, errors: VALID_HIT_DICE.has(hitDie) ? [] : ["hit die must be one of d6, d8, d10, d12"] };
    },
};
const primaryStep: StepSpec<{ primaryAbility: string }> = {
    id: "chassis-primary", tool: PRIMARY_TOOL, system: "Pick a primary ability.", task: "Choose the primary ability.",
    parse: raw => {
        const primaryAbility = str(raw.primary_ability).trim().toUpperCase();
        return { value: { primaryAbility }, errors: VALID_ABILITIES.has(primaryAbility) ? [] : ["primary ability must be STR/DEX/CON/INT/WIS/CHA"] };
    },
};

/** Routes by the step's forced tool. The primary-ability step returns garbage first, then repairs. */
function stubRunner(): StepModelRunner {
    let primaryAttempts = 0;
    return async (spec): Promise<SubAgentResult> => {
        const toolName = spec.tools[0]?.name;
        if (toolName === "set_hit_die") {
            return { text: "", toolCalls: [{ id: "h", name: toolName, input: { hit_die: "d10", fits_concept: "tough storm-touched warriors" } }], ok: true };
        }
        if (toolName === "set_primary_ability") {
            primaryAttempts++;
            const input = primaryAttempts === 1 ? { primary_ability: "Mighty Thews" } : { primary_ability: "STR" };
            return { text: "", toolCalls: [{ id: "p", name: toolName, input }], ok: true };
        }
        return { text: "", toolCalls: [], ok: true };
    };
}

describe("2-step stub pipeline (M0 acceptance)", () => {
    beforeEach(async () => {
        await pipelineCheckpointDB.checkpoints.clear();
    });

    it("runs both steps, repairs the bad one, and checkpoints after each", async () => {
        const runner = stubRunner();
        const brief: ConceptBrief = {
            concept: "A knight who borrows strength from a bound storm", tone: "grim, martial",
            power_tier: "on par with the Fighter", motifs: ["chained lightning", "iron gauntlet"],
            themes: ["debt"], naming_style: "weather + martial", constraints: [],
        };
        const working: WorkingClass = { name: "Stormwarden" };

        const cp = await pipelineCheckpointManager.create({
            conversationId: "acc-1", pipelineType: "class", seed: "a storm knight", currentPhaseIndex: 0, working, conceptBrief: brief,
        });

        // ── step 1: hit die (clean) ──
        const r1 = await runStep(hitDieStep, { brief, summary: summarize(working, "class") }, AI, { repairBudget: 1 }, runner);
        expect(r1.ok).toBe(true);
        expect(r1.attempts).toBe(1);
        working.hitDie = r1.value!.hitDie;
        const cp1 = await pipelineCheckpointManager.save({ ...cp, currentPhaseIndex: 1, working });

        // ── step 2: primary ability (forced-bad first attempt, then repairs) ──
        const summaryForStep2 = summarize(working, "class");
        expect(summaryForStep2).toContain("d10");   // carry-forward now carries the decided hit die
        const r2 = await runStep(primaryStep, { brief, summary: summaryForStep2 }, AI, { repairBudget: 1 }, runner);
        expect(r2.ok).toBe(true);
        expect(r2.attempts).toBe(2);   // the repair happened
        working.primaryAbility = r2.value!.primaryAbility;
        await pipelineCheckpointManager.save({ ...cp1, currentPhaseIndex: 2, working });

        // ── the persisted checkpoint reflects the full run ──
        const restored = await pipelineCheckpointManager.get("acc-1");
        expect(restored?.currentPhaseIndex).toBe(2);
        const w = restored?.working as WorkingClass;
        expect(w.hitDie).toBe("d10");
        expect(w.primaryAbility).toBe("STR");
        expect(restored?.conceptBrief?.concept).toContain("bound storm");
    });
});
