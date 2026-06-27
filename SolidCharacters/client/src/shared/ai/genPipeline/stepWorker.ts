import { AiSettings } from "../../../models/userSettings";
import { str } from "../coerce";
import type { SubAgentResult, SubAgentSpec } from "../subAgent";
import type { ConceptBrief, RunStepOptions, StepContext, StepResult, StepSpec } from "./types";

/**
 * The per-step worker (plan §2.1 / spec §6): force ONE tool, coerce + gate the model's output, and repair
 * within a step-scoped budget. It is a thin driver over `runSubAgent` (the existing isolated-context
 * primitive) — each attempt runs in a FRESH short context built from the brief + carry-forward summary +
 * scoped homebrew + the step task. Reliability comes from the small schema and the repair loop, not from
 * constrained decoding (Ollama can't be forced to emit a tool call — risk §4 — so "no tool call" is a
 * step failure that repairs, then surfaces).
 *
 * `runSubAgent` is imported LAZILY (only on the default path) so this module — and its consumers — don't
 * eagerly pull the provider/SRD graph; tests inject a stub runner and never touch it.
 */

/** The model-call primitive `runStep` drives. Matches `runSubAgent`'s first four params (execute is unused). */
export type StepModelRunner = (
    spec: SubAgentSpec, task: string, ai: AiSettings, signal?: AbortSignal,
) => Promise<SubAgentResult>;

/** Default runner: lazy-imports runSubAgent so importing stepWorker stays side-effect-free. */
const defaultRunner: StepModelRunner = async (spec, task, ai, signal) => {
    const { runSubAgent } = await import("../subAgent");
    return runSubAgent(spec, task, ai, signal);
};

/**
 * Neutral identity for EVERY step — a zero-persona content engine (the Grimoire voice never enters tool
 * prompts). The step's own `system` fragment names its specific job; this frames the shared rules.
 */
const NEUTRAL_PREAMBLE =
    "You are a Dungeons & Dragons 5e content engine. You build one small, well-formed piece of a larger " +
    "entity per turn by calling a single tool. Use exact 5e terminology and legal values. Serve the given " +
    "concept and weave in its motifs. When homebrew definitions are provided, transcribe them exactly — " +
    "do not rename, renormalize, or reason about whether they are balanced.";

/** Format the concept brief as a compact prompt block (skips empty fields). */
function formatBrief(b: ConceptBrief): string {
    const lines: string[] = [];
    if (b.concept?.trim()) lines.push(`Concept: ${b.concept.trim()}`);
    if (b.tone?.trim()) lines.push(`Tone: ${b.tone.trim()}`);
    if (b.power_tier?.trim()) lines.push(`Power tier: ${b.power_tier.trim()}`);
    if (b.motifs?.length) lines.push(`Motifs: ${b.motifs.join(", ")}`);
    if (b.themes?.length) lines.push(`Themes: ${b.themes.join(", ")}`);
    if (b.naming_style?.trim()) lines.push(`Naming style: ${b.naming_style.trim()}`);
    if (b.constraints?.length) lines.push(`Constraints: ${b.constraints.join("; ")}`);
    return lines.join("\n");
}

/** Build the user-message task for one attempt: context blocks, the task, and any prior-attempt errors. */
function buildTask(spec: StepSpec<unknown>, ctx: StepContext, repairErrors: string[], noToolCall: boolean): string {
    const blocks: string[] = [];
    if (ctx.brief) blocks.push(`CONCEPT BRIEF\n${formatBrief(ctx.brief)}`);
    if (ctx.summary?.trim()) blocks.push(`DECIDED SO FAR\n${ctx.summary.trim()}`);
    if (ctx.scopedHomebrew?.trim()) {
        blocks.push(`RELEVANT HOMEBREW (transcribe exactly; do not normalize or reason about it)\n${ctx.scopedHomebrew.trim()}`);
    }
    blocks.push(`YOUR TASK\n${spec.task.trim()}`);
    if (repairErrors.length) {
        blocks.push(`FIX THESE PROBLEMS FROM YOUR LAST ATTEMPT:\n${repairErrors.map(e => `- ${e}`).join("\n")}`);
    }
    if (noToolCall) {
        blocks.push(`You did not call the tool last time. You MUST respond by calling ${spec.tool.name}.`);
    }
    blocks.push(
        `Respond ONLY by calling ${spec.tool.name} with the requested fields. ` +
        "Include a short `fits_concept` note (one line) explaining how this serves the concept.",
    );
    return blocks.join("\n\n");
}

/**
 * Run one pipeline step to a gated result. Forces `spec.tool`, coerces via `spec.parse`, and on a gate
 * failure (or no tool call) re-runs THIS step with the errors appended, up to `repairBudget` repairs
 * (default 1). Returns the gated value, or the last failing attempt for the UI to surface.
 */
export async function runStep<T>(
    spec: StepSpec<T>,
    ctx: StepContext,
    ai: AiSettings,
    opts: RunStepOptions = {},
    runner: StepModelRunner = defaultRunner,
): Promise<StepResult<T>> {
    const budget = Math.max(0, opts.repairBudget ?? 1);
    const subSpec: SubAgentSpec = {
        id: spec.id,
        name: spec.id,
        system: `${NEUTRAL_PREAMBLE}\n\n${spec.system.trim()}`,
        tools: [spec.tool],
        maxTokens: opts.maxTokens ?? 1024,
        numCtx: opts.numCtx,
        think: false,   // reasoning would burn the small budget before the tool call (matches llmReview/commandAgent)
    };

    let attempts = 0;
    let lastValue: T | null = null;
    let lastErrors: string[] = [];
    let lastFits: string | undefined;
    let noToolCall = false;

    for (let attempt = 0; attempt <= budget; attempt++) {
        if (opts.signal?.aborted) return { ok: false, value: lastValue, errors: lastErrors, attempts, aborted: true };

        attempts++;
        const task = buildTask(spec, ctx, attempt === 0 ? [] : lastErrors, noToolCall);
        const res = await runner(subSpec, task, ai, opts.signal);

        if (!res.ok) { noToolCall = true; lastErrors = ["The model call failed; try again."]; continue; }

        const call = res.toolCalls.find(c => c.name === spec.tool.name) ?? res.toolCalls[0];
        if (!call) { noToolCall = true; lastErrors = [`You did not call ${spec.tool.name}.`]; continue; }
        noToolCall = false;

        const raw = (call.input ?? {}) as Record<string, unknown>;
        lastFits = str(raw.fits_concept).trim() || undefined;
        const { value, errors } = spec.parse(raw);
        lastValue = value;
        if (!errors.length) return { ok: true, value, fitsConcept: lastFits, errors: [], attempts };
        lastErrors = errors;
    }

    return { ok: false, value: lastValue, fitsConcept: lastFits, errors: lastErrors, attempts, noToolCall };
}
