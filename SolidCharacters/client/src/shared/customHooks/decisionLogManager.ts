import { Accessor, createSignal } from "solid-js";
import decisionLogDB, { DecisionLogEntry } from "./utility/localDB/decisionLogDB";
import { createNewId } from "./utility/tools/idGen";

/**
 * Singleton store for the homebrew decision log (mirrors reviewAgentManager). The app appends an entry
 * whenever Spark commits a create/edit; the log UI reads the reactive list. Kept in its own Dexie DB so
 * it never bloats settings or chat history.
 */
const [entries, setEntries] = createSignal<DecisionLogEntry[]>([]);

/** Reactive list of decision-log entries (most recent first). */
export const decisionLog: Accessor<DecisionLogEntry[]> = entries;

let loaded = false;
let loading: Promise<void> | null = null;

/** Load the log from IndexedDB once (idempotent). */
export function ensureDecisionLogLoaded(): Promise<void> {
    if (loaded) return Promise.resolve();
    if (loading) return loading;
    loading = decisionLogDB.entries.orderBy("timestamp").reverse().toArray()
        .then(rows => { setEntries(rows); loaded = true; })
        .catch(e => { console.error("Failed to load decision log", e); })
        .finally(() => { loading = null; });
    return loading;
}

/** Refresh the reactive list from IndexedDB. */
export async function loadDecisionLog(): Promise<void> {
    try {
        setEntries(await decisionLogDB.entries.orderBy("timestamp").reverse().toArray());
        loaded = true;
    } catch (e) {
        console.error("Failed to load decision log", e);
    }
}

/**
 * Append a decision-log entry. Fire-and-forget from the caller's perspective (never throws into a turn);
 * `timestamp`/`id` are assigned here. Updates the reactive list optimistically so the UI reflects it.
 */
export async function logDecision(input: Omit<DecisionLogEntry, "id" | "timestamp">): Promise<void> {
    const entry: DecisionLogEntry = { ...input, id: createNewId(), timestamp: Date.now() };
    try {
        setEntries(prev => [entry, ...prev]);
        await decisionLogDB.entries.put(entry);
    } catch (e) {
        console.error("Failed to write decision log entry", e);
    }
}

export async function clearDecisionLog(): Promise<void> {
    try { await decisionLogDB.entries.clear(); }
    catch (e) { console.error("Failed to clear decision log", e); }
    setEntries([]);
}
