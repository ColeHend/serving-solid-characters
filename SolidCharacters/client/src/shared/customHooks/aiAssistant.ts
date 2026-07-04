import { Accessor, createSignal, Setter } from "solid-js";
import { addSnackbar } from "coles-solid-library";
import getUserSettings from "./userSettings";
import {
    AiSettings, DEFAULT_AI_AUTO_SWITCH, DEFAULT_AI_COMMAND_GENERATION, DEFAULT_AI_LOOKUP_TOOLS,
    DEFAULT_AI_MAX_TOKENS, DEFAULT_AI_NUM_CTX, DEFAULT_AI_PERSONA_STRENGTH, DEFAULT_AI_RESUME_GENERATION,
    DEFAULT_AI_THINKING, DEFAULT_AI_THINKING_HOMEBREW, DEFAULT_CREATION_PIPELINE_LEVEL,
    DEFAULT_HIGH_MAX_SCHEMA_RETRIES, DEFAULT_MEDIUM_RETRIES, DEFAULT_USAGE_LEVEL, UsageControlLevel,
} from "../../models/userSettings";
import { AiAudio, AiImage, AiMessage, AiToolCall, AiToolDef, AiToolResult } from "../ai/types";
import { buildProvider } from "../ai/providers/providerFactory";
import { HOMEBREW_TOOLS, allowedKinds, enabledUtilityTools, filterPipelineTools, filterTools, requiredFieldsForKind } from "../ai/tools/toolSchemas";
import { HOMEBREW_KINDS, HomebrewKind, KIND_TO_TOOL, kindLabel, kindLabelLower, TOOL_TO_KIND } from "../ai/refs/homebrewKind";
import { ensureRaceCatalog } from "../ai/refs/raceRefs";
import { toolCategory } from "../ai/tools/toolCategory";
import { runComputeTool } from "../ai/tools/computeTools";
import { LOOKUP_TOOLS, runLookupTool } from "../ai/tools/lookupTools";
import { EDIT_TOOLS } from "../ai/tools/editTools";
import { CONTROL_TOOLS, parseSwitchMode } from "../ai/tools/controlTools";
import { DELEGATE_RESEARCH_TOOL, researchAgentSpec, runSubAgent } from "../ai/subAgent";
import { attachCommandsWithStats, gapFillCommands, hasFeatures } from "../ai/commands/commandAgent";
import {
    buildInteraction, interactionResultText, InteractionResponse, PendingInteraction,
} from "../ai/tools/interactions";
import { buildEditPreview, buildPreview, HomebrewPreview, saveHomebrew } from "../ai/tools/toolDispatcher";
import { logDecision } from "./decisionLogManager";
import { DebugConsole } from "./DebugConsole";
import { assembleVerdicts } from "../ai/readiness/pipeline";
import { isBlocked, ReviewState, ReviewVerdict } from "../ai/readiness/types";
import { ensureReviewAgentsLoaded } from "./reviewAgentManager";
import { runClassPipeline, CLASS_PIPELINE_PHASES } from "../ai/genPipeline/classPipeline";
import { runCharacterPipeline, CHARACTER_PIPELINE_PHASES } from "../ai/genPipeline/characterPipeline";
import { runHomebrewPipeline, supportsHomebrewPipeline, HOMEBREW_PIPELINE_PHASES } from "../ai/genPipeline/homebrewPipeline";
import { runMechanicsReview } from "../ai/genPipeline/mechanicsStep";
import { featuresMissingMads } from "../ai/commands/validateMads";
import { buildCharacterReviewer, buildClassReviewer } from "../ai/genPipeline/critic";
import type { CharacterPipelineHost, HomebrewPipelineHost, PipelineHost, RatifyDecision } from "../ai/genPipeline/orchestrator";
import { skeletonSummaryLines, type SkeletonPlan } from "../ai/genPipeline/skeleton";
import { PipelinePhase } from "../ai/genPipeline/types";
import type { ConceptBrief, PipelineCheckpoint, PipelineResume, PipelineRun, PipelineType, WorkingCharacter, WorkingClass, WorkingEntity } from "../ai/genPipeline/types";
import { pipelineCheckpointManager } from "../ai/genPipeline/checkpoint/pipelineCheckpointManager";
import characterManager from "./dndInfo/useCharacters";
import type { Character } from "../../models/character.model";
import { AiMode, buildSystemPrompt, personaFor } from "../ai/prompt/systemPrompt";
import { splitModelReasoning } from "../ai/prompt/cleanReasoning";
import { generateConversationTitle } from "../ai/prompt/generateTitle";
import { createNewId } from "./utility/tools/idGen";
import chatHistoryDB, { SavedConversation } from "./utility/localDB/chatHistoryDB";

export type { SavedConversation };

export type ChatRole = "user" | "assistant";
export type ChatStatus = "idle" | "streaming" | "error";

/**
 * What Grimoire is currently doing, so the sidebar's status ticker can show phase-appropriate flavor
 * (e.g. "Scouring the tomes" during a lookup). Display-only; "idle" means no turn is in flight.
 */
export type AiPhase = "thinking" | "lookup" | "research" | "compute" | "homebrew" | "editing" | "idle";

/** A rendered chat bubble. Tool calls/results live in the underlying AiMessage history, not here. */
export interface ChatMessage {
    id: string;
    role: ChatRole;
    text: string;
    /**
     * "answer" (default) is genuine model content; "system" is an app-emitted notice (error/refusal/
     * cut-off/warning). Tracked as a field so decision-log/title logic can skip system notices WITHOUT
     * sniffing a "⚠️" prefix (which would break if the model legitimately starts a reply with that emoji).
     */
    kind?: "answer" | "system";
    /** The model's reasoning for this turn (display-only; not replayed to the model). */
    thinking?: string;
    /** For a user bubble: images attached to this prompt, rendered as thumbnails. Mirrors the AiMessage. */
    images?: AiImage[];
    /** For a user bubble: audio clips attached to this prompt, rendered as inline players. Mirrors the AiMessage. */
    audio?: AiAudio[];
    /**
     * For a user bubble: the index in `history` of the matching {role:"user"} entry, captured when the
     * turn was sent. Used by editAndRewind() to slice history/messages back to this prompt. Persisted with
     * the conversation so rewind works after a reload; pre-feature chats lack it (Nth-user fallback covers them).
     */
    historyIndex?: number;
}

export type { HomebrewPreview };
export type { PendingInteraction, InteractionResponse };
export type { PipelineRun };

/**
 * Bound on the Medium+ per-feature MADS turns per entity (each is one cheap focused sub-agent call).
 * Features past the cap are logged by gapFillCommands and land in `inertFeatures`, where the card's
 * "Generate commands" repair can pick them up.
 */
const PER_FEATURE_MADS_CAP = 12;

/**
 * The tool_result text that asks the model to regenerate an entity. Used by the manual "Complete with
 * AI" button (no `reason` → "was incomplete") and by the Medium/High auto-retry paths, which pass an
 * explicit `reason` (the schema error, or "cut off / could not be parsed") so the model knows what to fix.
 */
function repairInstruction(p: HomebrewPreview, reason?: string): string {
    // Prefer the concrete missing fields; otherwise fall back to the kind's required fields (more
    // actionable than a vague "every empty field" when the entity validated but the turn was truncated).
    const missing = p.missingFields?.length ? p.missingFields : requiredFieldsForKind(p.kind);
    const fields = missing.length ? missing.join(", ") : "every field you left empty";
    const tool = KIND_TO_TOOL[p.kind];
    const lead = reason
        ? `The ${p.kind.replace("_", " ")} "${p.title}" you generated could not be accepted: ${reason}.`
        : `The ${p.kind.replace("_", " ")} "${p.title}" you generated was incomplete.`;
    // Only ask for a fuller description when the description is actually among the missing fields.
    const descNudge = missing.some(f => f.toLowerCase().includes("desc"))
        ? " Write a full multi-sentence description with concrete mechanics."
        : "";
    return `${lead} Call ${tool} again with the SAME content you already produced, but this time fill in these fields: ${fields}.${descNudge} Do not drop any field you already filled. Emit only the tool call — no preamble.`;
}

/** Translate an InteractionCard (propose_plan) response into the orchestrator's ratification verdict. */
function toRatifyDecision(response: InteractionResponse): RatifyDecision {
    switch (response.type) {
        case "plan_accept": return { type: "approve" };
        case "plan_refine": return { type: "refine", text: response.text };
        case "plan_reject":
        case "dismiss":
        default: return { type: "reject" };   // any non-approval is treated as "stop and rethink"
    }
}

/** Map a raw provider/network error to a short, actionable message instead of dumping `String(e)`. */
function friendlyError(e: unknown): string {
    const msg = String((e as Error)?.message ?? e);
    if (/failed to fetch|networkerror|load failed|err_connection|fetch failed/i.test(msg))
        return "Couldn't reach the AI server. Check that it's running and the endpoint in AI settings is correct.";
    if (/\b401\b|\b403\b|unauthor|forbidden|api key/i.test(msg))
        return "The AI server rejected the request — check your API key in AI settings.";
    if (/\b404\b|not found|no such model|unknown model/i.test(msg))
        return "The AI model or endpoint wasn't found — check the model name and endpoint in AI settings.";
    return `Something went wrong talking to the AI. ${msg}`;
}

/**
 * Singleton AI session store (mirrors homebrewManager). Read by both the navbar and the sidebar
 * without prop-drilling or context. Holds the visible chat, the provider-facing message history,
 * streaming status, and pending homebrew previews awaiting confirmation.
 */
export class AiAssistant {
    // ---- reactive UI state ----
    readonly isOpen: Accessor<boolean>;
    private setIsOpen: Setter<boolean>;
    readonly mode: Accessor<AiMode>;
    private setMode_: Setter<AiMode>;
    readonly messages: Accessor<ChatMessage[]>;
    private setMessages: Setter<ChatMessage[]>;
    readonly status: Accessor<ChatStatus>;
    private setStatus: Setter<ChatStatus>;
    readonly activePhase: Accessor<AiPhase>;
    private setActivePhase: Setter<AiPhase>;
    readonly streamingText: Accessor<string>;
    private setStreamingText: Setter<string>;
    readonly streamingThinking: Accessor<string>;
    private setStreamingThinking: Setter<string>;
    readonly pendingPreviews: Accessor<HomebrewPreview[]>;
    private setPendingPreviews: Setter<HomebrewPreview[]>;
    readonly pendingInteractions: Accessor<PendingInteraction[]>;
    private setPendingInteractions: Setter<PendingInteraction[]>;
    /** The in-flight staged-generation run (null when no pipeline is active). Drives the GenPipelineCard. */
    readonly pipelineRun: Accessor<PipelineRun | null>;
    private setPipelineRun: Setter<PipelineRun | null>;
    /** An interrupted pipeline checkpoint for the loaded conversation, offered for resume (null when none). */
    readonly resumableCheckpoint: Accessor<PipelineCheckpoint | null>;
    private setResumableCheckpoint: Setter<PipelineCheckpoint | null>;
    readonly conversations: Accessor<SavedConversation[]>;
    private setConversations: Setter<SavedConversation[]>;
    // ---- composer (draft) state — held in the store, not in ChatInput, so it survives the sidebar
    // Portal unmounting/remounting (e.g. a mobile camera pick that flicker-closes the panel). ----
    readonly draft: Accessor<string>;
    readonly setDraft: Setter<string>;
    readonly pendingImages: Accessor<AiImage[]>;
    readonly setPendingImages: Setter<AiImage[]>;
    readonly pendingAudio: Accessor<AiAudio[]>;
    readonly setPendingAudio: Setter<AiAudio[]>;
    /** True while the native file/camera picker is open; suppresses the scrim/Escape dismiss. */
    readonly filePicking: Accessor<boolean>;
    private setFilePicking: Setter<boolean>;
    /** Data URL of the image shown full-screen in the lightbox, or null when closed. */
    readonly lightboxImage: Accessor<string | null>;
    private setLightboxImage: Setter<string | null>;

    // ---- non-reactive turn state ----
    private history: AiMessage[] = [];
    private outstanding = new Set<string>();   // tool_call ids from the current turn awaiting confirm/reject
    private resolved: AiToolResult[] = [];      // tool_results collected so far this turn
    private controller: AbortController | null = null;
    private reviewController: AbortController | null = null;   // aborts in-flight readiness reviews (High mode)
    private delegateController: AbortController | null = null; // aborts an in-flight research sub-agent
    private commandController: AbortController | null = null;  // aborts in-flight command enrichment
    private pipelineController: AbortController | null = null; // aborts an in-flight staged-generation run
    private pipelineRatify = new Map<string, (decision: RatifyDecision) => void>();   // ratify interactionId -> resolver
    private pipelineCheckpointId: string | null = null;        // id of the current run's checkpoint row, for upsert/discard
    private currentPipelineType: PipelineType = "class";       // which pipeline the active run drives (for checkpoint rows)
    private currentPipelineSeed = "";                          // the active/last run's generation seed (for checkpoints + restart)
    // Latest successful-phase snapshot, kept in memory regardless of conversationId so Retry can resume the
    // FAILED step even in an unsaved chat (where savePipelineCheckpoint writes no Dexie row). Cloned on write.
    private lastCheckpointSnapshot: { phaseIndex: number; working: WorkingEntity; brief?: ConceptBrief } | null = null;
    private repairCounts = new Map<string, number>();   // entity title (lowercased) -> AI repair attempts (capped at 1)
    private narratedDrafts = new Set<string>();          // toolCallIds whose drafted entity was already announced in chat
    private mediumRetryStreak = 0;                       // Medium-mode auto-retries fired for the current request chain
    private schemaRetryStreak = 0;                       // High-mode SCHEMA-gate regenerations (pre-handoff) for this request
    private reviewFixStreak = 0;                         // High-mode READINESS auto-fix regenerations (post-review) for this request
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
        [this.activePhase, this.setActivePhase] = createSignal<AiPhase>("idle");
        [this.streamingText, this.setStreamingText] = createSignal("");
        [this.streamingThinking, this.setStreamingThinking] = createSignal("");
        [this.pendingPreviews, this.setPendingPreviews] = createSignal<HomebrewPreview[]>([]);
        [this.pendingInteractions, this.setPendingInteractions] = createSignal<PendingInteraction[]>([]);
        [this.pipelineRun, this.setPipelineRun] = createSignal<PipelineRun | null>(null);
        [this.resumableCheckpoint, this.setResumableCheckpoint] = createSignal<PipelineCheckpoint | null>(null);
        [this.conversations, this.setConversations] = createSignal<SavedConversation[]>([]);
        [this.draft, this.setDraft] = createSignal("");
        [this.pendingImages, this.setPendingImages] = createSignal<AiImage[]>([]);
        [this.pendingAudio, this.setPendingAudio] = createSignal<AiAudio[]>([]);
        [this.filePicking, this.setFilePicking] = createSignal(false);
        [this.lightboxImage, this.setLightboxImage] = createSignal<string | null>(null);

        // Best-effort flush of the current conversation when the tab is hidden/closed — the per-turn
        // persists are fire-and-forget, so a quick close between a reply landing and Dexie committing
        // could otherwise lose the last turn / generated title. put() by id is idempotent.
        if (typeof document !== "undefined") {
            const flush = () => { if (document.visibilityState === "hidden") void this.persistCurrent(); };
            document.addEventListener("visibilitychange", flush);
            window.addEventListener("pagehide", () => void this.persistCurrent());
        }
    }

    /** Serializes conversation-row writes so a full put() can't interleave with a title update(). */
    private writeChain: Promise<unknown> = Promise.resolve();
    private enqueueWrite(task: () => Promise<void>): Promise<void> {
        const next = this.writeChain.then(task, task);
        this.writeChain = next.catch(() => {});
        return next;
    }

    open = () => this.setIsOpen(true);
    close = () => this.setIsOpen(false);
    toggle = () => this.setIsOpen(v => !v);
    setMode = (m: AiMode) => this.setMode_(m);

    /** Clear the composer (sent or discarded). Called centrally from send(). */
    clearDraft = () => { this.setDraft(""); this.setPendingImages([]); this.setPendingAudio([]); };

    /**
     * Mark that the native file/camera picker is opening, so a tap that lands on the scrim when the page
     * regains focus (the iOS "phantom click") can't dismiss the sidebar. Cleared a beat after the window
     * refocuses (returning from the picker), with a grace delay to absorb that stray click.
     */
    beginFilePick = () => {
        this.setFilePicking(true);
        if (typeof window === "undefined") return;
        const onFocus = () => {
            window.removeEventListener("focus", onFocus);
            setTimeout(() => this.setFilePicking(false), 350);
        };
        window.addEventListener("focus", onFocus);
    };
    endFilePick = () => this.setFilePicking(false);

    openLightbox = (src: string) => this.setLightboxImage(src);
    closeLightbox = () => this.setLightboxImage(null);

    clear = () => {
        this.cancel();
        this.resetTurnState();
        this.history = [];
        this.setMessages([]);
    };

    /**
     * Reset all in-flight TURN state — outstanding tool calls, repair/retry budgets, pending cards,
     * streaming buffers, status. Does NOT touch the conversation's messages/history/mode. Call cancel()
     * first to abort any live controllers. Shared by clear(), loadConversation(), and editAndRewind().
     */
    private resetTurnState() {
        this.outstanding.clear();
        this.resolved = [];
        this.teardownPipeline();
        this.pipelineCheckpointId = null;
        this.setResumableCheckpoint(null);   // drop any "Resume generation" offer from a prior load
        this.repairCounts.clear();
        this.narratedDrafts.clear();
        this.mediumRetryStreak = 0;
        this.schemaRetryStreak = 0;
        this.reviewFixStreak = 0;
        this.setPendingPreviews([]);
        this.setPendingInteractions([]);
        this.setStreamingText("");
        this.setStreamingThinking("");
        this.setStatus("idle");
        this.setActivePhase("idle");
    }

    cancel = () => {
        this.turnEpoch++;   // invalidate the turn we're aborting so a late finishTurn/persist is dropped
        this.controller?.abort();
        this.controller = null;
        this.reviewController?.abort();   // stop any in-flight readiness reviews tied to this turn
        this.reviewController = null;
        this.delegateController?.abort(); // stop any in-flight research sub-agent
        this.delegateController = null;
        this.commandController?.abort();  // stop any in-flight command enrichment
        this.commandController = null;
        this.teardownPipeline();          // stop any in-flight staged-generation run + settle its ratify gate
        // Preserve any partial text/thinking as a bubble so it isn't lost (splitting out leaked reasoning).
        const split = splitModelReasoning(this.streamingText());
        const partial = split.text;
        const thinking = [this.streamingThinking().trim(), split.reasoning].filter(Boolean).join("\n\n").trim();
        if (partial.trim() || thinking) this.pushAssistantBubble(partial, thinking);
        this.setStreamingText("");
        this.setStreamingThinking("");
        if (this.status() === "streaming") this.setStatus("idle");
        this.setActivePhase("idle");
    };

    send = (text: string, images?: AiImage[], audio?: AiAudio[]) => {
        const trimmed = text.trim();
        // An attachment-only message (no prose) is valid; only bail when there's no text, image, nor audio.
        if ((!trimmed && !images?.length && !audio?.length) || this.status() === "streaming") return;
        // If the previous turn left tool calls unanswered (previews never confirmed/rejected), close
        // them out so the history stays valid (Anthropic requires every tool_use to get a tool_result).
        this.flushOutstanding();
        this.mediumRetryStreak = 0;   // a new request starts a fresh auto-retry budget
        this.schemaRetryStreak = 0;
        this.reviewFixStreak = 0;
        this.repairCounts.clear();    // don't let a prior entity's repair cap suppress a new same-named one
        // Stamp the bubble with the history index its {role:"user"} entry is about to occupy, so
        // editAndRewind() can slice both arrays back to exactly this prompt. flushOutstanding() already ran.
        const historyIndex = this.history.length;
        this.pushUserBubble(trimmed, historyIndex, images, audio);
        this.history.push({ role: "user", text: trimmed, images, audio });
        void this.persistCurrent();   // capture the chat (and its title) from turn 1
        void this.runTurn();
    };

    /**
     * Retry after a failed turn: an error never records an assistant turn (finishTurn isn't reached), so
     * history still ends at the user/tool message — drop the trailing system error bubble(s) and re-run.
     */
    /**
     * Stop an in-flight readiness review and let the user act on the cards as-is. Marks every still-
     * "reviewing" card "review_unavailable" so none is stranded with Save permanently disabled (the
     * aborted pipeline loop won't reach its terminal patch for them).
     */
    cancelReview = () => {
        this.reviewController?.abort();
        this.reviewController = null;
        this.setPendingPreviews(prev => prev.map(p =>
            p.reviewState === "reviewing" ? { ...p, reviewState: "review_unavailable" as ReviewState } : p));
    };

    retryLast = () => {
        if (this.status() !== "error" || this.history.length === 0) return;
        this.setMessages(prev => {
            const out = [...prev];
            while (out.length && out[out.length - 1].kind === "system") out.pop();
            return out;
        });
        void this.runTurn();
    };

    /**
     * Edit an earlier USER prompt and rewind the conversation to it: discard every message/turn after it
     * and re-run from the edited text (ChatGPT/Claude-style). Side effects from the discarded turns are NOT
     * undone — homebrew already saved to the collection stays saved (the UI confirm says so). Bails while a
     * turn is streaming. Anything already saved earlier in the chat is untouched.
     */
    editAndRewind = (messageId: string, newText: string) => {
        const trimmed = newText.trim();
        if (!trimmed || this.status() === "streaming") return;
        const msgs = this.messages();
        const mi = msgs.findIndex(m => m.id === messageId);
        if (mi < 0 || msgs[mi].role !== "user") return;
        const hi = this.historyCutFor(msgs, mi);
        if (hi == null) return;   // couldn't map the bubble to history — refuse rather than corrupt it
        this.cancel();            // bump turnEpoch (drops any in-flight detached save) + abort controllers
        this.resetTurnState();    // clear outstanding/streaks/pending cards/streaming from the discarded future
        this.history = this.history.slice(0, hi);
        this.setMessages(prev => prev.slice(0, mi));
        if (mi === 0) this.titleGenerated = false;   // re-derive the title from the edited first prompt
        // Carry the original prompt's attachments through the rewind so an edit doesn't silently drop them.
        this.send(trimmed, msgs[mi].images, msgs[mi].audio);   // re-pushes the edited user turn (with a fresh historyIndex), persists, runs
    };

    /**
     * The `history` index to slice at when rewinding to the user bubble at messages[mi]. Prefers the
     * stored `historyIndex`; falls back (for pre-feature chats) to matching the Nth user bubble to the Nth
     * {role:"user"} entry in history — sound because send() is the only producer of user bubbles, 1:1 with
     * history user entries. Returns null if no match (don't risk a bad slice).
     */
    private historyCutFor(msgs: ChatMessage[], mi: number): number | null {
        const stored = msgs[mi].historyIndex;
        if (stored != null && this.history[stored]?.role === "user") return stored;
        // Fallback: this bubble is the Nth user message (1-based) among messages[0..mi].
        let n = 0;
        for (let i = 0; i <= mi; i++) if (msgs[i].role === "user") n++;
        let seen = 0;
        for (let j = 0; j < this.history.length; j++) {
            if (this.history[j].role === "user" && ++seen === n) return j;
        }
        return null;
    }

    confirmPreview = async (previewId: string) => {
        const preview = this.pendingPreviews().find(p => p.previewId === previewId);
        if (!preview || preview.saved) return;   // gone, or already saved — ignore a double Save
        const epoch = this.turnEpoch;   // capture: a session swap during the async save invalidates this resolve
        // Leave the card in place while the save runs (clearing any prior error). It is removed ONLY on a real
        // success — and even then it transforms into a "Saved" confirmation rather than vanishing (below).
        this.updatePreview(previewId, { saveError: undefined });
        const result = await saveHomebrew(preview);
        // The user switched/loaded another conversation while the save was in flight — drop the late
        // tool_result + decision-log entry so they don't land on (and continue) the wrong chat.
        if (epoch !== this.turnEpoch) return;
        // Visible confirmation in the app (a failed save otherwise looks identical to success — the card
        // just vanishes either way), in addition to feeding the result back to the model below. On a
        // successful save the Grimoire voice gets its strongest beat here — the model has no turn at save
        // time, so this is app-emitted. The model still receives the factual result.message below.
        const [userSettings] = getUserSettings();
        const aiCfg = userSettings().ai;
        const tier = aiCfg?.provider === "local" ? "small" : "large";
        const persona = personaFor(aiCfg?.personaStrength ?? DEFAULT_AI_PERSONA_STRENGTH, tier);
        // The save flourish is the strongest persona beat — show it only when the resolved persona carries
        // a confirm flourish (the "full" voice); lighter levels keep the factual save message.
        const snackMessage = result.ok && persona.confirmFlourish ? "It is done. Let it be written." : result.message;
        addSnackbar({ message: snackMessage, severity: result.ok ? "success" : "error" });
        if (result.ok) {
            // A durable, in-flow chat record naming the saved entity — so both the user and (on the next
            // turn, by re-reading the chat) the model know exactly what was created/edited and its name.
            // App-emitted because the model has no turn at save time (mirrors the character-pipeline note).
            const noteId = this.pushAssistantBubble(preview.mode === "edit"
                ? `✦ Updated **${preview.title}** (${kindLabelLower(preview.kind)}).`
                : `✦ Saved **${preview.title}** (${kindLabelLower(preview.kind)}) to your homebrew. Say "edit ${preview.title}" to change it.`);
            // Transform the card into a "Saved" confirmation (the user dismisses it when ready) instead of
            // removing it — and anchor it under the announcement above so it stays in place in the
            // transcript instead of drifting to the bottom as the conversation continues.
            this.updatePreview(previewId, { saved: true, saveError: undefined, anchorId: noteId });
            // Auto-log every committed change (the model's chat reply is the "why"; we capture a short note).
            void logDecision({
                entityKind: preview.kind,
                entityName: preview.title,
                changeType: preview.mode === "edit" ? "edit" : "create",
                summary: this.deriveDecisionSummary(preview),
                patch: preview.appliedOps,
                conversationId: this.currentConversationId ?? undefined,
                previewId,
            });
        } else {
            // The save genuinely didn't persist — keep the card and surface why, so the user can retry.
            this.updatePreview(previewId, { saveError: result.message });
        }
        this.resolveToolCall(preview.toolCallId, result.message, !result.ok);
        // Capture the now-smaller card set. For a DETACHED card resolveToolCall no-ops (no continuation
        // turn → no other persist), so this is what keeps the saved conversation in sync after a restore.
        void this.persistCurrent();
    };

    /** A short app-derived summary for the decision log, prefixed with the model's last one-line note. */
    private deriveDecisionSummary(preview: HomebrewPreview): string {
        const kind = preview.kind.replace("_", " ");
        const base = preview.mode === "edit"
            ? `Edited ${kind} "${preview.title}"` + (preview.appliedOps?.length ? `: ${preview.appliedOps.map(o => o.path).join(", ")}` : "")
            : `Created ${kind} "${preview.title}"`;
        const note = this.lastAssistantNote();
        return note ? `${base} — ${note}` : base;
    }

    /** The model's most recent chat line (trimmed/short), used as the decision-log "why". */
    private lastAssistantNote(): string {
        const msg = [...this.messages()].reverse().find(m => m.role === "assistant" && m.kind !== "system" && m.text.trim());
        const t = msg?.text.trim().replace(/\s+/g, " ") ?? "";
        return t.length > 140 ? `${t.slice(0, 140)}…` : t;
    }

    rejectPreview = (previewId: string) => {
        const preview = this.pendingPreviews().find(p => p.previewId === previewId);
        if (!preview) return;
        this.removePreview(previewId);
        this.resolveToolCall(preview.toolCallId, "The user rejected this and it was not saved.", true);
        // Persist the smaller set so a rejected detached card doesn't reappear on the next switch back.
        void this.persistCurrent();
    };

    /**
     * Dismiss a card that no longer needs a decision — a "Saved" confirmation. Unlike reject, this does NOT
     * send a rejection tool_result (the save already resolved the tool call); it just clears the card.
     */
    dismissPreview = (previewId: string) => {
        this.removePreview(previewId);
        void this.persistCurrent();
    };

    /**
     * Resolve an interactive card (ask_user / propose_plan) with the user's response. Reuses the same
     * tool_result channel as confirm/reject so the message history stays valid, then continues the turn.
     * Idempotent: a card already answered (or removed) is ignored.
     */
    answerInteraction = (interactionId: string, response: InteractionResponse) => {
        // A ratification gate from the staged-generation pipeline isn't a chat tool call — it resolves the
        // orchestrator's awaited promise instead of going through the tool_result channel.
        const ratify = this.pipelineRatify.get(interactionId);
        if (ratify) {
            this.pipelineRatify.delete(interactionId);
            this.removeInteraction(interactionId);
            ratify(toRatifyDecision(response));
            return;
        }
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

    /**
     * Dismiss a card that's mid-repair: abort the in-flight completion turn and restore the pre-repair card
     * (instead of deleting it). completePreview collapsed the card (`repairing`), bumped the repair count, and
     * RESOLVED the card's tool call to kick off the repair turn — so we un-collapse it, roll back the count
     * (re-enabling "Complete with AI"), and re-open that tool call so the restored card is fully live again.
     */
    cancelRepair = (previewId: string) => {
        const preview = this.pendingPreviews().find(p => p.previewId === previewId);
        if (!preview) return;
        this.cancel();   // abort the streaming turn (+ any pipeline it spawned); bumps turnEpoch so a late finishTurn is dropped
        this.reopenToolCall(preview.toolCallId);   // undo the repair injection so Save/Reject/Complete all work again
        this.updatePreview(previewId, { repairing: false });   // un-collapse → the previous full card returns
        this.repairCounts.delete(preview.title.toLowerCase());  // roll back the attempt bump so the user can retry
        void this.persistCurrent();
    };

    /**
     * Undo a repair injection so a dismissed "Complete with AI" card is fully live again: drop the tool_result
     * completePreview recorded for it (from the in-flight buffer or, if already flushed, the last history tool
     * message) and re-open the call as outstanding — leaving history exactly as it was before the repair.
     */
    private reopenToolCall(toolCallId: string) {
        if (this.outstanding.has(toolCallId)) return;   // still open (never resolved) — nothing to undo
        this.resolved = this.resolved.filter(r => r.toolCallId !== toolCallId);
        const last = this.history[this.history.length - 1];
        if (last?.role === "tool" && last.toolResults?.some(r => r.toolCallId === toolCallId)) {
            const remaining = last.toolResults.filter(r => r.toolCallId !== toolCallId);
            if (remaining.length) last.toolResults = remaining;
            else this.history.pop();
        }
        this.outstanding.add(toolCallId);
    }

    /**
     * Regenerate an entity the readiness pipeline couldn't get past schema validation ("needs direction").
     * User-initiated, so it grants a fresh schema-retry budget; reuses the repair channel + collapse UI.
     */
    regeneratePreview = (previewId: string) => {
        if (this.status() === "streaming") return;
        const preview = this.pendingPreviews().find(p => p.previewId === previewId);
        if (!preview) return;
        this.schemaRetryStreak = 0;
        this.reviewFixStreak = 0;
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
        const tool = KIND_TO_TOOL[preview.kind];
        const instruction = `A reviewer flagged problems with the ${preview.kind.replace("_", " ")} "${preview.title}". Call ${tool} again with the SAME content, fixing each of these:\n- ${notes.join("\n- ")}\nKeep everything that was already correct, and use concrete rules text.`;
        this.resolveToolCall(preview.toolCallId, instruction, true);
    };

    /**
     * User-initiated MADS repair for the "no sheet effect" warning: re-run the focused per-feature command
     * pass over every mechanical feature still missing a command. Uses the enrichment sub-agent channel
     * (fresh context, own abort controller) — NOT the chat repair channel — so conversation history is
     * untouched, no repair budget is spent, and it works even on a detached/restored card. Fails open:
     * worst case the warning chip stays and the user edits manually.
     */
    regenerateCommands = async (previewId: string) => {
        const [userSettings] = getUserSettings();
        const ai = userSettings().ai;
        if (!ai) return;
        const preview = this.pendingPreviews().find(p => p.previewId === previewId);
        if (!preview || preview.enriching || !hasFeatures(preview.kind)) return;
        const inert = featuresMissingMads(preview.kind, preview.entity, true);
        if (!inert.length) return;

        this.commandController = new AbortController();
        const signal = this.commandController.signal;
        this.setPendingPreviews(prev => prev.map(p => p.previewId === previewId ? { ...p, enriching: true } : p));
        let entity = preview.entity;
        try {
            // Focused per-feature turns over exactly the gaps the base pass left (no whole-entity re-run).
            const gap = await gapFillCommands(preview, ai, signal, { maxPerFeaturePasses: inert.length });
            if (gap.attached) entity = gap.entity;
        } catch (e) { console.error("Command regeneration failed", e); }
        this.setPendingPreviews(prev => prev.map(p => p.previewId === previewId
            ? { ...p, enriching: false, entity, inertFeatures: featuresMissingMads(preview.kind, entity, true) }
            : p));
        void this.persistCurrent();
        if (this.commandController?.signal === signal) this.commandController = null;
    };

    // ----------------- staged generation pipeline -----------------

    /** Abort the in-flight staged-generation run (user "Abort"). Settles its ratify gate and clears the card. */
    abortPipeline = () => {
        this.teardownPipeline();
        void this.discardPipelineCheckpoint();
    };

    /** Dismiss a finished pipeline card that ended in error/abort (the card is terminal; just clear it). */
    dismissPipeline = () => {
        this.setPipelineRun(null);
    };

    /**
     * Restart the last/current pipeline from scratch (user "Restart" on a terminal card). Drops any partial
     * checkpoint and the terminal card, then re-launches the SAME pipeline type with the SAME seed. Bails if
     * there's no remembered seed (e.g. a brand-new session after a hard reload, where Resume is the path).
     */
    restartPipeline = () => {
        // The homebrew mini-pipeline doesn't support restart (it clears its seed and never checkpoints).
        if (this.currentPipelineType === "homebrew") return;
        const seed = this.currentPipelineSeed;
        if (!seed) return;
        const type = this.currentPipelineType;
        this.teardownPipeline();
        void this.discardPipelineCheckpoint();
        this.setResumableCheckpoint(null);
        const epoch = this.turnEpoch;
        if (type === "character") this.launchCharacterPipeline(seed, epoch);
        else this.launchClassPipeline(seed, epoch);
    };

    /**
     * Retry a FAILED pipeline from the step that failed (user "Retry" on a terminal error card). Resumes from
     * the last successful phase — reusing the same {@link PipelineResume} machinery as {@link resumePipeline}
     * — so only the failed step and what follows re-run, never the whole build (an approved skeleton is never
     * re-ratified). Uses the in-memory snapshot, which is present in saved AND unsaved chats, and keeps the
     * existing Dexie row (via `pipelineCheckpointId`) so later steps upsert it rather than orphan it. Falls
     * back to a full relaunch only when nothing checkpointed yet (the very first phase failed). No-op for the
     * homebrew mini-pipeline (it never checkpoints — Retry isn't offered for it).
     */
    retryPipeline = () => {
        if (this.currentPipelineType === "homebrew") return;
        const seed = this.currentPipelineSeed;
        if (!seed) return;
        const type = this.currentPipelineType;
        const snap = this.lastCheckpointSnapshot;
        const checkpointId = this.pipelineCheckpointId ?? undefined;   // continue the same row if one exists
        const epoch = this.turnEpoch;
        // Nothing decided yet — resume and restart are equivalent; relaunch from the top.
        if (!snap) {
            if (type === "character") this.launchCharacterPipeline(seed, epoch);
            else this.launchClassPipeline(seed, epoch);
            return;
        }
        if (type === "character") {
            const resume: PipelineResume<WorkingCharacter> = { working: snap.working as WorkingCharacter, brief: snap.brief, fromPhaseIndex: snap.phaseIndex };
            this.launchCharacterPipeline(seed, epoch, resume, checkpointId);
        } else {
            const resume: PipelineResume<WorkingClass> = { working: snap.working as WorkingClass, brief: snap.brief, fromPhaseIndex: snap.phaseIndex };
            this.launchClassPipeline(seed, epoch, resume, checkpointId);
        }
    };

    /**
     * Resume an interrupted pipeline offered after reloading its conversation (plan §9, M6). Adopts the
     * persisted checkpoint (working object + brief + its row id, so further steps upsert the same row) and
     * re-enters the matching orchestrator, which skips every already-decided phase. No-op if no offer stands.
     */
    resumePipeline = () => {
        const cp = this.resumableCheckpoint();
        if (!cp || this.pipelineRun()) return;
        this.setResumableCheckpoint(null);
        // The mini-pipeline never checkpoints, so a homebrew checkpoint shouldn't exist — drop it defensively.
        if (cp.pipelineType === "homebrew") return;
        const epoch = this.turnEpoch;
        if (cp.pipelineType === "character") {
            const resume: PipelineResume<WorkingCharacter> = { working: cp.working as WorkingCharacter, brief: cp.conceptBrief, fromPhaseIndex: cp.currentPhaseIndex };
            this.launchCharacterPipeline(cp.seed, epoch, resume, cp.id);
        } else {
            const resume: PipelineResume<WorkingClass> = { working: cp.working as WorkingClass, brief: cp.conceptBrief, fromPhaseIndex: cp.currentPhaseIndex };
            this.launchClassPipeline(cp.seed, epoch, resume, cp.id);
        }
    };

    /** Decline a resume offer: drop the persisted checkpoint and clear the affordance. */
    discardResumable = () => {
        const cp = this.resumableCheckpoint();
        this.setResumableCheckpoint(null);
        if (cp) void pipelineCheckpointManager.discard(cp.id).catch(e => console.error("Failed to discard pipeline checkpoint", e));
    };

    /**
     * Resolve a pipeline SEED tool call WITHOUT starting a continuation turn — the orchestrator is the
     * continuation (it runs async and renders its own card). Commits the tool_result to history so the
     * assistant's tool_use stays wire-valid, but never calls runTurn.
     */
    private resolvePipelineTrigger(toolCallId: string, content: string) {
        if (!this.outstanding.has(toolCallId)) return;
        this.resolved.push({ toolCallId, content, isError: false });
        this.outstanding.delete(toolCallId);
        if (this.outstanding.size === 0 && this.resolved.length) {
            this.history.push({ role: "tool", toolResults: this.resolved });
            this.resolved = [];
        }
    }

    /** Build the generation seed (concept + any hard requirements) from a `generate_*` seed tool call. */
    private seedFromToolCall(tc: AiToolCall): string {
        const input = (tc.input ?? {}) as Record<string, unknown>;
        const concept = String(input.concept ?? "").trim();
        const requirements = Array.isArray(input.requirements)
            ? input.requirements.map(r => String(r).trim()).filter(Boolean) : [];
        return requirements.length ? `${concept}\nRequirements: ${requirements.join("; ")}` : concept;
    }

    /** Start the Class staged-generation pipeline from a `generate_class` seed call. One run at a time. */
    private startClassPipeline(tc: AiToolCall, epoch: number) {
        const seed = this.seedFromToolCall(tc);
        if (!seed) { this.pushSystemBubble("The class generator needs a concept to start from."); return; }
        this.launchClassPipeline(seed, epoch);
    }

    /** Start the Character staged-generation pipeline from a `generate_character` seed call. One run at a time. */
    private startCharacterPipeline(tc: AiToolCall, epoch: number) {
        const seed = this.seedFromToolCall(tc);
        if (!seed) { this.pushSystemBubble("The character generator needs a concept to start from."); return; }
        this.launchCharacterPipeline(seed, epoch);
    }

    /** Build the mini-pipeline seed from a one-shot create_* draft + the user's latest request. */
    private seedFromHomebrewCall(tc: AiToolCall): string {
        const draft = JSON.stringify(tc.input ?? {});
        const ask = this.lastUserText();
        const label = kindLabel(TOOL_TO_KIND[tc.name] ?? "homebrew");
        return `${ask ? `${ask}\n` : ""}Make a homebrew ${label} based on this draft: ${draft}`.trim();
    }

    /** The user's most recent prompt text (used to seed the homebrew mini-pipeline's concept step). */
    private lastUserText(): string {
        const msg = [...this.messages()].reverse().find(m => m.role === "user" && m.text.trim());
        return msg?.text.trim() ?? "";
    }

    /**
     * Launch the Homebrew mini-pipeline (Generation depth ≥ Medium) for one create_* kind. Like the staged
     * pipelines it is a standalone run that owns the progress card; on completion it reuses
     * {@link onPipelineComplete} (which surfaces + enriches the preview, so the High MADS step is reached).
     * It never checkpoints, so `currentPipelineSeed` is cleared — Restart/Resume don't apply (see their guards).
     */
    private startHomebrewPipeline(kind: HomebrewKind, seed: string, epoch: number) {
        const [userSettings] = getUserSettings();
        const ai = userSettings().ai;
        if (!ai) { this.pushSystemBubble("AI is not configured."); return; }
        const dndSystem = userSettings().dndSystem;

        this.teardownPipeline();              // supersede any prior run before starting a new one
        this.setResumableCheckpoint(null);
        this.pipelineCheckpointId = null;     // the mini-pipeline never checkpoints
        this.currentPipelineType = "homebrew";
        this.currentPipelineSeed = "";        // Restart/Resume are not offered for the mini-pipeline
        this.lastCheckpointSnapshot = null;   // no resumable step for the mini-pipeline
        this.pipelineController = new AbortController();
        const signal = this.pipelineController.signal;

        const host: HomebrewPipelineHost = {
            ai, dndSystem, signal, kind,
            usageLevel: ai.usageLevel ?? DEFAULT_USAGE_LEVEL,
            creationPipelineLevel: ai.creationPipelineLevel ?? DEFAULT_CREATION_PIPELINE_LEVEL,
            onProgress: run => { if (epoch === this.turnEpoch && !signal.aborted) this.setPipelineRun(run); },
            onComplete: previews => this.onPipelineComplete(previews, epoch),
            onError: message => { if (epoch === this.turnEpoch) this.pushSystemBubble(message); },
        };
        void runHomebrewPipeline(seed, host).finally(() => {
            if (this.pipelineController?.signal === signal) this.pipelineController = null;
        });
    }

    /**
     * Launch (or RESUME/RESTART) the Class pipeline for `seed`. Supersedes any prior run, wires the reactive
     * host callbacks, and drives the standalone orchestrator. When `resume` is given the orchestrator picks
     * up from the persisted working object; `checkpointId` re-adopts that run's row so later steps upsert it.
     */
    private launchClassPipeline(seed: string, epoch: number, resume?: PipelineResume<WorkingClass>, checkpointId?: string) {
        const [userSettings] = getUserSettings();
        const ai = userSettings().ai;
        if (!ai) { this.pushSystemBubble("AI is not configured."); return; }
        const dndSystem = userSettings().dndSystem;

        this.teardownPipeline();   // supersede any prior run (and settle its gate) before starting a new one
        this.setResumableCheckpoint(null);   // a launch supersedes any standing resume offer
        this.pipelineCheckpointId = checkpointId ?? null;
        this.currentPipelineType = "class";
        this.currentPipelineSeed = seed;
        // Reset (fresh run) or re-seed (resume/retry) the snapshot so a stale one can't leak across runs and
        // a second Retry still has a target before the resumed run checkpoints again. Clone: the orchestrator
        // mutates resume.working in place.
        this.lastCheckpointSnapshot = resume
            ? { phaseIndex: resume.fromPhaseIndex, working: structuredClone(resume.working), brief: resume.brief }
            : null;
        if (resume) this.seedResumeProgress(resume, "class");
        this.pipelineController = new AbortController();
        const signal = this.pipelineController.signal;

        const host: PipelineHost = {
            ai, dndSystem, signal,
            usageLevel: ai.usageLevel ?? DEFAULT_USAGE_LEVEL,
            creationPipelineLevel: ai.creationPipelineLevel ?? DEFAULT_CREATION_PIPELINE_LEVEL,
            // Phase-F critic reviewer (runs only at the High usage level; the orchestrator gates on usageLevel).
            reviewer: buildClassReviewer(ai, dndSystem, signal),
            // Once aborted (user "Abort"), drop the run's card and ignore its trailing progress so it can't
            // flash back; a plain rejection (signal NOT aborted) still surfaces its "Stopped" terminal card.
            onProgress: run => { if (epoch === this.turnEpoch && !signal.aborted) this.setPipelineRun(run); },
            ratifySkeleton: plan => this.requestSkeletonRatification(plan, epoch),
            onCheckpoint: (phaseIndex, working, brief) => this.savePipelineCheckpoint(phaseIndex, working, brief, epoch),
            onComplete: previews => this.onPipelineComplete(previews, epoch),
            onError: message => { if (epoch === this.turnEpoch) this.pushSystemBubble(message); },
        };
        void runClassPipeline(seed, host, resume).finally(() => {
            if (this.pipelineController?.signal === signal) this.pipelineController = null;
        });
    }

    /** Launch (or RESUME/RESTART) the Character pipeline for `seed`. See {@link launchClassPipeline}. */
    private launchCharacterPipeline(seed: string, epoch: number, resume?: PipelineResume<WorkingCharacter>, checkpointId?: string) {
        const [userSettings] = getUserSettings();
        const ai = userSettings().ai;
        if (!ai) { this.pushSystemBubble("AI is not configured."); return; }
        const dndSystem = userSettings().dndSystem;

        this.teardownPipeline();   // supersede any prior run before starting a new one
        this.setResumableCheckpoint(null);   // a launch supersedes any standing resume offer
        this.pipelineCheckpointId = checkpointId ?? null;
        this.currentPipelineType = "character";
        this.currentPipelineSeed = seed;
        // See launchClassPipeline: reset on a fresh run, re-seed on resume/retry (cloned — mutated in place).
        this.lastCheckpointSnapshot = resume
            ? { phaseIndex: resume.fromPhaseIndex, working: structuredClone(resume.working), brief: resume.brief }
            : null;
        if (resume) this.seedResumeProgress(resume, "character");
        this.pipelineController = new AbortController();
        const signal = this.pipelineController.signal;

        const host: CharacterPipelineHost = {
            ai, dndSystem, signal,
            usageLevel: ai.usageLevel ?? DEFAULT_USAGE_LEVEL,
            creationPipelineLevel: ai.creationPipelineLevel ?? DEFAULT_CREATION_PIPELINE_LEVEL,
            // Whole-character consistency critic (spec §5.5; runs only at the High usage level).
            reviewer: buildCharacterReviewer(ai, dndSystem, signal),
            onProgress: run => { if (epoch === this.turnEpoch && !signal.aborted) this.setPipelineRun(run); },
            onCheckpoint: (phaseIndex, working, brief) => this.savePipelineCheckpoint(phaseIndex, working, brief, epoch),
            onComplete: character => this.onCharacterComplete(character, epoch),
            onError: message => { if (epoch === this.turnEpoch) this.pushSystemBubble(message); },
        };
        void runCharacterPipeline(seed, host, resume).finally(() => {
            if (this.pipelineController?.signal === signal) this.pipelineController = null;
        });
    }

    /**
     * Paint the progress card immediately at the resumed phase so a resumed run shows where it left off
     * before the orchestrator's first async emit lands (which then takes over). The phase list mirrors each
     * pipeline's `PHASES`; the index is clamped so a stale checkpoint can't point past the end.
     */
    private seedResumeProgress(resume: PipelineResume, pipelineType: PipelineType) {
        const phases = pipelineType === "character" ? CHARACTER_PIPELINE_PHASES : CLASS_PIPELINE_PHASES;
        const index = Math.min(Math.max(resume.fromPhaseIndex, 0), phases.length - 1);
        this.setPipelineRun({ pipelineType, phase: phases[index], phaseIndex: index, totalPhases: phases.length, status: "running" });
    }

    /**
     * Terminal success for the Character pipeline: save the assembled character via the CharacterManager and
     * surface a confirmation. A character is NOT a homebrew preview, so there is no card hand-off — it goes
     * straight to the user's Characters. A name collision is reported rather than silently dropped (the
     * manager dedups by name).
     */
    private onCharacterComplete(character: Character, epoch: number) {
        if (epoch !== this.turnEpoch) return;
        this.setPipelineRun(null);
        void this.discardPipelineCheckpoint();
        const clash = characterManager.characters().some(c => c.name.trim().toLowerCase() === character.name.trim().toLowerCase());
        if (clash) {
            this.pushSystemBubble(`A character named “${character.name}” already exists. Rename the existing one (or this concept) and generate again to keep both.`);
        } else {
            characterManager.createCharacter(character);
            this.pushAssistantBubble(`✦ Created **${character.name}** — level ${character.level} ${character.race.species} ${character.className}. Open the Characters page to view or edit them.`);
            // Log the creation alongside generated homebrew for observability (plan §10/§13 M6). A character
            // isn't a homebrew preview (no confirm step), so this is the only place its creation is recorded.
            void logDecision({
                entityKind: "character",
                entityName: character.name,
                changeType: "create",
                summary: `Generated level ${character.level} ${character.race.species} ${character.className} via the staged pipeline.`,
                conversationId: this.currentConversationId ?? undefined,
            });
        }
        void this.persistCurrent();
    }

    /**
     * Surface the skeleton as a ratification card (reusing the propose_plan InteractionCard) and return a
     * promise the orchestrator awaits. The resolver is keyed by the card's id so answerInteraction routes
     * the user's Approve/Refine/Reject back here instead of through the chat tool_result channel.
     */
    private requestSkeletonRatification(plan: SkeletonPlan, epoch: number): Promise<RatifyDecision> {
        return new Promise<RatifyDecision>(resolve => {
            if (epoch !== this.turnEpoch || this.pipelineController?.signal.aborted) { resolve({ type: "reject" }); return; }
            const interactionId = createNewId();
            this.pipelineRatify.set(interactionId, resolve);
            this.setPendingInteractions(prev => [...prev, {
                interactionId,
                toolCallId: `pipeline-${interactionId}`,   // synthetic: never resolved via the tool channel
                kind: "plan",
                title: `Skeleton: ${plan.name || "new class"}`,
                steps: skeletonSummaryLines(plan),
                constraints: [],
            }]);
        });
    }

    /**
     * Terminal success: record the assembled class (and any subclasses) as preview cards, but HOLD THEM
     * BACK (`deferred`) until the post-completion MADS phase finishes — the user sees the progress card's
     * status line, never a savable card that's still being enriched. The cards live in pendingPreviews
     * from the start (flag stripped on persist), so a mid-enrichment reload or conversation switch still
     * restores the finished build instead of losing it. `previews` is the class first, then one per subclass.
     */
    private onPipelineComplete(previews: HomebrewPreview[], epoch: number) {
        if (epoch !== this.turnEpoch || !previews.length) return;
        this.setPendingPreviews(prev => [...prev, ...previews.map(p => ({ ...p, deferred: true }))]);
        void this.discardPipelineCheckpoint();
        void this.runMadsPhaseThenHandoff(previews, epoch);
        void this.persistCurrent();
    }

    /**
     * Drive the post-completion MADS phase shown in the progress strip (class + homebrew only): hold the
     * pipeline run on a `MadsReview` step while {@link enrichWithCommands} attaches/validates the mechanical
     * "mads" commands, then hand off — clear the run AND un-defer the preview card(s) so they appear only
     * now, fully enriched. Hand-off also runs on an abort mid-enrichment (same epoch), so an aborted MADS
     * phase surfaces the un-enriched cards rather than leaving them hidden. When no enrichment will run
     * (command generation off, or no feature-bearing preview), hand off at once. The phase index is the
     * trailing MadsReview slot appended to each pipeline's PHASES, so the orchestrator's generation phases
     * and this step share one consistent total.
     */
    private async runMadsPhaseThenHandoff(previews: HomebrewPreview[], epoch: number) {
        const ids = new Set(previews.map(p => p.previewId));
        const handoff = () => {
            if (epoch !== this.turnEpoch) return;   // conversation swapped — the loaded session owns the cards now
            this.setPendingPreviews(prev => prev.map(p => (ids.has(p.previewId) ? { ...p, deferred: false } : p)));
            this.setPipelineRun(null);
        };

        const [userSettings] = getUserSettings();
        const ai = userSettings().ai;
        const willEnrich = !!ai
            && (ai.commandGeneration ?? DEFAULT_AI_COMMAND_GENERATION)
            && previews.some(p => p.valid && hasFeatures(p.kind));
        if (!willEnrich) { handoff(); return; }   // nothing to review — hand off immediately

        const phases = this.currentPipelineType === "homebrew" ? HOMEBREW_PIPELINE_PHASES : CLASS_PIPELINE_PHASES;
        this.setPipelineRun({
            pipelineType: this.currentPipelineType, phase: PipelinePhase.MadsReview,
            phaseIndex: phases.length - 1, totalPhases: phases.length, status: "running",
            note: "Adding mechanics…",
        });

        await this.enrichWithCommands(previews.map(p => p.previewId), epoch);

        handoff();
    }

    /** Update the working-line note on the live pipeline run (no-op when no progress card is showing). */
    private setRunNote(note: string) {
        this.setPipelineRun(r => (r ? { ...r, note } : r));
    }

    /** Upsert the run's single checkpoint row after a phase (best-effort; resume UI lands in a later milestone). */
    private savePipelineCheckpoint(phaseIndex: number, working: WorkingEntity, brief: ConceptBrief | undefined, epoch: number) {
        if (epoch !== this.turnEpoch) return;
        // Snapshot in memory FIRST (before the conversationId guard) so Retry can resume the failed step even
        // in an unsaved chat with no Dexie row. Clone: `working` is the live object the orchestrator mutates.
        this.lastCheckpointSnapshot = { phaseIndex, working: structuredClone(working), brief };
        const conversationId = this.currentConversationId;
        if (!conversationId) return;   // nothing persisted yet to anchor a resume to
        void (async () => {
            try {
                if (!this.pipelineCheckpointId) {
                    const cp = await pipelineCheckpointManager.create({ conversationId, pipelineType: this.currentPipelineType, seed: this.currentPipelineSeed, currentPhaseIndex: phaseIndex, working, conceptBrief: brief });
                    this.pipelineCheckpointId = cp.id;
                } else {
                    const existing = await pipelineCheckpointManager.getById(this.pipelineCheckpointId);
                    if (existing) await pipelineCheckpointManager.save({ ...existing, currentPhaseIndex: phaseIndex, working, conceptBrief: brief });
                }
            } catch (e) {
                console.error("Failed to checkpoint pipeline", e);
            }
        })();
    }

    /** Drop the current run's checkpoint row (completion / abort). */
    private async discardPipelineCheckpoint() {
        const id = this.pipelineCheckpointId;
        this.pipelineCheckpointId = null;
        this.lastCheckpointSnapshot = null;   // no step left to resume once the run is settled/restarted
        if (!id) return;
        try { await pipelineCheckpointManager.discard(id); }
        catch (e) { console.error("Failed to discard pipeline checkpoint", e); }
    }

    /**
     * Stop any in-flight pipeline and settle its state: abort the run, resolve any awaited ratify gate as a
     * rejection (so the orchestrator's promise can't dangle), drop its card(s), and clear the run signal.
     * Does NOT delete the persisted checkpoint (abortPipeline does that explicitly).
     */
    private teardownPipeline() {
        this.pipelineController?.abort();
        this.pipelineController = null;
        // The MADS phase keeps the card alive while command enrichment runs; Abort must stop that too, else
        // the card vanishes but enrichment keeps mutating the (now handed-off) preview in the background.
        this.commandController?.abort();
        this.commandController = null;
        if (this.pipelineRatify.size) {
            for (const [id, resolve] of this.pipelineRatify) { resolve({ type: "reject" }); this.removeInteraction(id); }
            this.pipelineRatify.clear();
        }
        this.setPipelineRun(null);
    }

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
        this.resetTurnState();
        this.history = structuredClone(rec.history);
        this.setMessages(rec.messages);
        // Restore the homebrew save-choice cards as DETACHED (Save/Reject only): their tool call was
        // stripped from `history` by balancedHistory() and `outstanding` is empty, so a live-turn action
        // would no-op — but Save still works (saveHomebrew + a harmless no-op resolveToolCall).
        this.setPendingPreviews((rec.pendingPreviews ?? []).map(p => ({ ...p, detached: true })));
        // Interactions (ask/plan) are NOT restored: answering one only matters to continue the turn, and
        // after a load there's no outstanding tool call to resolve, so the answer would go nowhere.
        this.setPendingInteractions([]);
        this.setMode(rec.mode);
        this.currentConversationId = rec.id;
        this.createdAt = rec.createdAt;
        this.titleOverride = rec.title;   // restore the saved (possibly AI) name
        this.titleGenerated = true;       // already named — never re-title an existing chat
        // Offer to resume an interrupted staged generation for this chat (plan §9, M6).
        void this.refreshResumableCheckpoint(rec.id);
    };

    /**
     * Look up an in-flight pipeline checkpoint for the (just-loaded) conversation and, if the user hasn't
     * disabled resume, surface it as a "Resume generation" offer. Guarded against a session swap mid-query
     * and against clobbering a live run. Remembers the seed/type so a later Restart works too.
     */
    private async refreshResumableCheckpoint(conversationId: string) {
        const [userSettings] = getUserSettings();
        if (!(userSettings().ai?.resumeGeneration ?? DEFAULT_AI_RESUME_GENERATION)) return;
        const epoch = this.turnEpoch;
        try {
            const cp = await pipelineCheckpointManager.get(conversationId);
            if (!cp || epoch !== this.turnEpoch || this.pipelineRun()) return;
            this.currentPipelineType = cp.pipelineType;
            this.currentPipelineSeed = cp.seed;
            this.setResumableCheckpoint(cp);
        } catch (e) {
            console.error("Failed to load pipeline checkpoint", e);
        }
    }

    deleteConversation = async (id: string) => {
        try { await chatHistoryDB.conversations.delete(id); }
        catch (e) { console.error("Failed to delete conversation", e); }
        void pipelineCheckpointManager.discardForConversation(id).catch(e => console.error("Failed to discard pipeline checkpoints", e));
        // If we deleted the live chat, detach so the next turn doesn't recreate the deleted row.
        if (id === this.currentConversationId) this.newConversation();
        void this.loadConversations();
    };

    /** Rename a saved conversation. Reuses the title-patch path; keeps the active chat's title in sync. */
    renameConversation = async (id: string, title: string) => {
        const t = title.trim();
        if (!t) return;
        try { await chatHistoryDB.conversations.update(id, { title: t }); }
        catch (e) { console.error("Failed to rename conversation", e); return; }
        if (id === this.currentConversationId) { this.titleOverride = t; this.titleGenerated = true; }
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
            .find(m => m.role === "assistant" && m.kind !== "system")?.text?.trim();
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
        // Sync the in-memory title BEFORE the write so any persistCurrent() queued after this point uses
        // the AI title (not a re-derived one). Guarded so a swapped-away session isn't affected.
        if (id === this.currentConversationId && epoch === this.turnEpoch) this.titleOverride = title;
        await this.enqueueWrite(async () => {
            try {
                // Patch only the title — never `put` a reconstructed row (the user may have switched away
                // or kept chatting; we'd clobber history/messages). update() on a deleted row is a no-op.
                await chatHistoryDB.conversations.update(id, { title });
                void this.loadConversations();
            } catch (e) {
                console.error("Failed to apply generated title", e);
            }
        });
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

    /**
     * The pending preview cards as they should be PERSISTED with the conversation (so the save-choice
     * dialog survives a chat-history switch). On reload these become "detached" cards (Save/Reject only),
     * because balancedHistory() strips their originating tool call and `outstanding` is empty after a load —
     * so any in-flight/live-turn state would be meaningless. We therefore neutralize it here:
     *  - drop `repairing`/`enriching` (their controllers are gone);
     *  - settle a mid-pipeline `reviewState` ("reviewing"/"needs_user_direction") to "review_unavailable";
     *  - clear `reviewBlocked` so Save isn't permanently disabled (its only unblock path, "Improve with AI",
     *    is hidden on a detached card). Save then gates on `valid` alone — the correct invariant.
     * `detached` is NOT set here; it's stamped on load so a same-session snapshot stays live.
     */
    private sanitizePreviewsForStore(previews: HomebrewPreview[]): HomebrewPreview[] {
        // "Saved" confirmation cards persist across reloads as a record of what was created/edited. Strip
        // their transient/live-turn flags but keep `saved` so they restore as compact confirmations (a
        // detached + saved card can't "resurrect": confirmPreview no-ops on an already-saved preview). Cap
        // to the most recent few so a long conversation's record stays bounded.
        const SAVED_CARD_CAP = 10;
        let savedKept = 0;
        const result: HomebrewPreview[] = [];
        // Walk newest→oldest so the cap keeps the most recent saved cards; restore original order after.
        for (let i = previews.length - 1; i >= 0; i--) {
            const p = previews[i];
            if (p.saved) {
                if (savedKept >= SAVED_CARD_CAP) continue;
                savedKept++;
                const { previewId, toolCallId, kind, title, entity, valid, mode, baseEntity, appliedOps, rejectedOps, anchorId } = p;
                result.push({ previewId, toolCallId, kind, title, entity, valid, errors: [], saved: true, mode, baseEntity, appliedOps, rejectedOps, anchorId });
            } else {
                const { repairing: _r, enriching: _e, detached: _d, saveError: _se, deferred: _df, ...rest } = p;
                const reviewState: ReviewState | undefined =
                    p.reviewState === "reviewing" || p.reviewState === "needs_user_direction"
                        ? "review_unavailable"
                        : p.reviewState;
                result.push({ ...rest, reviewState, reviewBlocked: false });
            }
        }
        return result.reverse();
    }

    /**
     * The history to actually send the model, windowed to fit its context. `history` grows every turn
     * and is replayed in full, so a long (especially tool-heavy) session would silently overflow num_ctx
     * — Ollama then drops the OLDEST messages, which can split a tool_use from its tool_result and corrupt
     * generation. We keep the most recent turns whose estimated tokens fit ~half of num_ctx (leaving room
     * for the system prompt + generation), cut at a `user` boundary so no tool_use/tool_result pair is
     * split. Short sessions are returned unchanged.
     */
    private windowedHistory(numCtx: number, overheadTokens = 0): AiMessage[] {
        const h = this.history;
        if (h.length <= 4) return h;
        // Exclude base64 image/audio data from the char-count estimate (it would dwarf the text and evict
        // real turns); count a flat per-attachment cost instead — closer to how the model tokenizes media
        // (vision tiles an image; Gemma 4 spends ~25 tokens/sec → ~750 for a 30s clip).
        const tokensOf = (m: AiMessage) =>
            Math.ceil(JSON.stringify({ ...m, images: undefined, audio: undefined }).length / 4)
            + (m.images?.length ?? 0) * 768
            + (m.audio?.length ?? 0) * 800;
        // History gets half the window MINUS the turn's fixed overhead (system prompt + tool schemas,
        // measured by the caller). A flat half under-reserved in homebrew mode, where the fixed surface
        // alone is ~5-6k tokens of a 16k window — history would then crowd out generation room.
        const budget = Math.max(2048, Math.floor((numCtx || DEFAULT_AI_NUM_CTX) * 0.5) - overheadTokens);
        let used = 0;
        let cut = h.length;
        for (let i = h.length - 1; i >= 0; i--) {
            used += tokensOf(h[i]);
            if (used > budget && cut < h.length) break;
            cut = i;
        }
        if (cut <= 0) return h;
        // Snap forward to a `user` message so the window starts a fresh exchange (never an orphan
        // tool_result, nor an assistant tool_use whose results got trimmed). If none, send full history.
        while (cut < h.length && h[cut].role !== "user") cut++;
        return cut >= h.length ? h : h.slice(cut);
    }

    /**
     * Keep `audio` only on the MOST RECENT audio-bearing turn and strip it from older ones for the model
     * request. Audio is far heavier than images and the model already processed earlier clips, so replaying
     * them just burns context (and re-triggers the audio+thinking issue). Send-time only — returns a shallow
     * copy so `this.history` and the persisted record keep every clip (past bubbles still play; rewind works).
     */
    private stripStaleAudio(history: AiMessage[]): AiMessage[] {
        let lastAudioIdx = -1;
        history.forEach((m, i) => { if (m.audio?.length) lastAudioIdx = i; });
        if (lastAudioIdx < 0) return history;
        return history.map((m, i) => (m.audio?.length && i !== lastAudioIdx) ? { ...m, audio: undefined } : m);
    }

    /**
     * Upsert the active conversation. Fire-and-forget; bails on empty chats; never throws into a turn.
     * The row is SNAPSHOTTED synchronously, then the put() is run through the serialized write queue so
     * it can't interleave with applyGeneratedTitle's title update() (which would clobber the AI title).
     */
    private persistCurrent(): Promise<void> {
        if (this.history.length === 0) return Promise.resolve();
        const now = Date.now();
        if (!this.currentConversationId) this.currentConversationId = createNewId();
        if (this.createdAt == null) this.createdAt = now;
        const row: SavedConversation = {
            id: this.currentConversationId,
            title: this.currentTitle(),
            mode: this.mode(),
            history: this.balancedHistory(),
            messages: this.messages(),
            pendingPreviews: this.sanitizePreviewsForStore(this.pendingPreviews()),
            createdAt: this.createdAt,
            updatedAt: now,
        };
        return this.enqueueWrite(async () => {
            try {
                await chatHistoryDB.conversations.put(row);
                void this.loadConversations();
            } catch (e) {
                console.error("Failed to save conversation", e);
            }
        });
    }

    // ----------------- internals -----------------

    private pushUserBubble(text: string, historyIndex?: number, images?: AiImage[], audio?: AiAudio[]) {
        this.setMessages(prev => [...prev, { id: createNewId(), role: "user", text, historyIndex, images, audio }]);
    }
    /** Append an assistant bubble and return its message id (so a card can anchor itself under it). */
    private pushAssistantBubble(text: string, thinking?: string): string {
        const id = createNewId();
        this.setMessages(prev => [...prev, { id, role: "assistant", text, thinking: thinking || undefined }]);
        return id;
    }
    /** An app-emitted notice (error/refusal/cut-off/warning), tagged kind:"system" and shown with a ⚠️. */
    private pushSystemBubble(text: string) {
        this.setMessages(prev => [...prev, { id: createNewId(), role: "assistant", kind: "system", text: `⚠️ ${text}` }]);
    }
    /**
     * App-emitted draft narration: a one-line note naming a freshly-surfaced CREATE entity so the chat
     * actually says what Grimoire is doing — but ONLY when the model itself stayed silent this turn (a
     * tool-call-only turn; the model is also prompted to narrate, and that takes precedence). Deduped by
     * toolCallId so a repair/regeneration replacement doesn't re-announce. Edits are skipped (their diff
     * card is self-explanatory and their save emits its own "Updated" line).
     */
    private narrateDraft(previews: HomebrewPreview[], modelSpoke: boolean) {
        if (modelSpoke) return;
        for (const p of previews) {
            if (p.mode === "edit" || this.narratedDrafts.has(p.toolCallId)) continue;
            this.narratedDrafts.add(p.toolCallId);
            this.pushAssistantBubble(`I've drafted a ${kindLabelLower(p.kind)}, **${p.title}** — review and save it below.`);
        }
    }
    private removePreview(previewId: string) {
        this.setPendingPreviews(prev => prev.filter(p => p.previewId !== previewId));
    }
    /** Patch one pending preview in place (e.g. flip it to a "Saved" confirmation, or attach a save error). */
    private updatePreview(previewId: string, patch: Partial<HomebrewPreview>) {
        this.setPendingPreviews(prev => prev.map(p => p.previewId === previewId ? { ...p, ...patch } : p));
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
        // Keep "Saved" confirmation cards: their tool call is already resolved, so they have no
        // wire-validity obligation and shouldn't be collateral when we close out unanswered calls.
        this.setPendingPreviews(prev => prev.filter(p => p.saved));
        this.setPendingInteractions([]);
    }

    /** Record a tool result; once every tool call from the turn is resolved, continue the turn. */
    private resolveToolCall(toolCallId: string, content: string, isError: boolean) {
        // The id is no longer outstanding (a session swap/cancel cleared it, or it already resolved) —
        // drop the late result so it can't push an orphan tool_result or kick off a turn on the wrong chat.
        if (!this.outstanding.has(toolCallId)) return;
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
        const canCreate = homebrew && allowedKinds(ai.toolPermissions).length > 0;
        // Tool permissions: allow/deny which create_* tools the model may use.
        const allowed = homebrew ? allowedKinds(ai.toolPermissions) : undefined;
        // Homebrew create_* + edit tools: only in homebrew mode, gated by permissions (fully-denied → []).
        const homebrewTools = canCreate ? filterTools(HOMEBREW_TOOLS, ai.toolPermissions) : [];
        const editTools = canCreate ? EDIT_TOOLS : [];
        // Subrace tools resolve their parent race NAME → race ID synchronously in finishTurn, so warm the
        // SRD race catalog while the model streams (fire-and-forget; resolution fails soft to homebrew-only).
        if (editTools.length || homebrewTools.some(t => t.name === "create_subrace")) void ensureRaceCatalog();
        // Staged-generation seed tools (generate_*): the ONLY class-creation path now that M4 removed the
        // one-shot create_class. Offered in homebrew mode and gated by the same per-kind create permission
        // (denying "class" denies generate_class too).
        const pipelineTools = canCreate ? filterPipelineTools(ai.toolPermissions) : [];
        // Read-only lookup + research-delegate, offered in BOTH modes (tiny, low-risk; help the model match
        // real numbers and reference the user's content before inventing).
        const lookupEnabled = ai.lookupTools ?? DEFAULT_AI_LOOKUP_TOOLS;
        const lookupTools = lookupEnabled ? [...LOOKUP_TOOLS, DELEGATE_RESEARCH_TOOL] : [];
        // switch_mode lets the model change its own mode to reach a tool the current mode lacks.
        const switchEnabled = ai.autoSwitch ?? DEFAULT_AI_AUTO_SWITCH;
        const controlTools = switchEnabled ? [...CONTROL_TOOLS] : [];
        // Utility tools (math/ask/plan) are offered in BOTH modes, gated by their own enable flags.
        const utilityTools = enabledUtilityTools(ai);
        // Never send an EMPTY tools array — omit entirely when nothing is offered (keeps chat-like turns clean).
        const combined = [...homebrewTools, ...editTools, ...pipelineTools, ...lookupTools, ...controlTools, ...utilityTools];
        const tools: AiToolDef[] | undefined = combined.length ? combined : undefined;
        // Soft gate: include the advisory note only when the permitted set is actually narrower than "all".
        const noteKinds = homebrew && allowed && allowed.length < HOMEBREW_KINDS.length ? allowed : undefined;
        // Advertise only the tools actually sent, so the prompt doesn't mention disabled ones.
        const utilityFlags = {
            math: utilityTools.some(t => t.name.startsWith("calc_")),
            ask: utilityTools.some(t => t.name === "ask_user"),
            plan: utilityTools.some(t => t.name === "propose_plan"),
            lookup: lookupTools.length > 0,
            edit: editTools.length > 0,
            switchMode: controlTools.length > 0,
            pipeline: pipelineTools.length > 0,
            canCreate,
        };
        // Right-size the prompt for the routed model: local (gemma) gets the worked-example "small" tier.
        const tier = ai.provider === "local" ? "small" : "large";
        // Persona is the VOICE layer; the user picks its strength for any model ("auto" → tier-aware).
        const persona = personaFor(ai.personaStrength ?? DEFAULT_AI_PERSONA_STRENGTH, tier);
        const system = buildSystemPrompt(userSettings().dndSystem, this.mode(), tier, noteKinds, utilityFlags, persona);
        // Build the windowed send-history once, then drop audio from all but the most recent audio turn —
        // audio base64 is heavy and the model already "heard" earlier clips, so replaying them wastes the
        // window. This is a send-time transform only; `history`/persistence keep the full audio.
        const overheadTokens = Math.ceil((system.length + JSON.stringify(tools ?? []).length) / 4);
        const sendHistory = this.stripStaleAudio(this.windowedHistory(ai.numCtx ?? DEFAULT_AI_NUM_CTX, overheadTokens));
        const turnHasAudio = sendHistory.some(m => m.audio?.length);
        // Thinking is split per-mode: chat defaults on (better answers, more context use); homebrew
        // defaults off (a reasoning model can burn its budget before emitting the create_* tool call).
        // Forced OFF whenever the turn carries audio — Gemma hallucinates/empties out on audio+thinking (#16584).
        const think = !turnHasAudio && (homebrew
            ? (ai.thinkingHomebrew ?? DEFAULT_AI_THINKING_HOMEBREW)
            : (ai.thinking ?? DEFAULT_AI_THINKING));

        this.controller = new AbortController();
        const signal = this.controller.signal;   // capture: cancel() nulls this.controller before our catch runs
        const epoch = this.turnEpoch;             // capture: a session swap mid-turn invalidates this turn
        this.setStatus("streaming");
        this.setActivePhase("thinking");   // the ticker shows phase-appropriate flavor until the answer streams
        this.setStreamingText("");
        this.setStreamingThinking("");

        const accumulators = new Map<number, { id: string; name: string; args: string }>();

        try {
            for await (const ev of provider.streamChat(sendHistory, tools, {
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
                        this.pushSystemBubble(ev.error);
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
            this.fail(friendlyError(e));
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
            // Record the assistant turn (text only — any partial tool calls are intentionally dropped) so
            // history stays consistent with the normal path. The bubble is a system message, not an answer.
            this.history.push({ role: "assistant", text: text || undefined });
            this.pushSystemBubble(text || "The model declined to respond to that request.");
            unflagRepairing();
            void this.persistCurrent();
            this.setStatus("idle");
            return;
        }

        if (stopReason === "error") {
            // The provider already surfaced the problem as a system bubble (the "error" event). Mark the
            // turn errored (not idle) so the UI shows the Retry affordance; history still ends at the user/
            // tool message, so retryLast() can re-run it. No assistant turn is recorded for a failed turn.
            unflagRepairing();
            this.setStatus("error");
            return;
        }

        // Record the assistant turn in history (text + any tool calls) for continuation. Thinking is
        // display-only and intentionally not replayed to the model.
        this.history.push({ role: "assistant", text: text || undefined, toolCalls: toolCalls.length ? toolCalls : undefined });
        // Only surface a bubble when there's something to show: real answer prose, or reasoning (which
        // only renders when the user opts into thoughts). A whitespace-only tool turn shows nothing.
        if (text.trim() || thinking) this.pushAssistantBubble(text, thinking);

        if (toolCalls.length) {
            // Every tool_use needs a tool_result, regardless of category — seed `outstanding` with ALL ids
            // up front so a mixed-category turn only continues once the LAST call (compute or user) resolves.
            this.outstanding = new Set(toolCalls.map(t => t.id));
            this.resolved = [];
            const [userSettings] = getUserSettings();
            const ai = userSettings().ai;
            const dndSystem = userSettings().dndSystem;

            // Partition by execution path. Compute/lookup auto-resolve (no UI; lookup is async); interactive
            // renders a card and waits for the user; control flips mode and auto-resolves; edit renders a diff
            // card; homebrew goes through the existing preview + usage-level routing. Homebrew keeps its
            // original index so parseFailed[idx] (built over the full toolCalls list) stays aligned.
            const computeCalls: AiToolCall[] = [];
            const interactiveCalls: AiToolCall[] = [];
            const lookupCalls: AiToolCall[] = [];
            const controlCalls: AiToolCall[] = [];
            const editCalls: AiToolCall[] = [];
            const pipelineCalls: AiToolCall[] = [];
            const homebrewCalls: { tc: AiToolCall; idx: number }[] = [];
            toolCalls.forEach((tc, idx) => {
                switch (toolCategory(tc.name)) {
                    case "compute": computeCalls.push(tc); break;
                    case "interactive": interactiveCalls.push(tc); break;
                    case "lookup": lookupCalls.push(tc); break;
                    case "control": controlCalls.push(tc); break;
                    case "edit": editCalls.push(tc); break;
                    case "pipeline": pipelineCalls.push(tc); break;
                    default: homebrewCalls.push({ tc, idx }); break;
                }
            });

            // Tell the status ticker what this turn is about to do (most "active" first). For pure
            // auto-resolve lookup turns this phase stays visible during the async wait (see the
            // streaming-status guard at the end of the turn).
            this.setActivePhase(
                lookupCalls.some(tc => tc.name === DELEGATE_RESEARCH_TOOL.name) ? "research"
                    : lookupCalls.length ? "lookup"
                    : computeCalls.length ? "compute"
                    : homebrewCalls.length ? "homebrew"
                    : editCalls.length ? "editing"
                    : "thinking",
            );

            // ---- Interactive: render cards now; their tool calls stay outstanding until the user answers. ----
            if (interactiveCalls.length) {
                this.setPendingInteractions(prev => [...prev, ...interactiveCalls.map(buildInteraction)]);
            }

            // ---- Control (switch_mode): flip mode and auto-resolve so the continuation turn re-derives its
            //      tool set. Short-circuit a no-op switch to the already-active mode (avoids a ping-pong loop). ----
            for (const tc of controlCalls) {
                const { mode, reason } = parseSwitchMode(tc);
                if (mode === this.mode()) {
                    this.resolveToolCall(tc.id, `Already in ${mode} mode.`, false);
                } else {
                    this.setMode(mode);
                    this.pushAssistantBubble(`⟳ Switched to ${mode === "homebrew" ? "Homebrew" : "Chat"} mode${reason ? ` — ${reason}` : ""}.`);
                    this.resolveToolCall(tc.id, `Mode is now "${mode}". The matching tools are available — continue.`, false);
                }
            }

            // ---- Pipeline (generate_*): resolve the seed immediately (NO continuation turn — the
            //      orchestrator IS the continuation) and start the standalone staged-generation run, which
            //      drives the model per step and renders its own GenPipelineCard. ----
            if (pipelineCalls.length) {
                for (const tc of pipelineCalls) {
                    this.resolvePipelineTrigger(tc.id, "Generation started — follow the generation panel.");
                    if (tc.name === "generate_character") this.startCharacterPipeline(tc, epoch);
                    else this.startClassPipeline(tc, epoch);
                }
                this.setStatus("idle");        // the pipeline card owns progress from here, not the chat ticker
                this.setActivePhase("idle");
                void this.persistCurrent();
                this.maybeGenerateTitle();
            }

            // ---- Edit (edit_homebrew): build a diff preview and surface it; it stays outstanding until the
            //      user accepts/rejects (no Low/Medium/High routing — it patches an existing entity). ----
            if (editCalls.length) {
                const editPreviews = editCalls.map(tc => buildEditPreview(tc, dndSystem));
                const surface = editPreviews.filter(p => !p.targetMissing);
                if (surface.length) this.setPendingPreviews(prev => [...prev.filter(p => !p.repairing), ...surface]);
                // A missing-target edit (wrong/unknown name) has no real card — feed the available names
                // straight back so the model retries with a correct name (or looks it up) instead of
                // stranding the user on a dead-end card it can only reject.
                for (const p of editPreviews) {
                    if (p.targetMissing) this.resolveToolCall(p.toolCallId, p.errors.join(" "), true);
                }
            }

            // ---- Lookup (+ research delegate): async auto-resolve. In a mixed turn other ids keep
            //      `outstanding` non-empty so these buffer; in a pure-lookup turn the last resolve starts the
            //      continuation turn (which sets its own streaming status). ----
            for (const tc of lookupCalls) {
                void this.resolveAsyncTool(tc, ai, epoch);
            }

            // ---- Compute: run deterministically and resolve immediately. In a mixed turn the other category
            //      ids keep `outstanding` non-empty so this only buffers results; in a pure-compute turn the
            //      final resolve empties `outstanding` and kicks off the continuation turn itself. ----
            for (const tc of computeCalls) {
                const r = runComputeTool(tc);
                this.resolveToolCall(tc.id, r.content, r.isError);
            }

            // ---- Homebrew: the existing preview build + Low/Medium/High routing, over the homebrew subset. ----
            if (homebrewCalls.length) {
                // Generation depth ≥ Medium: run the concept → creation mini-pipeline instead of a one-shot
                // build. The mini-pipeline is a single-run orchestrator, so only when exactly one homebrew
                // call landed this turn (the common case); a rare multi-call turn falls through to one-shot.
                const creationLevel = ai?.creationPipelineLevel ?? DEFAULT_CREATION_PIPELINE_LEVEL;
                if (creationLevel !== "low" && homebrewCalls.length === 1) {
                    const { tc } = homebrewCalls[0];
                    const kind = TOOL_TO_KIND[tc.name];
                    if (kind && supportsHomebrewPipeline(kind)) {
                        // Resolve the create_* call now (no continuation turn — the orchestrator is the
                        // continuation, like a generate_* seed), then launch the mini-pipeline.
                        this.resolvePipelineTrigger(tc.id, "Generation started — follow the generation panel.");
                        // Drop any "Complete with AI" card collapsed to "Improving…": a repair that routes into
                        // the mini-pipeline is superseded by the pipeline card (which yields the improved card via
                        // onComplete). Without this the old card is stranded showing "Improving with AI…" forever.
                        this.setPendingPreviews(prev => prev.filter(p => !p.repairing));
                        this.startHomebrewPipeline(kind, this.seedFromHomebrewCall(tc), epoch);
                        this.setStatus("idle");        // the pipeline card owns progress from here
                        this.setActivePhase("idle");
                        void this.persistCurrent();
                        this.maybeGenerateTitle();
                        return;
                    }
                }

                // The model produced its own reply this turn → it narrates the draft itself (it's prompted
                // to); only fall back to an app-emitted draft note when the create turn was tool-call-only.
                const modelSpoke = !!text.trim();

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
                    this.narrateDraft(show, modelSpoke);
                    void this.enrichWithCommands(show.filter(p => p.valid && hasFeatures(p.kind)).map(p => p.previewId), epoch);
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
                        this.narrateDraft(reviewing, modelSpoke);
                        void this.persistCurrent();
                        this.maybeGenerateTitle();
                        // If valid cards remain for the user, the turn is idle now; otherwise resolving the last
                        // failed call below starts a fresh turn (which manages its own streaming status).
                        if (reviewing.length) this.setStatus("idle");
                        void this.enrichThenReview(reviewing.map(p => p.previewId), epoch);
                        for (const p of schemaFailed) {
                            const reason = p.errors.length ? p.errors.join(" ") : "the response was cut off or its data could not be parsed";
                            this.resolveToolCall(p.toolCallId, repairInstruction(p, reason), true);
                        }
                        return;
                    }

                    // Schema budget spent (or nothing failed): the still-broken ones need the user's
                    // direction; the valid ones go through the readiness pipeline (which has its own
                    // reviewFixStreak budget). Both budgets reset only on the next request.
                    const needDirection = schemaFailed.map(p => ({ ...p, reviewState: "needs_user_direction" as ReviewState }));
                    const reviewing = schemaOk.map(p => ({ ...p, reviewState: "reviewing" as ReviewState }));
                    this.setPendingPreviews(prev => [...prev.filter(p => !p.repairing), ...needDirection, ...reviewing]);
                    this.narrateDraft(reviewing, modelSpoke);
                    void this.persistCurrent();
                    this.maybeGenerateTitle();
                    this.setStatus("idle");
                    void this.enrichThenReview(reviewing.map(p => p.previewId), epoch);
                    return;
                }

                // Low: drop any collapsed "Improving…" cards — their replacement has now arrived.
                this.setPendingPreviews(prev => [...prev.filter(p => !p.repairing), ...previews]);
                this.narrateDraft(previews, modelSpoke);
                // Enrich the surfaced feature-bearing entities with mechanical commands (no-op if disabled).
                void this.enrichWithCommands(previews.filter(p => p.valid && hasFeatures(p.kind)).map(p => p.previewId), epoch);
            } else {
                // No homebrew replacement arrived this turn — revert any collapsed "Improving…" cards so they
                // stay actionable instead of being stranded (a repair turn always regenerates via create_*).
                unflagRepairing();
            }

            // A pure-compute turn already resolved every call and started the continuation turn (which owns
            // the streaming status); bail so we don't flip it back to idle. Otherwise interactive/homebrew
            // cards (or buffered compute results) are waiting on the user — settle to idle and persist below.
            if (this.outstanding.size === 0) return;
            // Pure auto-resolve lookup/research turn — nothing for the user to act on, just async tools in
            // flight. Keep the working bubble (and its phase-appropriate ticker) visible during the wait
            // instead of flashing to idle; the async resolve starts the continuation turn (or settles to
            // idle) when it lands.
            if (lookupCalls.length && !interactiveCalls.length && !editCalls.length && !homebrewCalls.length) {
                void this.persistCurrent();
                return;
            }
        } else {
            // No replacement was produced (plain text / cut off) — revert any collapsed cards so they
            // stay actionable instead of being stranded in the "Improving…" state.
            unflagRepairing();
            this.mediumRetryStreak = 0;
            if (truncated) {
                // For local models the real ceiling is usually the context window (output comes out of
                // num_ctx), not the output cap — point there rather than at "max output tokens".
                const [settings] = getUserSettings();
                const hint = settings().ai?.provider === "local"
                    ? "Try again, or raise the model's context window (num_ctx) in AI settings."
                    : "Try again, or raise the model's max output tokens.";
                this.pushSystemBubble(`The response was cut off (the model hit its length limit). ${hint}`);
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
                let reviewErrored = false;
                try { verdicts = await assembleVerdicts(preview, { ai, dndSystem, signal }); }
                catch (e) { console.error("Readiness pipeline failed", e); verdicts = []; reviewErrored = true; }

                if (epoch !== this.turnEpoch || signal.aborted) return;
                const blocked = isBlocked(verdicts, blockingSeverity);
                const maxFixes = ai.review?.maxSchemaRetries ?? DEFAULT_HIGH_MAX_SCHEMA_RETRIES;
                // Resolving this preview regenerates it only when it's the sole outstanding tool call (the
                // common single-entity turn); otherwise a repair would stall behind the other cards, so we
                // fall through and surface the findings for the user to act on with "Improve with AI".
                const canRegenerateNow = this.outstanding.size === 1 && this.outstanding.has(preview.toolCallId);

                // ---- Auto-fix loop: on a BLOCKING review finding, feed the issues back and regenerate.
                //      Uses its OWN budget (reviewFixStreak) — separate from the pre-handoff schema gate so
                //      the two regeneration loops can't cannibalize each other's attempts. ----
                if (blocked && canRegenerateNow && this.reviewFixStreak < maxFixes) {
                    this.reviewFixStreak++;
                    const notes = verdicts.flatMap(v => v.issues).map(i => i.suggestedFix ? `${i.message} (${i.suggestedFix})` : i.message);
                    this.setPendingPreviews(prev => prev.map(p => p.previewId === id ? { ...p, repairing: true } : p));
                    const tool = KIND_TO_TOOL[preview.kind];
                    const instruction = notes.length
                        ? `A reviewer found problems with the ${preview.kind.replace("_", " ")} "${preview.title}". Call ${tool} again with the SAME content, fixing each of these:\n- ${notes.join("\n- ")}\nKeep everything that was already correct, and use concrete rules text.`
                        : repairInstruction(preview);
                    this.resolveToolCall(preview.toolCallId, instruction, true);   // → regenerates → re-reviews via a fresh turn
                    return;   // the regeneration turn re-runs the pipeline; stop this pass
                }

                // A thrown pass must NOT masquerade as "passed" (green "Reviewed" chip) — the entity was
                // not actually reviewed. Surface a neutral "review unavailable" state instead (Save still
                // allowed: p.valid already gates hard blockers, so this fails open without misrepresenting QC).
                const state: ReviewState = reviewErrored
                    ? "review_unavailable"
                    : (verdicts.some(v => !v.pass) ? "issues" : "passed");
                this.setPendingPreviews(prev => prev.map(p =>
                    p.previewId === id ? { ...p, reviewState: state, verdicts, reviewBlocked: blocked } : p));
                // Re-persist so a switch-away after review restores the reviewed card, not a stale "reviewing".
                void this.persistCurrent();
            }
        } finally {
            if (this.reviewController?.signal === signal) this.reviewController = null;
        }
    }

    /**
     * Post-generation command enrichment: for each feature-bearing preview, run the command sub-agent to
     * attach mechanical "mads" commands to the entity's features and patch the enriched entity back onto
     * the card. Runs SEQUENTIALLY (one local model at a time, like runReadiness) and at every usage level.
     * Fails open: a thrown/empty pass leaves the entity with plain features. Returns false if it was
     * aborted or the session swapped (so the High-mode caller skips the follow-on review).
     */
    private async enrichWithCommands(previewIds: string[], epoch: number): Promise<boolean> {
        if (!previewIds.length) return true;
        const [userSettings] = getUserSettings();
        const ai = userSettings().ai;
        if (!ai) return true;
        if (!(ai.commandGeneration ?? DEFAULT_AI_COMMAND_GENERATION)) return true;

        this.commandController = new AbortController();
        const signal = this.commandController.signal;
        try {
            for (const id of previewIds) {
                if (epoch !== this.turnEpoch || signal.aborted) return false;
                const preview = this.pendingPreviews().find(p => p.previewId === id);
                if (!preview || !preview.valid || !hasFeatures(preview.kind)) continue;   // gone / broken / no features

                this.setPendingPreviews(prev => prev.map(p => p.previewId === id ? { ...p, enriching: true } : p));
                // Status for the pipeline card's working line (no-op on the one-shot path, where no run
                // card is showing); the High mechanics stages refine it per stage via their own onNote.
                this.setRunNote(`Adding mechanics to “${preview.title}”…`);

                // Low runs the single whole-entity pass (cheapest — one turn). At Medium+ the focused
                // per-feature loop is the PRIMARY pass, not a gap-filler: small models follow the trimmed
                // per-feature cheat sheet far better than the whole-entity 16-row table (see commandAgent),
                // and the extra turns are what the depth ladder exists to buy. High additionally runs the
                // 4-stage Mechanics review below, merged on top.
                const level = ai.creationPipelineLevel ?? DEFAULT_CREATION_PIPELINE_LEVEL;

                let enriched: HomebrewPreview["entity"] | null = null;
                try {
                    if (level === "low") {
                        const stats = await attachCommandsWithStats(preview, ai, signal, { maxGapFill: 0 });
                        enriched = stats.entity;
                        DebugConsole.info(`[MADS] ${preview.title}: proposed ${stats.proposed}, attached ${stats.attached}`);
                    } else {
                        const gap = await gapFillCommands(preview, ai, signal, { maxPerFeaturePasses: PER_FEATURE_MADS_CAP });
                        enriched = gap.attached ? gap.entity : null;
                        DebugConsole.info(`[MADS] ${preview.title}: per-feature pass attached ${gap.attached}`);
                    }
                } catch (e) { console.error("Command enrichment failed", e); }

                if (epoch !== this.turnEpoch || signal.aborted) return false;

                // High generation depth: the multi-stage "Mechanics" review — describe how each feature changes
                // what/whom (fresh-context sub-agent), encode those self-effects into commands, then an
                // adversarial audit + fix pass (mechanicsStep). Runs AFTER the base pass and merges/dedupes onto it.
                let finalEntity = enriched ?? preview.entity;
                if (level === "high") {
                    try {
                        const reviewed = await runMechanicsReview(
                            { ...preview, entity: finalEntity }, ai, signal, note => this.setRunNote(note));
                        if (reviewed) finalEntity = reviewed;
                    } catch (e) { console.error("Mechanics review failed", e); }
                    if (epoch !== this.turnEpoch || signal.aborted) return false;
                }

                // Surface MECHANICAL features the MADS pass still left without a command: dev log, plus
                // `inertFeatures` on the card so the user sees a "no sheet effect" warning with a
                // "Generate commands" repair (regenerateCommands). Pure-flavor features legitimately have
                // none and are never listed.
                const missingMads = featuresMissingMads(preview.kind, finalEntity, true);
                if (missingMads.length) DebugConsole.warn(
                    `[MADS review] ${preview.title}: ${missingMads.length} mechanical feature(s) have no mads command — add mechanical info:`,
                    missingMads);

                this.setPendingPreviews(prev => prev.map(p =>
                    p.previewId === id ? { ...p, enriching: false, entity: finalEntity, inertFeatures: missingMads } : p));
                // Re-persist so the enriched entity (mads commands attached) survives a chat-history switch.
                void this.persistCurrent();
            }
            return true;
        } finally {
            if (this.commandController?.signal === signal) this.commandController = null;
        }
    }

    /** High mode: enrich first (so the reviewer sees the final entity), then run the readiness pipeline. */
    private async enrichThenReview(previewIds: string[], epoch: number) {
        const ok = await this.enrichWithCommands(previewIds, epoch);
        if (!ok) return;
        await this.runReadiness(previewIds, epoch);
    }

    /** Resolve an async auto-resolve tool (lookup_* / delegate_research). Drops a late result if the session swapped. */
    private async resolveAsyncTool(tc: AiToolCall, ai: AiSettings | undefined, epoch: number) {
        let r: { content: string; isError: boolean };
        try {
            r = tc.name === "delegate_research" ? await this.runDelegate(tc, ai, epoch) : await runLookupTool(tc);
        } catch (e) {
            r = { content: `Lookup failed: ${String(e)}`, isError: true };
        }
        if (epoch !== this.turnEpoch) return;   // session swapped while awaiting — drop the late result
        this.resolveToolCall(tc.id, r.content, r.isError);
    }

    /**
     * Run the research sub-agent in a fresh, isolated context (the heavy lookup loop never touches the main
     * history) and return a compact summary. Aborts cleanly on cancel/session-swap. Reuses runLookupTool as
     * the sub-agent's tool executor.
     */
    private async runDelegate(tc: AiToolCall, ai: AiSettings | undefined, epoch: number): Promise<{ content: string; isError: boolean }> {
        if (!ai) return { content: "AI is not configured.", isError: true };
        const task = String((tc.input ?? {}).task ?? "").trim();
        if (!task) return { content: "delegate_research needs a \"task\".", isError: true };
        this.delegateController = new AbortController();
        const signal = this.delegateController.signal;
        try {
            const result = await runSubAgent(researchAgentSpec(), task, ai, signal, runLookupTool);
            if (epoch !== this.turnEpoch || signal.aborted) return { content: "(research cancelled)", isError: true };
            return { content: result.ok && result.text.trim() ? result.text.trim() : "No research result.", isError: !result.ok };
        } finally {
            if (this.delegateController?.signal === signal) this.delegateController = null;
        }
    }

    private fail(message: string) {
        this.pushSystemBubble(message);
        // A repair turn that errored out shouldn't leave a card stuck collapsed.
        this.setPendingPreviews(prev => prev.some(p => p.repairing) ? prev.map(p => ({ ...p, repairing: false })) : prev);
        this.setStatus("error");
        this.setActivePhase("idle");
        this.setStreamingText("");
    }
}

/** Construct an isolated assistant — for tests that want a fresh instance instead of resetting the singleton. */
export const createAiAssistant = () => new AiAssistant();

const aiAssistant = new AiAssistant();
export { aiAssistant };
export default aiAssistant;
