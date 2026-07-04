import { Accessor, createSignal } from "solid-js";
import type { AiMessage, AiToolDef, TokenUsage, UsageTotals } from "./types";
import { recordOverall } from "./overallUsage";

/**
 * Token accounting for Grimoire.
 *
 * - `estimateTokens` / `estimateMessageTokens` / `estimateUsage` are the shared char/4 heuristic (lifted
 *   from aiAssistant.windowedHistory's inline `tokensOf`) used both for history windowing AND as the
 *   fallback when a provider reports no real counts. The estimate is computed in the ADAPTERS, because only
 *   the adapter sees the emitted output — homebrew output streams as tool-call args, not `text_delta`.
 * - `sessionUsage` is the reactive PER-CONVERSATION total (persisted on SavedConversation, restored on load,
 *   zeroed on New chat). `recordUsage` folds one request into BOTH this and the persistent overall total.
 *
 * This module imports nothing heavier than solid-js + the overall-usage store, so the deep, aiAssistant-
 * agnostic generation chain (subAgent, genPipeline, commands, readiness) can import it without a cycle.
 */

/** The one char/4 token estimator. */
export const estimateTokens = (s: string): number => Math.ceil(s.length / 4);

/**
 * Estimate the token cost of ONE message, excluding base64 image/audio data (it would dwarf the text) and
 * counting a flat per-attachment cost instead — mirrors the original windowedHistory heuristic (a vision
 * model tiles an image; Gemma spends ~25 tokens/sec of audio → ~750 for a 30s clip).
 */
export const estimateMessageTokens = (m: AiMessage): number =>
    estimateTokens(JSON.stringify({ ...m, images: undefined, audio: undefined }))
    + (m.images?.length ?? 0) * 768
    + (m.audio?.length ?? 0) * 800;

/** Estimate the request's INPUT tokens: system prompt + tool schemas + all messages (media-excluded). */
export const estimateInputTokens = (
    messages: AiMessage[],
    system?: string,
    tools?: AiToolDef[],
): number =>
    estimateTokens(system ?? "")
    + estimateTokens(JSON.stringify(tools ?? []))
    + messages.reduce((n, m) => n + estimateMessageTokens(m), 0);

/**
 * Fallback usage when the provider reported nothing. `outChars` is the running length of everything the
 * adapter emitted as output (text + thinking + tool-call arg JSON). Always flagged `estimated`.
 */
export const estimateUsage = (
    messages: AiMessage[],
    system: string | undefined,
    outChars: number,
    tools?: AiToolDef[],
): TokenUsage => ({
    inputTokens: estimateInputTokens(messages, system, tools),
    outputTokens: Math.ceil(outChars / 4),
    estimated: true,
});

// ---- per-conversation session ledger ----

const zero = (): UsageTotals => ({ inputTokens: 0, outputTokens: 0, requestCount: 0 });

const [sessionUsageSig, setSessionUsage] = createSignal<UsageTotals>(zero());

/** Reactive per-conversation token total — drives the Grimoire header readout. */
export const sessionUsage: Accessor<UsageTotals> = sessionUsageSig;

/**
 * Fold one completed request into BOTH the per-conversation session total and the persistent overall total.
 * Every `streamChat` consumer calls this once at `message_done`. `estimated` is sticky.
 */
export function recordUsage(u: TokenUsage): void {
    setSessionUsage(t => ({
        inputTokens: t.inputTokens + (u.inputTokens || 0),
        outputTokens: t.outputTokens + (u.outputTokens || 0),
        requestCount: t.requestCount + 1,
        estimated: t.estimated || u.estimated || undefined,
    }));
    recordOverall(u);
}

/** New chat → zero. loadConversation → restore the persisted per-conversation total. */
export function resetSessionUsage(seed?: UsageTotals): void {
    setSessionUsage(seed ? { ...seed } : zero());
}

/** Sum two usages (for consumers that make multiple model calls per logical unit — sum, never overwrite). */
export function addUsage(a: TokenUsage | undefined, b: TokenUsage | undefined): TokenUsage {
    return {
        inputTokens: (a?.inputTokens || 0) + (b?.inputTokens || 0),
        outputTokens: (a?.outputTokens || 0) + (b?.outputTokens || 0),
        estimated: a?.estimated || b?.estimated || undefined,
    };
}
