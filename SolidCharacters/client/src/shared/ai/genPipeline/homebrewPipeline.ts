import { AiSettings, DEFAULT_AI_MAX_TOKENS } from "../../../models/userSettings";
import { byTypeLine, editionNote, ORIGIN_KINDS, QUALITY_BAR } from "../prompt/systemPrompt";
import { HomebrewKind, KIND_TO_TOOL, kindLabelLower } from "../refs/homebrewKind";
import { HOMEBREW_TOOLS } from "../tools/toolSchemas";
import { buildPreview, HomebrewPreview } from "../tools/toolDispatcher";
import { AiToolCall, AiToolDef } from "../types";
import { createNewId } from "../../customHooks/utility/tools/idGen";
import { produceConceptBrief } from "./conceptBrief";
import { runStep } from "./stepWorker";
import { repairBudgetFor, type HomebrewPipelineHost } from "./orchestrator";
import { PipelinePhase } from "./types";
import { addUsage } from "../usage";
import type { TokenUsage } from "../types";
import type { PipelineRun, PipelineStatus, RunStepOptions, StepContext, StepResult, StepSpec } from "./types";

/**
 * The generic Homebrew mini-pipeline (Generation depth ≥ Medium). The 7 non-class/character create_* kinds
 * normally generate one-shot; here they run a tiny 2-step pipeline instead — a CONCEPT step that distills a
 * design brief from the model's draft, then a CREATION step that builds the full entity to serve that brief.
 * Both steps reuse the existing infra: the concept step is `produceConceptBrief`, and the creation step is a
 * `StepSpec` over the EXISTING `create_*` tool whose `parse` runs the EXISTING `buildPreview` coercion +
 * validation, so the result is an ordinary `HomebrewPreview` the host surfaces and enriches like any other.
 *
 * Standalone driver behind {@link HomebrewPipelineHost} callbacks: no ratification gate, no critic, no
 * checkpoint (two steps finish in seconds). The High MADS validation step is NOT here — it runs in the
 * host's command enrichment after `onComplete`, so it covers this pipeline and the class pipeline alike.
 */

/**
 * The phases the mini-pipeline walks, in order. Drives the progress card's "Phase X of Y" strip. The
 * trailing MadsReview step is NOT emitted by this pipeline — aiAssistant drives it post-completion, once
 * command enrichment runs (the orchestrator only emits Concept/Assemble).
 */
export const HOMEBREW_PIPELINE_PHASES = [PipelinePhase.Concept, PipelinePhase.Assemble, PipelinePhase.MadsReview];
const TOTAL = HOMEBREW_PIPELINE_PHASES.length;

/** The create_* tool defs, by name — the creation step forces the one matching the kind. */
const HOMEBREW_TOOL_BY_NAME: Record<string, AiToolDef> = Object.fromEntries(HOMEBREW_TOOLS.map(t => [t.name, t]));

/** True when `kind` has a one-shot create_* tool the mini-pipeline can reuse (i.e. the 7 non-class kinds). */
export function supportsHomebrewPipeline(kind: HomebrewKind): boolean {
    return !!HOMEBREW_TOOL_BY_NAME[KIND_TO_TOOL[kind]];
}

/** Creation step: build the full entity by forcing the kind's create_* tool, gated by buildPreview. */
function creationStep(kind: HomebrewKind, tool: AiToolDef, dndSystem: string): StepSpec<HomebrewPreview> {
    const label = kindLabelLower(kind);
    // Carry the one-shot path's quality scaffolding (quality bar, per-kind guidance, edition note) so the
    // deeper Medium/High path never gets LESS balance anchoring than a Low one-shot. All three are the
    // canonical exports from systemPrompt.ts — never restate them here.
    const guidance = [
        QUALITY_BAR,
        byTypeLine(kind, dndSystem),
        ORIGIN_KINDS.includes(kind) ? editionNote(dndSystem) : "",
    ].filter(Boolean).join("\n\n");
    return {
        id: `create_${kind}`,
        tool,
        system: `Build one complete, well-formed homebrew ${label} by calling ${tool.name} with concrete, ` +
            `rules-legal 5e values. Serve the concept brief and weave in its motifs.\n\n${guidance}`,
        task: `Create the full homebrew ${label} now, using the concept brief above as the design target: every ` +
            `field should reflect it. Provide complete rules text.`,
        parse: raw => {
            // Run the model's tool input through the SAME coercion + validation the one-shot path uses.
            const toolCall: AiToolCall = { id: createNewId(), name: tool.name, input: raw };
            const preview = buildPreview(toolCall, dndSystem);
            return { value: preview, errors: preview.valid ? [] : preview.errors };
        },
    };
}

/** A small entity needs more than the per-step default (1024); cap it so it can't run away. */
function creationMaxTokens(ai: AiSettings): number {
    return Math.min(ai.maxTokens ?? DEFAULT_AI_MAX_TOKENS, 4096);
}

/**
 * Run the Homebrew mini-pipeline for `host.kind`, seeded by the model's create_* draft. Emits progress, then
 * hands the assembled preview to `host.onComplete`. A load-bearing failure (no concept, or the model never
 * called the creation tool) ends the run via `host.onError`; an invalid-but-built preview is still surfaced
 * (Save disabled), mirroring the one-shot path so the user can repair it.
 */
export async function runHomebrewPipeline(seed: string, host: HomebrewPipelineHost): Promise<void> {
    const kind = host.kind;
    const label = kindLabelLower(kind);
    const tool = HOMEBREW_TOOL_BY_NAME[KIND_TO_TOOL[kind]];

    // Running token total for THIS generation — folded in per step and shown live on the GenPipelineCard.
    let runUsage: TokenUsage | undefined;
    const accrue = <T>(res: StepResult<T>): StepResult<T> => {
        if (res.usage) runUsage = addUsage(runUsage, res.usage);
        return res;
    };

    const emit = (index: number, status: PipelineStatus, extra?: Partial<PipelineRun>) =>
        host.onProgress({ pipelineType: "homebrew", phase: HOMEBREW_PIPELINE_PHASES[index], phaseIndex: index, totalPhases: TOTAL, status, ...extra, usage: runUsage });

    if (!tool) return fail(host, emit, 0, `There's no generator for a homebrew ${label}.`);

    const opts: RunStepOptions = { repairBudget: repairBudgetFor(host.usageLevel), signal: host.signal };

    try {
        // ── Phase 1 — concept brief ────────────────────────────────────────────
        emit(0, "running");
        const briefResult = accrue(await produceConceptBrief(seed, label, host.ai, opts, host.runner));
        if (host.signal.aborted) return void emit(0, "aborted");
        if (!briefResult.ok || !briefResult.value) {
            return fail(host, emit, 0, briefResult.errors[0] ?? `Couldn't draft a concept for the ${label}.`);
        }
        const brief = briefResult.value;

        // ── Phase 2 — creation (build the full entity from the brief) ───────────
        emit(1, "running");
        const ctx: StepContext = { brief };   // the brief is the carry-forward for a single-entity build
        const creationOpts: RunStepOptions = { ...opts, maxTokens: creationMaxTokens(host.ai) };
        const result = accrue(await runStep(creationStep(kind, tool, host.dndSystem), ctx, host.ai, creationOpts, host.runner));
        if (host.signal.aborted) return void emit(1, "aborted");

        const preview = result.value;
        if (!preview) return fail(host, emit, 1, result.errors[0] ?? `Couldn't build the ${label}.`);
        // Stamp the mini-pipeline's total onto the preview so its per-homebrew cost survives to the card
        // and (on save) the decision log, exactly like a one-shot generation.
        if (runUsage) preview.usage = runUsage;

        // Surface the preview even if it failed its gate — the one-shot path shows an invalid card (Save
        // disabled) rather than dropping it, and the card's own errors drive any follow-up repair.
        emit(1, "completed", { currentPreview: preview });
        host.onComplete([preview]);
    } catch (e) {
        if (host.signal.aborted) return;
        fail(host, emit, 1, e instanceof Error ? e.message : String(e));
    }
}

type Emit = (index: number, status: PipelineStatus, extra?: Partial<PipelineRun>) => void;

/** Emit a terminal error for the given phase and notify the host. Returns void for `return fail(...)` use. */
function fail(host: HomebrewPipelineHost, emit: Emit, phaseIndex: number, message: string): void {
    emit(phaseIndex, "error", { error: message });
    host.onError(message);
}
