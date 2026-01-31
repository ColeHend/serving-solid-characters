using SolidCharacters.Domain;
using SolidCharacters.Tests.Fixtures;
using Xunit;

namespace SolidCharacters.Tests.Services;

[Collection("JsonData")]
public class DbJsonServiceTests
{
    private readonly JsonDataFixture _fixture;

    public DbJsonServiceTests(JsonDataFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public void DataFolder_Exists()
    {
        Assert.True(Directory.Exists(_fixture.DataRoot), 
            $"Data folder should exist at {_fixture.DataRoot}");
    }

    [Fact]
    public void GetDB_ReturnsNonNullCollection()
    {
        var service = _fixture.CreateDbJsonService();
        
        var db = service.GetDB();
        
        Assert.NotNull(db);
    }

    [Fact]
    public void GetJson_LoadsDbJson()
    {
        var service = _fixture.CreateDbJsonService();
        
        var db = service.GetJson<DBCollection>("db");
        
        Assert.NotNull(db);
    }

    [Fact]
    public void GetJson_LoadsClassesJson()
    {
        var service = _fixture.CreateDbJsonService();
        
        var classes = service.GetThe5EClasses();
        
        Assert.NotNull(classes);
        Assert.NotEmpty(classes);
    }

    [Theory]
    [InlineData("srd/2014/spells")]
    [InlineData("srd/2014/classes")]
    [InlineData("srd/2014/races")]
    [InlineData("srd/2014/backgrounds")]
    [InlineData("srd/2014/feats")]
    [InlineData("srd/2024/spells")]
    [InlineData("srd/2024/classes")]
    [InlineData("srd/2024/races")]
    [InlineData("srd/2024/backgrounds")]
    [InlineData("srd/2024/feats")]
    public void GetJson_LoadsSrdFile(string path)
    {
        var service = _fixture.CreateDbJsonService();
        
        // Load as dynamic array to verify file is valid JSON
        var data = service.GetJson<object[]>(path);
        
        Assert.NotNull(data);
    }

    [Fact]
    public void JsonRoot_PointsToRepositoryFolder()
    {
        var service = _fixture.CreateDbJsonService();
        
        Assert.Equal(_fixture.RepositoryRoot, service.JsonRoot);
    }
}
