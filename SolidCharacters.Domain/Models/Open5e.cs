namespace SolidCharacters.Domain.Open5e;
using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

// -------------------------
// Generic list wrapper (v1 + v2)
// -------------------------
public sealed class Open5eListResponse<T>
{
    public int Count { get; set; }
    public string? Next { get; set; }
    public string? Previous { get; set; }
    public List<T>? Results { get; set; }
}

// -------------------------
// Extensible base DTO: captures any additional/unknown fields
// -------------------------
public abstract class Open5eExtensibleDto
{
    [JsonExtensionData]
    public IDictionary<string, JToken>? Extra { get; set; }
}

// -------------------------
// Reusable "reference" shapes used heavily in v2
// -------------------------
public sealed class Open5eV2NamedRef : Open5eExtensibleDto
{
    public string? Name { get; set; }
    public string? Key { get; set; }
    public string? Url { get; set; }
}

public sealed class Open5eV2PublisherRef : Open5eExtensibleDto
{
    public string? Name { get; set; }
    public string? Key { get; set; }
    public string? Url { get; set; }
}

public sealed class Open5eV2GameSystemRef : Open5eExtensibleDto
{
    public string? Name { get; set; }
    public string? Key { get; set; }
    public string? Url { get; set; }
}

public sealed class Open5eV2LicenseRef : Open5eExtensibleDto
{
    public string? Name { get; set; }
    public string? Key { get; set; }
    public string? Url { get; set; }
}

public sealed class Open5eV2DocumentSummary : Open5eExtensibleDto
{
    public string? Name { get; set; }
    public string? Key { get; set; }
    public string? Type { get; set; }
    public string? DisplayName { get; set; }
    public Open5eV2PublisherRef? Publisher { get; set; }
    public Open5eV2GameSystemRef? Gamesystem { get; set; }
    public string? Permalink { get; set; }
}

// -------------------------
// v2: Documents
// -------------------------
public sealed class Open5eV2Document : Open5eExtensibleDto
{
    public string? Url { get; set; }
    public string? Key { get; set; }

    public List<Open5eV2LicenseRef>? Licenses { get; set; }
    public Open5eV2PublisherRef? Publisher { get; set; }
    public Open5eV2GameSystemRef? Gamesystem { get; set; }

    public string? DisplayName { get; set; }
    public string? Name { get; set; }
    public string? Desc { get; set; }
    public string? Type { get; set; }
    public string? Author { get; set; }

    public DateTime? PublicationDate { get; set; }

    public string? Permalink { get; set; }

    public string? DistanceUnit { get; set; }
    public string? WeightUnit { get; set; }
}

// -------------------------
// v2: Feats
// -------------------------
public sealed class Open5eV2FeatBenefit : Open5eExtensibleDto
{
    public string? Desc { get; set; }
}

public sealed class Open5eV2Feat : Open5eExtensibleDto
{
    public string? Url { get; set; }
    public string? Key { get; set; }

    public bool? HasPrerequisite { get; set; }
    public List<Open5eV2FeatBenefit>? Benefits { get; set; }

    public Open5eV2DocumentSummary? Document { get; set; }

    public string? Name { get; set; }
    public string? Desc { get; set; }
    public string? Prerequisite { get; set; }
    public string? Type { get; set; }
}

// -------------------------
// v2: Conditions
// -------------------------
public sealed class Open5eV2ConditionDescription : Open5eExtensibleDto
{
    public string? Desc { get; set; }
    public string? Document { get; set; }
    public string? Gamesystem { get; set; }
}

public sealed class Open5eV2Condition : Open5eExtensibleDto
{
    public string? Url { get; set; }
    public string? Key { get; set; }

    public Open5eV2DocumentSummary? Document { get; set; }

    public string? Icon { get; set; }
    public List<Open5eV2ConditionDescription>? Descriptions { get; set; }

    public string? Name { get; set; }
}

// -------------------------
// v2: Backgrounds
// -------------------------
public sealed class Open5eV2BackgroundBenefit : Open5eExtensibleDto
{
    public string? Name { get; set; }
    public string? Desc { get; set; }
    public string? Type { get; set; }
}

public sealed class Open5eV2Background : Open5eExtensibleDto
{
    public string? Url { get; set; }
    public string? Key { get; set; }

    public List<Open5eV2BackgroundBenefit>? Benefits { get; set; }
    public Open5eV2DocumentSummary? Document { get; set; }

    public string? Name { get; set; }
    public string? Desc { get; set; }
}

// -------------------------
// v2: Weapons
// -------------------------
public sealed class Open5eV2WeaponProperty : Open5eExtensibleDto
{
    public string? Name { get; set; }
    public string? Type { get; set; } // e.g. "Mastery" or null
    public string? Url { get; set; }
    public string? Desc { get; set; }
}

public sealed class Open5eV2WeaponPropertyLink : Open5eExtensibleDto
{
    public Open5eV2WeaponProperty? Property { get; set; }
    public string? Detail { get; set; }
}

public sealed class Open5eV2DamageTypeRef : Open5eExtensibleDto
{
    public string? Name { get; set; }
    public string? Key { get; set; }
    public string? Url { get; set; }
}

public sealed class Open5eV2Weapon : Open5eExtensibleDto
{
    public string? Url { get; set; }
    public string? Key { get; set; }

    public Open5eV2DocumentSummary? Document { get; set; }
    public List<Open5eV2WeaponPropertyLink>? Properties { get; set; }
    public Open5eV2DamageTypeRef? DamageType { get; set; }

    public string? DistanceUnit { get; set; }
    public string? Name { get; set; }

    public string? DamageDice { get; set; }
    public double? Range { get; set; }
    public double? LongRange { get; set; }

    public bool? IsSimple { get; set; }
    public bool? IsImprovised { get; set; }
}

// -------------------------
// v2: Armor
// -------------------------
public sealed class Open5eV2Armor : Open5eExtensibleDto
{
    public string? Url { get; set; }
    public string? Key { get; set; }

    public string? AcDisplay { get; set; }
    public string? Category { get; set; }

    public Open5eV2DocumentSummary? Document { get; set; }

    public string? Name { get; set; }

    public bool? GrantsStealthDisadvantage { get; set; }
    public int? StrengthScoreRequired { get; set; }

    public int? AcBase { get; set; }
    public bool? AcAddDexmod { get; set; }
    public int? AcCapDexmod { get; set; }
}

// -------------------------
// v2: Spells
// -------------------------
public sealed class Open5eV2SpellCastingOption : Open5eExtensibleDto
{
    public string? Type { get; set; }         // e.g. "attack", "save", etc.
    public string? Desc { get; set; }

    public string? DamageRoll { get; set; }
    public int? TargetCount { get; set; }

    public string? Duration { get; set; }
    public string? Range { get; set; }        // Can be numeric or text like "60 feet"
    public bool? Concentration { get; set; }

    public double? ShapeSize { get; set; }
}

public sealed class Open5eV2Spell : Open5eExtensibleDto
{
    public string? Url { get; set; }

    public Open5eV2DocumentSummary? Document { get; set; }

    public string? Key { get; set; }

    public List<Open5eV2SpellCastingOption>? CastingOptions { get; set; }

    public Open5eV2NamedRef? School { get; set; }

    // Often present (sometimes empty)
    public List<Open5eV2NamedRef>? Classes { get; set; }
    public List<Open5eV2NamedRef>? SpellLists { get; set; }

    public string? RangeUnit { get; set; }
    public string? ShapeSizeUnit { get; set; }

    public string? Name { get; set; }
    public string? Desc { get; set; }

    public int? Level { get; set; }
    public string? HigherLevel { get; set; }

    public string? TargetType { get; set; }
    public string? RangeText { get; set; }
    public double? Range { get; set; }

    public bool? Ritual { get; set; }

    public string? CastingTime { get; set; }
    public string? ReactionCondition { get; set; }

    public bool? Verbal { get; set; }
    public bool? Somatic { get; set; }
    public bool? Material { get; set; }
    public string? MaterialSpecified { get; set; }
    public decimal? MaterialCost { get; set; }  // Can be decimal like "100.00"
    public bool? MaterialConsumed { get; set; }

    public int? TargetCount { get; set; }
    public string? SavingThrowAbility { get; set; }

    public bool? AttackRoll { get; set; }
    public string? DamageRoll { get; set; }

    // In samples this is an array of strings (e.g., "acid"), keep flexible:
    public List<string>? DamageTypes { get; set; }

    public string? Duration { get; set; }
    public bool? Concentration { get; set; }

    public string? ShapeType { get; set; }
    public double? ShapeSize { get; set; }
}

// -------------------------
// v1: Spell Lists
// -------------------------
public sealed class Open5eV1SpellList : Open5eExtensibleDto
{
    public string? Slug { get; set; }
    public string? Name { get; set; }
    public string? Desc { get; set; }
    public List<string>? Spells { get; set; }
}

// -------------------------
// v1: Planes
// -------------------------
public sealed class Open5eV1Plane : Open5eExtensibleDto
{
    public string? Slug { get; set; }
    public string? Name { get; set; }
    public string? Desc { get; set; }

    public string? DocumentSlug { get; set; }
    public string? DocumentTitle { get; set; }
    public string? DocumentUrl { get; set; }

    public string? Parent { get; set; }
}

// -------------------------
// v1: Sections
// -------------------------
public sealed class Open5eV1Section : Open5eExtensibleDto
{
    public string? Slug { get; set; }
    public string? Name { get; set; }
    public string? Desc { get; set; }
}

// -------------------------
// v1: Races
// -------------------------
public sealed class Open5eV1RaceAsiEntry : Open5eExtensibleDto
{
    public List<string>? Attributes { get; set; }
    public int? Value { get; set; }
}

public sealed class Open5eV1Speed : Open5eExtensibleDto
{
    public int? Walk { get; set; }
    public int? Fly { get; set; }
    public int? Swim { get; set; }
    public int? Burrow { get; set; }
    public int? Climb { get; set; }
}

public sealed class Open5eV1Race : Open5eExtensibleDto
{
    public string? Name { get; set; }
    public string? Slug { get; set; }

    public string? Desc { get; set; }

    public string? AsiDesc { get; set; }
    public List<Open5eV1RaceAsiEntry>? Asi { get; set; }

    public string? Age { get; set; }
    public string? Alignment { get; set; }

    public string? Size { get; set; }
    public string? SizeRaw { get; set; }

    public Open5eV1Speed? Speed { get; set; }
    public string? SpeedDesc { get; set; }

    public string? Languages { get; set; }
    public string? Vision { get; set; }
    public string? Traits { get; set; }

    public string? DocumentSlug { get; set; }
    public string? DocumentTitle { get; set; }
    public string? DocumentLicenseUrl { get; set; }
    public string? DocumentUrl { get; set; }
}

// -------------------------
// v1: Classes (+ archetypes)
// -------------------------
public sealed class Open5eV1Subclass : Open5eExtensibleDto
{
    public string? Slug { get; set; }
    public string? Name { get; set; }
    public string? Desc { get; set; }

    public string? DocumentSlug { get; set; }
    public string? DocumentTitle { get; set; }
    public string? DocumentLicenseUrl { get; set; }
    public string? DocumentUrl { get; set; }
}

public sealed class Open5eV1Class : Open5eExtensibleDto
{
    public string? Slug { get; set; }
    public string? Name { get; set; }
    public string? Desc { get; set; }

    public string? HitDice { get; set; }
    public string? HpAt1stLevel { get; set; }
    public string? HpAtHigherLevels { get; set; }

    public string? ProfArmor { get; set; }
    public string? ProfWeapons { get; set; }
    public string? ProfTools { get; set; }
    public string? ProfSavingThrows { get; set; }
    public string? ProfSkills { get; set; }

    public string? Equipment { get; set; }
    public string? Table { get; set; }

    public string? SpellcastingAbility { get; set; }
    public string? SubtypesName { get; set; }

    public List<Open5eV1Subclass>? Archetypes { get; set; }
}

// -------------------------
// v1: Magic Items
// -------------------------
public sealed class Open5eV1MagicItem : Open5eExtensibleDto
{
    public string? Slug { get; set; }
    public string? Name { get; set; }
    public string? Type { get; set; }
    public string? Desc { get; set; }

    public string? Rarity { get; set; }
    public string? RequiresAttunement { get; set; }

    public string? DocumentSlug { get; set; }
    public string? DocumentTitle { get; set; }
    public string? DocumentUrl { get; set; }
}

// -------------------------
// v1: Monsters (big schema; keep explicit core fields + Extra)
// -------------------------
public sealed class Open5eV1Monster : Open5eExtensibleDto
{
    public string? Slug { get; set; }
    public string? Name { get; set; }

    public string? Size { get; set; }
    public string? Type { get; set; }
    public string? Subtype { get; set; }
    public string? Alignment { get; set; }

    public int? ArmorClass { get; set; }
    public string? ArmorDesc { get; set; }

    public int? HitPoints { get; set; }
    public string? HitDice { get; set; }

    public string? Speed { get; set; }

    public int? Strength { get; set; }
    public int? Dexterity { get; set; }
    public int? Constitution { get; set; }
    public int? Intelligence { get; set; }
    public int? Wisdom { get; set; }
    public int? Charisma { get; set; }

    public string? StrengthSave { get; set; }
    public string? DexteritySave { get; set; }
    public string? ConstitutionSave { get; set; }
    public string? IntelligenceSave { get; set; }
    public string? WisdomSave { get; set; }
    public string? CharismaSave { get; set; }

    public string? Perception { get; set; }
    public string? Skills { get; set; }

    public string? DamageVulnerabilities { get; set; }
    public string? DamageResistances { get; set; }
    public string? DamageImmunities { get; set; }
    public string? ConditionImmunities { get; set; }

    public string? Senses { get; set; }
    public string? Languages { get; set; }

    public string? ChallengeRating { get; set; }

    public string? Actions { get; set; }
    public string? Reactions { get; set; }
    public string? LegendaryDesc { get; set; }
    public string? LegendaryActions { get; set; }
    public string? SpecialAbilities { get; set; }

    public string? Desc { get; set; }

    public string? DocumentSlug { get; set; }
    public string? DocumentTitle { get; set; }
    public string? DocumentLicenseUrl { get; set; }
    public string? DocumentUrl { get; set; }
}

// -------------------------
// v1: Manifest (endpoint exists; content may vary; keep generic)
// -------------------------
public sealed class Open5eV1ManifestItem : Open5eExtensibleDto
{
    public string? Filename { get; set; }
    public string? Type { get; set; }
    public string? Hash { get; set; }
    public DateTime? CreatedAt { get; set; }
}
