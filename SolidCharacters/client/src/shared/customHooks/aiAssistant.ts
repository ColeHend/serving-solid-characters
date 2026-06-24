import { Accessor, createSignal, Setter } from "solid-js";
import getUserSettings from "./userSettings";
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
}

export type { HomebrewPreview };

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
    readonly pendingPreviews: Accessor<HomebrewPreview[]>;
    private setPendingPreviews: Setter<HomebrewPreview[]>;

    // ---- non-reactive turn state ----
    private history: AiMessage[] = [];
    private outstanding = new Set<string>();   // tool_call ids from the current turn awaiting confirm/reject
    private resolved: AiToolResult[] = [];      // tool_results collected so far this turn
    private controller: AbortController | null = null;

    constructor() {
        [this.isOpen, this.setIsOpen] = createSignal(false);
        [this.mode, this.setMode_] = createSignal<AiMode>("chat");
        [this.messages, this.setMessages] = createSignal<ChatMessage[]>([]);
        [this.status, this.setStatus] = createSignal<ChatStatus>("idle");
        [this.streamingText, this.setStreamingText] = createSignal("");
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
        this.setMessages([]);
        this.setPendingPreviews([]);
        this.setStreamingText("");
        this.setStatus("idle");
    };

    cancel = () => {
        this.controller?.abort();
        this.controller = null;
        // Preserve any partial text as a bubble so it isn't lost.
        const partial = this.streamingText().trim();
        if (partial) this.pushAssistantBubble(partial);
        this.setStreamingText("");
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

    // ----------------- internals -----------------

    private pushUserBubble(text: string) {
        this.setMessages(prev => [...prev, { id: createNewId(), role: "user", text }]);
    }
    private pushAssistantBubble(text: string) {
        this.setMessages(prev => [...prev, { id: createNewId(), role: "assistant", text }]);
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

        const accumulators = new Map<number, { id: string; name: string; args: string }>();

        try {
            for await (const ev of provider.streamChat(this.history, tools, {
                model: ai.model,
                system,
                maxTokens: 4096,
                signal: this.controller.signal,
            })) {
                switch (ev.type) {
                    case "text_delta":
                        this.setStreamingText(prev => prev + ev.text);
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
        this.setStreamingText("");

        const toolCalls: AiToolCall[] = [];
        for (const acc of accumulators.values()) {
            let input: Record<string, unknown> = {};
            try { input = acc.args.trim() ? JSON.parse(acc.args) : {}; } catch { input = {}; }
            toolCalls.push({ id: acc.id, name: acc.name, input });
        }

        if (stopReason === "refusal") {
            this.pushAssistantBubble(text || "⚠️ The model declined to respond to that request.");
            this.setStatus("idle");
            return;
        }

        // Record the assistant turn in history (text + any tool calls) for continuation.
        this.history.push({ role: "assistant", text: text || undefined, toolCalls: toolCalls.length ? toolCalls : undefined });
        if (text) this.pushAssistantBubble(text);

        if (toolCalls.length) {
            this.outstanding = new Set(toolCalls.map(t => t.id));
            this.resolved = [];
            const previews = toolCalls.map(buildPreview);
            this.setPendingPreviews(prev => [...prev, ...previews]);
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
