// createLLM.ts
import { createSignal, batch } from "solid-js";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};
/* 
   How It Works:
    - messages is a signal holding the full conversation array. Every call to send appends a user message, 
   fires the request, then appends the assistant reply.
    - output is a signal that updates on every streamed token — any UI that reads output() will re-render 
    character by character, giving you the typewriter effect for free via SolidJS's fine-grained reactivity.
    - loading and error are standard request-state signals.
    - batch() groups multiple signal writes into one update pass so the UI doesn't flicker between intermediate states.
*/
type CreateLLMOptions = {
  /** Base URL, e.g. "https://api.openai.com" or "http://localhost:11434" */
  baseURL: string;
  /** API key (sent as Bearer token) */
  apiKey?: string;
  /** Model name, e.g. "gpt-4o", "llama3", "mistral-large-latest" */
  model: string;
  /** Optional system prompt prepended to every request */
  systemPrompt?: string;
  /** Use streaming (default: true) */
  stream?: boolean;
};

export function createLLM(options: CreateLLMOptions) {
  const [messages, setMessages] = createSignal<Message[]>(
    options.systemPrompt
      ? [{ role: "system", content: options.systemPrompt }]
      : []
  );
  const [output, setOutput] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const useStream = options.stream ?? true;

  // --- internal: non-streaming fetch ---
  async function fetchComplete(msgs: Message[]): Promise<string> {
    const res = await fetch(`${options.baseURL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(options.apiKey && { Authorization: `Bearer ${options.apiKey}` }),
      },
      body: JSON.stringify({
        model: options.model,
        messages: msgs,
        stream: false,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`API ${res.status}: ${body}`);
    }

    const json = await res.json();
    return json.choices[0].message.content;
  }

  // --- internal: streaming fetch ---
  async function fetchStream(
    msgs: Message[],
    onChunk: (text: string) => void
  ): Promise<string> {
    const res = await fetch(`${options.baseURL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(options.apiKey && { Authorization: `Bearer ${options.apiKey}` }),
      },
      body: JSON.stringify({
        model: options.model,
        messages: msgs,
        stream: true,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`API ${res.status}: ${body}`);
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let full = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE lines are separated by double newlines
      const lines = buffer.split("\n");
      // Keep the last (possibly incomplete) line in the buffer
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const payload = trimmed.slice(6); // strip "data: "
        if (payload === "[DONE]") break;

        try {
          const chunk = JSON.parse(payload);
          const token = chunk.choices?.[0]?.delta?.content ?? "";
          if (token) {
            full += token;
            onChunk(full); // pass the accumulated text so far
          }
        } catch {
          // ignore malformed chunks
        }
      }
    }

    return full;
  }

  // --- public: send a message ---
  async function send(userMessage: string): Promise<string> {
    batch(() => {
      setError(null);
      setLoading(true);
      setOutput("");
    });

    // Append the user message to history
    const updated: Message[] = [
      ...messages(),
      { role: "user", content: userMessage },
    ];
    setMessages(updated);

    try {
      let result: string;

      if (useStream) {
        result = await fetchStream(updated, (soFar) => setOutput(soFar));
      } else {
        result = await fetchComplete(updated);
        setOutput(result);
      }

      // Append assistant reply to history
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result },
      ]);

      return result;
    } catch (e: any) {
      setError(e.message ?? "Unknown error");
      throw e;
    } finally {
      setLoading(false);
    }
  }

  // --- public: reset conversation ---
  function clear() {
    batch(() => {
      setMessages(
        options.systemPrompt
          ? [{ role: "system", content: options.systemPrompt }]
          : []
      );
      setOutput("");
      setError(null);
    });
  }

  return {
    /** The current (or in-progress) assistant output */
    output,
    /** Full message history */
    messages,
    /** Whether a request is in flight */
    loading,
    /** Last error message, or null */
    error,
    /** Send a user message and get a response */
    send,
    /** Reset the conversation */
    clear,
  };
}