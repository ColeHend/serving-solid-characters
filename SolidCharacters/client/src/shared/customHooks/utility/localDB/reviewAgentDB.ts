import Dexie from "dexie";
import type { HomebrewKind } from "../../../ai/refs/homebrewKind";
import type { ReviewSeverity } from "../../../../models/userSettings";

/**
 * A user-created "readiness subagent": a named LLM review pass with its own criteria, applied to chosen
 * homebrew kinds during High-mode review. Stored in its OWN Dexie database (mirroring chatHistoryDB),
 * NOT inside AiSettings — AiSettings is Clone()d on every settings keystroke, so a growing list of
 * prompts there would bloat every settings write.
 */
export interface ReviewAgentDef {
    id: string;
    name: string;
    enabled: boolean;
    /** Kinds this agent reviews. Empty array = applies to every kind. */
    appliesTo: HomebrewKind[];
    /** The reviewer's instruction — what it should judge. */
    criteria: string;
    /** Optional explicit pass/fail rubric, appended to the criteria. */
    rubric?: string;
    /** Caps how loud this agent's findings can be (its issues never exceed this severity). */
    severity: ReviewSeverity;
    /** Run order relative to other custom agents (lower first). */
    order?: number;
    createdAt: number;
    updatedAt: number;
}

class ReviewAgentDB extends Dexie {
    agents!: Dexie.Table<ReviewAgentDef, string>;

    constructor(name: string) {
        super(name);
        this.version(1).stores({ agents: "id, updatedAt" });
    }
}

const reviewAgentDB = new ReviewAgentDB("dnd_reviewAgents");

export default reviewAgentDB;
