import Dexie from "dexie";
import type { AiMessage, UsageTotals } from "../../../ai/types";
import type { AiMode } from "../../../ai/prompt/systemPrompt";
import type { ChatMessage } from "../../aiAssistant";
import type { HomebrewPreview } from "../../../ai/tools/toolDispatcher";

/**
 * A saved Grimoire conversation. Persists enough to RESUME the chat: the provider-facing `history`
 * (what the model is sent) plus the rendered `messages` (the bubbles). Most transient turn state
 * (outstanding tool calls, repair counts, in-flight interactions) is intentionally NOT stored — but the
 * pending homebrew save-choice cards ARE, so they survive a chat-history switch and are restored as
 * "detached" (save/reject only) cards on load.
 */
export interface SavedConversation {
    id: string;
    title: string;
    mode: AiMode;
    history: AiMessage[];
    messages: ChatMessage[];
    /** Unconfirmed homebrew preview cards, sanitized of in-flight flags. Restored detached on load. */
    pendingPreviews?: HomebrewPreview[];
    /** Cumulative token usage for this conversation (in+out+count), restored into the header on load. Absent on pre-feature rows. */
    usage?: UsageTotals;
    createdAt: number;
    updatedAt: number;
}

class ChatHistoryDB extends Dexie {
    conversations!: Dexie.Table<SavedConversation, string>;

    constructor(name: string) {
        super(name);
        // `updatedAt` is indexed so the list query can orderBy("updatedAt").reverse().
        this.version(1).stores({ conversations: "id, updatedAt" });
    }
}

const chatHistoryDB = new ChatHistoryDB("dnd_chatHistory");

export default chatHistoryDB;
