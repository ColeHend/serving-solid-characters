import { AiToolDef, AiToolCall } from "../types";
import { AiMode } from "../prompt/systemPrompt";

/**
 * switch_mode — a control tool that lets the model change its own mode when it needs a tool the current
 * mode doesn't expose (e.g. it's in chat mode and the user asks to create homebrew). Routed as the
 * "control" category in toolCategory.ts: the orchestrator flips the mode and auto-resolves, so the
 * continuation turn re-derives its tool set and the create_* tools become available. No card, no wait.
 */
export const SWITCH_MODE_TOOL: AiToolDef = {
    name: "switch_mode",
    description:
        "Switch your own mode when you need a tool the current mode doesn't have. Call switch_mode(\"homebrew\") before creating or editing content if you're in chat mode; the app enables the create_*/edit tools and you continue automatically. Switch to \"chat\" only when the user is done creating and just wants to talk. Don't claim you created anything until after switching.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            mode: { type: "string", enum: ["chat", "homebrew"], description: "The mode to switch to." },
            reason: { type: "string", description: "One short sentence on why (shown to the user)." },
        },
        required: ["mode"],
    },
};

export const CONTROL_TOOLS: AiToolDef[] = [SWITCH_MODE_TOOL];

/** Parse a switch_mode call's target mode; defaults to homebrew (the common "I need to create" case). */
export function parseSwitchMode(tc: AiToolCall): { mode: AiMode; reason: string } {
    const i = (tc.input ?? {}) as Record<string, unknown>;
    const mode: AiMode = i.mode === "chat" ? "chat" : "homebrew";
    const reason = typeof i.reason === "string" ? i.reason : "";
    return { mode, reason };
}
