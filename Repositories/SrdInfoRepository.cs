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
    if (string.IsNullOrWhiteSpace(version))
    {
      throw new ArgumentNullException(nameof(version), "Version parameter cannot be null or empty");
    }

    if (!int.TryParse(version, out int versionInt))
    {
      throw new ArgumentException($"Version must be a valid integer but was '{version}'", nameof(version));
    }

    if (versionInt != 2014 && versionInt != 2024)
    {
      throw new ArgumentException($"Version must be 2014 or 2024 but was {versionInt}", nameof(version));
    }
    var json = jsonService.GetJson<Background[]>($"srd/{versionInt}/backgrounds");
    if (json == null)
    {
      throw new Exception($"Failed to retrieve backgrounds for version {versionInt}");
    }
    json ??= Array.Empty<Background>();
    return json.ToList();
  }

  public List<Class5E> GetClasses(string version = "2014")
  {
    if (string.IsNullOrWhiteSpace(version))
    {
      throw new ArgumentNullException(nameof(version), "Version parameter cannot be null or empty");
    }

    if (!int.TryParse(version, out int versionInt))
    {
      throw new ArgumentException($"Version must be a valid integer but was '{version}'", nameof(version));
    }

    if (versionInt != 2014 && versionInt != 2024)
    {
      throw new ArgumentException($"Version must be 2014 or 2024 but was {versionInt}", nameof(version));
    }
    var json = jsonService.GetJson<Class5E[]>($"srd/{version}/classes");
    if (json == null)
    {
      throw new Exception($"Failed to retrieve classes for version {versionInt}");
    }
    json ??= Array.Empty<Class5E>();
    return json.ToList();
  }

  public List<Feat> GetFeats(string version = "2014")
  {
    if (string.IsNullOrWhiteSpace(version))
    {
      throw new ArgumentNullException(nameof(version), "Version parameter cannot be null or empty");
    }

    if (!int.TryParse(version, out int versionInt))
    {
      throw new ArgumentException($"Version must be a valid integer but was '{version}'", nameof(version));
    }

    if (versionInt != 2014 && versionInt != 2024)
    {
      throw new ArgumentException($"Version must be 2014 or 2024 but was {versionInt}", nameof(version));
    }
    var json = jsonService.GetJson<Feat[]>($"srd/{version}/feats");
    if (json == null)
    {
      throw new Exception($"Failed to retrieve feats for version {versionInt}");
    }
    json ??= Array.Empty<Feat>();
    return json.ToList();
  }

  public List<Item> GetItems(string version = "2014")
  {
    if (string.IsNullOrWhiteSpace(version))
    {
      throw new ArgumentNullException(nameof(version), "Version parameter cannot be null or empty");
    }

    if (!int.TryParse(version, out int versionInt))
    {
      throw new ArgumentException($"Version must be a valid integer but was '{version}'", nameof(version));
    }

    if (versionInt != 2014 && versionInt != 2024)
    {
      throw new ArgumentException($"Version must be 2014 or 2024 but was {versionInt}", nameof(version));
    }

    var items = jsonService.GetJson<Item[]>($"srd/{version}/items");
    if (versionInt == 2024)
    {
      items ??= Array.Empty<Item>();
      
      return items.ToList();
    } else
    {
      var armor = jsonService.GetJson<Item[]>($"srd/{version}/armor") ?? Array.Empty<Item>();
      var weapons = jsonService.GetJson<Item[]>($"srd/{version}/weapons") ?? Array.Empty<Item>();
      items ??= Array.Empty<Item>();
      var allItems = new List<Item>();
      allItems.AddRange(armor);
      allItems.AddRange(weapons);
      allItems.AddRange(items);
      return allItems;
    }
  }

  public List<Race> GetRaces(string version = "2014")
  {
    if (string.IsNullOrWhiteSpace(version))
    {
      throw new ArgumentNullException(nameof(version), "Version parameter cannot be null or empty");
    }

    if (!int.TryParse(version, out int versionInt))
    {
      throw new ArgumentException($"Version must be a valid integer but was '{version}'", nameof(version));
    }

    if (versionInt != 2014 && versionInt != 2024)
    {
      throw new ArgumentException($"Version must be 2014 or 2024 but was {versionInt}", nameof(version));
    }
    var json = jsonService.GetJson<Race[]>($"srd/{version}/races");
    json ??= Array.Empty<Race>();
    return json.ToList();
  }

  public List<Spell> GetSpells(string version = "2014")
  {
    if (string.IsNullOrWhiteSpace(version))
    {
      throw new ArgumentNullException(nameof(version), "Version parameter cannot be null or empty");
    }

    if (!int.TryParse(version, out int versionInt))
    {
      throw new ArgumentException($"Version must be a valid integer but was '{version}'", nameof(version));
    }

    if (versionInt != 2014 && versionInt != 2024)
    {
      throw new ArgumentException($"Version must be 2014 or 2024 but was {versionInt}", nameof(version));
    }
    var json = jsonService.GetJson<Spell[]>($"srd/{version}/spells");
    json ??= Array.Empty<Spell>();
    return json.ToList();
  }

  public List<Subclass> GetSubclasses(string version = "2014")
  {
    if (string.IsNullOrWhiteSpace(version))
    {
      throw new ArgumentNullException(nameof(version), "Version parameter cannot be null or empty");
    }

    if (!int.TryParse(version, out int versionInt))
    {
      throw new ArgumentException($"Version must be a valid integer but was '{version}'", nameof(version));
    }

    if (versionInt != 2014 && versionInt != 2024)
    {
      throw new ArgumentException($"Version must be 2014 or 2024 but was {versionInt}", nameof(version));
    }
    var json = jsonService.GetJson<Subclass[]>($"srd/{version}/subclasses");
    json ??= Array.Empty<Subclass>();
    return json.ToList();
  }

  public List<Subrace> GetSubraces(string version = "2014")
  {
    if (string.IsNullOrWhiteSpace(version))
    {
      throw new ArgumentNullException(nameof(version), "Version parameter cannot be null or empty");
    }

    if (!int.TryParse(version, out int versionInt))
    {
      throw new ArgumentException($"Version must be a valid integer but was '{version}'", nameof(version));
    }

    if (versionInt != 2014 && versionInt != 2024)
    {
      throw new ArgumentException($"Version must be 2014 or 2024 but was {versionInt}", nameof(version));
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