using sharpAngleTemplate.models.DTO.Updated;
using sharpAngleTemplate.tools;

namespace sharpAngleTemplate.models.repositories;

public class SrdInfoRepository : ISrdInfoRepository
{
  private readonly IDbJsonService jsonService;
  public SrdInfoRepository(IDbJsonService jsonService)
  {
    this.jsonService = jsonService;
  }
  
  public List<Background> GetBackgrounds(string version = "2014")
  {
    int versionInt = int.Parse(version);
    if (versionInt != 2014 && versionInt != 2024)
    {
      throw new ArgumentException($"Version must be 2014 or 2024 but was {versionInt}");
    }
    var json = jsonService.GetJson<Background[]>($"srd/{versionInt}/backgrounds");
    json ??= Array.Empty<Background>();
    return json.ToList();
  }

  public List<Class5E> GetClasses(string version = "2014")
  {
    int versionInt = int.Parse(version);
    if (versionInt != 2014 && versionInt != 2024)
    {
      throw new ArgumentException($"Version must be 2014 or 2024 but was {versionInt}");
    }
    var json = jsonService.GetJson<Class5E[]>($"srd/{version}/classes");
    json ??= Array.Empty<Class5E>();
    return json.ToList();
  }

  public List<Feat> GetFeats(string version = "2014")
  {
    int versionInt = int.Parse(version);
    if (versionInt != 2014 && versionInt != 2024)
    {
      throw new ArgumentException($"Version must be 2014 or 2024 but was {versionInt}");
    }
    var json = jsonService.GetJson<Feat[]>($"srd/{version}/feats");
    json ??= Array.Empty<Feat>();
    return json.ToList();
  }

  public List<Item> GetItems(string version = "2014")
  {
    int versionInt = int.Parse(version);
    if (versionInt != 2014 && versionInt != 2024)
    {
      throw new ArgumentException($"Version must be 2014 or 2024 but was {versionInt}");
    }
    Item[] json = jsonService.GetJson<Item[]>($"srd/{version}/items") ?? Array.Empty<Item>();
    if (versionInt == 2014)
    {
      var weapons = jsonService.GetJson<Item[]>($"srd/{version}/weapons") ?? Array.Empty<Item>();
      var armor = jsonService.GetJson<Item[]>($"srd/{version}/armor") ?? Array.Empty<Item>();
      json = json.Concat(weapons).Concat(armor).ToArray();
    }
    json ??= Array.Empty<Item>();
    return json.ToList();
  }

  public List<Race> GetRaces(string version = "2014")
  {
    int versionInt = int.Parse(version);
    if (versionInt != 2014 && versionInt != 2024)
    {
      throw new ArgumentException($"Version must be 2014 or 2024 but was {versionInt}");
    }
    var json = jsonService.GetJson<Race[]>($"srd/{version}/races");
    json ??= Array.Empty<Race>();
    return json.ToList();
  }

  public List<Spell> GetSpells(string version = "2014")
  {
    int versionInt = int.Parse(version);
    if (versionInt != 2014 && versionInt != 2024)
    {
      throw new ArgumentException($"Version must be 2014 or 2024 but was {versionInt}");
    }
    var json = jsonService.GetJson<Spell[]>($"srd/{version}/spells");
    json ??= Array.Empty<Spell>();
    return json.ToList();
  }

  public List<Subclass> GetSubclasses(string version = "2014")
  {
    int versionInt = int.Parse(version);
    if (versionInt != 2014 && versionInt != 2024)
    {
      throw new ArgumentException($"Version must be 2014 or 2024 but was {versionInt}");
    }
    var json = jsonService.GetJson<Subclass[]>($"srd/{version}/subclasses");
    json ??= Array.Empty<Subclass>();
    return json.ToList();
  }

  public List<Subrace> GetSubraces(string version = "2014")
  {
    int versionInt = int.Parse(version);
    if (versionInt != 2014 && versionInt != 2024)
    {
      throw new ArgumentException($"Version must be 2014 or 2024 but was {versionInt}");
    }
    var json = jsonService.GetJson<Subrace[]>($"srd/{version}/subraces");
    json ??= Array.Empty<Subrace>();
    return json.ToList();
  }

  public List<MagicItem> GetMagicItems()
  {
    var json = jsonService.GetJson<MagicItem[]>($"srd/2024/magicitems");
    json ??= Array.Empty<MagicItem>();
    return json.ToList();
  }

  public List<WeaponMastery> GetWeaponMasteries()
  {
    var json = jsonService.GetJson<WeaponMastery[]>($"srd/2024/weaponmasteries");
    json ??= Array.Empty<WeaponMastery>();
    return json.ToList();
  }
}