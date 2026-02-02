using SolidCharacters.Domain.Core;
using SolidCharacters.Repository;
using SolidCharacters.Repository.Services;

namespace SolidCharacters.HostedServices;

/// <summary>
/// Startup service that fetches spells from the Closed5e repository (Open5e API)
/// and writes them to a JSON file. Enable by setting SYNC_OPEN5E_SPELLS=true.
/// </summary>
public sealed class SpellSyncStartupService : IRunOnStartup
{
    private readonly Closed5eRepository _closed5eRepository;
    private readonly IDbJsonService _dbJsonService;
    private readonly ILogger<SpellSyncStartupService> _logger;

    public SpellSyncStartupService(
        Closed5eRepository closed5eRepository,
        IDbJsonService dbJsonService,
        ILogger<SpellSyncStartupService> logger)
    {
        _closed5eRepository = closed5eRepository;
        _dbJsonService = dbJsonService;
        _logger = logger;
    }

    public void Run()
    {
        // Only run if explicitly enabled via environment variable
        if (Environment.GetEnvironmentVariable("SYNC_OPEN5E_SPELLS") != "true")
        {
            _logger.LogInformation("Spell sync skipped (set SYNC_OPEN5E_SPELLS=true to enable)");
            return;
        }

        // Call async method synchronously since IRunOnStartup.Run() is void
        RunAsync().GetAwaiter().GetResult();
    }

    private async Task RunAsync()
    {
        try
        {
            _logger.LogInformation("Starting spell sync from Open5e API...");

            var spells = await _closed5eRepository.GetOpen5eSpells();

            // Write to data/srd/2024/open5e-spells.json to avoid overwriting existing SRD data
            _dbJsonService.SaveJson("srd/2024/open5e-spells", spells);

            _logger.LogInformation("Spell sync completed. Wrote {Count} spells to open5e-spells.json", spells.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to sync spells from Open5e API");
        }
    }
}
