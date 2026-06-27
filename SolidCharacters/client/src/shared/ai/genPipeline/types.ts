import type { AiToolDef } from "../types";
import type { HomebrewPreview } from "../tools/toolDispatcher";
import type { ReviewVerdict } from "../readiness/types";

/**
 * Shared types for the staged generation pipeline (see StagedGenPipeline.Plan.md §4 + ComplexGenPipeline.md).
 *
 * The pipeline reads/writes ONE mutable WORKING object (the source of truth), computes derived values in
 * code between steps, validates + repairs per step, and checkpoints after each step. These types describe
 * that working object, the per-step worker contract, the run state surfaced to the UI, and the persisted
 * checkpoint. Kept dependency-light (only `import type` from the heavier modules) so it can't create cycles.
 */

/** Which entity the pipeline is building. Class ships first (extends an existing generated kind); character is net-new. */
export type PipelineType = "class" | "character";

/** Lower-case ability keys, matching `Stats` on the character model. */
export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";
export const ABILITY_KEYS: AbilityKey[] = ["str", "dex", "con", "int", "wis", "cha"];

/** Caster-type names as the model emits them; map to the `CasterType` enum via `parseCasterType`. */
export type CasterTypeName = "none" | "third" | "half" | "full" | "pact";

/** Armor weight class, which decides how Dexterity feeds Armor Class (see compute.computeAC). */
export type ArmorCategory = "none" | "light" | "medium" | "heavy";

/**
 * The design brief produced by Phase A/1. Every later step is told to "serve this concept; weave in the
 * motifs". `motifs` must be concrete nouns (validated), not sentences — they are the recurring hooks the
 * feature/narrative steps reuse so the entity reads as one coherent thing.
 */
export interface ConceptBrief {
    concept: string;
    tone: string;
    power_tier: string;
    motifs: string[];
    themes: string[];
    naming_style: string;
    constraints: string[];
}

/** One feature/trait the pipeline has decided on (class feature, subclass feature, or character feature). */
export interface WorkingFeature {
    name: string;
    level: number;
    description: string;
    /** Optional note about the resource/mechanic this feature interacts with (carry-forward context). */
    resource?: string;
}

/** A subclass under construction: a mini-brief plus its own feature loop (Phase E). */
export interface WorkingSubclass {
    name: string;
    brief?: string;
    features: WorkingFeature[];
}

/**
 * The mutable working object for the Class pipeline (Phases A–G). All fields are optional and filled
 * incrementally as phases complete; the assemble step (Phase G) maps a complete WorkingClass to the
 * `models/generated` `Class5E` DTO that `homebrewManager5e.addClass` accepts.
 */
export interface WorkingClass {
    name?: string;
    // ----- skeleton (Phase B) -----
    primaryAbility?: string;          // "STR" or "STR, CON"
    hitDie?: string;                  // "d10"
    coreMechanic?: string;
    subclassCount?: number;
    subclassLevel?: number;
    // ----- chassis (Phase C) -----
    savingThrows?: string[];
    proficiencies?: { armor: string[]; weapons: string[]; tools: string[]; skills: string[] };
    startingEquipment?: string[];
    casterType?: CasterTypeName;
    // ----- features / subclasses (Phases D–E) -----
    features?: WorkingFeature[];
    subclasses?: WorkingSubclass[];
}

/** Derived stats computed in code (Phase 7), never asked of the model. */
export interface WorkingDerivedStats {
    ac?: number;
    hp?: number;
    initiative?: number;
    proficiencyBonus?: number;
    spellSaveDC?: number;
    spellAttackBonus?: number;
    passivePerception?: number;
}

/**
 * The mutable working object for the Character pipeline (Phases 1–7). Assembles to the `Character` model,
 * saved via `CharacterManager`. Net-new surface — see plan §7.
 */
export interface WorkingCharacter {
    name?: string;
    // ----- mechanical foundation (Phase 2) -----
    className?: string;
    lineage?: string;
    level?: number;
    background?: string;
    hitDie?: string;                  // the class's hit die ("d8"); drives HP compute
    abilityPriority?: AbilityKey[];
    // ----- trained-in (Phase 3) -----
    abilityScores?: Partial<Record<AbilityKey, number>>;
    skills?: string[];
    savingThrows?: AbilityKey[];
    otherProficiencies?: string[];    // tool/weapon/armor proficiency labels (display only)
    // ----- capabilities (Phase 4) -----
    features?: WorkingFeature[];
    casterType?: CasterTypeName;
    spells?: string[];
    // ----- loadout (Phase 5) -----
    equipment?: string[];
    armor?: { category: ArmorCategory; baseAc?: number; name?: string };
    shield?: boolean;
    // ----- narrative (Phase 6) -----
    alignment?: string;
    backstory?: string;
    bonds?: string;
    ideals?: string;
    flaws?: string;
    appearance?: string;
    // ----- compute (Phase 7) -----
    derived?: WorkingDerivedStats;
}

export type WorkingEntity = WorkingClass | WorkingCharacter;

/** Stable phase identifiers (class A–G, then character 1–7), reused by the UI ticker + decision log. */
export enum PipelinePhase {
    // class (A–G)
    DesignBrief = "design_brief",
    Skeleton = "skeleton",
    Chassis = "chassis",
    Features = "features",
    Subclasses = "subclasses",
    Balance = "balance",
    Assemble = "assemble",
    // character (1–7)
    Concept = "concept",
    Foundation = "foundation",
    TrainedIn = "trained_in",
    Capabilities = "capabilities",
    Loadout = "loadout",
    Narrative = "narrative",
    Compute = "compute",
}

export type PhaseKind = "model" | "code" | "gate";

/** One phase in a pipeline's state machine. `run()` is wired by the orchestrator (M1+). */
export interface PhaseSpec {
    id: PipelinePhase;
    kind: PhaseKind;
    run: () => Promise<void>;
}

export type PipelineStatus =
    | "idle"           // not started
    | "running"        // a step is in flight
    | "awaiting_user"  // paused on a ratification gate (Phase B) or a mid-pipeline ask
    | "completed"      // assembled + saved
    | "aborted"        // user abort
    | "error";         // unrecoverable error (surfaced to the user)

/** Reactive run state surfaced to the UI (GenPipelineCard / StatusTicker). Populated by the orchestrator. */
export interface PipelineRun {
    pipelineType: PipelineType;
    phase: PipelinePhase;
    phaseIndex: number;
    totalPhases: number;
    status: PipelineStatus;
    currentPreview?: HomebrewPreview;
    verdicts?: ReviewVerdict[];
    error?: string;
    /** Sub-step progress within a looping phase (Features/Subclasses), e.g. "Feature 3 of 12 — Storm's Fury (L5)". */
    note?: string;
}

/**
 * A persisted checkpoint, written after each step into its OWN Dexie table (not a SavedConversation field,
 * so the intentional conversation-sanitization stays untouched — plan §9). Resume re-enters the
 * orchestrator at `currentPhaseIndex` with the persisted `working` object.
 */
export interface PipelineCheckpoint {
    id: string;
    conversationId: string;
    pipelineType: PipelineType;
    currentPhaseIndex: number;
    working: WorkingEntity;
    conceptBrief?: ConceptBrief;
    createdAt: number;
    updatedAt: number;
}

// ───────────────────────────── per-step worker contract (plan §2.1) ─────────────────────────────

/** The context every step receives: the brief, a digest of decided-so-far, and any scoped homebrew defs. */
export interface StepContext {
    /** The concept brief — present on every step after Phase A so the model "serves this concept". */
    brief?: ConceptBrief;
    /** Compact carry-forward digest of prior decisions (see carryForward.summarize). */
    summary?: string;
    /** ONLY the homebrew defs this step needs, pre-formatted. "Transcribe, don't reason about it." */
    scopedHomebrew?: string;
}

/** The coerced value plus the gate errors for one step's raw model output. */
export interface StepParse<T> {
    value: T;
    /** Structural + semantic + consistency errors. Empty ⇒ the step passed its gate. */
    errors: string[];
}

/**
 * A single pipeline step: ONE forced tool (its small schema), a neutral system fragment naming the job,
 * the task instruction, and a `parse` that coerces + gates the model's untrusted tool input.
 */
export interface StepSpec<T> {
    id: string;
    tool: AiToolDef;
    system: string;
    task: string;
    parse: (raw: Record<string, unknown>) => StepParse<T>;
}

/** The outcome of `runStep`: the gated value (or the last failing attempt), plus observability fields. */
export interface StepResult<T> {
    /** True when the gate passed within the repair budget. */
    ok: boolean;
    /** Coerced value from the final attempt (even when failing, so the UI can show what was produced). */
    value: T | null;
    /** The model's one-line "how this serves the concept" note, if it provided one. */
    fitsConcept?: string;
    /** Gate errors from the final attempt (empty when ok). */
    errors: string[];
    /** Model calls made (1 + repairs used). */
    attempts: number;
    /** True when the model returned prose instead of calling the tool on the final attempt (Ollama risk). */
    noToolCall?: boolean;
    /** True when the run was cut short by an aborted signal. */
    aborted?: boolean;
}

export interface RunStepOptions {
    /** Model re-tries on a gate failure. Default 1 (Low usage level). Medium/High raise this (plan §8). */
    repairBudget?: number;
    /** Per-step output-token cap. Steps are small; defaults to 1024. */
    maxTokens?: number;
    /** Context window override (local models). Falls back to the AiSettings numCtx. */
    numCtx?: number;
    signal?: AbortSignal;
}
