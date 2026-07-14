using System;
using Newtonsoft.Json;
using SolidCharacters.Domain.DTO.Updated;
using Xunit;
using Stj = System.Text.Json;

namespace SolidCharacters.Tests.Models;

/// <summary>
/// Verifies the new <see cref="Monster"/> statblock model: it round-trips through the same
/// dual-serializer path the app uses (Newtonsoft reads the snake_case JSON on disk; System.Text.Json
/// writes camelCase over HTTP), and — crucially — that a monster's combat numbers can be DERIVED from
/// its stored <see cref="Stats"/> the character-model way, reproducing the printed statblock values
/// with nothing pre-computed on disk.
/// </summary>
public class StatBlockTests
{
    // 5e ability modifier, mirroring dndMath.ts getAbilityModifier.
    private static int AbilityModifier(int score) => (int)Math.Floor((score - 10) / 2.0);

    // A snake_case Chimera record, exactly as it would live in data/srd/{version}/monsters.json.
    private const string ChimeraJson = /*lang=json,strict*/ """
    {
      "id": "c0ffee00-0000-4c00-9000-00000000c417",
      "name": "Chimera", "size": "Large", "type": "monstrosity", "alignment": "chaotic evil",
      "stats": { "str": 19, "dex": 11, "con": 19, "int": 3, "wis": 14, "cha": 10 },
      "armor_class": 14, "armor_desc": "natural armor",
      "health": { "max": 114, "current": 114, "temp": 0 }, "hit_dice": "12d10+48",
      "speed": 30, "movement_speeds": { "fly": 60 },
      "senses": { "darkvision": 60, "passive_perception": 18 },
      "saving_throws": [],
      "proficiencies": { "skills": { "perception": { "stat": "wis", "value": 8, "proficient": true, "expertise": false } }, "other": {} },
      "resistances": [], "vulnerabilities": [], "immunities": [], "condition_immunities": [],
      "languages": ["Draconic"],
      "challenge_rating": "6", "proficiency_bonus": 3, "xp": 2300,
      "features": [], "granted_actions": [], "roll_advantages": [], "roll_bonuses": [],
      "attacks_per_action": 3,
      "attacks": [
        { "name": "Bite",  "action_type": "action", "attack_type": "melee", "ability": "str", "proficient": true, "reach": "5 ft.", "count": 1,
          "description": "Melee Weapon Attack: +7 to hit, reach 5 ft. Hit: 11 (2d6 + 4) piercing.",
          "damage": [ { "dice": "2d6", "type": "Piercing", "add_ability_modifier": true } ] },
        { "name": "Fire Breath", "action_type": "action", "recharge": "5-6", "count": 1,
          "description": "DC 15 Dexterity save, 31 (7d8) fire on a fail, half on a success.",
          "save": { "target_ability": "dex", "dc_ability": "con", "type": "half" },
          "damage": [ { "dice": "7d8", "type": "Fire", "add_ability_modifier": false } ] }
      ],
      "legacy": true
    }
    """;

    private static Monster DeserializeChimera() =>
        JsonConvert.DeserializeObject<Monster>(ChimeraJson)
            ?? throw new InvalidOperationException("Chimera failed to deserialize.");

    [Fact]
    public void Monster_DeserializesStructuredFields_FromSnakeCaseJson()
    {
        var chimera = DeserializeChimera();

        Assert.Equal("Chimera", chimera.Name);
        Assert.True(chimera.Legacy);
        Assert.Equal(19, chimera.Stats.Str);
        Assert.Equal(14, chimera.ArmorClass);
        Assert.Equal(114, chimera.Health.Max);
        Assert.Equal(60, chimera.MovementSpeeds.Fly);
        Assert.Equal(3, chimera.AttacksPerAction);

        var bite = Assert.Single(chimera.Attacks, a => a.Name == "Bite");
        Assert.Equal("str", bite.Ability);
        Assert.True(bite.Proficient);
        var biteDamage = Assert.Single(bite.Damage);
        Assert.Equal("2d6", biteDamage.Dice);
        Assert.True(biteDamage.AddAbilityModifier);

        var breath = Assert.Single(chimera.Attacks, a => a.Name == "Fire Breath");
        Assert.NotNull(breath.Save);
        Assert.Equal("dex", breath.Save!.TargetAbility);
        Assert.Equal("con", breath.Save.DcAbility);
        Assert.Equal("half", breath.Save.Type);
        Assert.Equal("5-6", breath.Recharge);
    }

    [Fact]
    public void Monster_DerivesToHitFromStats_MatchingPrintedStatblock()
    {
        var chimera = DeserializeChimera();
        var pb = chimera.ProficiencyBonus ?? 0;
        var bite = Assert.Single(chimera.Attacks, a => a.Name == "Bite");

        // to-hit = ability mod + (proficient ? PB : 0)  — the character-model derivation, nothing stored.
        var toHit = AbilityModifier(chimera.Stats.Str) + (bite.Proficient ? pb : 0);

        Assert.Equal(7, toHit);                                            // printed "+7 to hit"
        Assert.Equal(4, AbilityModifier(chimera.Stats.Str));             // the "+ 4" in "2d6 + 4"
    }

    [Fact]
    public void Monster_DerivesSaveDcFromStats_MatchingPrintedStatblock()
    {
        var chimera = DeserializeChimera();
        var pb = chimera.ProficiencyBonus ?? 0;
        var breath = Assert.Single(chimera.Attacks, a => a.Name == "Fire Breath");

        // save DC = 8 + PB + mod(dc_ability)  — mirrors spellSaveDC(pb, mod) in compute.ts.
        var dc = 8 + pb + AbilityModifier(GetStat(chimera.Stats, breath.Save!.DcAbility!));

        Assert.Equal(15, dc);                                            // printed "DC 15"
    }

    [Fact]
    public void Monster_SerializesCamelCase_OverTheWire()
    {
        var chimera = DeserializeChimera();

        // Mirror the API path: System.Text.Json with the ASP.NET camelCase policy (it ignores
        // Newtonsoft's [JsonProperty], so C# property names drive the wire keys).
        var json = Stj.JsonSerializer.Serialize(chimera, new Stj.JsonSerializerOptions
        {
            PropertyNamingPolicy = Stj.JsonNamingPolicy.CamelCase,
        });

        Assert.Contains("\"armorClass\":14", json);
        Assert.Contains("\"savingThrows\":", json);
        Assert.Contains("\"actionType\":\"action\"", json);
        Assert.Contains("\"attacksPerAction\":3", json);
    }

    [Fact]
    public void Rule_RoundTrips_WithTags()
    {
        const string ruleJson = /*lang=json,strict*/ """
        {
          "id": "b1e2c3d4-0000-4a00-9000-000000000001",
          "name": "Jumping",
          "description": "Your Strength determines how far you can jump.",
          "category": "Movement",
          "tags": ["movement", "jump", "athletics", "strength"],
          "page": "PHB 182",
          "legacy": true
        }
        """;

        var rule = JsonConvert.DeserializeObject<Rule>(ruleJson)
            ?? throw new InvalidOperationException("Rule failed to deserialize.");

        Assert.Equal("Jumping", rule.Name);
        Assert.Equal("Movement", rule.Category);
        Assert.Contains("jump", rule.Tags);
        Assert.True(rule.Legacy);
    }

    private static int GetStat(Stats stats, string key) => key switch
    {
        "str" => stats.Str,
        "dex" => stats.Dex,
        "con" => stats.Con,
        "int" => stats.Int,
        "wis" => stats.Wis,
        "cha" => stats.Cha,
        _ => throw new ArgumentOutOfRangeException(nameof(key), key, "Unknown ability key"),
    };
}
