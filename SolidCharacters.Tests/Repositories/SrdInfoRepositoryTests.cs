using SolidCharacters.Tests.Fixtures;
using Xunit;

namespace SolidCharacters.Tests.Repositories;

[Collection("JsonData")]
public class SrdInfoRepositoryTests
{
    private readonly JsonDataFixture _fixture;

    public SrdInfoRepositoryTests(JsonDataFixture fixture)
    {
        _fixture = fixture;
    }

    #region 2014 SRD Tests

    [Fact]
    public void GetBackgrounds_2014_ReturnsNonEmpty()
    {
        var repo = _fixture.CreateSrdInfoRepository();
        
        var backgrounds = repo.GetBackgrounds("2014");
        
        Assert.NotNull(backgrounds);
        Assert.NotEmpty(backgrounds);
    }

    [Fact]
    public void GetClasses_2014_ReturnsNonEmpty()
    {
        var repo = _fixture.CreateSrdInfoRepository();
        
        var classes = repo.GetClasses("2014");
        
        Assert.NotNull(classes);
        Assert.NotEmpty(classes);
    }

    [Fact]
    public void GetRaces_2014_ReturnsNonEmpty()
    {
        var repo = _fixture.CreateSrdInfoRepository();
        
        var races = repo.GetRaces("2014");
        
        Assert.NotNull(races);
        Assert.NotEmpty(races);
    }

    [Fact]
    public void GetSpells_2014_ReturnsNonEmpty()
    {
        var repo = _fixture.CreateSrdInfoRepository();
        
        var spells = repo.GetSpells("2014");
        
        Assert.NotNull(spells);
        Assert.NotEmpty(spells);
    }

    [Fact]
    public void GetFeats_2014_ReturnsNonEmpty()
    {
        var repo = _fixture.CreateSrdInfoRepository();
        
        var feats = repo.GetFeats("2014");
        
        Assert.NotNull(feats);
        Assert.NotEmpty(feats);
    }

    [Fact]
    public void GetItems_2014_ReturnsNonEmpty()
    {
        var repo = _fixture.CreateSrdInfoRepository();
        
        var items = repo.GetItems("2014");
        
        Assert.NotNull(items);
        Assert.NotEmpty(items);
    }

    [Fact]
    public void GetSubclasses_2014_ReturnsNonEmpty()
    {
        var repo = _fixture.CreateSrdInfoRepository();
        
        var subclasses = repo.GetSubclasses("2014");
        
        Assert.NotNull(subclasses);
        Assert.NotEmpty(subclasses);
    }

    [Fact]
    public void GetSubraces_2014_ReturnsNonEmpty()
    {
        var repo = _fixture.CreateSrdInfoRepository();
        
        var subraces = repo.GetSubraces("2014");
        
        Assert.NotNull(subraces);
        Assert.NotEmpty(subraces);
    }

    #endregion

    #region 2024 SRD Tests

    [Fact]
    public void GetBackgrounds_2024_ReturnsNonEmpty()
    {
        var repo = _fixture.CreateSrdInfoRepository();
        
        var backgrounds = repo.GetBackgrounds("2024");
        
        Assert.NotNull(backgrounds);
        Assert.NotEmpty(backgrounds);
    }

    [Fact]
    public void GetClasses_2024_ReturnsNonEmpty()
    {
        var repo = _fixture.CreateSrdInfoRepository();
        
        var classes = repo.GetClasses("2024");
        
        Assert.NotNull(classes);
        Assert.NotEmpty(classes);
    }

    [Fact]
    public void GetRaces_2024_ReturnsNonEmpty()
    {
        var repo = _fixture.CreateSrdInfoRepository();
        
        var races = repo.GetRaces("2024");
        
        Assert.NotNull(races);
        Assert.NotEmpty(races);
    }

    [Fact]
    public void GetSpells_2024_ReturnsNonEmpty()
    {
        var repo = _fixture.CreateSrdInfoRepository();
        
        var spells = repo.GetSpells("2024");
        
        Assert.NotNull(spells);
        Assert.NotEmpty(spells);
    }

    [Fact]
    public void GetFeats_2024_ReturnsNonEmpty()
    {
        var repo = _fixture.CreateSrdInfoRepository();
        
        var feats = repo.GetFeats("2024");
        
        Assert.NotNull(feats);
        Assert.NotEmpty(feats);
    }

    [Fact]
    public void GetItems_2024_ReturnsNonEmpty()
    {
        var repo = _fixture.CreateSrdInfoRepository();
        
        var items = repo.GetItems("2024");
        
        Assert.NotNull(items);
        Assert.NotEmpty(items);
    }

    [Fact]
    public void GetSubclasses_2024_ReturnsNonEmpty()
    {
        var repo = _fixture.CreateSrdInfoRepository();
        
        var subclasses = repo.GetSubclasses("2024");
        
        Assert.NotNull(subclasses);
        Assert.NotEmpty(subclasses);
    }

    [Fact]
    public void GetSubraces_2024_ReturnsEmptyOrNonNull()
    {
        var repo = _fixture.CreateSrdInfoRepository();
        
        // 2024 SRD doesn't have subraces (species concept replaced them)
        var subraces = repo.GetSubraces("2024");
        
        Assert.NotNull(subraces);
        // May be empty - that's expected for 2024
    }

    #endregion

    #region Version Validation Tests

    [Theory]
    [InlineData("2013")]
    [InlineData("2025")]
    [InlineData("invalid")]
    public void GetBackgrounds_InvalidVersion_Throws(string version)
    {
        var repo = _fixture.CreateSrdInfoRepository();
        
        Assert.ThrowsAny<Exception>(() => repo.GetBackgrounds(version));
    }

    [Theory]
    [InlineData("2014")]
    [InlineData("2024")]
    public void GetBackgrounds_ValidVersion_DoesNotThrow(string version)
    {
        var repo = _fixture.CreateSrdInfoRepository();
        
        var exception = Record.Exception(() => repo.GetBackgrounds(version));
        
        Assert.Null(exception);
    }

    #endregion
}
