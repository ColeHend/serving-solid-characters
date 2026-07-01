import { AiToolDef } from "../types";
import { MAD_CATEGORIES } from "./madCommandCatalog";

/**
 * Structured-output tools for the High-depth "Mechanics" review (genPipeline/mechanicsStep): a describe pass
 * that extracts WHAT each feature changes and WHO it changes, and an adversarial audit pass that finds
 * self-effects with no matching command. Both mirror reviewTool.ts/attachCommandsTool.ts — forcing one tool
 * call is far more reliable from small local models than free-text JSON. ZERO-PERSONA surface (procedural).
 */

/** Stage 1 — pull each feature's concrete mechanical effects and who they affect (self vs other). */
export const DESCRIBE_MECHANICS_TOOL: AiToolDef = {
    name: "describe_mechanics",
    description:
        "Report the concrete mechanical effects each feature grants and who each effect changes, so they can " +
        "be turned into character-sheet commands. Call this exactly once. List only effects the feature text " +
        "explicitly states; pure-flavor features get no effects. Never invent effects.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            features: {
                type: "array",
                description: "One entry per feature that grants at least one mechanical effect. Omit pure-flavor features.",
                items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                        name: { type: "string", description: "The exact feature name, copied from the list you were given." },
                        effects: {
                            type: "array",
                            description: "Each concrete mechanical change this feature grants.",
                            items: {
                                type: "object",
                                additionalProperties: false,
                                properties: {
                                    change: {
                                        type: "string",
                                        description: "One concrete mechanical change in plain words, e.g. \"resistance to fire damage\", " +
                                            "\"+1 Constitution\", \"proficiency in Stealth\", \"walking speed +10 ft\", \"learns the Light cantrip\".",
                                    },
                                    affects: {
                                        type: "string",
                                        enum: ["self", "other"],
                                        description: "\"self\" = it changes THIS character's own sheet; \"other\" = it affects an ally, a target, or an enemy.",
                                    },
                                },
                                required: ["change", "affects"],
                            },
                        },
                    },
                    required: ["name", "effects"],
                },
            },
        },
        required: ["features"],
    },
};

/** Stage 3 — adversarial audit: report described self-effects that have no command but could. */
export const REVIEW_MECHANICS_TOOL: AiToolDef = {
    name: "report_missing_mechanics",
    description:
        "Report self-effects that SHOULD have a character-sheet command but currently have none. Call this " +
        "exactly once. Be adversarial: assume commands are missing and look hard. Only report an effect if it " +
        "maps to one of the listed command categories and is not already covered by a current command.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            missing: {
                type: "array",
                description: "Each self-effect that has no matching command but could. Leave empty if every self-effect is already covered.",
                items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                        feature: { type: "string", description: "The exact feature name the effect belongs to." },
                        effect: { type: "string", description: "The described self-effect that has no command, in plain words." },
                        category: { type: "string", enum: [...MAD_CATEGORIES], description: "The command category that should represent it." },
                    },
                    required: ["feature", "effect", "category"],
                },
            },
        },
        required: ["missing"],
    },
};
