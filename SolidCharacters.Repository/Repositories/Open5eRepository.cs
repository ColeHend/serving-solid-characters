namespace SolidCharacters.Repository;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using SolidCharacters.Domain.Open5e;

public sealed class Open5eRepository
{
    private readonly HttpClient _httpClient;

    // API root shows both v1 and v2 endpoints; keep base as api root. :contentReference[oaicite:1]{index=1}
    private const string BaseUrl = "https://api.open5e.com/";

    private static readonly JsonSerializerSettings JsonSettings = new()
    {
        ContractResolver = new DefaultContractResolver
        {
            NamingStrategy = new SnakeCaseNamingStrategy()
        },
        NullValueHandling = NullValueHandling.Ignore,
        MissingMemberHandling = MissingMemberHandling.Ignore
    };

    public Open5eRepository(HttpClient httpClient)
    {
        _httpClient = httpClient;
        // Optional: If you set BaseAddress elsewhere, this won’t hurt.
        _httpClient.BaseAddress ??= new Uri(BaseUrl);
    }

    // -------------------------
    // Public “get everything” methods (ALL endpoints in Api Root)
    // -------------------------

    // v2
    public Task<List<Open5eV2Spell>> GetV2SpellsAsync(CancellationToken ct = default)
        => GetAllPagesAsync<Open5eV2Spell>("v2/spells/", ct);

    public Task<List<Open5eV2Document>> GetV2DocumentsAsync(CancellationToken ct = default)
        => GetAllPagesAsync<Open5eV2Document>("v2/documents/", ct);

    public Task<List<Open5eV2Background>> GetV2BackgroundsAsync(CancellationToken ct = default)
        => GetAllPagesAsync<Open5eV2Background>("v2/backgrounds/", ct);

    public Task<List<Open5eV2Feat>> GetV2FeatsAsync(CancellationToken ct = default)
        => GetAllPagesAsync<Open5eV2Feat>("v2/feats/", ct);

    public Task<List<Open5eV2Condition>> GetV2ConditionsAsync(CancellationToken ct = default)
        => GetAllPagesAsync<Open5eV2Condition>("v2/conditions/", ct);

    public Task<List<Open5eV2Weapon>> GetV2WeaponsAsync(CancellationToken ct = default)
        => GetAllPagesAsync<Open5eV2Weapon>("v2/weapons/", ct);

    public Task<List<Open5eV2Armor>> GetV2ArmorAsync(CancellationToken ct = default)
        => GetAllPagesAsync<Open5eV2Armor>("v2/armor/", ct);

    // v1
    public Task<List<Open5eV1SpellList>> GetV1SpellListsAsync(CancellationToken ct = default)
        => GetAllPagesAsync<Open5eV1SpellList>("v1/spelllist/", ct);

    public Task<List<Open5eV1Monster>> GetV1MonstersAsync(CancellationToken ct = default)
        => GetAllPagesAsync<Open5eV1Monster>("v1/monsters/", ct);

    public Task<List<Open5eV1Plane>> GetV1PlanesAsync(CancellationToken ct = default)
        => GetAllPagesAsync<Open5eV1Plane>("v1/planes/", ct);

    public Task<List<Open5eV1Section>> GetV1SectionsAsync(CancellationToken ct = default)
        => GetAllPagesAsync<Open5eV1Section>("v1/sections/", ct);

    public Task<List<Open5eV1Race>> GetV1RacesAsync(CancellationToken ct = default)
        => GetAllPagesAsync<Open5eV1Race>("v1/races/", ct);

    public Task<List<Open5eV1Class>> GetV1ClassesAsync(CancellationToken ct = default)
        => GetAllPagesAsync<Open5eV1Class>("v1/classes/", ct);

    public Task<List<Open5eV1MagicItem>> GetV1MagicItemsAsync(CancellationToken ct = default)
        => GetAllPagesAsync<Open5eV1MagicItem>("v1/magicitems/", ct);

    public Task<List<Open5eV1ManifestItem>> GetV1ManifestAsync(CancellationToken ct = default)
        => GetAllPagesAsync<Open5eV1ManifestItem>("v1/manifest/", ct);

    // -------------------------
    // Core paginator
    // -------------------------
    private async Task<List<T>> GetAllPagesAsync<T>(string relativeOrAbsoluteUrl, CancellationToken ct)
    {
        var results = new List<T>();
        string? nextUrl = MakeAbsolute(relativeOrAbsoluteUrl);

        while (!string.IsNullOrWhiteSpace(nextUrl))
        {
            using var response = await _httpClient.GetAsync(nextUrl, ct).ConfigureAwait(false);
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
            var page = JsonConvert.DeserializeObject<Open5eListResponse<T>>(content, JsonSettings);

            if (page?.Results != null)
                results.AddRange(page.Results);

            nextUrl = page?.Next;
        }

        return results;
    }

    private static string MakeAbsolute(string url)
    {
        if (Uri.TryCreate(url, UriKind.Absolute, out _))
            return url;

        // Accept "v1/..." "v2/..." or "/v1/..."
        url = url.TrimStart('/');
        return $"{BaseUrl}{url}";
    }
}
