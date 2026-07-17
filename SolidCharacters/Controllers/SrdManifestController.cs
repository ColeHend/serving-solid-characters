using Microsoft.AspNetCore.Mvc;
using SolidCharacters.Domain.DTO.Updated;
using SolidCharacters.Repository;

// Deliberately routed outside /api/(2014|2024|DndInfo) so the service worker's
// StaleWhileRevalidate SRD cache never applies — freshness checks must hit the network.
[ApiController]
[Route("api/srd")]
public class SrdManifestController : ControllerBase
{
    private readonly ISrdInfoRepository srdInfoRepository;

    public SrdManifestController(ISrdInfoRepository srdInfoRepository)
    {
        this.srdInfoRepository = srdInfoRepository;
    }

    [HttpGet("manifest")]
    public ActionResult<SrdManifest> Manifest()
    {
        try
        {
            return Ok(srdInfoRepository.GetManifest());
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error retrieving SRD manifest: " + ex.Message);
            return StatusCode(500, "Internal server error");
        }
    }
}
