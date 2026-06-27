import Dexie from "dexie";
import type { HomebrewKind } from "../../../ai/refs/homebrewKind";
import type { PatchOp } from "../../../ai/tools/patch";

/**
 * The kind of thing a decision-log entry is about: any homebrew kind, plus `"character"` for the staged
 * character-generation pipeline (a generated character isn't homebrew, but it IS a committed creation worth
 * logging alongside the rest — plan §10/§13 M6). `kindLabel` falls back to the raw value for "character".
 */
export type DecisionEntityKind = HomebrewKind | "character";

/**
 * A persisted record of a change Grimoire made (create / edit / delete) to homebrew or a generated
 * character. The app writes one on every committed change; the model may add a one-line summary. Stored in
 * its OWN Dexie database (mirroring reviewAgentDB / chatHistoryDB), NOT in AiSettings.
 */
export interface DecisionLogEntry {
    id: string;
    entityKind: DecisionEntityKind;
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
