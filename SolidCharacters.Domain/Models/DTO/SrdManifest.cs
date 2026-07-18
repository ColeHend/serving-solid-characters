using Newtonsoft.Json;

namespace SolidCharacters.Domain.DTO.Updated
{

/// <summary>
/// Version manifest for the on-disk SRD data, emitted by scripts/srd-gen (data/srd/manifest.json).
/// The client compares the opaque content-derived <see cref="Version"/> against its cached copy
/// to decide whether to offer an SRD data update.
/// </summary>
public class SrdManifest
{
  [JsonProperty("version")] public string Version { get; set; } = string.Empty;
  [JsonProperty("generatedAt")] public string? GeneratedAt { get; set; }
  [JsonProperty("rulesets")] public Dictionary<string, SrdRulesetInfo> Rulesets { get; set; } = new();
}

/// <summary>Per-ruleset ("2014"/"2024") hash + row counts from the generator run.</summary>
public class SrdRulesetInfo
{
  [JsonProperty("hash")] public string Hash { get; set; } = string.Empty;
  [JsonProperty("counts")] public Dictionary<string, int> Counts { get; set; } = new();
  [JsonProperty("generatedAt")] public string? GeneratedAt { get; set; }
}

}
