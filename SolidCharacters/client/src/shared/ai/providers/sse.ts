/**
 * Minimal Server-Sent Events reader over a fetch ReadableStream. Buffers across chunk
 * boundaries, splits events on a blank line, and yields one `{event?, data}` per event.
 *
 * NOTE: we deliberately do NOT reuse httpClientObs.streamText — that helper emits already-decoded
 * text with no SSE framing, so it can't distinguish events / data lines / comments.
 */
export interface SseEvent {
    event?: string;
    data: string;
}

export async function* parseSse(
    body: ReadableStream<Uint8Array>,
    signal?: AbortSignal,
): AsyncGenerator<SseEvent, void, unknown> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
        while (true) {
            if (signal?.aborted) break;
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            // Normalize CRLF so we can split on a single blank-line delimiter.
            buffer = buffer.replace(/\r\n/g, "\n");
            let sep: number;
            while ((sep = buffer.indexOf("\n\n")) !== -1) {
                const raw = buffer.slice(0, sep);
                buffer = buffer.slice(sep + 2);
                const parsed = parseBlock(raw);
                if (parsed) yield parsed;
            }
        }
        // Flush any trailing event that wasn't terminated by a blank line.
        const tail = parseBlock(buffer);
        if (tail) yield tail;
    } finally {
        try { reader.releaseLock(); } catch { /* already released */ }
    }
}

function parseBlock(raw: string): SseEvent | null {
    let event: string | undefined;
    const dataLines: string[] = [];
    for (const line of raw.split("\n")) {
        if (!line || line.startsWith(":")) continue; // blank or comment
        if (line.startsWith("event:")) {
            event = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
            // SSE allows an optional single leading space after the colon.
            dataLines.push(line.slice(5).replace(/^ /, ""));
        }
    }
    if (dataLines.length === 0 && event === undefined) return null;
    return { event, data: dataLines.join("\n") };
}
