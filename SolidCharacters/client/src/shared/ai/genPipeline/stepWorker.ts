import { AiSettings, STRUCTURED_TURN_TEMPERATURE } from "../../../models/userSettings";
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
    // Only demand `fits_concept` from tools whose schema declares it (all pipeline step tools do; the
    // create_* schemas don't and forbid extra fields via additionalProperties — demanding it there
    // contradicts the schema and wastes output budget).
    const wantsFits = !!(spec.tool.inputSchema as { properties?: Record<string, unknown> })?.properties?.fits_concept;
    blocks.push(
        `Respond ONLY by calling ${spec.tool.name} with the requested fields.` +
        (wantsFits ? " Include a short `fits_concept` note (one line) explaining how this serves the concept." : ""),
    );
    return blocks.join("\n\n");
}

/**
 * Salvage a tool payload the model wrote as TEXT instead of making the forced call — a common local-model
 * failure (it "describes" the call or emits a ```json block). Returns the first parseable JSON OBJECT (a
 * fenced block first, else the first balanced `{ … }` span), or null. A salvaged object still goes through
 * the step's normal `parse`/gate, so a malformed-but-parseable object just falls into the repair path.
 */
export function extractToolJson(text: string): Record<string, unknown> | null {
    if (!text?.trim()) return null;
    const candidates: string[] = [];
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence?.[1]?.trim()) candidates.push(fence[1].trim());
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) candidates.push(text.slice(start, end + 1));
    for (const c of candidates) {
        try {
            const parsed = JSON.parse(c);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
        } catch { /* try the next candidate */ }
    }
    return null;
}

/**
 * Run one pipeline step to a gated result. Forces `spec.tool`, coerces via `spec.parse`, and re-runs on
 * failure within TWO separate budgets: gate failures (the tool was called but its output was illegal) use
 * `repairBudget` (usage-level, default 1); a "no tool call" / failed call (prose-only reply — a transient
 * local-model glitch) uses `toolCallRetries` (default 2, usage-independent) so one bad reply can't kill the
 * run at the Low level. A prose reply that contains the tool's JSON is salvaged (see `extractToolJson`) so
 * it often succeeds without a retry. Total attempts are bounded by `1 + repairBudget + toolCallRetries`.
 */
export async function runStep<T>(
    spec: StepSpec<T>,
    ctx: StepContext,
    ai: AiSettings,
    opts: RunStepOptions = {},
    runner: StepModelRunner = defaultRunner,
): Promise<StepResult<T>> {
    const gateBudget = Math.max(0, opts.repairBudget ?? 1);
    const toolCallBudget = Math.max(0, opts.toolCallRetries ?? 2);
    const maxAttempts = 1 + gateBudget + toolCallBudget;   // hard ceiling so alternating failures can't spin
    const subSpec: SubAgentSpec = {
        id: spec.id,
        name: spec.id,
        system: `${NEUTRAL_PREAMBLE}\n\n${spec.system.trim()}`,
        tools: [spec.tool],
        maxTokens: opts.maxTokens ?? 1024,
        numCtx: opts.numCtx,
        think: false,   // reasoning would burn the small budget before the tool call (matches llmReview/commandAgent)
        temperature: STRUCTURED_TURN_TEMPERATURE,   // exact enum keys + legal JSON want near-greedy decoding
        forceTool: true,   // cloud/compat servers must not answer a forced-tool step in prose
    };

    let attempts = 0;
    let gateRepairsUsed = 0;
    let toolCallRetriesUsed = 0;
    let lastValue: T | null = null;
    let lastErrors: string[] = [];
    let lastFits: string | undefined;
    let noToolCall = false;

    while (attempts < maxAttempts) {
        if (opts.signal?.aborted) return { ok: false, value: lastValue, errors: lastErrors, attempts, aborted: true };

        attempts++;
        const task = buildTask(spec, ctx, attempts === 1 ? [] : lastErrors, noToolCall);
        const res = await runner(subSpec, task, ai, opts.signal);

        // Resolve the tool input: a real forced call, else salvage a JSON object the model wrote as text.
        let raw: Record<string, unknown> | null = null;
        if (res.ok) {
            const call = res.toolCalls.find(c => c.name === spec.tool.name) ?? res.toolCalls[0];
            raw = call ? ((call.input ?? {}) as Record<string, unknown>) : extractToolJson(res.text);
        }

        if (!raw) {
            // No usable output (call failed, or prose with no parseable JSON) — spend the tool-call budget.
            noToolCall = true;
            lastErrors = [res.ok ? `You did not call ${spec.tool.name}.` : "The model call failed; try again."];
            if (toolCallRetriesUsed >= toolCallBudget) break;
            toolCallRetriesUsed++;
            continue;
        }
        noToolCall = false;

        lastFits = str(raw.fits_concept).trim() || undefined;
        const { value, errors } = spec.parse(raw);
        lastValue = value;
        if (!errors.length) return { ok: true, value, fitsConcept: lastFits, errors: [], attempts };

        // Gate failure (legal call, illegal output) — spend the gate-repair budget.
        lastErrors = errors;
        if (gateRepairsUsed >= gateBudget) break;
        gateRepairsUsed++;
    }

    // A persistent no-tool-call gets an actionable message; a gate failure keeps the validator's errors.
    const finalErrors = noToolCall
        ? [`The model replied with text instead of filling in ${spec.tool.name}. Try again, or raise the usage level.`]
        : lastErrors;
    return { ok: false, value: lastValue, fitsConcept: lastFits, errors: finalErrors, attempts, noToolCall };
}
