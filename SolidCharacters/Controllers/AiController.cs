using System.Text.Json;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using SolidCharacters.Services.Ai;

[ApiController]
[Route("api/ai")]
public class AiController : ControllerBase
{
    private readonly IAiCredentialStore _store;
    private readonly IAiChatService _chat;

    public AiController(IAiCredentialStore store, IAiChatService chat)
    {
        _store = store;
        _chat = chat;
    }

    /// <summary>Which providers are usable, for client-side gating. Local is always available; cloud needs a key.</summary>
    [HttpGet("providers")]
    public IActionResult Providers() => Ok(new
    {
        local = true,
        anthropic = _store.HasKey("anthropic"),
        openai = _store.HasKey("openai"),
    });

    [HttpPost("credentials")]
    public IActionResult SetCredential([FromBody] CredentialRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Provider) || string.IsNullOrWhiteSpace(req.ApiKey))
            return BadRequest("provider and apiKey are required");
        if (req.Provider != "anthropic" && req.Provider != "openai")
            return BadRequest("unknown provider");
        _store.SetKey(req.Provider, req.ApiKey);
        return Ok(new { ok = true });
    }

    [HttpDelete("credentials/{provider}")]
    public IActionResult ClearCredential(string provider)
    {
        _store.ClearKey(provider);
        return Ok(new { ok = true });
    }

    [HttpGet("test")]
    public async Task<IActionResult> Test([FromQuery] string provider, CancellationToken ct)
    {
        var key = _store.GetKey(provider);
        if (string.IsNullOrEmpty(key))
            return Ok(new { ok = false, message = $"No API key configured for {provider}." });
        var (ok, message) = await _chat.TestAsync(provider, key, ct);
        return Ok(new { ok, message });
    }

    /// <summary>Streaming chat relay. Forwards to Anthropic/OpenAI with the server-held key and re-emits a normalized SSE stream.</summary>
    [HttpPost("chat")]
    public async Task Chat([FromBody] ChatRequest req, CancellationToken ct)
    {
        Response.ContentType = "text/event-stream";
        Response.Headers["Cache-Control"] = "no-cache";
        Response.Headers["X-Accel-Buffering"] = "no"; // disable proxy buffering (nginx)
        HttpContext.Features.Get<IHttpResponseBodyFeature>()?.DisableBuffering();

        if (req.Provider != "anthropic" && req.Provider != "openai")
        {
            await WriteEvent(new { type = "error", error = "Unknown provider." }, ct);
            await WriteEvent(new { type = "message_done", stopReason = "error" }, ct);
            return;
        }

        var key = _store.GetKey(req.Provider);
        if (string.IsNullOrEmpty(key))
        {
            await WriteEvent(new { type = "error", error = $"No API key configured for {req.Provider}." }, ct);
            await WriteEvent(new { type = "message_done", stopReason = "error" }, ct);
            return;
        }

        try
        {
            await foreach (var json in _chat.StreamAsync(req, key, ct))
            {
                await Response.WriteAsync($"data: {json}\n\n", ct);
                await Response.Body.FlushAsync(ct);
            }
        }
        catch (OperationCanceledException)
        {
            // client disconnected — nothing to do
        }
        catch (Exception e)
        {
            await WriteEvent(new { type = "error", error = e.Message }, CancellationToken.None);
        }
    }

    private async Task WriteEvent(object value, CancellationToken ct)
    {
        await Response.WriteAsync($"data: {JsonSerializer.Serialize(value)}\n\n", ct);
        await Response.Body.FlushAsync(ct);
    }
}
