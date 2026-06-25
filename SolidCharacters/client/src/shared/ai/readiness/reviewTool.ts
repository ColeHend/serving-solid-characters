import { AiToolDef } from "../types";

/**
 * The single structured-output tool every LLM review pass (built-in or custom) is forced to call.
 * Reusing tool-calling — which the app already relies on for homebrew generation — gives far more
 * reliable structured output from small local models than asking for free-text JSON (which would need
 * the kind of regex-scrubbing generateTitle.ts does). One tool, one call, one verdict.
 */
export const REPORT_REVIEW_TOOL: AiToolDef = {
    name: "report_review",
    description: "Report the result of reviewing a homebrew D&D entity. Always call this exactly once with your verdict. Set pass=false only when there is a real, concrete problem — not for stylistic nitpicks.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            pass: { type: "boolean", description: "true if the entity is acceptable as-is for this review's focus." },
            severity: {
                type: "string",
                enum: ["info", "warning", "error"],
                description: "Worst severity found. Use \"error\" ONLY for genuinely broken or clearly abusable content; \"warning\" for things worth fixing; \"info\" for minor notes. If pass is true, use \"info\".",
            },
            issues: {
                type: "array",
                description: "The specific problems found. Leave empty if pass is true.",
                items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                        message: { type: "string", description: "One concrete problem, stated plainly in one sentence." },
                        field: { type: "string", description: "Which field it concerns, if applicable (e.g. \"description\", \"level\")." },
                        suggestedFix: { type: "string", description: "A concrete fix, if you have one." },
                    },
                    required: ["message"],
                },
            },
        },
        required: ["pass", "severity"],
    },
};
