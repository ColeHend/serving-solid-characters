import { Accessor, createSignal, Setter } from "solid-js";
import getUserSettings from "./userSettings";
import { DEFAULT_AI_MAX_TOKENS, DEFAULT_AI_NUM_CTX } from "../../models/userSettings";
import { AiMessage, AiToolCall, AiToolResult } from "../ai/types";
import { buildProvider } from "../ai/providerFactory";
import { HOMEBREW_TOOLS } from "../ai/toolSchemas";
import { buildPreview, HomebrewPreview, saveHomebrew } from "../ai/toolDispatcher";
import { AiMode, buildSystemPrompt } from "../ai/systemPrompt";
import { createNewId } from "./utility/tools/idGen";

export type ChatRole = "user" | "assistant";
export type ChatStatus = "idle" | "streaming" | "error";

/** A rendered chat bubble. Tool calls/results live in the underlying AiMessage history, not here. */
export interface ChatMessage {
    id: string;
    role: ChatRole;
    text: string;
    /** The model's reasoning for this turn (display-only; not replayed to the model). */
    thinking?: string;
}

export type { HomebrewPreview };

/** The tool_result text that asks the model to regenerate a thin entity with its empty fields filled. */
function repairInstruction(p: HomebrewPreview): string {
    const fields = p.missingFields?.length ? p.missingFields.join(", ") : "every empty field";
    const tool = `create_${p.kind}`;
    return `The ${p.kind.replace("_", " ")} "${p.title}" you generated was incomplete. Call ${tool} again with the SAME content you already produced, but this time fill in these fields: ${fields}. In particular, write a full multi-sentence description with concrete mechanics. Do not drop any field you already filled.`;
}

/**
 * Singleton AI session store (mirrors homebrewManager). Read by both the navbar and the sidebar
 * without prop-drilling or context. Holds the visible chat, the provider-facing message history,
 * streaming status, and pending homebrew previews awaiting confirmation.
 */
class AiAssistant {
    // ---- reactive UI state ----
    readonly isOpen: Accessor<boolean>;
    private setIsOpen: Setter<boolean>;
    readonly mode: Accessor<AiMode>;
    private setMode_: Setter<AiMode>;
    readonly messages: Accessor<ChatMessage[]>;
    private setMessages: Setter<ChatMessage[]>;
    readonly status: Accessor<ChatStatus>;
    private setStatus: Setter<ChatStatus>;
    readonly streamingText: Accessor<string>;
    private setStreamingText: Setter<string>;
    readonly streamingThinking: Accessor<string>;
    private setStreamingThinking: Setter<string>;
    readonly pendingPreviews: Accessor<HomebrewPreview[]>;
    private setPendingPreviews: Setter<HomebrewPreview[]>;

    // ---- non-reactive turn state ----
    private history: AiMessage[] = [];
    private outstanding = new Set<string>();   // tool_call ids from the current turn awaiting confirm/reject
    private resolved: AiToolResult[] = [];      // tool_results collected so far this turn
    private controller: AbortController | null = null;
    private repairCounts = new Map<string, number>();   // entity title (lowercased) -> AI repair attempts (capped at 1)

    constructor() {
        [this.isOpen, this.setIsOpen] = createSignal(false);
        [this.mode, this.setMode_] = createSignal<AiMode>("chat");
        [this.messages, this.setMessages] = createSignal<ChatMessage[]>([]);
        [this.status, this.setStatus] = createSignal<ChatStatus>("idle");
        [this.streamingText, this.setStreamingText] = createSignal("");
        [this.streamingThinking, this.setStreamingThinking] = createSignal("");
        [this.pendingPreviews, this.setPendingPreviews] = createSignal<HomebrewPreview[]>([]);
    }

    open = () => this.setIsOpen(true);
    close = () => this.setIsOpen(false);
    toggle = () => this.setIsOpen(v => !v);
    setMode = (m: AiMode) => this.setMode_(m);

    clear = () => {
        this.cancel();
        this.history = [];
        this.outstanding.clear();
        this.resolved = [];
        this.repairCounts.clear();
        this.setMessages([]);
        this.setPendingPreviews([]);
        this.setStreamingText("");
        this.setStreamingThinking("");
        this.setStatus("idle");
    };

    cancel = () => {
        this.controller?.abort();
        this.controller = null;
        // Preserve any partial text/thinking as a bubble so it isn't lost.
        const partial = this.streamingText().trim();
        const thinking = this.streamingThinking().trim();
        if (partial || thinking) this.pushAssistantBubble(partial, thinking);
        this.setStreamingText("");
        this.setStreamingThinking("");
        if (this.status() === "streaming") this.setStatus("idle");
    };

    send = (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || this.status() === "streaming") return;
        // If the previous turn left tool calls unanswered (previews never confirmed/rejected), close
        // them out so the history stays valid (Anthropic requires every tool_use to get a tool_result).
        this.flushOutstanding();
        this.pushUserBubble(trimmed);
        this.history.push({ role: "user", text: trimmed });
        void this.runTurn();
    };

    confirmPreview = async (previewId: string) => {
        const preview = this.pendingPreviews().find(p => p.previewId === previewId);
        if (!preview) return;
        this.removePreview(previewId);
        const result = await saveHomebrew(preview);
        this.resolveToolCall(preview.toolCallId, result.message, !result.ok);
    };

    rejectPreview = (previewId: string) => {
        const preview = this.pendingPreviews().find(p => p.previewId === previewId);
        if (!preview) return;
        this.removePreview(previewId);
        this.resolveToolCall(preview.toolCallId, "The user rejected this and it was not saved.", true);
    };

    /**
     * Ask the AI to fill the empty/weak fields on a generated entity. Reuses the same tool_result
     * channel as confirm/reject (so message history stays valid), and is hard-capped at ONE repair
     * per entity — after that the user is steered to the editor. Button-initiated only; never loops.
     */
    completePreview = (previewId: string) => {
        if (this.status() === "streaming") return;
        const preview = this.pendingPreviews().find(p => p.previewId === previewId);
        if (!preview) return;
        const title = preview.title.toLowerCase();
        const attempts = preview.repairAttempts ?? this.repairCounts.get(title) ?? 0;
        if (attempts >= 1) return;   // already repaired once — edit manually from here
        this.repairCounts.set(title, attempts + 1);
        this.removePreview(previewId);
        this.resolveToolCall(preview.toolCallId, repairInstruction(preview), true);
    };

    // ----------------- internals -----------------

    private pushUserBubble(text: string) {
        this.setMessages(prev => [...prev, { id: createNewId(), role: "user", text }]);
    }
    private pushAssistantBubble(text: string, thinking?: string) {
        this.setMessages(prev => [...prev, { id: createNewId(), role: "assistant", text, thinking: thinking || undefined }]);
    }
    private removePreview(previewId: string) {
        this.setPendingPreviews(prev => prev.filter(p => p.previewId !== previewId));
    }

    /** Close out any tool calls the user never addressed, keeping the message history valid. */
    private flushOutstanding() {
        if (this.outstanding.size === 0 && this.resolved.length === 0) return;
        for (const id of this.outstanding) {
            this.resolved.push({ toolCallId: id, content: "The user did not act on this.", isError: true });
        }
        if (this.resolved.length) this.history.push({ role: "tool", toolResults: this.resolved });
        this.resolved = [];
        this.outstanding.clear();
        this.setPendingPreviews([]);
    }

    /** Record a tool result; once every tool call from the turn is resolved, continue the turn. */
    private resolveToolCall(toolCallId: string, content: string, isError: boolean) {
        this.resolved.push({ toolCallId, content, isError });
        this.outstanding.delete(toolCallId);
        if (this.outstanding.size === 0 && this.resolved.length) {
            this.history.push({ role: "tool", toolResults: this.resolved });
            this.resolved = [];
            void this.runTurn();
        }
    }

    private async runTurn() {
        const [userSettings] = getUserSettings();
        const ai = userSettings().ai;
        if (!ai) { this.fail("AI is not configured."); return; }

        const provider = buildProvider(ai);
        const tools = this.mode() === "homebrew" ? HOMEBREW_TOOLS : undefined;
        const system = buildSystemPrompt(userSettings().dndSystem, this.mode());

        this.controller = new AbortController();
        this.setStatus("streaming");
        this.setStreamingText("");
        this.setStreamingThinking("");

        const accumulators = new Map<number, { id: string; name: string; args: string }>();

        try {
            for await (const ev of provider.streamChat(this.history, tools, {
                model: ai.model,
                system,
                // User-configurable in AI settings. We stream, so a large ceiling is safe re: HTTP
                // timeouts. Truncation past this is surfaced (not swallowed) in finishTurn.
                maxTokens: ai.maxTokens ?? DEFAULT_AI_MAX_TOKENS,
                // Context window for local Ollama models — too small a window starves output room.
                numCtx: ai.numCtx ?? DEFAULT_AI_NUM_CTX,
                signal: this.controller.signal,
            })) {
                switch (ev.type) {
                    case "text_delta":
                        this.setStreamingText(prev => prev + ev.text);
                        break;
                    case "thinking_delta":
                        this.setStreamingThinking(prev => prev + ev.text);
                        break;
                    case "tool_call_start":
                        accumulators.set(ev.index, { id: ev.id, name: ev.name, args: "" });
                        break;
                    case "tool_call_delta": {
                        const acc = accumulators.get(ev.index);
                        if (acc) acc.args += ev.argsDelta;
                        break;
                    }
                    case "tool_call_done":
                        break; // parsed at message_done
                    case "error":
                        this.pushAssistantBubble(`⚠️ ${ev.error}`);
                        break;
                    case "message_done":
                        this.finishTurn(ev.stopReason, accumulators);
                        return;
                }
            }
            // Stream ended without an explicit message_done.
            this.finishTurn(accumulators.size ? "tool_use" : "end_turn", accumulators);
        } catch (e) {
            if (this.controller?.signal.aborted) { this.setStatus("idle"); return; }
            this.fail(`Something went wrong talking to the AI. ${String(e)}`);
        } finally {
            this.controller = null;
        }
    }

    private finishTurn(stopReason: string, accumulators: Map<number, { id: string; name: string; args: string }>) {
        const text = this.streamingText().trim();
        const thinking = this.streamingThinking().trim();
        this.setStreamingText("");
        this.setStreamingThinking("");

        // A cut-off turn (max_tokens) usually leaves partial tool-arg JSON; track parse failures per call
        // so we can flag the affected preview as truncated instead of silently saving an empty entity.
        const truncated = stopReason === "max_tokens";
        const toolCalls: AiToolCall[] = [];
        const parseFailed: boolean[] = [];
        for (const acc of accumulators.values()) {
            let input: Record<string, unknown> = {};
            let failed = false;
            if (acc.args.trim()) {
                try { input = JSON.parse(acc.args); } catch { failed = true; }
            }
            toolCalls.push({ id: acc.id, name: acc.name, input });
            parseFailed.push(failed);
        }

        if (stopReason === "refusal") {
            this.pushAssistantBubble(text || "⚠️ The model declined to respond to that request.", thinking);
            this.setStatus("idle");
            return;
        }

        // Record the assistant turn in history (text + any tool calls) for continuation. Thinking is
        // display-only and intentionally not replayed to the model.
        this.history.push({ role: "assistant", text: text || undefined, toolCalls: toolCalls.length ? toolCalls : undefined });
        if (text || thinking) this.pushAssistantBubble(text, thinking);

        if (toolCalls.length) {
            this.outstanding = new Set(toolCalls.map(t => t.id));
            this.resolved = [];
            const [userSettings] = getUserSettings();
            const dndSystem = userSettings().dndSystem;
            const previews = toolCalls.map((tc, idx) => {
                const p = buildPreview(tc, dndSystem);
                p.repairAttempts = this.repairCounts.get(p.title.toLowerCase()) ?? 0;
                if (truncated || parseFailed[idx]) {
                    p.truncated = true;
                    p.warnings = [...(p.warnings ?? []), "The AI's response was cut off before it finished — some fields may be missing. Use \"Complete with AI\" or regenerate."];
                }
                return p;
            });
            this.setPendingPreviews(prev => [...prev, ...previews]);
        } else if (truncated) {
            this.pushAssistantBubble("⚠️ The response was cut off (the model hit its length limit). Try again, or raise the model's max output tokens.");
        }
        this.setStatus("idle");
    }

    private fail(message: string) {
        this.pushAssistantBubble(`⚠️ ${message}`);
        this.setStatus("error");
        this.setStreamingText("");
    }
}

const aiAssistant = new AiAssistant();
export { aiAssistant };
export default aiAssistant;
