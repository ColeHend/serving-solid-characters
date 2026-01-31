using System.Reflection;
using SolidCharacters.Repository.Services;
using SolidCharacters.Repository;
using Xunit;

namespace SolidCharacters.Tests.Fixtures;

/// <summary>
/// Shared fixture that discovers the repository data root and provides
/// pre-configured service instances for tests.
/// </summary>
public class JsonDataFixture : IDisposable
{
    /// <summary>
    /// Absolute path to the folder containing data/ (test output directory).
    /// </summary>
    public string RepositoryRoot { get; }

    /// <summary>
    /// Absolute path to the data folder.
    /// </summary>
    public string DataRoot => Path.Combine(RepositoryRoot, "data");

    public JsonDataFixture()
    {
        RepositoryRoot = GetTestOutputDirectory();
        
        // Set environment variable so DbJsonService picks up the correct path
        Environment.SetEnvironmentVariable("DB_JSON_ROOT", RepositoryRoot);
    }

    /// <summary>
    /// Creates a new DbJsonService instance pointing at the real data files.
    /// </summary>
    public DbJsonService CreateDbJsonService()
    {
        return new DbJsonService();
    }

    /// <summary>
    /// Creates a new SrdInfoRepository instance for the specified version.
    /// </summary>
    public SrdInfoRepository CreateSrdInfoRepository()
    {
        return new SrdInfoRepository(CreateDbJsonService());
    }

    /// <summary>
    /// Creates a new DndInfoRepository instance (legacy SRD).
    /// </summary>
    public DndInfoRepository CreateDndInfoRepository()
    {
        return new DndInfoRepository(CreateDbJsonService());
    }

    /// <summary>
    /// Gets the test output directory where data/ is copied during build.
    /// </summary>
    private static string GetTestOutputDirectory()
    {
        var assemblyLocation = Assembly.GetExecutingAssembly().Location;
        var directory = Path.GetDirectoryName(assemblyLocation);

        if (string.IsNullOrEmpty(directory))
        {
            throw new InvalidOperationException("Could not determine test assembly directory.");
        }

        var dataPath = Path.Combine(directory, "data");
        if (!Directory.Exists(dataPath))
        {
            throw new InvalidOperationException(
                $"Data folder not found at {dataPath}. Ensure the test project copies data files to output.");
        }

        return directory;
    }

    public void Dispose()
    {
        // Clean up environment variable
        Environment.SetEnvironmentVariable("DB_JSON_ROOT", null);
    }
}

/// <summary>
/// Collection definition for sharing JsonDataFixture across test classes.
/// </summary>
[CollectionDefinition("JsonData")]
public class JsonDataCollection : ICollectionFixture<JsonDataFixture>
{
}
