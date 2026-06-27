import { describe, it, expect, beforeEach } from "vitest";
import type { AiSettings } from "../../../models/userSettings";
import type { Class5E, Subclass } from "../../../models/generated";
import type { HomebrewPreview } from "../tools/toolDispatcher";
import type { SubAgentResult } from "../subAgent";
import type { StepModelRunner } from "./stepWorker";
import { runClassPipeline } from "./classPipeline";
import type { PipelineHost, RatifyDecision } from "./orchestrator";
import type { SkeletonPlan } from "./skeleton";
import { baseFeatureLevels } from "./features";
import { subclassFeatureLevels } from "./subclasses";
import type { ConceptBrief, PipelineRun, WorkingClass, WorkingEntity } from "./types";
import { PipelinePhase } from "./types";

/**
 * Orchestrator acceptance (plan §13 M1+M2, §14): with every model step stubbed, the Class pipeline walks
 * Phase A → B (ratified) → C → D (features) → E (subclasses) → assemble in order, PAUSES on the skeleton
 * gate, honours approve/refine/reject, checkpoints each step, fills a full 1–20 feature progression whose
 * features build on each other, builds each promised subclass with its own features, and emits savable
 * previews (the class plus one per subclass).
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

/**
 * A runner that replies to each step's forced tool. The fixed steps (brief/skeleton/chassis) return canned
 * input; the LOOP steps (class_feature, subclass_brief) get DISTINCT input per call (a per-tool counter), so
 * the duplicate-name gates pass and the loops actually accumulate. Records the tasks + call counts it saw.
 */
function scriptRunner(overrides: Partial<Record<string, Record<string, unknown>>> = {}) {
    const tasks: Record<string, string[]> = {};
    const counts: Record<string, number> = {};
    const fixed: Record<string, Record<string, unknown>> = {
        concept_brief: briefInput, skeleton_plan: skeletonInput, class_chassis: chassisInput, ...overrides,
    };
    const runner: StepModelRunner = async (spec, task): Promise<SubAgentResult> => {
        const tool = spec.tools[0]?.name ?? "";
        (tasks[tool] ??= []).push(task);
        const n = (counts[tool] = (counts[tool] ?? 0) + 1);
        let input = fixed[tool];
        if (!input) {
            if (tool === "class_feature") {
                input = { name: `Feature ${n}`, description: `Rules text for feature ${n} with concrete numbers and scaling.`, fits_concept: "extends the charge" };
            } else if (tool === "subclass_brief") {
                input = { name: `Tempest ${n}`, brief: `A distinct subclass variation number ${n} on the core charge mechanic.`, fits_concept: "varies the charge" };
            } else {
                input = {};
            }
        }
        return { text: "", toolCalls: [{ id: tool, name: tool, input }], ok: true };
    };
    return { runner, tasks, counts };
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
        onComplete: ps => completed.push(...ps),
        onError: m => errors.push(m),
    };
    return { host, runs, completed, errors, checkpoints, ratifiedPlans };
}

const statusesFor = (runs: PipelineRun[], phase: PipelinePhase) => runs.filter(r => r.phase === phase).map(r => r.status);

// The level counts the stubbed skeleton (3 subclasses unlocking at level 3) drives the loops to.
const SKELETON_WORKING: WorkingClass = { subclassCount: 3, subclassLevel: 3 };
const BASE_LEVELS = baseFeatureLevels(SKELETON_WORKING);            // 10 (the canonical spread minus level 3)
const SUB_FEATURE_LEVELS = subclassFeatureLevels(3);               // [3, 6, 10, 14]

describe("runClassPipeline (M1 + M2)", () => {
    beforeEach(() => { /* no shared state */ });

    it("runs A → B(ratify) → C → D → E → assemble and emits a savable class on approval", async () => {
        const { runner, tasks } = scriptRunner();
        const { host, runs, completed, errors, checkpoints, ratifiedPlans } = makeHost(runner, { type: "approve" });

        await runClassPipeline("a storm knight", host);

        expect(errors).toEqual([]);
        // The fixed phases each ran once; the user ratified the skeleton it produced.
        expect(tasks.concept_brief).toHaveLength(1);
        expect(tasks.skeleton_plan).toHaveLength(1);
        expect(tasks.class_chassis).toHaveLength(1);
        expect(ratifiedPlans).toHaveLength(1);
        expect(ratifiedPlans[0].name).toBe("Stormwarden");
        // Phase ordering: brief → skeleton (incl. awaiting_user) → chassis → features → subclasses → assemble.
        expect(statusesFor(runs, PipelinePhase.DesignBrief)).toContain("running");
        expect(statusesFor(runs, PipelinePhase.Skeleton)).toEqual(["running", "awaiting_user"]);
        expect(statusesFor(runs, PipelinePhase.Chassis)).toContain("running");
        expect(statusesFor(runs, PipelinePhase.Features)).toContain("running");
        expect(statusesFor(runs, PipelinePhase.Subclasses)).toContain("running");
        expect(statusesFor(runs, PipelinePhase.Assemble)).toContain("completed");
        // Checkpoints span all the model phases (0–4), starting with the three fixed ones in order.
        expect(checkpoints.map(c => c.phaseIndex).slice(0, 3)).toEqual([0, 1, 2]);
        expect(new Set(checkpoints.map(c => c.phaseIndex))).toEqual(new Set([0, 1, 2, 3, 4]));
        // The first emitted preview is the assembled, savable class.
        expect(completed[0].kind).toBe("class");
        expect(completed[0].valid).toBe(true);
        expect((completed[0].entity as Class5E).name).toBe("Stormwarden");
    });

    it("builds a full 1–20 feature progression whose features carry forward", async () => {
        const { runner, tasks } = scriptRunner();
        const { host, completed } = makeHost(runner, { type: "approve" });

        await runClassPipeline("a storm knight", host);

        // Phase D: one model call per base-feature level (the canonical spread minus the subclass-grant level).
        const baseFeatureCalls = tasks.class_feature!.length - SUB_FEATURE_LEVELS.length * 3;
        expect(baseFeatureCalls).toBe(BASE_LEVELS.length);
        // Each feature step is told the level it fills and is handed everything decided so far.
        expect(tasks.class_feature![0]).toMatch(/LEVEL \d+/);

        const klass = completed[0].entity as Class5E;
        const levels = Object.keys(klass.features ?? {}).map(Number).sort((a, b) => a - b);
        // Level 1 (chassis) plus every base-feature level → a real 1–20 spread, not a single level.
        expect(levels).toContain(1);
        for (const l of BASE_LEVELS) expect(levels).toContain(l);
        expect(levels.length).toBeGreaterThan(8);
        // No duplicate feature names survived (the gate rejects collisions).
        const names = Object.values(klass.features ?? {}).flat().map(f => f.name);
        expect(new Set(names).size).toBe(names.length);
    });

    it("builds each promised subclass with a brief and its own feature loop", async () => {
        const { runner, tasks } = scriptRunner();
        const { host, completed } = makeHost(runner, { type: "approve" });

        await runClassPipeline("a storm knight", host);

        // Phase E: one brief per subclass, and a feature loop per subclass at the subclass levels.
        expect(tasks.subclass_brief).toHaveLength(3);
        const subclassPreviews = completed.filter(p => p.kind === "subclass");
        expect(subclassPreviews).toHaveLength(3);
        for (const preview of subclassPreviews) {
            const sub = preview.entity as Subclass;
            expect(sub.parentClass).toBeTruthy();
            const levels = Object.keys(sub.features ?? {}).map(Number).sort((a, b) => a - b);
            expect(levels).toEqual(SUB_FEATURE_LEVELS);
        }
        // Distinct subclass names — the brief gate rejects a sibling collision.
        const subNames = subclassPreviews.map(p => (p.entity as Subclass).name);
        expect(new Set(subNames).size).toBe(3);
    });

    it("re-runs the skeleton with the refinement, then completes on approval", async () => {
        const { runner, tasks } = scriptRunner();
        const { host, completed, ratifiedPlans } = makeHost(runner, [{ type: "refine", text: "make it d12 and rage-like" }, { type: "approve" }]);

        await runClassPipeline("a storm knight", host);

        // Skeleton ran twice (once, refined once); the second task carried the refinement note.
        expect(tasks.skeleton_plan).toHaveLength(2);
        expect(tasks.skeleton_plan[1]).toContain("make it d12 and rage-like");
        expect(ratifiedPlans).toHaveLength(2);
        expect(completed.filter(p => p.kind === "class")).toHaveLength(1);
    });

    it("stops cleanly on rejection — no features, no assemble, no error", async () => {
        const { runner, tasks } = scriptRunner();
        const { host, runs, completed, errors } = makeHost(runner, { type: "reject" });

        await runClassPipeline("a storm knight", host);

        expect(completed).toEqual([]);
        expect(errors).toEqual([]);
        expect(tasks.class_chassis).toBeUndefined();   // chassis never ran
        expect(tasks.class_feature).toBeUndefined();   // the feature loop never started
        expect(runs[runs.length - 1].status).toBe("aborted");
    });

    it("skips a feature that can't pass its gate but still completes the class", async () => {
        // Every class_feature returns a blank name → fails its gate, is skipped (resilient), never fatal.
        const { runner } = scriptRunner({ class_feature: { name: "", description: "x" } });
        const { host, completed, errors } = makeHost(runner, { type: "approve" });

        await runClassPipeline("a storm knight", host);

        expect(errors).toEqual([]);
        const klass = completed[0].entity as Class5E;
        // Only the level-1 chassis feature survives; the loop's failures were skipped, not fatal.
        expect(Object.keys(klass.features ?? {})).toEqual(["1"]);
        expect(completed[0].valid).toBe(true);
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
