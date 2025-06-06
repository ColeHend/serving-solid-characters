namespace sharpAngleTemplate.models.DTO.Updated;

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

public enum PrerequisiteType
{
  String,
  Level,
  Class,
  Subclass,
  Feat,
  Race,
  Item,
  Stat
}

public enum FeatureTypes
{
  Class = 0,
  Subclass,
  Feat,
  Race,
  Background,
  Language,
  AbilityScore,
  CharacterLevel,
  Classes,
  Item,
  Weapon,
  Armor,
  Subrace
}

public class Choices : Dictionary<string, ChoiceDetail> { }

public class ChoiceDetail
{
  public List<string> Options { get; set; } = new();
  public int Amount { get; set; }
}

public enum CharacterChangeTypes
{
  AbilityScore = 0,
  HP,
  Speed,
  AC,
  Initiative,
  Save,
  AttackRoll,
  Spell,
  SpellSlot
}

public enum SetMethod
{
  Set,
  Add,
  Subtract,
  Multiply,
  Divide
}

public enum IncreaseMethod
{
  Number,
  Die,
  Stat
}

public enum AbilityScores
{
  STR = 0,
  DEX,
  CON,
  INT,
  WIS,
  CHA,
  CHOICE,
  ALL
}

public enum TypeRestrictions
{
  SpellOnly = 0,
  MeleeOnly,
  RangedOnly,
  RangeReduced
}

public enum MovementTypes
{
  Walk = 0,
  Swim,
  Fly,
  Climb,
  Burrow
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
  public Dictionary<string, string> Properties { get; set; } = new();
}

public enum ItemType
{
  Weapon,
  Armor,
  Tool,
  Item
}

public class ItemProperties : Dictionary<string, object?> { }

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
  public string Name { get; set; } = null!;
  public string Desc { get; set; } = null!;
  public string Duration { get; set; } = null!;
  public bool Concentration { get; set; }
  public string Level { get; set; } = null!;
  public string Range { get; set; } = null!;
  public bool Ritual { get; set; }
  public string School { get; set; } = null!;
  public string CastingTime { get; set; } = null!;
  public string DamageType { get; set; } = null!;
  public string Page { get; set; } = null!;
  public bool IsMaterial { get; set; }
  public bool IsSomatic { get; set; }
  public bool IsVerbal { get; set; }
  public string? MaterialsNeeded { get; set; }
  public string HigherLevel { get; set; } = null!;
  public List<string> Classes { get; set; } = new();
  public List<string> SubClasses { get; set; } = new();
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
  public string Name { get; set; } = null!;
  public string ParentClass { get; set; } = null!;
  public string Description { get; set; } = null!;
  public Dictionary<int, List<FeatureDetail>> Features { get; set; } = new();
  public Choices? Choices { get; set; }
  public Spellcasting? Spellcasting { get; set; } = null!;
}

public class Class5E
{
  public int Id { get; set; }
  public string Name { get; set; } = null!;
  public string HitDie { get; set; } = null!;
  public string PrimaryAbility { get; set; } = null!;
  public List<string> SavingThrows { get; set; } = new();
  public List<StartingEquipment> StartingEquipment { get; set; } = new();
  public Proficiencies Proficiencies { get; set; } = new();
  public Spellcasting? Spellcasting { get; set; }
  public Dictionary<int, List<FeatureDetail>>? Features { get; set; }
  public Choices? Choices { get; set; }
  public Dictionary<string, Dictionary<int, string>>? ClassSpecific { get; set; }
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
  public SpellcastingMetadata Metadata { get; set; } = null!;

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
  public Dictionary<int, Spellslots> Slots { get; set; } = new();
  public CasterType CasterType { get; set; }
}

/// <summary>Per-level slot information.</summary>
public class Spellslots
{
  public int? CantripsKnown { get; set; }
  public int? SpellSlotsLevel0 { get; set; }
  public int? SpellSlotsLevel1 { get; set; }
  public int? SpellSlotsLevel2 { get; set; }
  public int? SpellSlotsLevel3 { get; set; }
  public int? SpellSlotsLevel4 { get; set; }
  public int? SpellSlotsLevel5 { get; set; }
  public int? SpellSlotsLevel6 { get; set; }
  public int? SpellSlotsLevel7 { get; set; }
  public int? SpellSlotsLevel8 { get; set; }
  public int? SpellSlotsLevel9 { get; set; }
}

/// <summary>Rule for calculating spells-known when <c>known_type = "calc"</c>.</summary>
public class SpellCalc
{
  public string Stat { get; set; } = null!;   // e.g. "INT", "WIS"
  public SpellCalcLevel Level { get; set; }   // "full" or "half"
  public bool? RoundUp { get; set; }
}

/* ───────────── Enums ───────────── */

public enum CasterType
{
  None,
  Third,
  Half,
  Full,
  Pact
}

public enum SpellKnownType   // maps the literal union "number" | "calc"
{
  Number,
  Calc
}

public enum SpellCalcLevel   // maps the literal union "full" | "half"
{
  Full,
  Half
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