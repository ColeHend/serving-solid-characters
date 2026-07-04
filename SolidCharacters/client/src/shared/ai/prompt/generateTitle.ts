import { AiSettings, DEFAULT_AI_NUM_CTX } from "../../../models/userSettings";
import { buildProvider } from "../providers/providerFactory";
import { AiMessage } from "../types";
import { recordUsage } from "../usage";

/** The first exchange used to seed a conversation title. The assistant reply is optional. */
export interface TitleContext {
    user: string;
    assistant?: string;
}

// ZERO-PERSONA SURFACE: pure utility on a 32-token budget with think:false. Any Grimoire flavor here
// risks blowing the title — keep this plain and never thread the persona in.
const TITLE_SYSTEM_PROMPT =
    "You generate a short title for a Dungeons & Dragons chat. Reply with ONLY a 3 to 6 word " +
    "title in plain text. No quotes, no trailing punctuation, no markdown, no preamble.";

/** Hard caps so a chatty model can't blow up the title prompt or the resulting title. */
const CONTEXT_CHAR_CAP = 500;
const TITLE_CHAR_CAP = 60;
const DEFAULT_TIMEOUT_MS = 8000;

/**
 * Ask the model for a short title for a conversation, derived from its first exchange. Single-shot:
 * consumes the streaming provider and accumulates text. Returns the cleaned title, or `null` on any
 * failure (disabled/unconfigured AI, abort, timeout, empty/garbage output) so the caller can fall
 * back to a derived title. Never throws.
 *
 * Uses its OWN AbortController + timeout — it must never share the live chat turn's controller, or
 * cancelling one would cancel the other. `think:false` is required: a reasoning model would otherwise
 * spend the tiny token budget thinking and emit no title.
 */
export async function generateConversationTitle(
    ai: AiSettings | undefined,
    context: TitleContext,
    opts?: { timeoutMs?: number },
): Promise<string | null> {
    if (!ai?.enabled || !ai.model?.trim()) return null;
    const user = context.user?.trim();
    if (!user) return null;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    try {
        const provider = buildProvider(ai);
        const prompt = buildPrompt(context);
        const messages: AiMessage[] = [{ role: "user", text: prompt }];

        let raw = "";
        for await (const ev of provider.streamChat(messages, undefined, {
            model: ai.model,
            system: TITLE_SYSTEM_PROMPT,
            maxTokens: 32,
            numCtx: ai.numCtx ?? DEFAULT_AI_NUM_CTX,
            think: false,
            signal: ctrl.signal,
        })) {
            if (ev.type === "text_delta") raw += ev.text;
            else if (ev.type === "error") return null;
            else if (ev.type === "message_done") { if (ev.usage) recordUsage(ev.usage); break; }
        }
        return cleanTitle(raw);
    } catch {
        return null; // abort / timeout / network — caller falls back to the derived title
    } finally {
        clearTimeout(timer);
    }
}

function buildPrompt(context: TitleContext): string {
    const user = context.user.trim().slice(0, CONTEXT_CHAR_CAP);
    const assistant = context.assistant?.trim().slice(0, CONTEXT_CHAR_CAP);
    return assistant
        ? `First message:\n${user}\n\nAssistant reply:\n${assistant}`
        : `First message:\n${user}`;
}

/**
 * Normalize whatever the model returned into a clean title, or `null` if there's nothing usable.
 * Models like to wrap titles in quotes, prefix "Title:", or add markdown — strip all of that.
 */
function cleanTitle(raw: string): string | null {
    let t = raw.trim();
    if (!t) return null;

    // If reasoning/preamble leaked across lines, the title is almost always the last real line.
    const lines = t.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length > 1) t = lines[lines.length - 1];

    t = t
        .replace(/^(?:title|name)\s*[:\-–]\s*/i, "")          // drop a "Title:" / "Name -" label
        .replace(/^(?:sure|here(?:'s| is)[^:]*)[:,]\s*/i, "")  // drop "Sure, " / "Here's a title: "
        .replace(/[*_`#>]/g, "")                                // strip markdown markers
        .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")                 // strip surrounding quotes
        .replace(/\s+/g, " ")                                    // collapse whitespace
        .replace(/[\s.,;:!?-]+$/g, "")                          // trim trailing punctuation
        .trim();

    if (!t || !/[a-z0-9]/i.test(t)) return null; // empty or punctuation-only
    return t.length > TITLE_CHAR_CAP ? `${t.slice(0, TITLE_CHAR_CAP)}…` : t;
}
