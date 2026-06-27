import { describe, it, expect, beforeEach } from "vitest";
import type { AiSettings } from "../../../models/userSettings";
import type { Class5E } from "../../../models/generated";
import type { HomebrewPreview } from "../tools/toolDispatcher";
import type { SubAgentResult } from "../subAgent";
import type { StepModelRunner } from "./stepWorker";
import { runClassPipeline } from "./classPipeline";
import type { PipelineHost, RatifyDecision } from "./orchestrator";
import type { SkeletonPlan } from "./skeleton";
import type { ConceptBrief, PipelineRun, WorkingEntity } from "./types";
import { PipelinePhase } from "./types";

/**
 * Orchestrator acceptance (plan §13 M1, §14): with every model step stubbed, the Class pipeline walks
 * Phase A → B (ratified) → C → assemble in order, PAUSES on the skeleton gate, honours approve/refine/reject,
 * checkpoints each phase, and emits a savable preview — the level-1-class-end-to-end milestone with a
 * working ratification gate.
 */

const AI = { provider: "local", model: "stub", localBaseUrl: "", enabled: true } as AiSettings;

const briefInput = {
    concept: "A knight who borrows strength from a bound storm", tone: "grim, martial",
    power_tier: "on par with the Fighter", motifs: ["chained lightning", "iron gauntlet"],
    themes: ["debt"], naming_style: "weather + martial terms", fits_concept: "A storm bound in armour.",
};
const skeletonInput = {
    name: "Stormwarden", primary_ability: "STR", hit_die: "d10",
    core_mechanic: "Builds Charge by taking or dealing damage, spent on thunderous strikes.",
    caster_type: "none", subclass_count: 3, subclass_level: 3, fits_concept: "Charge fuels the storm.",
};
const chassisInput = {
    saving_throws: ["STR", "CON"], skills: ["Athletics", "Intimidation", "Perception"],
    armor: ["Light armor", "Medium armor", "Shields"], weapons: ["Simple weapons", "Martial weapons"], tools: [],
    starting_equipment: ["A martial weapon", "Leather armor"],
    features: [{ level: 1, name: "Storm's Charge", description: "Gain 1 Charge when you take damage; spend on a hit for +1d6 thunder." }],
    fits_concept: "The chassis carries the charge.",
};

/** A runner that replies to each step's forced tool with the given input. Records the tasks it saw. */
function scriptRunner(overrides: Partial<Record<string, Record<string, unknown>>> = {}) {
    const tasks: Record<string, string[]> = {};
    const inputs: Record<string, Record<string, unknown>> = {
        concept_brief: briefInput, skeleton_plan: skeletonInput, class_chassis: chassisInput, ...overrides,
    };
    const runner: StepModelRunner = async (spec, task): Promise<SubAgentResult> => {
        const tool = spec.tools[0]?.name ?? "";
        (tasks[tool] ??= []).push(task);
        return { text: "", toolCalls: [{ id: tool, name: tool, input: inputs[tool] ?? {} }], ok: true };
    };
    return { runner, tasks };
}

/** A spy host with a scripted ratify decision (or a per-call sequence). */
function makeHost(runner: StepModelRunner, ratify: RatifyDecision | RatifyDecision[]): {
    host: PipelineHost;
    runs: PipelineRun[];
    completed: HomebrewPreview[];
    errors: string[];
    checkpoints: { phaseIndex: number; working: WorkingEntity; brief?: ConceptBrief }[];
    ratifiedPlans: SkeletonPlan[];
} {
    const runs: PipelineRun[] = [];
    const completed: HomebrewPreview[] = [];
    const errors: string[] = [];
    const checkpoints: { phaseIndex: number; working: WorkingEntity; brief?: ConceptBrief }[] = [];
    const ratifiedPlans: SkeletonPlan[] = [];
    const decisions = Array.isArray(ratify) ? [...ratify] : null;
    const host: PipelineHost = {
        ai: AI, dndSystem: "both", signal: new AbortController().signal, runner,
        onProgress: r => runs.push(r),
        ratifySkeleton: async plan => { ratifiedPlans.push(plan); return decisions ? (decisions.shift() ?? { type: "reject" }) : (ratify as RatifyDecision); },
        onCheckpoint: (phaseIndex, working, brief) => checkpoints.push({ phaseIndex, working: structuredClone(working), brief }),
        onComplete: p => completed.push(p),
        onError: m => errors.push(m),
    };
    return { host, runs, completed, errors, checkpoints, ratifiedPlans };
}

const statusesFor = (runs: PipelineRun[], phase: PipelinePhase) => runs.filter(r => r.phase === phase).map(r => r.status);

describe("runClassPipeline (M1 thin slice)", () => {
    beforeEach(() => { /* no shared state */ });

    it("runs A → B(ratify) → C → assemble and emits a savable class on approval", async () => {
        const { runner, tasks } = scriptRunner();
        const { host, runs, completed, errors, checkpoints, ratifiedPlans } = makeHost(runner, { type: "approve" });

        await runClassPipeline("a storm knight", host);

        expect(errors).toEqual([]);
        // Every step's model was called exactly once.
        expect(tasks.concept_brief).toHaveLength(1);
        expect(tasks.skeleton_plan).toHaveLength(1);
        expect(tasks.class_chassis).toHaveLength(1);
        // The user was asked to ratify the skeleton it produced.
        expect(ratifiedPlans).toHaveLength(1);
        expect(ratifiedPlans[0].name).toBe("Stormwarden");
        // Phase ordering: brief → skeleton (incl. awaiting_user) → chassis → assemble.
        expect(statusesFor(runs, PipelinePhase.DesignBrief)).toContain("running");
        expect(statusesFor(runs, PipelinePhase.Skeleton)).toEqual(["running", "awaiting_user"]);
        expect(statusesFor(runs, PipelinePhase.Chassis)).toContain("running");
        expect(statusesFor(runs, PipelinePhase.Assemble)).toContain("completed");
        // A checkpoint was written after each of the three model phases.
        expect(checkpoints.map(c => c.phaseIndex)).toEqual([0, 1, 2]);
        // The assembled preview is a valid, savable class.
        expect(completed).toHaveLength(1);
        expect(completed[0].kind).toBe("class");
        expect(completed[0].valid).toBe(true);
        expect((completed[0].entity as Class5E).name).toBe("Stormwarden");
    });

    it("re-runs the skeleton with the refinement, then completes on approval", async () => {
        const { runner, tasks } = scriptRunner();
        const { host, completed, ratifiedPlans } = makeHost(runner, [{ type: "refine", text: "make it d12 and rage-like" }, { type: "approve" }]);

        await runClassPipeline("a storm knight", host);

        // Skeleton ran twice (once, refined once); the second task carried the refinement note.
        expect(tasks.skeleton_plan).toHaveLength(2);
        expect(tasks.skeleton_plan[1]).toContain("make it d12 and rage-like");
        expect(ratifiedPlans).toHaveLength(2);
        expect(completed).toHaveLength(1);
    });

    it("stops cleanly on rejection — no assemble, no error", async () => {
        const { runner, tasks } = scriptRunner();
        const { host, runs, completed, errors } = makeHost(runner, { type: "reject" });

        await runClassPipeline("a storm knight", host);

        expect(completed).toEqual([]);
        expect(errors).toEqual([]);
        expect(tasks.class_chassis).toBeUndefined();   // chassis never ran
        expect(runs[runs.length - 1].status).toBe("aborted");
    });

    it("surfaces an error when a step can't pass its gate within the repair budget", async () => {
        // A skeleton that never validates (bad hit die) exhausts the default 1-repair budget.
        const { runner } = scriptRunner({ skeleton_plan: { ...skeletonInput, hit_die: "d7" } });
        const { host, completed, errors } = makeHost(runner, { type: "approve" });

        await runClassPipeline("a storm knight", host);

        expect(completed).toEqual([]);
        expect(errors).toHaveLength(1);
        expect(errors[0]).toMatch(/hit die/i);
    });
});
