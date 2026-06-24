using System.Collections.Concurrent;
using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;

namespace SolidCharacters.Services.Ai;

public interface IAiCredentialStore
{
    string? GetKey(string provider);
    bool HasKey(string provider);
    void SetKey(string provider, string apiKey);
    void ClearKey(string provider);
}

/// <summary>
/// Holds cloud-provider API keys server-side so the browser never sees them. Seeds from
/// configuration (ApiKeys:Anthropic / ApiKeys:OpenAI) on startup, and persists user-entered keys
/// encrypted-at-rest via ASP.NET Core Data Protection to App_Data/ai-credentials.dat (git-ignored).
/// Single-tenant by design — this app has no per-user AI auth.
/// </summary>
public sealed class AiCredentialStore : IAiCredentialStore
{
    private readonly ConcurrentDictionary<string, string> _keys = new(StringComparer.OrdinalIgnoreCase);
    private readonly IDataProtector _protector;
    private readonly string _file;
    private readonly object _lock = new();

    public AiCredentialStore(IDataProtectionProvider dataProtection, IConfiguration config, IHostEnvironment env)
    {
        _protector = dataProtection.CreateProtector("SolidCharacters.AiCredentials.v1");

        var dir = Path.Combine(env.ContentRootPath, "App_Data");
        Directory.CreateDirectory(dir);
        _file = Path.Combine(dir, "ai-credentials.dat");

        var anthropic = config["ApiKeys:Anthropic"];
        if (!string.IsNullOrWhiteSpace(anthropic)) _keys["anthropic"] = anthropic;
        var openai = config["ApiKeys:OpenAI"];
        if (!string.IsNullOrWhiteSpace(openai)) _keys["openai"] = openai;

        Load(); // persisted keys override config defaults
    }

    public string? GetKey(string provider) => _keys.TryGetValue(provider, out var v) ? v : null;

    public bool HasKey(string provider) => _keys.TryGetValue(provider, out var v) && !string.IsNullOrWhiteSpace(v);

    public void SetKey(string provider, string apiKey)
    {
        _keys[provider] = apiKey;
        Persist();
    }

    public void ClearKey(string provider)
    {
        _keys.TryRemove(provider, out _);
        Persist();
    }

    private void Load()
    {
        try
        {
            if (!File.Exists(_file)) return;
            var protectedText = File.ReadAllText(_file);
            if (string.IsNullOrWhiteSpace(protectedText)) return;
            var json = _protector.Unprotect(protectedText);
            var map = JsonSerializer.Deserialize<Dictionary<string, string>>(json);
            if (map != null)
                foreach (var kv in map) _keys[kv.Key] = kv.Value;
        }
        catch (Exception e)
        {
            Console.WriteLine($"[ai] failed to load credentials: {e.Message}");
        }
    }

    private void Persist()
    {
        lock (_lock)
        {
            try
            {
                var json = JsonSerializer.Serialize(_keys);
                File.WriteAllText(_file, _protector.Protect(json));
            }
            catch (Exception e)
            {
                Console.WriteLine($"[ai] failed to persist credentials: {e.Message}");
            }
        }
    }
}
