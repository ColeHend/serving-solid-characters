import { buildProvider } from "./providers/providerFactory";
import { AiMessage, AiToolCall, AiToolDef, AiToolResult } from "./types";
import { AiSettings, DEFAULT_AI_NUM_CTX } from "../../models/userSettings";
import { LOOKUP_TOOLS } from "./tools/lookupTools";

/**
 * Restricted-tool sub-agents that run in a FRESH, isolated context (a brand-new short `messages` array —
 * none of the main conversation is passed). Generalizes the readiness reviewer (llmReview.ts): own
 * provider, minimal system prompt, a SMALL tool set, and a bounded tool-use loop. Only a compact result
 * is returned to the main turn, so heavy tool I/O never bloats the main chat's token count.
 */

export interface SubAgentSpec {
    id: string;
    name: string;
    /** Minimal, focused system prompt naming only this agent's job + its 1-3 tools. */
    system: string;
    /** The agent's restricted tool set (fewer tools → more reliable small-model tool use). */
    tools: AiToolDef[];
    maxTokens?: number;
    numCtx?: number;
    think?: boolean;
    /** Sampling temperature; set low (~0.2) on structured/tool-JSON agents. Undefined keeps the server default. */
    temperature?: number;
    /** Force a tool call on OpenAI-compatible/cloud servers (tool_choice "required"); Ollama-native ignores it. */
    forceTool?: boolean;
}

export interface SubAgentResult {
    text: string;
    /** Tool calls from the final (unexecuted) turn, if any. */
    toolCalls: AiToolCall[];
    ok: boolean;
}

/** Executes one of the sub-agent's tool calls. Returns the tool_result content. */
export type SubAgentToolExecutor = (tc: AiToolCall) => Promise<{ content: string; isError: boolean }>;

const MAX_ITERATIONS = 4;   // sub-agents are depth-1 and bounded; never an open-ended loop

function parseCalls(acc: Map<number, { id: string; name: string; args: string }>): AiToolCall[] {
    const calls: AiToolCall[] = [];
    for (const a of acc.values()) {
        let input: Record<string, unknown> = {};
        if (a.args.trim()) { try { input = JSON.parse(a.args); } catch { /* leave empty */ } }
        calls.push({ id: a.id, name: a.name, input });
    }
    return calls;
}

/** Stream a single sub-agent turn over the given messages; returns its text + parsed tool calls. */
async function streamOnce(spec: SubAgentSpec, messages: AiMessage[], ai: AiSettings, signal?: AbortSignal): Promise<SubAgentResult> {
    const provider = buildProvider(ai);
    const acc = new Map<number, { id: string; name: string; args: string }>();
    let text = "";
    for await (const ev of provider.streamChat(messages, spec.tools.length ? spec.tools : undefined, {
        model: ai.model,
        system: spec.system,
        maxTokens: spec.maxTokens ?? 1024,
        numCtx: spec.numCtx ?? ai.numCtx ?? DEFAULT_AI_NUM_CTX,
        think: spec.think ?? false,
        temperature: spec.temperature,
        forceTool: spec.forceTool,
        signal,
    })) {
        switch (ev.type) {
            case "text_delta": text += ev.text; break;
            case "tool_call_start": acc.set(ev.index, { id: ev.id, name: ev.name, args: "" }); break;
            case "tool_call_delta": { const a = acc.get(ev.index); if (a) a.args += ev.argsDelta; break; }
            case "error": return { text, toolCalls: [], ok: false };
            case "message_done": return { text, toolCalls: parseCalls(acc), ok: true };
        }
    }
    return { text, toolCalls: parseCalls(acc), ok: true };
}

/**
 * Run a sub-agent to completion over a fresh, isolated context. If `execute` is given, the sub-agent's
 * tool calls are run and fed back in a bounded loop until it produces a plain-text answer (or the cap is
 * hit). Returns only the final text + the last unexecuted tool calls. Fails closed (ok:false) on error.
 */
export async function runSubAgent(
    spec: SubAgentSpec, task: string, ai: AiSettings, signal?: AbortSignal, execute?: SubAgentToolExecutor,
): Promise<SubAgentResult> {
    const messages: AiMessage[] = [{ role: "user", text: task }];
    let lastText = "";
    try {
        for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
            if (signal?.aborted) break;
            const turn = await streamOnce(spec, messages, ai, signal);
            if (!turn.ok) return { text: lastText, toolCalls: [], ok: false };
            if (turn.text) lastText = turn.text;
            if (!turn.toolCalls.length || !execute) return { text: lastText, toolCalls: turn.toolCalls, ok: true };

            // Record the assistant turn + execute its tool calls, then loop with the results appended.
            messages.push({ role: "assistant", text: turn.text || undefined, toolCalls: turn.toolCalls });
            const results: AiToolResult[] = [];
            for (const tc of turn.toolCalls) {
                if (signal?.aborted) return { text: lastText, toolCalls: [], ok: false };
                const r = await execute(tc);
                results.push({ toolCallId: tc.id, content: r.content, isError: r.isError });
            }
            messages.push({ role: "tool", toolResults: results });
        }
        return { text: lastText, toolCalls: [], ok: true };
    } catch {
        return { text: lastText, toolCalls: [], ok: false };
    }
}

/**
 * The lookup-only research sub-agent: searches SRD + homebrew and reports a compact summary.
 *
 * ZERO-PERSONA SURFACE: this agent reports facts; keep it in plain "report only what you found" mode.
 * No Grimoire voice, no page metaphors — a hallucination-prone small model must not dress up gaps.
 */
export function researchAgentSpec(): SubAgentSpec {
    return {
        id: "research",
        name: "Researcher",
        system:
            "You are a D&D 5e research helper. Use lookup_srd and lookup_homebrew to find exact official numbers " +
            "and the user's existing content. When you have what you need, answer in at most 6 concise lines with " +
            "the concrete facts you found (names, numbers, sources). If a lookup returns no match, say so explicitly " +
            "(\"No official match for X\") — never fill the gap with an invented number. Never invent anything you could not look up.",
        tools: [...LOOKUP_TOOLS],
    };
}

/** A delegate tool the MAIN model can call to offload a multi-step lookup to a fresh context. */
export const DELEGATE_RESEARCH_TOOL: AiToolDef = {
    name: "delegate_research",
    description:
        "Delegate a focused research task to a helper that searches SRD + homebrew and returns a short summary. " +
        "Use this for multi-step lookups so the main conversation stays small. " +
        "Example: {\"task\":\"Find Fireball's official damage/range and any similar fire spells the user already has.\"}",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            task: { type: "string", description: "What to research, in one or two sentences." },
        },
        required: ["task"],
    },
};
