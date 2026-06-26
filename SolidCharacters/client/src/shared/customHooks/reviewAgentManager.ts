import { Accessor, createSignal } from "solid-js";
import reviewAgentDB, { ReviewAgentDef } from "./utility/localDB/reviewAgentDB";
import { createNewId } from "./utility/tools/idGen";
import { setCustomAgentResolver } from "../ai/readiness/pipeline";
import { ReviewPassSpec } from "../ai/readiness/reviewSystemPrompt";
import { HomebrewKind } from "../ai/refs/homebrewKind";

/**
 * Singleton store for user-created review agents (mirrors homebrewManager / aiAssistant). Backs both the
 * builder UI and the readiness pipeline from one reactive source. Registers the pipeline's custom-agent
 * resolver on import, so High-mode reviews pick up custom agents without the pipeline knowing about Dexie.
 */
const [agents, setAgents] = createSignal<ReviewAgentDef[]>([]);

/** Reactive list of all saved review agents (most-recently-updated first). */
export const reviewAgents: Accessor<ReviewAgentDef[]> = agents;

let loaded = false;
let loading: Promise<void> | null = null;

/** Load the agents from IndexedDB once (idempotent); subsequent calls return the same in-flight promise. */
export function ensureReviewAgentsLoaded(): Promise<void> {
    if (loaded) return Promise.resolve();
    if (loading) return loading;
    loading = reviewAgentDB.agents.orderBy("updatedAt").reverse().toArray()
        .then(rows => { setAgents(rows); loaded = true; })
        .catch(e => { console.error("Failed to load review agents", e); })
        .finally(() => { loading = null; });
    return loading;
}

/** Refresh the reactive list from IndexedDB. */
export async function loadReviewAgents(): Promise<void> {
    try {
        setAgents(await reviewAgentDB.agents.orderBy("updatedAt").reverse().toArray());
        loaded = true;
    } catch (e) {
        console.error("Failed to load review agents", e);
    }
}

/** Create or update a review agent (id assigned if absent). Returns the persisted record. */
export async function saveReviewAgent(input: Omit<ReviewAgentDef, "id" | "createdAt" | "updatedAt"> & Partial<Pick<ReviewAgentDef, "id" | "createdAt">>): Promise<ReviewAgentDef> {
    const now = Date.now();
    const def: ReviewAgentDef = {
        ...input,
        id: input.id || createNewId(),
        createdAt: input.createdAt ?? now,
        updatedAt: now,
    };
    await reviewAgentDB.agents.put(def);
    await loadReviewAgents();
    return def;
}

export async function deleteReviewAgent(id: string): Promise<void> {
    try { await reviewAgentDB.agents.delete(id); }
    catch (e) { console.error("Failed to delete review agent", e); }
    await loadReviewAgents();
}

/** Map a stored agent to a pipeline review spec (criteria + rubric → the reviewer's instruction). */
function specForAgent(a: ReviewAgentDef): ReviewPassSpec {
    const criteria = a.rubric?.trim() ? `${a.criteria}\n\nPass/fail rubric:\n${a.rubric}` : a.criteria;
    return { passId: a.id, label: a.name, criteria, severity: a.severity };
}

// Register the resolver the pipeline calls for custom passes. Reads the current signal value (no reactive
// scope needed); kinds with an empty appliesTo apply to everything.
setCustomAgentResolver((kind: HomebrewKind): ReviewPassSpec[] =>
    agents()
        .filter(a => a.enabled && (a.appliesTo.length === 0 || a.appliesTo.includes(kind)))
        .sort((x, y) => (x.order ?? 0) - (y.order ?? 0))
        .map(specForAgent),
);
