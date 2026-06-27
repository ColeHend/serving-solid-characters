import { AiSettings } from "../../../models/userSettings";
import { AiToolDef } from "../types";
import { str } from "../coerce";
import { runStep, StepModelRunner } from "./stepWorker";
import type {
    RunStepOptions, StepContext, StepResult, StepSpec, WorkingCharacter,
} from "./types";

/**
 * Phase 6 (plan §7): NARRATIVE — the last creative step, and the first that gives the character its NAME.
 * By now every mechanical decision is in the carry-forward summary, so the step is told to make the story
 * REFERENCE the mechanics (a Goliath Barbarian's rage shows up in the backstory; the naming style from the
 * brief governs the name). This is what makes the finished character read as one coherent thing rather than
 * a stat block with unrelated prose stapled on — the whole point of carrying everything forward (spec §5.2).
 */

/** The narrative fields the model writes. `name` finally names the character. */
export interface CharacterNarrative {
    name: string;
    alignment: string;
    appearance: string;
    backstory: string;
    bonds: string;
    ideals: string;
    flaws: string;
}

export const NARRATIVE_TOOL: AiToolDef = {
    name: "character_narrative",
    description:
        "Write the story of a D&D 5e character whose mechanics are fully decided (in DECIDED SO FAR): its NAME (following " +
        "the concept's naming style), alignment, appearance, backstory, and its bonds/ideals/flaws. The story MUST " +
        "reference the character's actual mechanics — its class, lineage, and signature features. Example: {\"name\":\"Varra " +
        "Stoneheart\",\"alignment\":\"Chaotic Good\",\"appearance\":\"...\",\"backstory\":\"...\",\"bonds\":\"...\",\"ideals\":\"...\"," +
        "\"flaws\":\"...\"}.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            name: { type: "string", description: "The character's name, following the concept's naming style." },
            alignment: { type: "string", description: "Moral/ethical alignment (e.g. \"Chaotic Good\")." },
            appearance: { type: "string", description: "A short physical description." },
            backstory: { type: "string", description: "A few sentences of backstory that reference the character's class, lineage, and features." },
            bonds: { type: "string", description: "What the character is bound to (people, places, causes)." },
            ideals: { type: "string", description: "The principles that drive the character." },
            flaws: { type: "string", description: "A meaningful weakness or vice." },
            fits_concept: { type: "string", description: "One line: how this story serves the concept." },
        },
        required: ["name", "backstory"],
    },
};

/** Coerce the model's untrusted narrative output (never throws). */
export function coerceNarrative(raw: Record<string, unknown>): CharacterNarrative {
    return {
        name: str(raw.name).trim(),
        alignment: str(raw.alignment).trim(),
        appearance: str(raw.appearance).trim(),
        backstory: str(raw.backstory).trim(),
        bonds: str(raw.bonds).trim(),
        ideals: str(raw.ideals).trim(),
        flaws: str(raw.flaws).trim(),
    };
}

const MIN_BACKSTORY = 40;

/** Gate the narrative: the character must be named and have a real backstory (not a one-liner). */
export function validateNarrative(n: CharacterNarrative): string[] {
    const errors: string[] = [];
    if (!n.name) errors.push("The character needs a name.");
    if (n.backstory.length < MIN_BACKSTORY) errors.push("Write a real backstory — a few sentences that reference the character's mechanics.");
    return errors;
}

/** Apply the narrative onto the working character. */
export function applyNarrative(working: WorkingCharacter, n: CharacterNarrative): void {
    working.name = n.name;
    working.alignment = n.alignment;
    working.appearance = n.appearance;
    working.backstory = n.backstory;
    working.bonds = n.bonds;
    working.ideals = n.ideals;
    working.flaws = n.flaws;
}

export function narrativeStep(): StepSpec<CharacterNarrative> {
    return {
        id: "narrative",
        tool: NARRATIVE_TOOL,
        system:
            "Write the story of a D&D 5e character whose mechanics are fully decided (in DECIDED SO FAR). Give it a name " +
            "in the concept's naming style, plus alignment, appearance, backstory, bonds, ideals, and flaws. The story " +
            "MUST reference the character's class, lineage, and signature features — make the mechanics and the fiction agree.",
        task:
            "Name the character (following the naming style) and write its alignment, appearance, backstory, bonds, " +
            "ideals, and flaws. The backstory must reference the character's actual class, lineage, and features.",
        parse: raw => {
            const value = coerceNarrative(raw);
            return { value, errors: validateNarrative(value) };
        },
    };
}

/** Run Phase 6 once: produce the gated narrative (and the character's name). */
export function produceNarrative(
    ctx: StepContext,
    ai: AiSettings,
    opts?: RunStepOptions,
    runner?: StepModelRunner,
): Promise<StepResult<CharacterNarrative>> {
    return runStep(narrativeStep(), ctx, ai, opts, runner);
}
