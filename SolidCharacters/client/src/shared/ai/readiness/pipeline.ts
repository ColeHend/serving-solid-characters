import { DEFAULT_REVIEW_SETTINGS, ReviewPassId } from "../../../models/userSettings";
import { HomebrewPreview } from "../toolDispatcher";
import { brokenReferenceVerdict, linterVerdict, schemaVerdict } from "./deterministicPasses";
import { runLlmReview } from "./llmReview";
import { BUILTIN_LLM_PASSES, ReviewPassSpec } from "./reviewSystemPrompt";
import { ReviewContext, ReviewVerdict } from "./types";

/**
 * Run the enabled readiness passes over a single preview and return their verdicts in pipeline order:
 * deterministic gates first (schema, references, terminology — free), then LLM judgment passes
 * (balance/action-economy/exploit/dominant-option + custom agents), then a final schema re-check.
 *
 * ctx.signal aborts long LLM passes; deterministic passes ignore it. LLM passes individually fail open
 * (see runLlmReview), so a flaky reviewer never strands or blocks a card.
 */
export async function assembleVerdicts(preview: HomebrewPreview, ctx: ReviewContext): Promise<ReviewVerdict[]> {
    const enabled: ReviewPassId[] = ctx.ai.review?.enabledPasses ?? DEFAULT_REVIEW_SETTINGS.enabledPasses;
    const verdicts: ReviewVerdict[] = [];

    // ----- deterministic gates -----
    if (enabled.includes("schema_validate")) verdicts.push(schemaVerdict(preview, "schema_validate"));
    if (enabled.includes("broken_reference")) verdicts.push(brokenReferenceVerdict(preview));
    if (enabled.includes("linter")) verdicts.push(linterVerdict(preview));

    // ----- LLM judgment passes (sequential — one local model at a time) -----
    verdicts.push(...await runLlmPasses(preview, ctx, enabled));

    // ----- final schema re-check ("schema validates still") -----
    if (enabled.includes("schema_validate_final")) verdicts.push(schemaVerdict(preview, "schema_validate_final"));

    return verdicts;
}

/**
 * The LLM judgment passes for a preview: the enabled built-ins, then any custom review agents that apply.
 * Custom agents are appended via the resolver injected by reviewAgentManager (Phase 4); when none is
 * registered this is just the built-ins. Runs strictly sequentially to avoid hammering a local model.
 */
async function runLlmPasses(preview: HomebrewPreview, ctx: ReviewContext, enabled: ReviewPassId[]): Promise<ReviewVerdict[]> {
    const specs: ReviewPassSpec[] = [];
    for (const id of enabled) {
        const spec = BUILTIN_LLM_PASSES[id];
        if (spec) specs.push(spec);
    }
    specs.push(...customAgentResolver(preview.kind));

    const verdicts: ReviewVerdict[] = [];
    for (const spec of specs) {
        if (ctx.signal?.aborted) break;
        verdicts.push(await runLlmReview(spec, preview, ctx));
    }
    return verdicts;
}

/**
 * Resolver for custom review-agent specs that apply to a given kind. Defaults to none; reviewAgentManager
 * registers the real resolver at startup (Phase 4), keeping the pipeline decoupled from its storage.
 */
let customAgentResolver: (kind: HomebrewPreview["kind"]) => ReviewPassSpec[] = () => [];
export function setCustomAgentResolver(resolver: (kind: HomebrewPreview["kind"]) => ReviewPassSpec[]): void {
    customAgentResolver = resolver;
}
