import { Accessor, createSignal, Setter } from "solid-js";
import getUserSettings from "./userSettings";
import {
    AiSettings, DEFAULT_AI_MAX_TOKENS, DEFAULT_AI_NUM_CTX, DEFAULT_AI_THINKING, DEFAULT_AI_THINKING_HOMEBREW,
} from "../../models/userSettings";
import { AiMessage, AiToolCall, AiToolResult } from "../ai/types";
import { buildProvider } from "../ai/providerFactory";
import { HOMEBREW_TOOLS } from "../ai/toolSchemas";
import { buildPreview, HomebrewPreview, saveHomebrew } from "../ai/toolDispatcher";
import { AiMode, buildSystemPrompt } from "../ai/systemPrompt";
import { generateConversationTitle } from "../ai/generateTitle";
import { createNewId } from "./utility/tools/idGen";
import chatHistoryDB, { SavedConversation } from "./utility/localDB/chatHistoryDB";

export type { SavedConversation };

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
    readonly conversations: Accessor<SavedConversation[]>;
    private setConversations: Setter<SavedConversation[]>;

    // ---- non-reactive turn state ----
    private history: AiMessage[] = [];
    private outstanding = new Set<string>();   // tool_call ids from the current turn awaiting confirm/reject
    private resolved: AiToolResult[] = [];      // tool_results collected so far this turn
    private controller: AbortController | null = null;
    private repairCounts = new Map<string, number>();   // entity title (lowercased) -> AI repair attempts (capped at 1)
    // ---- persisted-conversation state ----
    private currentConversationId: string | null = null;   // null until the active chat is first saved
    private createdAt: number | null = null;               // creation timestamp of the active chat
    private titleOverride: string | null = null;           // AI-generated/restored title; null => derive from first message
    private titleGenerated = false;                         // whether AI titling was already attempted for this chat
    private turnEpoch = 0;                                  // bumped on every session swap to invalidate in-flight turns

    constructor() {
        [this.isOpen, this.setIsOpen] = createSignal(false);
        [this.mode, this.setMode_] = createSignal<AiMode>("chat");
        [this.messages, this.setMessages] = createSignal<ChatMessage[]>([]);
        [this.status, this.setStatus] = createSignal<ChatStatus>("idle");
        [this.streamingText, this.setStreamingText] = createSignal("");
        [this.streamingThinking, this.setStreamingThinking] = createSignal("");
        [this.pendingPreviews, this.setPendingPreviews] = createSignal<HomebrewPreview[]>([]);
        [this.conversations, this.setConversations] = createSignal<SavedConversation[]>([]);
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
        this.turnEpoch++;   // invalidate the turn we're aborting so a late finishTurn/persist is dropped
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
        void this.persistCurrent();   // capture the chat (and its title) from turn 1
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
        // Keep the card (collapsed) so the user sees progress; it's removed once the replacement arrives.
        this.setPendingPreviews(prev => prev.map(p => p.previewId === previewId ? { ...p, repairing: true } : p));
        this.resolveToolCall(preview.toolCallId, repairInstruction(preview), true);
    };

    /** Dismiss a card that's mid-repair. UI-only: its tool call was already resolved by completePreview. */
    cancelRepair = (previewId: string) => {
        this.removePreview(previewId);
    };

    // ----------------- persisted conversations -----------------

    /** Start a fresh chat: wipe the in-memory session AND detach from the saved record so the next
     *  turn writes a new row instead of overwriting the previous conversation. */
    newConversation = () => {
        this.clear();   // calls cancel() -> bumps turnEpoch
        this.currentConversationId = null;
        this.createdAt = null;
        this.titleOverride = null;
        this.titleGenerated = false;
    };

    /** Refresh the reactive conversation list (most-recently-updated first). */
    loadConversations = async () => {
        try {
            const rows = await chatHistoryDB.conversations.orderBy("updatedAt").reverse().toArray();
            this.setConversations(rows);
        } catch (e) {
            console.error("Failed to load conversations", e);
        }
    };

    /** Rehydrate a saved conversation as the active session. Transient state is reset, not restored. */
    loadConversation = async (id: string) => {
        let rec: SavedConversation | undefined;
        try { rec = await chatHistoryDB.conversations.get(id); }
        catch (e) { console.error("Failed to load conversation", e); return; }
        if (!rec) return;
        this.cancel();
        this.outstanding.clear();
        this.resolved = [];
        this.repairCounts.clear();
        this.history = structuredClone(rec.history);
        this.setMessages(rec.messages);
        this.setPendingPreviews([]);       // previews are transient — never restored
        this.setMode(rec.mode);
        this.setStreamingText("");
        this.setStreamingThinking("");
        this.setStatus("idle");
        this.currentConversationId = rec.id;
        this.createdAt = rec.createdAt;
        this.titleOverride = rec.title;   // restore the saved (possibly AI) name
        this.titleGenerated = true;       // already named — never re-title an existing chat
    };

    deleteConversation = async (id: string) => {
        try { await chatHistoryDB.conversations.delete(id); }
        catch (e) { console.error("Failed to delete conversation", e); }
        // If we deleted the live chat, detach so the next turn doesn't recreate the deleted row.
        if (id === this.currentConversationId) this.newConversation();
        void this.loadConversations();
    };

    deleteAllConversations = async () => {
        try { await chatHistoryDB.conversations.clear(); }
        catch (e) { console.error("Failed to clear conversations", e); }
        this.newConversation();
        void this.loadConversations();
    };

    /** A short title for the active chat, derived from the first user message. */
    private deriveTitle(): string {
        const first = this.messages().find(m => m.role === "user");
        const t = first?.text.trim();
        if (!t) return "New chat";
        return t.length > 60 ? `${t.slice(0, 60)}…` : t;
    }

    /** The title to persist: the AI-generated (or restored) one once we have it, else the derived one. */
    private currentTitle(): string {
        return this.titleOverride ?? this.deriveTitle();
    }

    /**
     * Once per conversation, ask the model for a short title from the first exchange and patch it onto
     * the saved row. Fire-and-forget, runs AFTER the first reply (so it never competes with the live
     * stream on a single local model). Falls back to the derived title on any failure.
     */
    private maybeGenerateTitle() {
        if (this.titleGenerated) return;
        const id = this.currentConversationId;
        if (!id) return;   // nothing persisted yet
        const firstUser = this.messages().find(m => m.role === "user")?.text?.trim();
        if (!firstUser) return;
        this.titleGenerated = true;   // set before awaiting so a rapid second turn can't double-fire
        const firstAssistant = this.messages()
            .find(m => m.role === "assistant" && !m.text.startsWith("⚠️"))?.text?.trim();
        const epoch = this.turnEpoch;
        const [userSettings] = getUserSettings();
        const ai = userSettings().ai;
        if (!ai) return;
        void this.applyGeneratedTitle(id, epoch, ai, firstUser, firstAssistant);
    }

    private async applyGeneratedTitle(
        id: string, epoch: number, ai: AiSettings, user: string, assistant?: string,
    ) {
        const title = await generateConversationTitle(ai, { user, assistant });
        if (!title) return;   // keep the derived title that was already persisted
        try {
            // Patch only the title — never `put` a reconstructed row (the user may have switched away,
            // or kept chatting, and we'd clobber history/messages). update() on a deleted row is a no-op.
            await chatHistoryDB.conversations.update(id, { title });
        } catch (e) {
            console.error("Failed to apply generated title", e);
            return;
        }
        // If that chat is still active and nothing swapped the session, keep the in-memory title in sync
        // so later persistCurrent() calls don't re-derive over it.
        if (id === this.currentConversationId && epoch === this.turnEpoch) this.titleOverride = title;
        void this.loadConversations();
    }

    /**
     * Snapshot of `history` with a trailing UNANSWERED tool call dropped, so a reloaded chat is always
     * wire-valid (every tool_use needs a tool_result). Mid-preview previews aren't persisted, so an
     * assistant turn whose tool calls were never confirmed/rejected would otherwise desync on resume.
     */
    private balancedHistory(): AiMessage[] {
        const h = structuredClone(this.history);
        const last = h[h.length - 1];
        if (last && last.role === "assistant" && last.toolCalls?.length) {
            delete last.toolCalls;          // drop the unanswered calls (keep any text)
            if (!last.text?.trim()) h.pop(); // nothing left → drop the message entirely
        }
        return h;
    }

    /** Upsert the active conversation. Fire-and-forget; bails on empty chats; never throws into a turn. */
    private async persistCurrent(): Promise<void> {
        if (this.history.length === 0) return;
        try {
            const now = Date.now();
            if (!this.currentConversationId) this.currentConversationId = createNewId();
            if (this.createdAt == null) this.createdAt = now;
            await chatHistoryDB.conversations.put({
                id: this.currentConversationId,
                title: this.currentTitle(),
                mode: this.mode(),
                history: this.balancedHistory(),
                messages: this.messages(),
                createdAt: this.createdAt,
                updatedAt: now,
            });
            void this.loadConversations();
        } catch (e) {
            console.error("Failed to save conversation", e);
        }
    }

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
        const homebrew = this.mode() === "homebrew";
        const tools = homebrew ? HOMEBREW_TOOLS : undefined;
        const system = buildSystemPrompt(userSettings().dndSystem, this.mode());
        // Thinking is split per-mode: chat defaults on (better answers, more context use); homebrew
        // defaults off (a reasoning model can burn its budget before emitting the create_* tool call).
        const think = homebrew
            ? (ai.thinkingHomebrew ?? DEFAULT_AI_THINKING_HOMEBREW)
            : (ai.thinking ?? DEFAULT_AI_THINKING);

        this.controller = new AbortController();
        const signal = this.controller.signal;   // capture: cancel() nulls this.controller before our catch runs
        const epoch = this.turnEpoch;             // capture: a session swap mid-turn invalidates this turn
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
                // Per-mode reasoning toggle (see `think` above).
                think,
                signal,
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
                        this.finishTurn(ev.stopReason, accumulators, epoch);
                        return;
                }
            }
            // Stream ended without an explicit message_done.
            this.finishTurn(accumulators.size ? "tool_use" : "end_turn", accumulators, epoch);
        } catch (e) {
            if (signal.aborted) { return; }   // aborted (cancel/switch) — status already handled by the swap
            this.fail(`Something went wrong talking to the AI. ${String(e)}`);
        } finally {
            if (this.controller?.signal === signal) this.controller = null;   // don't null a newer turn's controller
        }
    }

    private finishTurn(stopReason: string, accumulators: Map<number, { id: string; name: string; args: string }>, epoch: number) {
        // The session was swapped (new/loaded conversation) while this turn was in flight — drop it so a
        // late message_done can't push bubbles or persist onto the now-active chat.
        if (epoch !== this.turnEpoch) return;
        const text = this.streamingText().trim();
        const thinking = this.streamingThinking().trim();
        this.setStreamingText("");
        this.setStreamingThinking("");

        // Cards collapsed by "Complete with AI": their replacement should arrive this turn. Track which
        // kinds were repairing so we can carry the repair cap onto the replacement (even if renamed) and
        // un-collapse them if no replacement comes.
        const repairing = this.pendingPreviews().filter(p => p.repairing);
        const repairingKinds = new Set(repairing.map(p => p.kind));
        const unflagRepairing = () => {
            if (repairing.length) this.setPendingPreviews(prev => prev.map(p => p.repairing ? { ...p, repairing: false } : p));
        };

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
            unflagRepairing();
            void this.persistCurrent();
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
                // If this replaces a card we were repairing (same kind), keep the repair cap so the
                // "Complete with AI" button stays suppressed even if the model renamed the entity.
                if (repairingKinds.has(p.kind)) {
                    p.repairAttempts = Math.max(p.repairAttempts ?? 0, 1);
                    this.repairCounts.set(p.title.toLowerCase(), 1);
                }
                if (truncated || parseFailed[idx]) {
                    p.truncated = true;
                    p.warnings = [...(p.warnings ?? []), "The AI's response was cut off before it finished — some fields may be missing. Use \"Complete with AI\" or regenerate."];
                }
                return p;
            });
            // Drop any collapsed "Improving…" cards — their replacement has now arrived.
            this.setPendingPreviews(prev => [...prev.filter(p => !p.repairing), ...previews]);
        } else {
            // No replacement was produced (plain text / cut off) — revert any collapsed cards so they
            // stay actionable instead of being stranded in the "Improving…" state.
            unflagRepairing();
            if (truncated) {
                this.pushAssistantBubble("⚠️ The response was cut off (the model hit its length limit). Try again, or raise the model's max output tokens.");
            }
        }
        void this.persistCurrent();
        this.maybeGenerateTitle();   // once per chat, after the first reply — never blocks the turn
        this.setStatus("idle");
    }

    private fail(message: string) {
        this.pushAssistantBubble(`⚠️ ${message}`);
        // A repair turn that errored out shouldn't leave a card stuck collapsed.
        this.setPendingPreviews(prev => prev.some(p => p.repairing) ? prev.map(p => ({ ...p, repairing: false })) : prev);
        this.setStatus("error");
        this.setStreamingText("");
    }
}

const aiAssistant = new AiAssistant();
export { aiAssistant };
export default aiAssistant;
