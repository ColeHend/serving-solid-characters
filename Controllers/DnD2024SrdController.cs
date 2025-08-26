
using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using sharpAngleTemplate.models.DTO.Updated;
using sharpAngleTemplate.models.repositories;

[ApiController]
[Route("api/2024")]
public class DnD2024Controller : ControllerBase
{
    private readonly ISrdInfoRepository srdInfoRepository;

    public DnD2024Controller(ISrdInfoRepository srdInfoRepository)
    {
        this.srdInfoRepository = srdInfoRepository;
    }

    [HttpGet("Classes")]
    public ActionResult<List<Class5E>> Classes()
    {
        try
        {
          var classes = srdInfoRepository.GetClasses("2024");

          Console.WriteLine("Classes: ",JsonConvert.SerializeObject(classes));
          Debug.WriteLine("Classes: ",JsonConvert.SerializeObject(classes));

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
        var spells = srdInfoRepository.GetSpells("2024");
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
        var items = srdInfoRepository.GetItems("2024");
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
        var subclasses = srdInfoRepository.GetSubclasses("2024");
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
        var backgrounds = srdInfoRepository.GetBackgrounds("2024");
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
        var feats = srdInfoRepository.GetFeats("2024");
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
        var races = srdInfoRepository.GetRaces("2024");
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
        var subraces = srdInfoRepository.GetSubraces("2024");
        return Ok(subraces);
      }
      catch (Exception ex)
      {
        Console.WriteLine("Error retrieving subraces: " + ex.Message);
        return StatusCode(500, "Internal server error");
      }
    }

    [HttpGet("Masteries")]
    public ActionResult<List<WeaponMastery>> Masteries()
    {
      try
      {
        var masteries = srdInfoRepository.GetWeaponMasteries();
        return Ok(masteries);
      }
      catch (Exception ex)
      {
        Console.WriteLine("Error retrieving masteries: " + ex.Message);
        return StatusCode(500, "Internal server error");
      }
    }

    [HttpGet("MagicItems")]
    public ActionResult<List<MagicItem>> MagicItems()
    {
      try
      {
        var magicItems = srdInfoRepository.GetMagicItems();
        return Ok(magicItems);
      }
      catch (Exception ex)
      {
        Console.WriteLine("Error retrieving magic items: " + ex.Message);
        return StatusCode(500, "Internal server error");
      }
    }
}