import { AiToolCall, AiToolDef } from "./types";
import { createNewId } from "../customHooks/utility/tools/idGen";

/**
 * Interactive tools (ask_user, propose_plan). Unlike compute tools they render a card and WAIT for the
 * user; the user's response becomes the tool_result that continues the turn. This module owns the tool
 * schemas, the non-persisted PendingInteraction card model, and the pure builders that turn a tool call
 * into a card (buildInteraction) and a user response into the tool_result text (interactionResultText).
 *
 * PendingInteractions are transient like HomebrewPreviews — never persisted; on reload balancedHistory()
 * drops the trailing unanswered tool call and the chat resumes wire-valid.
 */

export type InteractionKind = "ask" | "plan";

export interface InteractionOption {
    id: string;        // stable id (index-based when the model omits one)
    label: string;
    detail?: string;   // one-line description shown under the option
}

export interface PendingInteraction {
    interactionId: string;   // local UI id
    toolCallId: string;      // originating AiToolCall id → the follow-up tool_result
    kind: InteractionKind;
    title: string;           // the question, or the plan's goal
    body?: string;           // optional Markdown context / rationale shown above the controls
    // ----- ask -----
    style?: "question" | "directions";
    options?: InteractionOption[];
    allowFreeText?: boolean;
    // ----- plan -----
    steps?: string[];
    constraints?: string[];
    // ----- shared -----
    answered?: boolean;      // set on resolve so a re-render can't double-submit
}

/** The user's reply to a card, turned into the tool_result by interactionResultText. */
export type InteractionResponse =
    | { type: "option"; optionId: string; label: string }
    | { type: "freeText"; text: string }
    | { type: "plan_accept" }
    | { type: "plan_refine"; text: string }
    | { type: "plan_reject" }
    | { type: "dismiss" };

// ----- coercers (model output is untrusted JSON) -----
const str = (v: unknown, d = ""): string => (typeof v === "string" ? v : v == null ? d : String(v));
const strList = (v: unknown): string[] =>
    (Array.isArray(v) ? v : []).map(x => str(x).trim()).filter(s => s.length > 0);

export const ASK_USER_TOOL: AiToolDef = {
    name: "ask_user",
    description: "Ask the user a question or offer several directions and WAIT for their choice before continuing. Use when you genuinely need a decision or a missing detail. Do NOT use it to ask permission to create content — generate directly instead. Example: {\"prompt\":\"Which feel should the subclass have?\",\"style\":\"directions\",\"options\":[{\"label\":\"Glass cannon\",\"detail\":\"High damage, fragile\"},{\"label\":\"Bruiser\",\"detail\":\"Durable melee\"}],\"allowFreeText\":true}.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            prompt: { type: "string", description: "The question, or the prompt that frames the choices. Never leave empty." },
            style: { type: "string", enum: ["question", "directions"], description: "\"question\" for a plain question, \"directions\" when the options are distinct approaches to pursue. Default question." },
            options: {
                type: "array",
                description: "2-5 choices to show as buttons. Omit for a free-text-only question.",
                items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                        label: { type: "string", description: "Short choice label shown on the button." },
                        detail: { type: "string", description: "Optional one-line description shown under the label." },
                    },
                    required: ["label"],
                },
            },
            allowFreeText: { type: "boolean", description: "Also show a free-text box so the user can type their own answer. Default false." },
            context: { type: "string", description: "Optional extra context (Markdown) shown above the choices." },
        },
        required: ["prompt"],
    },
};

export const PROPOSE_PLAN_TOOL: AiToolDef = {
    name: "propose_plan",
    description: "Propose a short design goal and plan for the user to Approve, Refine, or Reject before you do a multi-step build (e.g. a whole subclass with several features). Wait for their decision. Example: {\"goal\":\"Build a frost-themed Fighter subclass\",\"steps\":[\"Define the theme and level-3 feature\",\"Add features at 7/10/15/18\",\"Balance-check damage\"],\"constraints\":[\"No spellcasting\"]}.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            goal: { type: "string", description: "The design goal in one sentence. Never leave empty." },
            steps: { type: "array", items: { type: "string" }, description: "2-6 ordered steps you will take." },
            constraints: { type: "array", items: { type: "string" }, description: "Optional guardrails the user cares about (rarity, no spellcasting, etc.)." },
            rationale: { type: "string", description: "Optional one-paragraph explanation of the approach." },
        },
        required: ["goal", "steps"],
    },
};

/** Build a non-persisted interaction card from a tool call. Coerces untrusted JSON; never throws. */
export function buildInteraction(tc: AiToolCall): PendingInteraction {
    const i = (tc.input ?? {}) as Record<string, unknown>;
    const base = { interactionId: createNewId(), toolCallId: tc.id };

    if (tc.name === "propose_plan") {
        return {
            ...base,
            kind: "plan",
            title: str(i.goal) || "(plan)",
            body: str(i.rationale) || undefined,
            steps: strList(i.steps),
            constraints: strList(i.constraints),
        };
    }

    // ask_user (and any unexpected interactive name) → an "ask" card.
    const rawOptions = Array.isArray(i.options) ? i.options : [];
    const options: InteractionOption[] = rawOptions
        .map((raw, idx) => {
            const o = raw as Record<string, unknown>;
            return { id: `opt-${idx}`, label: str(o.label).trim(), detail: str(o.detail).trim() || undefined };
        })
        .filter(o => o.label.length > 0);
    const style = str(i.style) === "directions" ? "directions" : "question";
    // A degenerate call with neither options nor free text would render nothing — fall back to free text.
    const allowFreeText = i.allowFreeText === true || options.length === 0;
    return {
        ...base,
        kind: "ask",
        title: str(i.prompt) || "(question)",
        body: str(i.context) || undefined,
        style,
        options,
        allowFreeText,
    };
}

/** The tool_result text fed back to the model for a given user response. */
export function interactionResultText(p: PendingInteraction, response: InteractionResponse): string {
    switch (response.type) {
        case "option": {
            const opt = p.options?.find(o => o.id === response.optionId);
            const detail = opt?.detail ? ` (${opt.detail})` : "";
            return `The user chose: "${response.label}"${detail}.`;
        }
        case "freeText":
            return `The user answered: "${response.text}".`;
        case "plan_accept": {
            const steps = (p.steps ?? []).map((s, idx) => `${idx + 1}. ${s}`).join("\n");
            const constraints = (p.constraints ?? []).length ? `\nConstraints: ${(p.constraints ?? []).join("; ")}` : "";
            return `The user APPROVED this plan. Proceed:\nGoal: ${p.title}${steps ? `\nSteps:\n${steps}` : ""}${constraints}`;
        }
        case "plan_refine":
            return `The user wants to adjust the plan: "${response.text}". Revise the plan (call propose_plan again with the changes) before proceeding.`;
        case "plan_reject":
            return "The user rejected this plan. Ask what they'd prefer instead before generating anything.";
        case "dismiss":
            return "The user did not act on this.";
    }
}
