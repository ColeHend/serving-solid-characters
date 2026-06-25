/**
 * Split a model's raw output into the user-facing answer and its leaked reasoning.
 *
 * Some local "thinking" models emit their chain-of-thought as ordinary content instead of through the
 * provider's structured reasoning field — especially when reasoning is turned off (Ollama then doesn't
 * parse the think section out). The leak takes a few shapes:
 *   - DeepSeek-style: `<think>…</think>answer`
 *   - Harmony/channel: `<|channel|>analysis<|message|>…<|channel|>final<|message|>answer`
 *   - Mangled variants seen in the wild: a `thought …<channel|>answer` blob
 *
 * In every case the user-facing answer is whatever follows the LAST reasoning/channel delimiter. We keep
 * that as `text` and stash the rest as `reasoning` (shown in the collapsed thinking block, not dropped),
 * then strip any stray control tokens from both. Plain answers with no markers pass through untouched.
 */
export function splitModelReasoning(raw: string): { text: string; reasoning: string } {
    let t = raw ?? "";
    let reasoning = "";

    // Explicit think tags (DeepSeek-R1 etc.): everything up to the closing tag is reasoning.
    for (const tag of ["think", "thinking"]) {
        const close = `</${tag}>`;
        const idx = t.lastIndexOf(close);
        if (idx >= 0) {
            reasoning += "\n" + t.slice(0, idx);
            t = t.slice(idx + close.length);
        }
    }

    // Harmony / channel formats: the answer follows the last channel/message marker; what precedes it is
    // the analysis channel. lastIndexOf across the known markers lands us on the final segment.
    const markers = ["<|channel|>final<|message|>", "<|message|>", "<channel|>", "<|channel|>"];
    let cut = -1;
    let cutLen = 0;
    for (const m of markers) {
        const idx = t.lastIndexOf(m);
        if (idx > cut) { cut = idx; cutLen = m.length; }
    }
    if (cut >= 0) {
        reasoning += "\n" + t.slice(0, cut);
        t = t.slice(cut + cutLen);
    }

    // Strip any leftover control tokens (e.g. <|start|>, <|end|>, stray <think>) from both parts.
    const strip = (s: string) => s
        .replace(/<\|[^|>]*\|>/g, "")
        .replace(/<\/?(?:think|thinking|analysis|channel|message)\b[^>]*>/gi, "")
        .trim();

    return { text: strip(t), reasoning: strip(reasoning) };
}
