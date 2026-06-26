import Dexie from "dexie";
import type { HomebrewKind } from "../../../ai/refs/homebrewKind";
import type { PatchOp } from "../../../ai/tools/patch";

/**
 * A persisted record of a change Grimoire made to homebrew (create / edit / delete). The app writes one on
 * every committed change; the model may add a one-line summary. Stored in its OWN Dexie database
 * (mirroring reviewAgentDB / chatHistoryDB), NOT in AiSettings.
 */
export interface DecisionLogEntry {
    id: string;
    entityKind: HomebrewKind;
    entityName: string;
    changeType: "create" | "edit" | "delete";
    /** App-derived (kind + changed fields), optionally prefixed with the model's one-line "what/why". */
    summary: string;
    /** For edits — the patch ops that were applied (for the expandable diff in the log UI). */
    patch?: PatchOp[];
    /** Links back to the chat that produced this change (chatHistoryDB). */
    conversationId?: string;
    previewId?: string;
    timestamp: number;
}

class DecisionLogDB extends Dexie {
    entries!: Dexie.Table<DecisionLogEntry, string>;

    constructor(name: string) {
        super(name);
        this.version(1).stores({ entries: "id, timestamp, entityKind" });
    }
}

const decisionLogDB = new DecisionLogDB("dnd_decisionLog");

export default decisionLogDB;
