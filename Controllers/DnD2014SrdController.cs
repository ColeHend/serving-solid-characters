
using Microsoft.AspNetCore.Mvc;
using sharpAngleTemplate.models.DTO.Updated;
using sharpAngleTemplate.models.repositories;
[ApiController]
[Route("api/2014")]
public class DnD2014Controller : ControllerBase
{
    private readonly ISrdInfoRepository srdInfoRepository;

    public DnD2014Controller(ISrdInfoRepository srdInfoRepository)
    {
        this.srdInfoRepository = srdInfoRepository;
    }

    [HttpGet("Classes")]
    public ActionResult<List<Class5E>> Classes()
    {
        try
        {
            var classes = srdInfoRepository.GetClasses();
            return Ok(classes);
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error retrieving classes: " + ex.Message);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("Spells")]
    public ActionResult<List<Spell>> Spells()
    {
        try
        {
            var spells = srdInfoRepository.GetSpells();
            return Ok(spells);
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error retrieving spells: " + ex.Message);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("Items")]
    public ActionResult<List<Item>> Items()
    {
        try
        {
            var items = srdInfoRepository.GetItems();
            return Ok(items);
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error retrieving items: " + ex.Message);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("Subclasses")]
    public ActionResult<List<Subclass>> Subclasses()
    {
        try
        {
            var subclasses = srdInfoRepository.GetSubclasses();
            return Ok(subclasses);
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error retrieving subclasses: " + ex.Message);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("Backgrounds")]
    public ActionResult<List<Background>> Backgrounds()
    {
        try
        {
            var backgrounds = srdInfoRepository.GetBackgrounds();
            return Ok(backgrounds);
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error retrieving backgrounds: " + ex.Message);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("Feats")]
    public ActionResult<List<Feat>> Feats()
    {
        try
        {
            var feats = srdInfoRepository.GetFeats();
            return Ok(feats);
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error retrieving feats: " + ex.Message);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("Races")]
    public ActionResult<List<Race>> Races()
    {
      try
      {
        var races = srdInfoRepository.GetRaces();
        return Ok(races);
      }
      catch (Exception ex)
      {
        Console.WriteLine("Error retrieving races: " + ex.Message);
        return StatusCode(500, "Internal server error");
      }
    }

    [HttpGet("Subraces")]
    public ActionResult<List<Subrace>> Subraces()
    {
      try
      {
        var subraces = srdInfoRepository.GetSubraces();
        return Ok(subraces);
      }
      catch (Exception ex)
      {
        Console.WriteLine("Error retrieving subraces: " + ex.Message);
        return StatusCode(500, "Internal server error");
      }
    }
}