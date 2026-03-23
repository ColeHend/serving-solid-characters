import { createLLM } from "./aiHelpers";
import { For, Show } from "solid-js";
/*
A few things worth considering if you take this further:
  Abort support — store an AbortController and pass its signal to fetch so users can cancel in-flight requests. 
Wire it to a "Stop" button that replaces "Send" while loading() is true.
  Token counting — the messages array grows unbounded. For long conversations, you'll eventually hit context limits. 
You can trim older messages or summarize them before sending.
  Retry logic — rate limits (429) and transient server errors (500/503) are common. A simple exponential backoff with 2–3 retries goes a long way.
  Key safety — never ship API keys in client-side code for production. Proxy through your own backend that attaches the key server-side. 
For local dev and prototyping, environment variables via import.meta.env are fine.
*/

function Chat() {
  let inputRef!: HTMLTextAreaElement;
  const URL = "https://api.openai.com"; // or your custom endpoint
  const APIKEY = 'CoolKey'; // or undefined if not needed
  const llm = createLLM({
    baseURL: URL,
    apiKey: APIKEY,
    model: "gpt-4o",
    systemPrompt: "You are a concise, helpful assistant.",
  });

  async function handleSend() {
    const text = inputRef.value.trim();
    if (!text || llm.loading()) return;
    inputRef.value = "";
    await llm.send(text);
  }

  return (
    <div>
      {/* Message history */}
      <For each={llm.messages()}>
        {(msg) => (
          <Show when={msg.role !== "system"}>
            <div class={msg.role}>
              <strong>{msg.role}:</strong> {msg.content}
            </div>
          </Show>
        )}
      </For>

      {/* Live streaming output */}
      <Show when={llm.loading()}>
        <div class="assistant streaming">{llm.output()}</div>
      </Show>

      {/* Error display */}
      <Show when={llm.error()}>
        <div class="error">{llm.error()}</div>
      </Show>

      {/* Input */}
      <textarea
        ref={inputRef}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        disabled={llm.loading()}
        placeholder="Type a message..."
      />
      <button onClick={handleSend} disabled={llm.loading()}>
        Send
      </button>
      <button onClick={llm.clear}>Clear</button>
    </div>
  );
}