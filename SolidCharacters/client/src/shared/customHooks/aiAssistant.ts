import { Accessor, createSignal, Setter } from "solid-js";
import getUserSettings from "./userSettings";
import {
    AiSettings, DEFAULT_AI_MAX_TOKENS, DEFAULT_AI_NUM_CTX, DEFAULT_AI_THINKING, DEFAULT_AI_THINKING_HOMEBREW,
    DEFAULT_HIGH_MAX_SCHEMA_RETRIES, DEFAULT_MEDIUM_RETRIES, DEFAULT_USAGE_LEVEL, UsageControlLevel,
} from "../../models/userSettings";
import { AiMessage, AiToolCall, AiToolResult } from "../ai/types";
import { buildProvider } from "../ai/providerFactory";
import { HOMEBREW_TOOLS, allowedKinds, enabledUtilityTools, filterTools } from "../ai/toolSchemas";
import { HOMEBREW_KINDS } from "../ai/homebrewKind";
import { toolCategory } from "../ai/toolCategory";
import { runComputeTool } from "../ai/computeTools";
import {
    buildInteraction, interactionResultText, InteractionResponse, PendingInteraction,
} from "../ai/interactions";
import { buildPreview, HomebrewPreview, saveHomebrew } from "../ai/toolDispatcher";
import { assembleVerdicts } from "../ai/readiness/pipeline";
import { isBlocked, ReviewState, ReviewVerdict } from "../ai/readiness/types";
import { ensureReviewAgentsLoaded } from "./reviewAgentManager";
import { AiMode, buildSystemPrompt } from "../ai/systemPrompt";
import { splitModelReasoning } from "../ai/cleanReasoning";
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
export type { PendingInteraction, InteractionResponse };

/**
 * The tool_result text that asks the model to regenerate an entity. Used by the manual "Complete with
 * AI" button (no `reason` → "was incomplete") and by the Medium/High auto-retry paths, which pass an
 * explicit `reason` (the schema error, or "cut off / could not be parsed") so the model knows what to fix.
 */
function repairInstruction(p: HomebrewPreview, reason?: string): string {
    const fields = p.missingFields?.length ? p.missingFields.join(", ") : "every empty field";
    const tool = `create_${p.kind}`;
    const lead = reason
        ? `The ${p.kind.replace("_", " ")} "${p.title}" you generated could not be accepted: ${reason}.`
        : `The ${p.kind.replace("_", " ")} "${p.title}" you generated was incomplete.`;
    return `${lead} Call ${tool} again with the SAME content you already produced, but this time fill in these fields: ${fields}. In particular, write a full multi-sentence description with concrete mechanics. Do not drop any field you already filled.`;
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
    readonly pendingInteractions: Accessor<PendingInteraction[]>;
    private setPendingInteractions: Setter<PendingInteraction[]>;
    readonly conversations: Accessor<SavedConversation[]>;
    private setConversations: Setter<SavedConversation[]>;

    // ---- non-reactive turn state ----
    private history: AiMessage[] = [];
    private outstanding = new Set<string>();   // tool_call ids from the current turn awaiting confirm/reject
    private resolved: AiToolResult[] = [];      // tool_results collected so far this turn
    private controller: AbortController | null = null;
    private reviewController: AbortController | null = null;   // aborts in-flight readiness reviews (High mode)
    private repairCounts = new Map<string, number>();   // entity title (lowercased) -> AI repair attempts (capped at 1)
    private mediumRetryStreak = 0;                       // Medium-mode auto-retries fired for the current request chain
    private schemaRetryStreak = 0;                       // High-mode schema-gate regenerations for the current request chain
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
        [this.pendingInteractions, this.setPendingInteractions] = createSignal<PendingInteraction[]>([]);
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
        this.mediumRetryStreak = 0;
        this.schemaRetryStreak = 0;
        this.setMessages([]);
        this.setPendingPreviews([]);
        this.setPendingInteractions([]);
        this.setStreamingText("");
        this.setStreamingThinking("");
        this.setStatus("idle");
    };

    cancel = () => {
        this.turnEpoch++;   // invalidate the turn we're aborting so a late finishTurn/persist is dropped
        this.controller?.abort();
        this.controller = null;
        this.reviewController?.abort();   // stop any in-flight readiness reviews tied to this turn
        this.reviewController = null;
        // Preserve any partial text/thinking as a bubble so it isn't lost (splitting out leaked reasoning).
        const split = splitModelReasoning(this.streamingText());
        const partial = split.text;
        const thinking = [this.streamingThinking().trim(), split.reasoning].filter(Boolean).join("\n\n").trim();
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
        this.mediumRetryStreak = 0;   // a new request starts a fresh auto-retry budget
        this.schemaRetryStreak = 0;
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
     * Resolve an interactive card (ask_user / propose_plan) with the user's response. Reuses the same
     * tool_result channel as confirm/reject so the message history stays valid, then continues the turn.
     * Idempotent: a card already answered (or removed) is ignored.
     */
    answerInteraction = (interactionId: string, response: InteractionResponse) => {
        const it = this.pendingInteractions().find(i => i.interactionId === interactionId);
        if (!it || it.answered) return;
        this.removeInteraction(interactionId);
        // Only a plan rejection is an "error" result; every other answer is normal guidance to continue on.
        this.resolveToolCall(it.toolCallId, interactionResultText(it, response), response.type === "plan_reject");
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
        // For a hard-failed preview (e.g. missing description) feed the errors back so the model knows what to fix.
        const reason = preview.valid ? undefined : preview.errors.join(" ");
        this.resolveToolCall(preview.toolCallId, repairInstruction(preview, reason), true);
    };

    /** Dismiss a card that's mid-repair. UI-only: its tool call was already resolved by completePreview. */
    cancelRepair = (previewId: string) => {
        this.removePreview(previewId);
    };

    /**
     * Regenerate an entity the readiness pipeline couldn't get past schema validation ("needs direction").
     * User-initiated, so it grants a fresh schema-retry budget; reuses the repair channel + collapse UI.
     */
    regeneratePreview = (previewId: string) => {
        if (this.status() === "streaming") return;
        const preview = this.pendingPreviews().find(p => p.previewId === previewId);
        if (!preview) return;
        this.schemaRetryStreak = 0;
        this.setPendingPreviews(prev => prev.map(p => p.previewId === previewId ? { ...p, repairing: true } : p));
        const reason = preview.errors.length ? preview.errors.join(" ") : "the data could not be parsed or was cut off";
        this.resolveToolCall(preview.toolCallId, repairInstruction(preview, reason), true);
    };

    /**
     * Ask the model to fix the issues a readiness review found, feeding back each finding (and any
     * suggested fix). Reuses the repair channel + collapse UI; the regenerated entity is re-reviewed.
     */
    applyReviewFixes = (previewId: string) => {
        if (this.status() === "streaming") return;
        const preview = this.pendingPreviews().find(p => p.previewId === previewId);
        if (!preview) return;
        const notes = (preview.verdicts ?? [])
            .flatMap(v => v.issues)
            .map(i => i.suggestedFix ? `${i.message} (${i.suggestedFix})` : i.message);
        if (!notes.length) return;
        this.setPendingPreviews(prev => prev.map(p => p.previewId === previewId ? { ...p, repairing: true } : p));
        const tool = `create_${preview.kind}`;
        const instruction = `A reviewer flagged problems with the ${preview.kind.replace("_", " ")} "${preview.title}". Call ${tool} again with the SAME content, fixing each of these:\n- ${notes.join("\n- ")}\nKeep everything that was already correct, and use concrete rules text.`;
        this.resolveToolCall(preview.toolCallId, instruction, true);
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
        this.mediumRetryStreak = 0;
        this.schemaRetryStreak = 0;
        this.history = structuredClone(rec.history);
        this.setMessages(rec.messages);
        this.setPendingPreviews([]);       // previews are transient — never restored
        this.setPendingInteractions([]);   // interactions are transient too
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
    private removeInteraction(interactionId: string) {
        this.setPendingInteractions(prev => prev.filter(i => i.interactionId !== interactionId));
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
        this.setPendingInteractions([]);
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
        // Tool permissions (Phase 0): allow/deny which create_* tools the model may use.
        const allowed = homebrew ? allowedKinds(ai.toolPermissions) : undefined;
        // Homebrew create_* tools: only in homebrew mode, gated by permissions (a fully-denied set yields []).
        const homebrewTools = homebrew && allowed && allowed.length ? filterTools(HOMEBREW_TOOLS, ai.toolPermissions) : [];
        // Utility tools (math/ask/plan) are offered in BOTH modes, gated by their own enable flags.
        const utilityTools = enabledUtilityTools(ai);
        // Never send an EMPTY tools array — omit entirely when nothing is offered (keeps chat-like turns clean).
        const combined = [...homebrewTools, ...utilityTools];
        const tools = combined.length ? combined : undefined;
        // Soft gate: include the advisory note only when the permitted set is actually narrower than "all".
        const noteKinds = homebrew && allowed && allowed.length < HOMEBREW_KINDS.length ? allowed : undefined;
        // Advertise only the utility tools actually sent, so the prompt doesn't mention disabled ones.
        const utilityFlags = {
            math: utilityTools.some(t => t.name.startsWith("calc_")),
            ask: utilityTools.some(t => t.name === "ask_user"),
            plan: utilityTools.some(t => t.name === "propose_plan"),
        };
        const system = buildSystemPrompt(userSettings().dndSystem, this.mode(), "large", noteKinds, utilityFlags);
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
        // Some local models leak their reasoning into the content stream (with channel markers) rather
        // than the structured thinking field — split it out so the bubble shows only the answer.
        const split = splitModelReasoning(this.streamingText());
        const text = split.text;
        const thinking = [this.streamingThinking().trim(), split.reasoning].filter(Boolean).join("\n\n").trim();
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
            // Every tool_use needs a tool_result, regardless of category — seed `outstanding` with ALL ids
            // up front so a mixed-category turn only continues once the LAST call (compute or user) resolves.
            this.outstanding = new Set(toolCalls.map(t => t.id));
            this.resolved = [];
            const [userSettings] = getUserSettings();
            const ai = userSettings().ai;
            const dndSystem = userSettings().dndSystem;

            // Partition by execution path. Compute auto-resolves (no UI); interactive renders a card and
            // waits for the user; homebrew goes through the existing preview + usage-level routing. Homebrew
            // keeps its original index so parseFailed[idx] (built over the full toolCalls list) stays aligned.
            const computeCalls: AiToolCall[] = [];
            const interactiveCalls: AiToolCall[] = [];
            const homebrewCalls: { tc: AiToolCall; idx: number }[] = [];
            toolCalls.forEach((tc, idx) => {
                switch (toolCategory(tc.name)) {
                    case "compute": computeCalls.push(tc); break;
                    case "interactive": interactiveCalls.push(tc); break;
                    default: homebrewCalls.push({ tc, idx }); break;
                }
            });

            // ---- Interactive: render cards now; their tool calls stay outstanding until the user answers. ----
            if (interactiveCalls.length) {
                this.setPendingInteractions(prev => [...prev, ...interactiveCalls.map(buildInteraction)]);
            }

            // ---- Compute: run deterministically and resolve immediately. In a mixed turn the interactive/
            //      homebrew ids keep `outstanding` non-empty so this only buffers results; in a pure-compute
            //      turn the final resolve empties `outstanding` and kicks off the continuation turn itself. ----
            for (const tc of computeCalls) {
                const r = runComputeTool(tc);
                this.resolveToolCall(tc.id, r.content, r.isError);
            }

            // ---- Homebrew: the existing preview build + Low/Medium/High routing, over the homebrew subset. ----
            if (homebrewCalls.length) {
                const previews = homebrewCalls.map(({ tc, idx }) => {
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

                const level = ai?.usageLevel ?? DEFAULT_USAGE_LEVEL;
                // parseFailed is folded into p.truncated above, so this needs only the preview. A missing
                // description is a hard validation error (see buildPreview), so it counts as failed here too.
                const failed = (p: HomebrewPreview) => !p.valid || !!p.truncated;
                const fixReason = (p: HomebrewPreview) =>
                    !p.valid ? p.errors.join(" ") : "the response was cut off or its data could not be parsed";

                // ---- Medium: silently regenerate entities that failed validation (up to the per-request
                //      budget) before surfacing them. Valid entities in the same turn are shown right away. ----
                const mediumBudget = ai?.mediumRetries ?? DEFAULT_MEDIUM_RETRIES;
                if (level === "medium" && mediumBudget > 0 && this.mediumRetryStreak < mediumBudget
                    && previews.some(failed)) {
                    this.mediumRetryStreak++;
                    const retry = previews.filter(failed);
                    const show = previews.filter(p => !failed(p));
                    // Show the good ones (dropping any collapsed "Improving…" cards); their tool calls stay outstanding.
                    this.setPendingPreviews(prev => [...prev.filter(p => !p.repairing), ...show]);
                    void this.persistCurrent();
                    this.maybeGenerateTitle();
                    // If anything remains for the user, the turn is idle now. If everything is being retried,
                    // resolving the last call below starts a fresh turn, which sets its own streaming status.
                    if (show.length) this.setStatus("idle");
                    for (const p of retry) this.resolveToolCall(p.toolCallId, repairInstruction(p, fixReason(p)), true);
                    return;
                }
                this.mediumRetryStreak = 0;   // surfacing results — reset the budget for the next request

                // ---- High: gate on schema before handoff. Regenerate schema-failed entities (up to the
                //      retry cap, then ask the user); surface valid ones in a "reviewing" state and run the
                //      readiness pipeline over them. The pipeline patches each card as passes complete. ----
                if (level === "high") {
                    const maxSchemaRetries = ai?.review?.maxSchemaRetries ?? DEFAULT_HIGH_MAX_SCHEMA_RETRIES;
                    const schemaFailed = previews.filter(failed);
                    const schemaOk = previews.filter(p => !failed(p));

                    if (schemaFailed.length && this.schemaRetryStreak < maxSchemaRetries) {
                        this.schemaRetryStreak++;
                        const reviewing = schemaOk.map(p => ({ ...p, reviewState: "reviewing" as ReviewState }));
                        this.setPendingPreviews(prev => [...prev.filter(p => !p.repairing), ...reviewing]);
                        void this.persistCurrent();
                        this.maybeGenerateTitle();
                        // If valid cards remain for the user, the turn is idle now; otherwise resolving the last
                        // failed call below starts a fresh turn (which manages its own streaming status).
                        if (reviewing.length) this.setStatus("idle");
                        void this.runReadiness(reviewing.map(p => p.previewId), epoch);
                        for (const p of schemaFailed) {
                            const reason = p.errors.length ? p.errors.join(" ") : "the response was cut off or its data could not be parsed";
                            this.resolveToolCall(p.toolCallId, repairInstruction(p, reason), true);
                        }
                        return;
                    }

                    // Retry budget spent (or nothing failed): the still-broken ones need the user's direction;
                    // the valid ones go through the readiness pipeline. The fix budget (schemaRetryStreak) is
                    // NOT reset here — it's shared with the review auto-fix loop and resets on the next request.
                    const needDirection = schemaFailed.map(p => ({ ...p, reviewState: "needs_user_direction" as ReviewState }));
                    const reviewing = schemaOk.map(p => ({ ...p, reviewState: "reviewing" as ReviewState }));
                    this.setPendingPreviews(prev => [...prev.filter(p => !p.repairing), ...needDirection, ...reviewing]);
                    void this.persistCurrent();
                    this.maybeGenerateTitle();
                    this.setStatus("idle");
                    void this.runReadiness(reviewing.map(p => p.previewId), epoch);
                    return;
                }

                // Low: drop any collapsed "Improving…" cards — their replacement has now arrived.
                this.setPendingPreviews(prev => [...prev.filter(p => !p.repairing), ...previews]);
            } else {
                // No homebrew replacement arrived this turn — revert any collapsed "Improving…" cards so they
                // stay actionable instead of being stranded (a repair turn always regenerates via create_*).
                unflagRepairing();
            }

            // A pure-compute turn already resolved every call and started the continuation turn (which owns
            // the streaming status); bail so we don't flip it back to idle. Otherwise interactive/homebrew
            // cards (or buffered compute results) are waiting on the user — settle to idle and persist below.
            if (this.outstanding.size === 0) return;
        } else {
            // No replacement was produced (plain text / cut off) — revert any collapsed cards so they
            // stay actionable instead of being stranded in the "Improving…" state.
            unflagRepairing();
            this.mediumRetryStreak = 0;
            if (truncated) {
                this.pushAssistantBubble("⚠️ The response was cut off (the model hit its length limit). Try again, or raise the model's max output tokens.");
            }
        }
        void this.persistCurrent();
        this.maybeGenerateTitle();   // once per chat, after the first reply — never blocks the turn
        this.setStatus("idle");
    }

    /**
     * High-mode readiness pipeline (post-turn). Reviews the given (schema-valid) previews SEQUENTIALLY —
     * never in parallel, so a single local model isn't hammered — patching each card from "reviewing" to
     * "passed"/"issues" as its passes complete. Aborts cleanly on session swap (epoch) or cancel
     * (reviewController). Fails open: a thrown pass leaves the card savable rather than stranded.
     */
    private async runReadiness(previewIds: string[], epoch: number) {
        if (!previewIds.length) return;
        const [userSettings] = getUserSettings();
        const ai = userSettings().ai;
        if (!ai) return;
        const dndSystem = userSettings().dndSystem;
        const blockingSeverity = ai.review?.blockingSeverity ?? "error";
        await ensureReviewAgentsLoaded();   // custom review agents are part of the pipeline

        if (epoch !== this.turnEpoch) return;   // a session swap may have happened while loading

        this.reviewController = new AbortController();
        const signal = this.reviewController.signal;
        try {
            for (const id of previewIds) {
                if (epoch !== this.turnEpoch || signal.aborted) return;
                const preview = this.pendingPreviews().find(p => p.previewId === id);
                if (!preview || preview.reviewState !== "reviewing") continue;   // confirmed/rejected/swapped

                let verdicts: ReviewVerdict[];
                try { verdicts = await assembleVerdicts(preview, { ai, dndSystem, signal }); }
                catch (e) { console.error("Readiness pipeline failed", e); verdicts = []; }

                if (epoch !== this.turnEpoch || signal.aborted) return;
                const blocked = isBlocked(verdicts, blockingSeverity);
                const maxFixes = ai.review?.maxSchemaRetries ?? DEFAULT_HIGH_MAX_SCHEMA_RETRIES;
                // Resolving this preview regenerates it only when it's the sole outstanding tool call (the
                // common single-entity turn); otherwise a repair would stall behind the other cards, so we
                // fall through and surface the findings for the user to act on with "Improve with AI".
                const canRegenerateNow = this.outstanding.size === 1 && this.outstanding.has(preview.toolCallId);

                // ---- Auto-fix loop: on a BLOCKING review finding, feed the issues back and regenerate
                //      (shared High fix budget). Only after the budget do we surface for the user. ----
                if (blocked && canRegenerateNow && this.schemaRetryStreak < maxFixes) {
                    this.schemaRetryStreak++;
                    const notes = verdicts.flatMap(v => v.issues).map(i => i.suggestedFix ? `${i.message} (${i.suggestedFix})` : i.message);
                    this.setPendingPreviews(prev => prev.map(p => p.previewId === id ? { ...p, repairing: true } : p));
                    const tool = `create_${preview.kind}`;
                    const instruction = notes.length
                        ? `A reviewer found problems with the ${preview.kind.replace("_", " ")} "${preview.title}". Call ${tool} again with the SAME content, fixing each of these:\n- ${notes.join("\n- ")}\nKeep everything that was already correct, and use concrete rules text.`
                        : repairInstruction(preview);
                    this.resolveToolCall(preview.toolCallId, instruction, true);   // → regenerates → re-reviews via a fresh turn
                    return;   // the regeneration turn re-runs the pipeline; stop this pass
                }

                const state: ReviewState = verdicts.some(v => !v.pass) ? "issues" : "passed";
                this.setPendingPreviews(prev => prev.map(p =>
                    p.previewId === id ? { ...p, reviewState: state, verdicts, reviewBlocked: blocked } : p));
            }
        } finally {
            if (this.reviewController?.signal === signal) this.reviewController = null;
        }
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
