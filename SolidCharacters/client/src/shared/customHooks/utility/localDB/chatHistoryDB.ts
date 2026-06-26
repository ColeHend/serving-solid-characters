import Dexie from "dexie";
import type { AiMessage } from "../../../ai/types";
import type { AiMode } from "../../../ai/prompt/systemPrompt";
import type { ChatMessage } from "../../aiAssistant";

/**
 * A saved Grimoire conversation. Persists enough to RESUME the chat: the provider-facing `history`
 * (what the model is sent) plus the rendered `messages` (the bubbles). Transient turn state
 * (pendingPreviews, outstanding tool calls, repair counts) is intentionally NOT stored.
 */
export interface SavedConversation {
    id: string;
    title: string;
    mode: AiMode;
    history: AiMessage[];
    messages: ChatMessage[];
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
