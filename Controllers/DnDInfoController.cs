using Newtonsoft.Json;
using sharpAngleTemplate;
using sharpAngleTemplate.models.DTO;
using Microsoft.AspNetCore.Mvc;
using ClassesEntity;
using sharpAngleTemplate.models.repositories;
using sharpAngleTemplate.tools;
using Items;
using RacesEntity;
using sharpAngleTemplate.models.entities;
using FeatsEntity;
using BackgroundsEntity;
using Microsoft.OpenApi.Any;
using sharpAngleTemplate.Repositories;

[ApiController]
[Route("api/[controller]")]
public class DnDInfoController : ControllerBase
{
    private readonly IDndInfoRepository dndInfoRepository;
    private readonly IDbJsonService jsonService;
    
    public DnDInfoController(IDndInfoRepository dndInfoRepository, IDbJsonService jsonService)
    {
        this.dndInfoRepository = dndInfoRepository;
        this.jsonService = jsonService;
    }
    [HttpGet("Classes")]
    public ActionResult<List<ClassesEntity.ClassDTO>> Classes()
    {
        var classes = dndInfoRepository.GetClasses();
        return Ok(classes);
    }

    [HttpGet("Spells")]
    public ActionResult<List<SpellEntity>> Spells()
    {
        var spells = dndInfoRepository.GetSpells();
        return Ok(spells);
    }
    
    [HttpGet("Items")]
    [ProducesResponseType(typeof(List<object>), 200)]
    public ActionResult<List<object>> Items()
    {
        List<object> toSend = new List<object>();
        var items = dndInfoRepository.GetItems();
        items.ForEach(item => toSend.Add(item));
        
        var weapons = dndInfoRepository.GetWeapons();
        weapons.ForEach(weapon => toSend.Add(weapon));

        var armors = dndInfoRepository.GetArmor();
        armors.ForEach(armor => toSend.Add(armor));

        return Ok(toSend);
    }

    [HttpGet("Races")]
    [ProducesResponseType(typeof(List<RaceEntity>), 200)]
    public ActionResult<List<RaceEntity>> Races()
    {
        var races = dndInfoRepository.GetRaces();
        return Ok(races);
    }

    [HttpGet("Feats")]
    [ProducesResponseType(typeof(List<FeatEntity>), 200)]
    public ActionResult<List<FeatEntity>> Feats()
    {
        var feats = dndInfoRepository.GetFeats();
        return Ok(feats);
    }

    [HttpGet("Backgrounds")]
    [ProducesResponseType(typeof(List<BackgroundEntity>), 200)]
    public ActionResult<List<BackgroundEntity>> Backgrounds()
    {
        Console.WriteLine("DnDInfo/Backgrounds endpoint called");
        var backgrounds = dndInfoRepository.GetBackgrounds();
        Console.WriteLine($"Found {backgrounds.Count} backgrounds");
        return Ok(backgrounds);
    }

}
