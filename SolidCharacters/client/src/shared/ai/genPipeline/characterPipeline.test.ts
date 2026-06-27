import { describe, it, expect } from "vitest";
import type { AiSettings } from "../../../models/userSettings";
import type { Character } from "../../../models/character.model";
import type { SubAgentResult } from "../subAgent";
import type { StepModelRunner } from "./stepWorker";
import { runCharacterPipeline } from "./characterPipeline";
import type { CharacterPipelineHost } from "./orchestrator";
import type { ConceptBrief, PipelineRun, WorkingEntity } from "./types";
import { PipelinePhase } from "./types";

/**
 * Orchestrator acceptance (plan §13 M5, §14): with every model step stubbed, the Character pipeline walks
 * Phase 1 (concept) → 2 (foundation) → 3 (scores → code modifiers → training) → 4 (capabilities, + spells
 * for casters) → 5 (loadout) → 6 (narrative) → 7 (compute + assemble) in order, checkpoints each step, and
 * hands back a COHERENT `Character` whose code-derived stats (AC/HP/prof bonus) match the rolled scores and
 * gear, whose proficiencies reflect the chosen skills/saves, and whose narrative names it. Load-bearing
 * steps fail the run; the rest are resilient (a skipped step still assembles a valid character).
 */

const AI = { provider: "local", model: "stub", localBaseUrl: "", enabled: true } as AiSettings;

const briefInput = {
    concept: "A guilt-ridden goliath who protects the weak", tone: "grim, heroic",
    power_tier: "on par with the Barbarian", motifs: ["mountain stone", "broken chain"],
    themes: ["atonement"], naming_style: "stony surnames", fits_concept: "A mountain that shields others.",
};
const foundationInput = {
    class_name: "Barbarian", lineage: "Goliath", level: 5, background: "Soldier",
    hit_die: "d12", ability_priority: ["str", "con", "dex", "wis", "cha", "int"], fits_concept: "A martial protector.",
};
const scoresInput = { str: 16, con: 15, dex: 13, wis: 12, cha: 10, int: 8, fits_concept: "STR leads." };
const trainingInput = { skills: ["Athletics", "Intimidation"], saving_throws: ["str", "con"], other_proficiencies: ["Smith's tools"], fits_concept: "Soldier training." };
const capabilitiesInput = {
    caster_type: "none",
    features: [{ name: "Rage", level: 1, description: "As a bonus action, rage for resistance to physical damage and +2 melee damage." }],
    fits_concept: "Rage shields the weak.",
};
const loadoutInput = { armor: { category: "medium", name: "Half plate" }, shield: true, weapons: ["Greataxe"], items: ["Explorer's pack"], fits_concept: "Stands in the front." };
const narrativeInput = {
    name: "Varra Stoneheart", alignment: "Chaotic Good", appearance: "A towering goliath with grey, stony skin.",
    backstory: "A goliath barbarian who left the mountains after a rockslide she could not stop; now her rage is a shield for the helpless.",
    bonds: "The village she failed to save.", ideals: "No one falls while she still stands.", flaws: "She cannot forgive herself.",
    fits_concept: "Her rage protects.",
};

/** A runner that replies to each character step's forced tool with canned input; records the tasks it saw. */
function scriptRunner(overrides: Partial<Record<string, Record<string, unknown>>> = {}) {
    const tasks: Record<string, string[]> = {};
    const fixed: Record<string, Record<string, unknown>> = {
        concept_brief: briefInput, character_foundation: foundationInput, ability_scores: scoresInput,
        character_training: trainingInput, character_capabilities: capabilitiesInput,
        character_loadout: loadoutInput, character_narrative: narrativeInput, ...overrides,
    };
    const runner: StepModelRunner = async (spec, task): Promise<SubAgentResult> => {
        const tool = spec.tools[0]?.name ?? "";
        (tasks[tool] ??= []).push(task);
        const input = fixed[tool] ?? {};
        return { text: "", toolCalls: [{ id: tool, name: tool, input }], ok: true };
    };
    return { runner, tasks };
}

function makeHost(runner: StepModelRunner, extra: Partial<CharacterPipelineHost> = {}): {
    host: CharacterPipelineHost;
    runs: PipelineRun[];
    completed: Character[];
    errors: string[];
    checkpoints: { phaseIndex: number; working: WorkingEntity; brief?: ConceptBrief }[];
} {
    const runs: PipelineRun[] = [];
    const completed: Character[] = [];
    const errors: string[] = [];
    const checkpoints: { phaseIndex: number; working: WorkingEntity; brief?: ConceptBrief }[] = [];
    const host: CharacterPipelineHost = {
        ai: AI, dndSystem: "both", signal: new AbortController().signal, runner,
        onProgress: r => runs.push(r),
        onCheckpoint: (phaseIndex, working, brief) => checkpoints.push({ phaseIndex, working: structuredClone(working), brief }),
        onComplete: c => completed.push(c),
        onError: m => errors.push(m),
        ...extra,
    };
    return { host, runs, completed, errors, checkpoints };
}

const statusesFor = (runs: PipelineRun[], phase: PipelinePhase) => runs.filter(r => r.phase === phase).map(r => r.status);

describe("runCharacterPipeline (M5)", () => {
    it("runs phases 1→7 in order and assembles a coherent character", async () => {
        const { runner, tasks } = scriptRunner();
        const { host, runs, completed, errors, checkpoints } = makeHost(runner);

        await runCharacterPipeline("a guilt-ridden goliath protector", host);

        expect(errors).toEqual([]);
        // Each model step ran once (no spells step — this build doesn't cast).
        expect(tasks.concept_brief).toHaveLength(1);
        expect(tasks.character_foundation).toHaveLength(1);
        expect(tasks.ability_scores).toHaveLength(1);
        expect(tasks.character_training).toHaveLength(1);
        expect(tasks.character_capabilities).toHaveLength(1);
        expect(tasks.character_spells).toBeUndefined();
        expect(tasks.character_loadout).toHaveLength(1);
        expect(tasks.character_narrative).toHaveLength(1);

        // Phase ordering across the seven phases, ending on a completed Compute.
        expect(statusesFor(runs, PipelinePhase.Concept)).toContain("running");
        expect(statusesFor(runs, PipelinePhase.Foundation)).toContain("running");
        expect(statusesFor(runs, PipelinePhase.TrainedIn)).toContain("running");
        expect(statusesFor(runs, PipelinePhase.Capabilities)).toContain("running");
        expect(statusesFor(runs, PipelinePhase.Loadout)).toContain("running");
        expect(statusesFor(runs, PipelinePhase.Narrative)).toContain("running");
        expect(statusesFor(runs, PipelinePhase.Compute)).toContain("completed");
        // Checkpoints span every phase (0–6).
        expect(new Set(checkpoints.map(c => c.phaseIndex))).toEqual(new Set([0, 1, 2, 3, 4, 5, 6]));

        // The assembled character: mechanics agree with the rolled scores + gear (everything code-derived).
        const c = completed[0];
        expect(c.name).toBe("Varra Stoneheart");
        expect(c.level).toBe(5);
        expect(c.className).toBe("Barbarian");
        expect(c.race.species).toBe("Goliath");
        expect(c.stats.str).toBe(16);
        // HP: d12 + CON(+2) at L1, then 4×(avg 7 + 2). AC: medium (12) + min(Dex +1, 2) + shield 2.
        expect(c.health.max).toBe(50);
        expect(c.ArmorClass).toBe(15);
        // Proficiencies reflect the chosen skills + the two saving throws.
        expect(c.proficiencies.skills["Athletics"].proficient).toBe(true);
        expect(c.proficiencies.skills["Intimidation"].proficient).toBe(true);
        expect(c.proficiencies.skills["Stealth"].proficient).toBe(false);
        expect(c.savingThrows.filter(s => s.proficient).map(s => s.stat).sort()).toEqual(["con", "str"]);
        // The signature feature landed in its level row.
        expect(c.levels[0].features.map(f => f.name)).toContain("Rage");
        expect(c.items.inventory).toContain("Greataxe");
    });

    it("runs the spells step for a caster and stores the spell list", async () => {
        const { runner, tasks } = scriptRunner({
            character_foundation: { ...foundationInput, class_name: "Wizard", lineage: "High Elf", hit_die: "d6" },
            character_capabilities: { caster_type: "full", features: [{ name: "Arcane Recovery", level: 1, description: "Once per day on a short rest, recover spell slots up to half your wizard level." }] },
            character_spells: { spells: [{ name: "Fire Bolt", level: 0 }, { name: "Shield", level: 1 }, { name: "Fireball", level: 3 }] },
        });
        const { host, completed, errors } = makeHost(runner);

        await runCharacterPipeline("a clever elf wizard", host);

        expect(errors).toEqual([]);
        expect(tasks.character_spells).toHaveLength(1);   // caster → the spells step ran
        expect(completed[0].spells.map(s => s.name)).toEqual(["Fire Bolt", "Shield", "Fireball"]);
        expect(completed[0].spells.every(s => s.prepared === false)).toBe(true);
    });

    it("fails the run when a load-bearing step can't pass its gate (bad hit die)", async () => {
        const { runner, tasks } = scriptRunner({ character_foundation: { ...foundationInput, hit_die: "d7" } });
        const { host, completed, errors } = makeHost(runner);

        await runCharacterPipeline("a goliath", host);

        expect(completed).toEqual([]);
        expect(errors).toHaveLength(1);
        expect(errors[0]).toMatch(/hit die/i);
        expect(tasks.ability_scores).toBeUndefined();   // never reached the next phase
    });

    it("fails when ability scores don't honour the priority order", async () => {
        // DEX 16 outranks the primary STR 14 → the scores gate never passes within the budget.
        const { runner } = scriptRunner({ ability_scores: { ...scoresInput, str: 14, dex: 16 } });
        const { host, completed, errors } = makeHost(runner);

        await runCharacterPipeline("a goliath", host);

        expect(completed).toEqual([]);
        expect(errors[0]).toMatch(/most-important ability/i);
    });

    it("skips a resilient step that fails but still completes the character", async () => {
        // Training returns only one saving throw → fails its count gate, is skipped (not fatal).
        const { runner } = scriptRunner({ character_training: { skills: ["Athletics", "Intimidation"], saving_throws: ["str"] } });
        const { host, completed, errors } = makeHost(runner);

        await runCharacterPipeline("a goliath", host);

        expect(errors).toEqual([]);
        expect(completed).toHaveLength(1);
        // No saving-throw proficiencies survived (the training step was skipped), but the character still assembled.
        expect(completed[0].savingThrows.every(s => !s.proficient)).toBe(true);
        expect(completed[0].name).toBe("Varra Stoneheart");
    });

    it("falls back to a class+lineage name when the narrative is skipped", async () => {
        const { runner } = scriptRunner({ character_narrative: { name: "", backstory: "too short" } });
        const { host, completed, errors } = makeHost(runner);

        await runCharacterPipeline("a goliath", host);

        expect(errors).toEqual([]);
        expect(completed[0].name).toBe("Goliath Barbarian");
    });

    it("stops cleanly when aborted before it starts (no completion, no error)", async () => {
        const controller = new AbortController();
        controller.abort();
        const { runner } = scriptRunner();
        const { host, completed, errors } = makeHost(runner, { signal: controller.signal });

        await runCharacterPipeline("a goliath", host);

        expect(completed).toEqual([]);
        expect(errors).toEqual([]);
    });
});
