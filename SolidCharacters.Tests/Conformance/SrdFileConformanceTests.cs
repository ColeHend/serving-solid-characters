using SolidCharacters.Domain.DTO.Updated;
using SolidCharacters.Tests.Fixtures;
using Xunit;

namespace SolidCharacters.Tests.Conformance;

/// <summary>
/// Round-trip conformance gate for the generated SRD JSON: every file must deserialize
/// through the same repository path the server uses (Newtonsoft → DTO.Updated) and satisfy
/// the structural invariants the client relies on. This is the true serving contract —
/// if these pass, the API can serve the files.
/// </summary>
[Collection("JsonData")]
public class SrdFileConformanceTests
{
    private readonly JsonDataFixture fixture;

    public SrdFileConformanceTests(JsonDataFixture fixture)
    {
        this.fixture = fixture;
    }

    public static IEnumerable<object[]> Versions => new List<object[]> { new object[] { "2014" }, new object[] { "2024" } };

    private static void AssertMads(string owner, FeatureMetadata? metadata)
    {
        foreach (var mad in metadata?.Mads ?? new List<MadFeature>())
        {
            Assert.False(string.IsNullOrWhiteSpace(mad.Command), $"{owner}: mad with empty command");
            Assert.True(mad.Command.StartsWith("Add") || mad.Command.StartsWith("Remove"), $"{owner}: mad command '{mad.Command}' is not Add/Remove");
            Assert.NotNull(mad.Value);
            Assert.NotEmpty(mad.Value);
            Assert.True(mad.Type == MadType.Character || mad.Type == MadType.Info, $"{owner}: mad '{mad.Command}' has invalid type");
            if (mad.Command == "AddUses")
            {
                Assert.Equal(MadType.Info, mad.Type);
            }
            Assert.NotNull(mad.Prerequisites);
        }
    }

    private static void AssertFeature(string owner, FeatureDetail feature)
    {
        Assert.False(string.IsNullOrWhiteSpace(feature.Name), $"{owner}: feature with empty name");
        Assert.False(string.IsNullOrWhiteSpace(feature.Id), $"{owner}: feature '{feature.Name}' has empty id");
        Assert.NotNull(feature.Description);
        AssertMads($"{owner}/{feature.Name}", feature.Metadata);
    }

    [Theory]
    [MemberData(nameof(Versions))]
    public void Classes_RoundTrip(string version)
    {
        var classes = fixture.CreateSrdInfoRepository().GetClasses(version);
        Assert.Equal(12, classes.Count);
        foreach (var c in classes)
        {
            Assert.False(string.IsNullOrWhiteSpace(c.Id), $"class {c.Name}: empty id");
            Assert.False(string.IsNullOrWhiteSpace(c.Name));
            Assert.False(string.IsNullOrWhiteSpace(c.HitDie), $"class {c.Name}: empty hit_die");
            Assert.NotNull(c.Features);
            for (var lvl = 1; lvl <= 20; lvl++)
            {
                Assert.True(c.Features!.ContainsKey(lvl), $"class {c.Name} ({version}): missing feature level {lvl}");
            }
            foreach (var (lvl, feats) in c.Features!)
            {
                foreach (var f in feats) AssertFeature($"{c.Name} L{lvl}", f);
            }
            if (c.Spellcasting is not null)
            {
                Assert.True(Enum.IsDefined(c.Spellcasting.Metadata.CasterType), $"class {c.Name}: bad casterType");
                Assert.NotEmpty(c.Spellcasting.Metadata.Slots);
            }
        }

        // every caster must have real slot tables (the old 2014 data lacked them)
        var casterNames = new[] { "Bard", "Cleric", "Druid", "Sorcerer", "Wizard", "Paladin", "Ranger", "Warlock" };
        foreach (var name in casterNames)
        {
            var caster = classes.FirstOrDefault(c => c.Name == name);
            Assert.NotNull(caster);
            Assert.NotNull(caster!.Spellcasting);
            var hasSlots = caster.Spellcasting!.Metadata.Slots.Values.Any(s =>
                (s.SpellSlotsLevel1 ?? s.SpellSlotsLevel2 ?? s.SpellSlotsLevel3 ?? s.SpellSlotsLevel4 ?? s.SpellSlotsLevel5 ??
                 s.SpellSlotsLevel6 ?? s.SpellSlotsLevel7 ?? s.SpellSlotsLevel8 ?? s.SpellSlotsLevel9) > 0);
            Assert.True(hasSlots, $"caster {name} ({version}): no spell slots in any level");
        }
    }

    [Theory]
    [MemberData(nameof(Versions))]
    public void Subclasses_RoundTrip(string version)
    {
        var subclasses = fixture.CreateSrdInfoRepository().GetSubclasses(version);
        Assert.Equal(12, subclasses.Count);
        foreach (var s in subclasses)
        {
            Assert.False(string.IsNullOrWhiteSpace(s.Id), $"subclass {s.Name}: empty id");
            Assert.False(string.IsNullOrWhiteSpace(s.ParentClass), $"subclass {s.Name}: empty parent_class");
            foreach (var (lvl, feats) in s.Features)
            {
                foreach (var f in feats) AssertFeature($"{s.Name} L{lvl}", f);
            }
        }
    }

    [Theory]
    [MemberData(nameof(Versions))]
    public void Races_And_Subraces_RoundTrip(string version)
    {
        var repo = fixture.CreateSrdInfoRepository();
        var races = repo.GetRaces(version);
        Assert.Equal(9, races.Count);
        foreach (var r in races)
        {
            Assert.False(string.IsNullOrWhiteSpace(r.Id), $"race {r.Name}: empty id");
            Assert.True(r.Speed > 0, $"race {r.Name}: speed {r.Speed}");
            foreach (var t in r.Traits)
            {
                Assert.False(string.IsNullOrWhiteSpace(t.Id), $"race {r.Name}: trait with empty id");
                AssertFeature($"{r.Name}", t.Details);
                // racial ability increases must live in abilityBonuses, never as stat mads
                Assert.DoesNotContain(t.Details.Metadata?.Mads ?? new List<MadFeature>(), m => m.Command.EndsWith("Stats"));
            }
        }

        var subraces = repo.GetSubraces(version);
        if (version == "2024")
        {
            Assert.Empty(subraces);
        }
        else
        {
            Assert.True(subraces.Count >= 4, $"expected >= 4 subraces, got {subraces.Count}");
            var raceIds = races.Select(r => r.Id).ToHashSet();
            foreach (var s in subraces)
            {
                Assert.Contains(s.ParentRace, raceIds);
            }
        }
    }

    [Theory]
    [MemberData(nameof(Versions))]
    public void Spells_RoundTrip(string version)
    {
        var spells = fixture.CreateSrdInfoRepository().GetSpells(version);
        Assert.True(spells.Count >= 319, $"expected >= 319 spells, got {spells.Count}");
        foreach (var s in spells)
        {
            Assert.False(string.IsNullOrWhiteSpace(s.Id), $"spell {s.Name}: empty id");
            Assert.False(string.IsNullOrWhiteSpace(s.Name));
            Assert.False(string.IsNullOrWhiteSpace(s.School), $"spell {s.Name}: empty school");
            Assert.NotNull(s.Classes);
            Assert.NotEmpty(s.Classes);
        }
    }

    [Theory]
    [MemberData(nameof(Versions))]
    public void Items_RoundTrip(string version)
    {
        var items = fixture.CreateSrdInfoRepository().GetItems(version);
        Assert.True(items.Count >= 60, $"expected >= 60 items, got {items.Count}");
        foreach (var i in items)
        {
            Assert.False(string.IsNullOrWhiteSpace(i.Id), $"item {i.Name}: empty id");
            Assert.True(Enum.IsDefined(i.Type), $"item {i.Name}: bad type");
        }
    }

    [Theory]
    [MemberData(nameof(Versions))]
    public void MagicItems_RoundTrip(string version)
    {
        var magicItems = fixture.CreateSrdInfoRepository().GetMagicItems(version);
        Assert.True(magicItems.Count >= 200, $"expected >= 200 magic items ({version}), got {magicItems.Count}");
        foreach (var m in magicItems)
        {
            Assert.False(string.IsNullOrWhiteSpace(m.Id), $"magic item {m.Name}: empty id");
            Assert.False(string.IsNullOrWhiteSpace(m.Name));
            AssertMads($"magic item {m.Name}", m.Metadata);
        }
    }

    [Theory]
    [MemberData(nameof(Versions))]
    public void Backgrounds_And_Feats_RoundTrip(string version)
    {
        var repo = fixture.CreateSrdInfoRepository();
        var backgrounds = repo.GetBackgrounds(version);
        var feats = repo.GetFeats(version);
        Assert.Equal(version == "2014" ? 1 : 4, backgrounds.Count);
        Assert.True(feats.Count >= (version == "2014" ? 1 : 16), $"feats {version}: got {feats.Count}");
        foreach (var b in backgrounds)
        {
            Assert.False(string.IsNullOrWhiteSpace(b.Id), $"background {b.Name}: empty id");
            foreach (var f in b.Features ?? new List<FeatureDetail>()) AssertFeature(b.Name, f);
        }
        foreach (var f in feats)
        {
            Assert.False(string.IsNullOrWhiteSpace(f.Id), "feat with empty id");
            AssertFeature("feat", f.Details);
        }
    }

    [Fact]
    public void WeaponMasteries_RoundTrip_2024()
    {
        var masteries = fixture.CreateSrdInfoRepository().GetWeaponMasteries();
        Assert.True(masteries.Count >= 30, $"expected >= 30 masteries, got {masteries.Count}");
        foreach (var m in masteries)
        {
            Assert.False(string.IsNullOrWhiteSpace(m.Id), $"mastery {m.Name}: empty id");
            Assert.False(string.IsNullOrWhiteSpace(m.Mastery), $"mastery {m.Name}: empty mastery");
        }
    }
}
