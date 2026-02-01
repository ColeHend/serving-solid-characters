namespace SolidCharacters.Repository.Extensions;

using System;
using System.Collections.Generic;
using System.Linq;
using SolidCharacters.Domain.DTO.Updated;
using SolidCharacters.Domain.Open5e;

/// <summary>
/// Extension methods for converting Open5e DTOs into domain models.
/// </summary>
public static class Open5eExtenstions
{
    /// <summary>
    /// Convert an Open5eV2Spell into a domain Spell.
    /// </summary>
    public static Spell ToDomainModel(this Open5eV2Spell spell)
    {
        var result = new Spell();
        if (spell == null)
        {
            return result;
        }

        result.Name = spell.Name ?? string.Empty;
        result.Description = spell.Desc ?? string.Empty;
        result.Duration = spell.Duration ?? string.Empty;
        result.Concentration = spell.Concentration ?? false;

        // Build components string from flags.
        var components = new List<string>();
        if (spell.Verbal == true) components.Add("V");
        if (spell.Somatic == true) components.Add("S");
        if (spell.Material == true) components.Add("M");
        result.Components = string.Join(", ", components);

        // Level as string (e.g., "0" for cantrips).
        if (spell.Level.HasValue)
        {
            result.Level = spell.Level.Value.ToString();
        }
        else
        {
            result.Level = string.Empty;
        }

        // Range: prefer RangeText, otherwise build from numeric Range and unit.
        if (!string.IsNullOrWhiteSpace(spell.RangeText))
        {
            result.Range = spell.RangeText!;
        }
        else if (spell.Range.HasValue)
        {
            var unit = spell.RangeUnit ?? string.Empty;
            result.Range = $"{spell.Range.Value} {unit}".Trim();
        }
        else
        {
            result.Range = string.Empty;
        }

        result.Ritual = spell.Ritual ?? false;
        result.School = spell.School?.Name ?? string.Empty;
        result.CastingTime = spell.CastingTime ?? string.Empty;

        // DamageType: join multiple types or leave empty.
        if (spell.DamageTypes != null && spell.DamageTypes.Any())
        {
            result.DamageType = string.Join(", ", spell.DamageTypes);
        }
        else
        {
            result.DamageType = string.Empty;
        }

        // Page is not provided by Open5e; leave empty.
        result.Page = string.Empty;

        result.IsMaterial = spell.Material ?? false;
        result.IsSomatic = spell.Somatic ?? false;
        result.IsVerbal = spell.Verbal ?? false;

        // Materials needed.
        result.MaterialsNeeded = spell.MaterialSpecified;

        // Higher level description.
        result.HigherLevel = spell.HigherLevel ?? string.Empty;

        // Classes and subclasses.
        result.Classes = spell.Classes != null
            ? spell.Classes.Where(c => !string.IsNullOrWhiteSpace(c?.Name)).Select(c => c!.Name!).ToList()
            : new List<string>();
        result.SubClasses = spell.SpellLists != null
            ? spell.SpellLists.Where(l => !string.IsNullOrWhiteSpace(l?.Name)).Select(l => l!.Name!).ToList()
            : new List<string>();

        return result;
    }

    /// <summary>
    /// Convert an Open5eV2Background into a domain Background.
    /// </summary>
    public static Background ToDomainModel(this Open5eV2Background background)
    {
        var result = new Background
        {
            Proficiencies = new Proficiencies(),
            StartEquipment = new List<StartingEquipment>(),
            AbilityOptions = null,
            Feat = null,
            Languages = null
        };

        if (background == null)
        {
            return result;
        }

        result.Name = background.Name ?? string.Empty;
        result.Desc = background.Desc ?? string.Empty;

        // Map benefits into FeatureDetail items.
        if (background.Benefits != null && background.Benefits.Any())
        {
            result.Features = background.Benefits.Select(b => new FeatureDetail
            {
                Name = b.Name ?? string.Empty,
                Description = b.Desc ?? string.Empty,
                ChoiceKey = null,
                Metadata = null
            }).ToList();
        }

        return result;
    }

    /// <summary>
    /// Convert an Open5eV2Feat into a domain Feat.
    /// </summary>
    public static Feat ToDomainModel(this Open5eV2Feat feat)
    {
        var result = new Feat
        {
            Details = new FeatureDetail(),
            Prerequisites = new List<Prerequisite>()
        };

        if (feat == null)
        {
            return result;
        }

        result.Details.Name = feat.Name ?? string.Empty;
        result.Details.Description = feat.Desc ?? string.Empty;
        result.Details.ChoiceKey = null;
        result.Details.Metadata = null;

        // Add prerequisite as a single string if provided.
        if (!string.IsNullOrWhiteSpace(feat.Prerequisite))
        {
            result.Prerequisites.Add(new Prerequisite
            {
                Type = PrerequisiteType.String,
                Value = feat.Prerequisite!
            });
        }

        return result;
    }

    /// <summary>
    /// Convert an Open5eV1Class into a domain Class5E.
    /// </summary>
    public static Class5E ToDomainModel(this Open5eV1Class class5E)
    {
        var result = new Class5E
        {
            SavingThrows = new List<string>(),
            StartingEquipment = new List<StartingEquipment>(),
            Proficiencies = new Proficiencies(),
            StartChoices = new ClassStartChoices(),
            Features = null,
            Choices = null,
            ClassSpecific = null
        };

        if (class5E == null)
        {
            return result;
        }

        // Compute a stable integer ID from the slug.
        result.Id = class5E.Slug != null ? class5E.Slug.GetHashCode() : 0;
        result.Name = class5E.Name ?? string.Empty;
        result.HitDie = class5E.HitDice ?? string.Empty;
        result.PrimaryAbility = class5E.SpellcastingAbility ?? string.Empty;

        // Parse saving throws into a list.
        result.SavingThrows = ParseList(class5E.ProfSavingThrows);

        // Parse starting equipment into a StartingEquipment list.
        if (!string.IsNullOrWhiteSpace(class5E.Equipment))
        {
            var items = class5E.Equipment!.Split(new[] { ';', ',', '\n' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(i => i.Trim())
                .Where(i => !string.IsNullOrWhiteSpace(i))
                .ToList();
            if (items.Any())
            {
                result.StartingEquipment.Add(new StartingEquipment { Items = items });
            }
        }

        // Populate proficiencies by splitting strings.
        result.Proficiencies = new Proficiencies
        {
            Armor = ParseList(class5E.ProfArmor),
            Weapons = ParseList(class5E.ProfWeapons),
            Tools = ParseList(class5E.ProfTools),
            Skills = ParseList(class5E.ProfSkills)
        };

        // Spellcasting metadata: if a spellcasting ability exists, assume full caster with number known type.
        if (!string.IsNullOrWhiteSpace(class5E.SpellcastingAbility))
        {
            result.Spellcasting = new Spellcasting
            {
                Metadata = new SpellcastingMetadata
                {
                    Slots = new Dictionary<int, Spellslots>(),
                    CasterType = CasterType.Full
                },
                KnownType = SpellKnownType.Number,
                SpellsKnown = null,
                SpellsKnownCalc = null,
                LearnedSpells = new Dictionary<int, List<string>>()
            };
        }
        else
        {
            result.Spellcasting = null;
        }

        return result;
    }

    /// <summary>
    /// Convert an Open5eV1Subclass into a domain Subclass.
    /// </summary>
    public static Subclass ToDomainModel(this Open5eV1Subclass subclass)
    {
        var result = new Subclass
        {
            Features = new Dictionary<int, List<FeatureDetail>>(),
            Choices = null,
            Spellcasting = null
        };

        if (subclass == null)
        {
            return result;
        }

        result.Name = subclass.Name ?? string.Empty;
        // Parent class context is not known at this level.
        result.ParentClass = string.Empty;
        result.Description = subclass.Desc ?? string.Empty;

        return result;
    }

    /// <summary>
    /// Convert an Open5eV1Race into a domain Race.
    /// </summary>
    public static Race ToDomainModel(this Open5eV1Race race)
    {
        var result = new Race
        {
            Languages = new List<string>(),
            AbilityBonuses = new List<StatBonus>(),
            Traits = new List<Feat>(),
            Descriptions = new Dictionary<string, string>()
        };

        if (race == null)
        {
            return result;
        }

        result.Id = race.Slug ?? string.Empty;
        result.Name = race.Name ?? string.Empty;
        result.Size = race.Size ?? race.SizeRaw ?? string.Empty;
        result.Speed = race.Speed?.Walk ?? 0;

        // Parse languages and detect any bonus language choice.
        if (!string.IsNullOrWhiteSpace(race.Languages))
        {
            var langStr = race.Languages!;
            // Check if there's a free language choice.
            if (langStr.ToLower().Contains("extra language"))
            {
                result.LanguageChoice = new ChoiceDetail
                {
                    Options = new List<string>(),
                    Amount = 1
                };
            }

            // Remove parenthetical phrases and "plus one extra language of your choice".
            var cleaned = langStr
                .Replace("(", string.Empty)
                .Replace(")", string.Empty)
                .Replace("+", string.Empty)
                .Replace("plus one extra language of your choice", string.Empty, StringComparison.OrdinalIgnoreCase)
                .Trim();

            var parts = cleaned.Split(new[] { ',', ';', '\n' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(p => p.Trim())
                .Where(p => !string.IsNullOrWhiteSpace(p))
                .ToList();
            var languagesList = new List<string>();
            foreach (var p in parts)
            {
                // Split on " and " for combined languages.
                var andSplits = p.Split(new[] { " and " }, StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => s.Trim());
                languagesList.AddRange(andSplits);
            }
            result.Languages = languagesList.Where(s => !string.IsNullOrWhiteSpace(s)).ToList();
        }

        // Map ability score increases.
        if (race.Asi != null)
        {
            foreach (var entry in race.Asi)
            {
                var value = entry.Value ?? 0;
                if (entry.Attributes != null && entry.Attributes.Count == 1)
                {
                    var attr = entry.Attributes[0];
                    if (Enum.TryParse<AbilityScores>(attr, true, out var score))
                    {
                        result.AbilityBonuses.Add(new StatBonus { Stat = score, Value = value });
                    }
                }
                else if (entry.Attributes != null && entry.Attributes.Count > 1)
                {
                    // Create or update an AbilityBonusChoice for multi-attribute ASI.
                    var choice = new AbilityBonusChoice { Amount = value };
                    foreach (var attr in entry.Attributes)
                    {
                        if (Enum.TryParse<AbilityScores>(attr, true, out var score))
                        {
                            choice.Choices.Add(new StatBonus { Stat = score, Value = value });
                        }
                    }
                    result.AbilityBonusChoice = choice;
                }
            }
        }

        // Add descriptive text.
        void AddDesc(string key, string? value)
        {
            if (!string.IsNullOrWhiteSpace(value))
            {
                result.Descriptions![key] = value!;
            }
        }
        AddDesc("desc", race.Desc);
        AddDesc("age", race.Age);
        AddDesc("alignment", race.Alignment);
        AddDesc("speed_desc", race.SpeedDesc);
        AddDesc("vision", race.Vision);
        AddDesc("traits", race.Traits);

        return result;
    }

    /// <summary>
    /// Convert an Open5eV1MagicItem into a domain MagicItem.
    /// </summary>
    public static MagicItem ToDomainModel(this Open5eV1MagicItem magicItem)
    {
        var result = new MagicItem
        {
            Properties = new MagicItemProperties()
        };

        if (magicItem == null)
        {
            return result;
        }

        result.Id = magicItem.Slug != null ? magicItem.Slug.GetHashCode() : 0;
        result.Name = magicItem.Name ?? string.Empty;
        result.Desc = magicItem.Desc ?? string.Empty;
        result.Rarity = magicItem.Rarity ?? string.Empty;
        result.Cost = string.Empty;
        result.Category = magicItem.Type ?? string.Empty;
        result.Weight = string.Empty;

        result.Properties.Attunement = magicItem.RequiresAttunement;
        // The Open5e API does not provide effect or charges separately; reuse description for effect.
        result.Properties.Effect = magicItem.Desc;
        result.Properties.Charges = null;

        return result;
    }

    /// <summary>
    /// Helper to parse comma-separated strings into a list of trimmed elements.
    /// Splits on commas, semicolons, and new lines; also splits segments containing " and ".
    /// </summary>
    private static List<string> ParseList(string? input)
    {
        var list = new List<string>();
        if (string.IsNullOrWhiteSpace(input))
        {
            return list;
        }

        var segments = input!.Split(new[] { ',', ';', '\n' }, StringSplitOptions.RemoveEmptyEntries)
            .Select(s => s.Trim())
            .Where(s => !string.IsNullOrWhiteSpace(s));

        foreach (var seg in segments)
        {
            // Further split on " and ".
            var parts = seg.Split(new[] { " and " }, StringSplitOptions.RemoveEmptyEntries)
                .Select(p => p.Trim());
            list.AddRange(parts);
        }

        return list;
    }

    /// <summary>
    /// Convert an Open5eV2Weapon into a domain Item.
    /// </summary>
    public static Item ToDomainModel(this Open5eV2Weapon weapon)
    {
        var result = new Item
        {
            Name = weapon.Name ?? string.Empty,
            Desc = string.Empty,
            Type = ItemType.Weapon,
            Weight = 0,
            Cost = string.Empty,
            Properties = new Dictionary<string, object>()
        };

        if (weapon.DamageDice != null)
        {
            result.Properties["damage"] = weapon.DamageDice;
        }
        if (weapon.DamageType?.Name != null)
        {
            result.Properties["damageType"] = weapon.DamageType.Name;
        }
        if (weapon.Range.HasValue)
        {
            result.Properties["range"] = weapon.Range.Value;
        }
        if (weapon.LongRange.HasValue)
        {
            result.Properties["longRange"] = weapon.LongRange.Value;
        }
        if (weapon.IsSimple.HasValue)
        {
            result.Properties["isSimple"] = weapon.IsSimple.Value;
        }
        if (weapon.Properties != null && weapon.Properties.Any())
        {
            result.Properties["weaponProperties"] = weapon.Properties
                .Where(p => p.Property?.Name != null)
                .Select(p => p.Property!.Name!)
                .ToList();
        }

        return result;
    }

    /// <summary>
    /// Convert an Open5eV2Armor into a domain Item.
    /// </summary>
    public static Item ToDomainModel(this Open5eV2Armor armor)
    {
        var result = new Item
        {
            Name = armor.Name ?? string.Empty,
            Desc = string.Empty,
            Type = ItemType.Armor,
            Weight = 0,
            Cost = string.Empty,
            Properties = new Dictionary<string, object>()
        };

        if (armor.AcDisplay != null)
        {
            result.Properties["acDisplay"] = armor.AcDisplay;
        }
        if (armor.AcBase.HasValue)
        {
            result.Properties["acBase"] = armor.AcBase.Value;
        }
        if (armor.Category != null)
        {
            result.Properties["category"] = armor.Category;
        }
        if (armor.GrantsStealthDisadvantage.HasValue)
        {
            result.Properties["stealthDisadvantage"] = armor.GrantsStealthDisadvantage.Value;
        }
        if (armor.StrengthScoreRequired.HasValue)
        {
            result.Properties["strengthRequired"] = armor.StrengthScoreRequired.Value;
        }
        if (armor.AcAddDexmod.HasValue)
        {
            result.Properties["addDexMod"] = armor.AcAddDexmod.Value;
        }
        if (armor.AcCapDexmod.HasValue)
        {
            result.Properties["dexModCap"] = armor.AcCapDexmod.Value;
        }

        return result;
    }
}