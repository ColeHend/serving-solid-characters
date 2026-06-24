export type AiMode = "chat" | "homebrew";

function rulesetLabel(dndSystem: string): string {
    switch (dndSystem) {
        case "2014": return "the D&D 5e 2014 ruleset";
        case "2024": return "the D&D 5e 2024 ruleset";
        case "both": return "both the 2014 and 2024 D&D 5e rulesets";
        default: return "D&D 5e";
    }
}

/**
 * System prompt for the Spark assistant. In homebrew mode it nudges the model to call the matching
 * create_* tool; the user confirms every generated entity before it is saved (the harness gates the
 * actual persistence), so the model should generate freely and not ask permission to "save".
 */
export function buildSystemPrompt(dndSystem: string, mode: AiMode): string {
    const ruleset = rulesetLabel(dndSystem);
    const base = `You are Spark, a Dungeons & Dragons assistant embedded in a character-management app. Assume ${ruleset} unless the user says otherwise. Be concise and use Markdown for formatting.`;

    if (mode === "homebrew") {
        return `${base}

When the user asks you to create homebrew content (a spell, item, magic item, feat, background, race, subclass, or class), call the matching create_* tool with your best design for the requested content. Fill in every field you reasonably can. Generate the content directly — do not ask the user for confirmation before calling the tool, because the app shows the user a preview and they approve it before anything is saved. If the request is ambiguous, make sensible choices and note them in your reply. For questions that are not requests to create content, just answer normally without calling a tool.`;
    }

    return `${base} Answer questions about rules, lore, and play. If the user wants to create homebrew content, suggest they switch to "Homebrew" mode using the toggle above the message box.`;
}
