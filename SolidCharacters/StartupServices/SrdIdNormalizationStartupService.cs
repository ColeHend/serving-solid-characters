using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SolidCharacters.Domain.Core;

namespace SolidCharacters.HostedServices;

public sealed class SrdIdNormalizationStartupService : IRunOnStartup
{
    private static readonly object NormalizeSync = new();
    private static bool normalized;

    private static readonly IReadOnlyDictionary<int, string[]> SrdFilesByVersion = new Dictionary<int, string[]>
    {
        [2014] = new[]
        {
            "backgrounds", "classes", "feats", "items", "weapons", "armor", "races", "spells", "subclasses", "subraces"
        },
        [2024] = new[]
        {
            "backgrounds", "classes", "feats", "items", "races", "spells", "subclasses", "subraces", "magic_items", "weapon_masteries"
        }
    };

    private readonly ILogger<SrdIdNormalizationStartupService> _logger;

    public SrdIdNormalizationStartupService(ILogger<SrdIdNormalizationStartupService> logger)
    {
        _logger = logger;
    }

    public void Run()
    {
        if (normalized)
        {
            return;
        }

        lock (NormalizeSync)
        {
            if (normalized)
            {
                return;
            }

            var updatedFiles = 0;
            foreach (var entry in SrdFilesByVersion)
            {
                foreach (var fileKey in entry.Value)
                {
                    var filePath = ResolveJsonFilePath(entry.Key, fileKey);
                    if (filePath == null)
                    {
                        continue;
                    }

                    if (NormalizeFile(filePath, includeNestedClassSubclasses: fileKey == "classes"))
                    {
                        updatedFiles++;
                    }
                }
            }

            normalized = true;
            _logger.LogInformation("SRD id normalization completed. UpdatedFiles={UpdatedFiles}", updatedFiles);
        }
    }

    private bool NormalizeFile(string filePath, bool includeNestedClassSubclasses)
    {
        var rawJson = File.ReadAllText(filePath);
        var records = JArray.Parse(rawJson);

        var changed = false;
        foreach (var token in records)
        {
            if (token is not JObject record)
            {
                continue;
            }

            changed |= EnsureGuidId(record);

            if (!includeNestedClassSubclasses)
            {
                continue;
            }

            if (record["subclasses"] is not JArray subclasses)
            {
                continue;
            }

            foreach (var subclassToken in subclasses)
            {
                if (subclassToken is JObject subclassRecord)
                {
                    changed |= EnsureGuidId(subclassRecord);
                }
            }
        }

        if (!changed)
        {
            return false;
        }

        File.WriteAllText(filePath, records.ToString(Formatting.Indented));
        _logger.LogInformation("Normalized SRD ids in {FilePath}", filePath);
        return true;
    }

    private static bool EnsureGuidId(JObject record)
    {
        if (!record.TryGetValue("id", out var idToken) || idToken.Type == JTokenType.Null)
        {
            record["id"] = Guid.NewGuid().ToString();
            return true;
        }

        if (idToken.Type == JTokenType.String)
        {
            var idValue = idToken.Value<string>();
            if (!string.IsNullOrWhiteSpace(idValue) && Guid.TryParse(idValue, out _))
            {
                return false;
            }

            record["id"] = Guid.NewGuid().ToString();
            return true;
        }

        record["id"] = Guid.NewGuid().ToString();
        return true;
    }

    private string? ResolveJsonFilePath(int version, string fileKey)
    {
        var relative = Path.Combine("srd", version.ToString(), fileKey + ".json");
        foreach (var dataRoot in GetCandidateDataRoots())
        {
            var filePath = Path.Combine(dataRoot, relative);
            if (File.Exists(filePath))
            {
                return filePath;
            }
        }

        return null;
    }

    private static IEnumerable<string> GetCandidateDataRoots()
    {
        var yielded = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        var configuredRoot = Environment.GetEnvironmentVariable("DB_JSON_ROOT");
        if (!string.IsNullOrWhiteSpace(configuredRoot))
        {
            var configuredData = Path.Combine(configuredRoot, "data");
            if (Directory.Exists(configuredData) && yielded.Add(configuredData))
            {
                yield return configuredData;
            }
        }

        foreach (var start in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
        {
            var current = start;
            for (int i = 0; i < 10; i++)
            {
                var sourceData = Path.Combine(current, "SolidCharacters.Repository", "data");
                if (Directory.Exists(sourceData) && yielded.Add(sourceData))
                {
                    yield return sourceData;
                }

                var genericData = Path.Combine(current, "data");
                if (Directory.Exists(genericData) && yielded.Add(genericData))
                {
                    yield return genericData;
                }

                var parent = Directory.GetParent(current)?.FullName;
                if (parent == null)
                {
                    break;
                }

                current = parent;
            }
        }
    }
}
