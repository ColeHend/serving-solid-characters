import { AiToolDef } from "../types";
import { MAD_CATEGORIES } from "./madCommandCatalog";

/**
 * The single structured-output tool the homebrew command sub-agent is forced to call (mirrors
 * reviewTool.ts's REPORT_REVIEW_TOOL). Reusing tool-calling gives far more reliable structured output
 * from small local models than free-text JSON. One call returns the commands for every feature of the
 * entity, so the pass is one model turn per entity.
 *
 * The model expresses each effect as {type, category, value, target}; commandAgent.ts validates/coerces
 * `value` against madCommandCatalog and resolves `target` (a name) to a catalog id, dropping anything
 * that doesn't resolve. Keep this description procedurally neutral (ZERO-PERSONA surface).
 */
export const ATTACH_COMMANDS_TOOL: AiToolDef = {
    name: "attach_commands",
    description:
        "Report the concrete mechanical character-changes each feature grants, so they can be applied to a " +
        "character sheet. Call this exactly once. Only include a command when the feature text clearly and " +
        "explicitly grants that effect; pure flavor features get no commands. Never invent effects.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            features: {
                type: "array",
                description: "One entry per feature that has at least one mechanical effect. Omit pure-flavor features.",
                items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                        name: { type: "string", description: "The exact feature name, copied from the list you were given." },
                        commands: {
                            type: "array",
                            description: "The mechanical effects this feature grants.",
                            items: {
                                type: "object",
                                additionalProperties: false,
                                properties: {
                                    type: { type: "string", enum: ["Add", "Remove"], description: "Add grants the effect; Remove takes it away." },
                                    category: { type: "string", enum: [...MAD_CATEGORIES], description: "The kind of change." },
                                    value: {
                                        type: "object",
                                        description: "The fields for this category (string values), e.g. {\"damageType\":\"Fire\"} or {\"bonus\":\"13\",\"stats\":\"dex\"} or {\"stat\":\"con\",\"statValue\":\"1\"}. " +
                                            "For 'ability of your choice' stat increases use {\"stat\":\"choice\",\"options\":\"str,dex\",\"statValue\":\"1\"}; for 'your score IS N' effects add \"mode\":\"set\".",
                                        additionalProperties: { type: "string" },
                                    },
                                    target: { type: "string", description: "For Spells/Items/Features/Feats only: the exact name of the referenced entity." },
                                },
                                required: ["type", "category"],
                            },
                        },
                    },
                    required: ["name", "commands"],
                },
            },
        },
        required: ["features"],
    },
};
