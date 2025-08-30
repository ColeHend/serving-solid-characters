using System.Text.Json.Serialization;

using Newtonsoft.Json;
namespace sharpAngleTemplate.models.DTO.Updated
{

/// <summary>Represents a discrete feat a character can gain.</summary>
public class Feat
{
  public FeatureDetail Details { get; set; } = null!;
  public List<Prerequisite> Prerequisites { get; set; } = new();
}

/// <summary>Describes a feature selectable by class, race, feat, etc.</summary>
public class FeatureDetail
{
  public string Name { get; set; } = null!;
  public string Description { get; set; } = null!;
  public string? ChoiceKey { get; set; }
  public FeatureMetadata? Metadata { get; set; }
}

public class FeatureMetadata
{
  public int? Uses { get; set; }
  public string? Recharge { get; set; }
  public List<string>? Spells { get; set; }
  public string? Category { get; set; }
}

public class Prerequisite
{
  public PrerequisiteType Type { get; set; }
  public string Value { get; set; } = null!;
}


public class Choices : Dictionary<string, ChoiceDetail> { }

public class ChoiceDetail
{
  public List<string> Options { get; set; } = new();
  public int Amount { get; set; }
}



public class StatBonus
{
  public AbilityScores Stat { get; set; }
  public int Value { get; set; }
}

public class StartingEquipment
{
  public List<string>? OptionKeys { get; set; }
  public List<string>? Items { get; set; }
}

public class MagicItem
{
  public int Id { get; set; }
  public string Name { get; set; } = null!;
  public string Desc { get; set; } = null!;
  public string Rarity { get; set; } = null!;
  public string Cost { get; set; } = null!;
  public string Category { get; set; } = null!;
  public string Weight { get; set; } = null!;
  public MagicItemProperties Properties { get; set; } = new();
}

public class MagicItemProperties
{
  public string? Attunement { get; set; }
  public string? Effect { get; set; }
  public string? Charges { get; set; }
}

public class Item
{
  public int Id { get; set; }
  public string Name { get; set; } = null!;
  public string Desc { get; set; } = null!;
  public ItemType Type { get; set; }
  public double Weight { get; set; }
  public string Cost { get; set; } = null!;
  // Some item JSON entries have mixed value types (string vs array) under properties (e.g. "Properties": ["Light"]).
  // Use object to tolerate strings, numbers, arrays without custom converters.
  [JsonProperty("properties")]
  [JsonPropertyName("properties")]
  public Dictionary<string, object> Properties { get; set; } = new();
}
// Removed ItemProperties wrapper to prevent nested path like properties.Properties during deserialization

public class WeaponMastery
{
  public int Id { get; set; }
  public string Name { get; set; } = null!;
  public string Damage { get; set; } = null!;
  public List<string> Properties { get; set; } = new();
  public string Mastery { get; set; } = null!;
}

public class Spell
{
  // Keep C# names for internal code, but expose snake_case / expected client names via attributes
  [JsonProperty("name")] public string Name { get; set; } = null!;
  [JsonProperty("description")] public string Description { get; set; } = null!; // front-end expects 'description'
  [JsonProperty("duration")] public string Duration { get; set; } = null!;
  [JsonProperty("is_concentration")] public bool Concentration { get; set; }
  [JsonProperty("components")] public string Components { get; set; } = string.Empty;
  [JsonProperty("level")] public string Level { get; set; } = null!; // JSON uses "" or number-like strings; keep string
  [JsonProperty("range")] public string Range { get; set; } = null!;
  [JsonProperty("is_ritual")] public bool Ritual { get; set; }
  [JsonProperty("school")] public string School { get; set; } = null!;
  [JsonProperty("casting_time")] public string CastingTime { get; set; } = null!;
  [JsonProperty("damage_type")] public string DamageType { get; set; } = null!;
  [JsonProperty("page")] public string Page { get; set; } = null!;
  [JsonProperty("is_material")] public bool IsMaterial { get; set; }
  [JsonProperty("is_somatic")] public bool IsSomatic { get; set; }
  [JsonProperty("is_verbal")] public bool IsVerbal { get; set; }
  [JsonProperty("materials_needed")] public string? MaterialsNeeded { get; set; }
  // Source JSON has higher-level text embedded in description; keep nullable
  [JsonProperty("higherLevel")] public string? HigherLevel { get; set; }
  [JsonProperty("classes")] public List<string> Classes { get; set; } = new();
  [JsonProperty("subclasses")] public List<string> SubClasses { get; set; } = new();
}

public class Background
{
  public string Name { get; set; } = null!;
  public string Desc { get; set; } = null!;
  public Proficiencies Proficiencies { get; set; } = new();
  public List<StartingEquipment> StartEquipment { get; set; } = new();
  public List<string>? AbilityOptions { get; set; }
  public string? Feat { get; set; }
  public ChoiceDetail? Languages { get; set; }
  public List<FeatureDetail>? Features { get; set; }
}

public class Race
{
  public string Id { get; set; } = null!;
  public string Name { get; set; } = null!;
  public string Size { get; set; } = null!;
  public int Speed { get; set; }
  public List<string> Languages { get; set; } = new();
  public ChoiceDetail? LanguageChoice { get; set; }
  public List<StatBonus> AbilityBonuses { get; set; } = new();
  public AbilityBonusChoice? AbilityBonusChoice { get; set; }
  public List<Feat> Traits { get; set; } = new();
  public TraitChoice? TraitChoice { get; set; }
  public Dictionary<string, string>? Descriptions { get; set; }
}

public class Subrace : Race
{
  public string ParentRace { get; set; } = null!;
}

public class Subclass
{
  [JsonProperty("name")]
  [JsonPropertyName("name")]
  public string Name { get; set; } = null!;

  [JsonProperty("parent_class")]
  [JsonPropertyName("parent_class")]
  public string ParentClass { get; set; } = null!;

  [JsonProperty("description")]
  [JsonPropertyName("description")]
  public string Description { get; set; } = null!;

  public Dictionary<int, List<FeatureDetail>> Features { get; set; } = new();
  public Choices? Choices { get; set; }
  public Spellcasting? Spellcasting { get; set; } = null!;
}

public class Class5E
{
  [JsonProperty("id")] public int Id { get; set; }
  [JsonProperty("name")] public string Name { get; set; } = null!;
  [JsonProperty("hit_die")] public string HitDie { get; set; } = null!;
  [JsonProperty("primary_ability")] public string PrimaryAbility { get; set; } = null!;
  [JsonProperty("saving_throws")] public List<string> SavingThrows { get; set; } = new();
  [JsonProperty("starting_equipment")] public List<StartingEquipment> StartingEquipment { get; set; } = new();
  [JsonProperty("proficiencies")] public Proficiencies Proficiencies { get; set; } = new();
  [JsonProperty("spellcasting")] public Spellcasting? Spellcasting { get; set; }
  [JsonProperty("start_choices")] public ClassStartChoices StartChoices { get; set; } = new();
  [JsonProperty("features")] public Dictionary<int, List<FeatureDetail>>? Features { get; set; }
  [JsonProperty("choices")] public Choices? Choices { get; set; }
  [JsonProperty("classSpecific")] public Dictionary<string, Dictionary<int, string>>? ClassSpecific { get; set; }
}

  public class ClassStartChoices
  {
    public string? weapon { get; set; }
    public string? armor { get; set; }
    public string? skills { get; set; }
    public string? tools { get; set; }
    public string? equipment { get; set; }
}

/// <summary>Represents a group of proficiency lists.</summary>
public class Proficiencies
{
  public List<string> Armor { get; set; } = new();
  public List<string> Weapons { get; set; } = new();
  public List<string> Tools { get; set; } = new();
  public List<string> Skills { get; set; } = new();
}

/// <summary>Represents a class’s spell-casting progression.</summary>
public class Spellcasting
{
  [JsonProperty("metadata")] public SpellcastingMetadata Metadata { get; set; } = null!;

  /// <summary>“number” or “calc” in the source JSON.</summary>
  public SpellKnownType KnownType { get; set; }

  /// <remarks>Present when <see cref="KnownType"/> is <see cref="SpellKnownType.Number"/>.</remarks>
  public Dictionary<int, int>? SpellsKnown { get; set; }

  /// <remarks>Present when <see cref="KnownType"/> is <see cref="SpellKnownType.Calc"/>.</remarks>
  public SpellCalc? SpellsKnownCalc { get; set; }

  public Dictionary<int, List<string>> LearnedSpells { get; set; } = new();
}

/// <summary>Metadata block holding slot tables and caster category.</summary>
public class SpellcastingMetadata
{
  [JsonProperty("slots")] public Dictionary<int, Spellslots> Slots { get; set; } = new();
  public CasterType CasterType { get; set; }
}

/// <summary>Per-level slot information.</summary>
public class Spellslots
{
  [JsonProperty("cantrips_known")] public int? CantripsKnown { get; set; }
  [JsonProperty("spell_slots_level_1")] public int? SpellSlotsLevel1 { get; set; }
  [JsonProperty("spell_slots_level_2")] public int? SpellSlotsLevel2 { get; set; }
  [JsonProperty("spell_slots_level_3")] public int? SpellSlotsLevel3 { get; set; }
  [JsonProperty("spell_slots_level_4")] public int? SpellSlotsLevel4 { get; set; }
  [JsonProperty("spell_slots_level_5")] public int? SpellSlotsLevel5 { get; set; }
  [JsonProperty("spell_slots_level_6")] public int? SpellSlotsLevel6 { get; set; }
  [JsonProperty("spell_slots_level_7")] public int? SpellSlotsLevel7 { get; set; }
  [JsonProperty("spell_slots_level_8")] public int? SpellSlotsLevel8 { get; set; }
  [JsonProperty("spell_slots_level_9")] public int? SpellSlotsLevel9 { get; set; }
}

/// <summary>Rule for calculating spells-known when <c>known_type = "calc"</c>.</summary>
public class SpellCalc
{
  public string Stat { get; set; } = null!;   // e.g. "INT", "WIS"
  public SpellCalcLevel Level { get; set; }   // "full" or "half"
  public bool? RoundUp { get; set; }
}

/// <summary>Helper types used inside <see cref="Race"/> / <see cref="Subrace"/>.</summary>
public class AbilityBonusChoice
{
  public int Amount { get; set; }
  public List<StatBonus> Choices { get; set; } = new();
}

public class TraitChoice
{
  public int Amount { get; set; }
  public List<Feat> Choices { get; set; } = new();
}

}