using System.Net.Http.Headers;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;

namespace SolidCharacters.Services.Ai;

public interface IAiChatService
{
    /// <summary>Streams normalized ChatStreamEvent JSON strings (one per yielded item) for a chat turn.</summary>
    IAsyncEnumerable<string> StreamAsync(ChatRequest req, string apiKey, CancellationToken ct);

    /// <summary>Minimal non-streaming auth/connectivity check.</summary>
    Task<(bool ok, string message)> TestAsync(string provider, string apiKey, CancellationToken ct);
}

/// <summary>
/// Translates a normalized chat request into the Anthropic Messages / OpenAI Chat Completions wire
/// format, injects the server-held key, and re-emits a single normalized SSE event stream. Server-to-
/// server, so Anthropic's browser-CORS header is not needed. The Anthropic body is kept minimal —
/// no temperature/top_p/top_k and no thinking (all 400 on Opus 4.8/4.7; thinking is off by default).
/// </summary>
public sealed class AiChatService : IAiChatService
{
    private const string AnthropicUrl = "https://api.anthropic.com/v1/messages";
    private const string OpenAiUrl = "https://api.openai.com/v1/chat/completions";
    private const string AnthropicVersion = "2023-06-01";

    private readonly IHttpClientFactory _http;

    public AiChatService(IHttpClientFactory http) => _http = http;

    public async IAsyncEnumerable<string> StreamAsync(ChatRequest req, string apiKey, [EnumeratorCancellation] CancellationToken ct)
    {
        var isAnthropic = req.Provider == "anthropic";
        using var request = isAnthropic ? BuildAnthropic(req, apiKey, stream: true) : BuildOpenAi(req, apiKey, stream: true);
        var client = _http.CreateClient(req.Provider);

        HttpResponseMessage? resp = null;
        string? error = null;
        try
        {
            resp = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct);
        }
        catch (Exception e) when (!ct.IsCancellationRequested)
        {
            error = e.Message;
        }

        if (error != null)
        {
            yield return Json(new { type = "error", error = $"Could not reach {req.Provider}: {error}" });
            yield return Json(new { type = "message_done", stopReason = "error" });
            yield break;
        }

        if (!resp!.IsSuccessStatusCode)
        {
            var body = await resp.Content.ReadAsStringAsync(ct);
            resp.Dispose();
            yield return Json(new { type = "error", error = $"{(int)resp.StatusCode}: {Truncate(body)}" });
            yield return Json(new { type = "message_done", stopReason = "error" });
            yield break;
        }

        await using var stream = await resp.Content.ReadAsStreamAsync(ct);
        using var reader = new StreamReader(stream);
        var events = isAnthropic ? ParseAnthropic(reader, ct) : ParseOpenAi(reader, ct);
        await foreach (var ev in events)
            yield return ev;
        resp.Dispose();
    }

    public async Task<(bool ok, string message)> TestAsync(string provider, string apiKey, CancellationToken ct)
    {
        var pingMessages = new[] { new { role = "user", content = "ping" } };
        using var request = new HttpRequestMessage(HttpMethod.Post, provider == "anthropic" ? AnthropicUrl : OpenAiUrl);
        if (provider == "anthropic")
        {
            request.Content = JsonBody(new { model = "claude-opus-4-8", max_tokens = 1, messages = pingMessages });
            request.Headers.Add("x-api-key", apiKey);
            request.Headers.Add("anthropic-version", AnthropicVersion);
        }
        else
        {
            request.Content = JsonBody(new { model = "gpt-4o-mini", max_tokens = 1, messages = pingMessages });
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        }

        try
        {
            var resp = await _http.CreateClient(provider).SendAsync(request, ct);
            if (resp.IsSuccessStatusCode) return (true, $"Connected to {provider}.");
            var body = await resp.Content.ReadAsStringAsync(ct);
            return (false, $"{(int)resp.StatusCode}: {Truncate(body)}");
        }
        catch (Exception e)
        {
            return (false, e.Message);
        }
    }

    // ---------------- Anthropic ----------------

    private static HttpRequestMessage BuildAnthropic(ChatRequest req, string apiKey, bool stream)
    {
        var body = new Dictionary<string, object?>
        {
            ["model"] = req.Model,
            ["max_tokens"] = req.MaxTokens ?? 4096,
            ["stream"] = stream,
            ["messages"] = BuildAnthropicMessages(req.Messages),
        };
        if (!string.IsNullOrWhiteSpace(req.System)) body["system"] = req.System;
        if (req.Tools is { Count: > 0 })
        {
            body["tools"] = req.Tools.Select(t => new { name = t.Name, description = t.Description, input_schema = t.InputSchema }).ToList();
            body["tool_choice"] = new { type = "auto" };
        }

        var msg = new HttpRequestMessage(HttpMethod.Post, AnthropicUrl) { Content = JsonBody(body) };
        msg.Headers.Add("x-api-key", apiKey);
        msg.Headers.Add("anthropic-version", AnthropicVersion);
        return msg;
    }

    private static List<object> BuildAnthropicMessages(List<AiMessageDto> messages)
    {
        var result = new List<object>();
        foreach (var m in messages)
        {
            if (m.Role == "tool")
            {
                var content = new List<object>();
                foreach (var r in m.ToolResults ?? new())
                {
                    var block = new Dictionary<string, object?>
                    {
                        ["type"] = "tool_result",
                        ["tool_use_id"] = r.ToolCallId,
                        ["content"] = r.Content,
                    };
                    if (r.IsError == true) block["is_error"] = true;
                    content.Add(block);
                }
                result.Add(new { role = "user", content });
            }
            else if (m.Role == "assistant")
            {
                var content = new List<object>();
                if (!string.IsNullOrEmpty(m.Text)) content.Add(new { type = "text", text = m.Text });
                foreach (var tc in m.ToolCalls ?? new())
                    content.Add(new { type = "tool_use", id = tc.Id, name = tc.Name, input = tc.Input });
                result.Add(new { role = "assistant", content });
            }
            else
            {
                result.Add(new { role = "user", content = new object[] { new { type = "text", text = m.Text ?? "" } } });
            }
        }
        return result;
    }

    private static async IAsyncEnumerable<string> ParseAnthropic(StreamReader reader, [EnumeratorCancellation] CancellationToken ct)
    {
        var toolUseIndices = new HashSet<int>();
        string stopReason = "end_turn";
        // Anthropic splits usage across events: input_tokens on message_start (complete), output_tokens on
        // message_delta (CUMULATIVE — overwrite, last wins). Emitted together on message_stop.
        int inputTokens = 0, outputTokens = 0;
        string? line;
        while ((line = await reader.ReadLineAsync(ct)) != null)
        {
            if (!line.StartsWith("data:")) continue;
            var payload = line.Substring(5).Trim();
            if (payload.Length == 0) continue;

            JsonDocument doc;
            try { doc = JsonDocument.Parse(payload); } catch { continue; }
            using (doc)
            {
                var root = doc.RootElement;
                if (!root.TryGetProperty("type", out var typeEl)) continue;
                switch (typeEl.GetString())
                {
                    case "message_start":
                    {
                        // message_start.message.usage.input_tokens is the COMPLETE prompt count (+ cache
                        // reads/creations when prompt caching is used). Its output_tokens is a small partial → ignore.
                        if (root.TryGetProperty("message", out var ms) && ms.TryGetProperty("usage", out var u0))
                        {
                            if (u0.TryGetProperty("input_tokens", out var it) && it.ValueKind == JsonValueKind.Number) inputTokens = it.GetInt32();
                            if (u0.TryGetProperty("cache_read_input_tokens", out var cr) && cr.ValueKind == JsonValueKind.Number) inputTokens += cr.GetInt32();
                            if (u0.TryGetProperty("cache_creation_input_tokens", out var cc) && cc.ValueKind == JsonValueKind.Number) inputTokens += cc.GetInt32();
                        }
                        break;
                    }
                    case "content_block_start":
                    {
                        var idx = root.GetProperty("index").GetInt32();
                        var cb = root.GetProperty("content_block");
                        if (cb.GetProperty("type").GetString() == "tool_use")
                        {
                            toolUseIndices.Add(idx);
                            yield return Json(new { type = "tool_call_start", index = idx, id = cb.GetProperty("id").GetString(), name = cb.GetProperty("name").GetString() });
                        }
                        break;
                    }
                    case "content_block_delta":
                    {
                        var idx = root.GetProperty("index").GetInt32();
                        var delta = root.GetProperty("delta");
                        var dt = delta.GetProperty("type").GetString();
                        if (dt == "text_delta")
                            yield return Json(new { type = "text_delta", text = delta.GetProperty("text").GetString() });
                        else if (dt == "input_json_delta")
                            yield return Json(new { type = "tool_call_delta", index = idx, argsDelta = delta.GetProperty("partial_json").GetString() });
                        break;
                    }
                    case "content_block_stop":
                    {
                        var idx = root.GetProperty("index").GetInt32();
                        if (toolUseIndices.Contains(idx))
                            yield return Json(new { type = "tool_call_done", index = idx });
                        break;
                    }
                    case "message_delta":
                        // usage sits at the event ROOT (sibling of delta) and is cumulative — overwrite.
                        if (root.TryGetProperty("usage", out var ud) && ud.TryGetProperty("output_tokens", out var ot) && ot.ValueKind == JsonValueKind.Number)
                            outputTokens = ot.GetInt32();
                        if (root.TryGetProperty("delta", out var d) && d.TryGetProperty("stop_reason", out var sr) && sr.ValueKind == JsonValueKind.String)
                            stopReason = MapAnthropicStop(sr.GetString());
                        break;
                    case "message_stop":
                        yield return Json(new { type = "message_done", stopReason, usage = new { inputTokens, outputTokens } });
                        break;
                    case "error":
                        yield return Json(new { type = "error", error = root.TryGetProperty("error", out var er) && er.TryGetProperty("message", out var em) ? em.GetString() : "stream error" });
                        break;
                }
            }
        }
    }

    private static string MapAnthropicStop(string? reason) => reason switch
    {
        "tool_use" => "tool_use",
        "max_tokens" => "max_tokens",
        "refusal" => "refusal",
        _ => "end_turn",
    };

    // ---------------- OpenAI ----------------

    private static HttpRequestMessage BuildOpenAi(ChatRequest req, string apiKey, bool stream)
    {
        var body = new Dictionary<string, object?>
        {
            ["model"] = req.Model,
            ["stream"] = stream,
            ["max_tokens"] = req.MaxTokens ?? 4096,
            ["messages"] = BuildOpenAiMessages(req.Messages, req.System),
        };
        // Ask for a trailing usage chunk (prompt/completion token counts) on streamed responses so the
        // proxy can report real token usage; servers that don't support it simply omit the chunk.
        if (stream) body["stream_options"] = new { include_usage = true };
        if (req.Tools is { Count: > 0 })
        {
            body["tools"] = req.Tools.Select(t => new { type = "function", function = new { name = t.Name, description = t.Description, parameters = t.InputSchema } }).ToList();
            body["tool_choice"] = "auto";
        }

        var msg = new HttpRequestMessage(HttpMethod.Post, OpenAiUrl) { Content = JsonBody(body) };
        msg.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        return msg;
    }

    private static List<object> BuildOpenAiMessages(List<AiMessageDto> messages, string? system)
    {
        var result = new List<object>();
        if (!string.IsNullOrWhiteSpace(system)) result.Add(new { role = "system", content = system });
        foreach (var m in messages)
        {
            if (m.Role == "tool")
            {
                foreach (var r in m.ToolResults ?? new())
                    result.Add(new { role = "tool", tool_call_id = r.ToolCallId, content = r.Content });
            }
            else if (m.Role == "assistant")
            {
                var msg = new Dictionary<string, object?> { ["role"] = "assistant", ["content"] = m.Text ?? "" };
                if (m.ToolCalls is { Count: > 0 })
                    msg["tool_calls"] = m.ToolCalls.Select(tc => new { id = tc.Id, type = "function", function = new { name = tc.Name, arguments = tc.Input.GetRawText() } }).ToList();
                result.Add(msg);
            }
            else
            {
                result.Add(new { role = "user", content = m.Text ?? "" });
            }
        }
        return result;
    }

    private static async IAsyncEnumerable<string> ParseOpenAi(StreamReader reader, [EnumeratorCancellation] CancellationToken ct)
    {
        var started = new HashSet<int>();
        var toolDoneEmitted = false;
        string? pendingStop = null;
        // Usage arrives on a TRAILING chunk (empty choices) AFTER finish_reason — capture it and defer the
        // single message_done to stream end so it can carry the counts.
        int inputTokens = 0, outputTokens = 0;
        string? line;
        while ((line = await reader.ReadLineAsync(ct)) != null)
        {
            if (!line.StartsWith("data:")) continue;
            var payload = line.Substring(5).Trim();
            if (payload.Length == 0) continue;
            if (payload == "[DONE]") break;

            JsonDocument doc;
            try { doc = JsonDocument.Parse(payload); } catch { continue; }
            using (doc)
            {
                if (doc.RootElement.TryGetProperty("usage", out var us) && us.ValueKind == JsonValueKind.Object)
                {
                    if (us.TryGetProperty("prompt_tokens", out var pt) && pt.ValueKind == JsonValueKind.Number) inputTokens = pt.GetInt32();
                    if (us.TryGetProperty("completion_tokens", out var ctk) && ctk.ValueKind == JsonValueKind.Number) outputTokens = ctk.GetInt32();
                }

                if (!doc.RootElement.TryGetProperty("choices", out var choices) || choices.GetArrayLength() == 0) continue;
                var choice = choices[0];

                if (choice.TryGetProperty("delta", out var delta))
                {
                    if (delta.TryGetProperty("content", out var content) && content.ValueKind == JsonValueKind.String)
                    {
                        var t = content.GetString();
                        if (!string.IsNullOrEmpty(t)) yield return Json(new { type = "text_delta", text = t });
                    }
                    if (delta.TryGetProperty("tool_calls", out var tcs) && tcs.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var tc in tcs.EnumerateArray())
                        {
                            var idx = tc.TryGetProperty("index", out var ix) && ix.ValueKind == JsonValueKind.Number ? ix.GetInt32() : 0;
                            if (!started.Contains(idx))
                            {
                                started.Add(idx);
                                var id = tc.TryGetProperty("id", out var idEl) && idEl.ValueKind == JsonValueKind.String ? idEl.GetString() : $"call_{idx}";
                                var name = tc.TryGetProperty("function", out var fn) && fn.TryGetProperty("name", out var nm) && nm.ValueKind == JsonValueKind.String ? nm.GetString() : "";
                                yield return Json(new { type = "tool_call_start", index = idx, id, name });
                            }
                            if (tc.TryGetProperty("function", out var fn2) && fn2.TryGetProperty("arguments", out var args) && args.ValueKind == JsonValueKind.String)
                            {
                                var frag = args.GetString();
                                if (!string.IsNullOrEmpty(frag)) yield return Json(new { type = "tool_call_delta", index = idx, argsDelta = frag });
                            }
                        }
                    }
                }

                if (choice.TryGetProperty("finish_reason", out var fr) && fr.ValueKind == JsonValueKind.String)
                {
                    // Close tool calls now, but DEFER message_done until the trailing usage chunk / stream end.
                    foreach (var idx in started) yield return Json(new { type = "tool_call_done", index = idx });
                    toolDoneEmitted = true;
                    pendingStop = MapOpenAiFinish(fr.GetString());
                }
            }
        }

        if (!toolDoneEmitted)
            foreach (var idx in started) yield return Json(new { type = "tool_call_done", index = idx });
        yield return Json(new { type = "message_done", stopReason = pendingStop ?? (started.Count > 0 ? "tool_use" : "end_turn"), usage = new { inputTokens, outputTokens } });
    }

    private static string MapOpenAiFinish(string? reason) => reason switch
    {
        "tool_calls" => "tool_use",
        "length" => "max_tokens",
        _ => "end_turn",
    };

    // ---------------- helpers ----------------

    private static string Json(object value) => JsonSerializer.Serialize(value);

    private static StringContent JsonBody(object value) =>
        new(JsonSerializer.Serialize(value), Encoding.UTF8, "application/json");

    private static string Truncate(string s, int max = 400) => s.Length <= max ? s : s.Substring(0, max);
}
