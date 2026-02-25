using SolidCharacters.Domain.DTO.Updated;
using SolidCharacters.Repository.Services;
using Newtonsoft.Json;

namespace SolidCharacters.Repository;

public class SrdInfoRepository : ISrdInfoRepository
{
  private readonly IDbJsonService jsonService;
  public SrdInfoRepository(IDbJsonService jsonService)
  {
    this.jsonService = jsonService;
  }
  
  public List<Background> GetBackgrounds(string version = "2014")
  {
    int versionInt = ParseVersion(version);
    var json = jsonService.GetJson<Background[]>($"srd/{versionInt}/backgrounds");
    json ??= Array.Empty<Background>();
    return json.ToList();
  }

  public List<Class5E> GetClasses(string version = "2014")
  {
    int versionInt = ParseVersion(version);
    var json = jsonService.GetJson<Class5E[]>($"srd/{versionInt}/classes");
    json ??= Array.Empty<Class5E>();
    return json.ToList();
  }

  public List<Feat> GetFeats(string version = "2014")
  {
    int versionInt = ParseVersion(version);
    var json = jsonService.GetJson<Feat[]>($"srd/{versionInt}/feats");
    json ??= Array.Empty<Feat>();
    return json.ToList();
  }

  public List<Item> GetItems(string version = "2014")
  {
    int versionInt = ParseVersion(version);
    var pathKey = $"srd/{versionInt}/items";
    SolidCharacters.Domain.DTO.Updated.Item[] items = Array.Empty<SolidCharacters.Domain.DTO.Updated.Item>();
    try
    {
      items = jsonService.GetJson<SolidCharacters.Domain.DTO.Updated.Item[]>(pathKey)
        ?? Array.Empty<SolidCharacters.Domain.DTO.Updated.Item>();
    }
    catch (JsonReaderException jex)
    {
      var basePath = (jsonService as DbJsonService)?.JsonRoot ?? AppContext.BaseDirectory;
      var full = System.IO.Path.Combine(basePath, "data", pathKey + ".json");
      if (System.IO.File.Exists(full))
      {
        var raw = System.IO.File.ReadAllText(full);
        throw new Exception($"Failed to deserialize {pathKey}: {jex.Message}. Raw head: {raw?.Substring(0, Math.Min(400, raw?.Length ?? 0)).Replace("\n", " ") ?? ""}");
      }

      throw;
    }

    if (versionInt == 2014)
    {
      var weapons = jsonService.GetJson<SolidCharacters.Domain.DTO.Updated.Item[]>($"srd/{versionInt}/weapons")
        ?? Array.Empty<SolidCharacters.Domain.DTO.Updated.Item>();
      var armor = jsonService.GetJson<SolidCharacters.Domain.DTO.Updated.Item[]>($"srd/{versionInt}/armor")
        ?? Array.Empty<SolidCharacters.Domain.DTO.Updated.Item>();
      items = items.Concat(weapons).Concat(armor).ToArray();
    }

    return items.ToList();
  }

  public List<Race> GetRaces(string version = "2014")
  {
    int versionInt = ParseVersion(version);
    var json = jsonService.GetJson<Race[]>($"srd/{versionInt}/races");
    json ??= Array.Empty<Race>();
    return json.ToList();
  }

  public List<Spell> GetSpells(string version = "2014")
  {
    int versionInt = ParseVersion(version);
    var json = jsonService.GetJson<Spell[]>($"srd/{versionInt}/spells");
    json ??= Array.Empty<Spell>();
    return json.ToList();
  }

  public List<Subclass> GetSubclasses(string version = "2014")
  {
    int versionInt = ParseVersion(version);
    var json = jsonService.GetJson<Subclass[]>($"srd/{versionInt}/subclasses");
    json ??= Array.Empty<Subclass>();
    return json.ToList();
  }

  public List<Subrace> GetSubraces(string version = "2014")
  {
    int versionInt = ParseVersion(version);
    var json = jsonService.GetJson<Subrace[]>($"srd/{versionInt}/subraces");
    json ??= Array.Empty<Subrace>();
    return json.ToList();
  }

  public List<MagicItem> GetMagicItems()
  {
    var json = jsonService.GetJson<MagicItem[]>($"srd/2024/magic_items");
    json ??= Array.Empty<MagicItem>();
    return json.ToList();
  }

  public List<WeaponMastery> GetWeaponMasteries()
  {
    var json = jsonService.GetJson<WeaponMastery[]>($"srd/2024/weapon_masteries");
    json ??= Array.Empty<WeaponMastery>();
    return json.ToList();
  }

  private int ParseVersion(string version)
  {
    int versionInt = int.Parse(version);
    if (versionInt != 2014 && versionInt != 2024)
    {
      throw new ArgumentException($"Version must be 2014 or 2024 but was {versionInt}");
    }

    return versionInt;
  }

}