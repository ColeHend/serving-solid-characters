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

[ApiController]
    [Route("api/[controller]/[action]")]
    public class DnDInfoController : Controller
    {
        private readonly IDndInfoRepository dndInfoRepository;
        private readonly IDbJsonService jsonService;
        
        public DnDInfoController(IDndInfoRepository dndInfoRepository, IDbJsonService jsonService)
        {
            this.dndInfoRepository = dndInfoRepository;
            this.jsonService = jsonService;
        }
        
        [HttpPost()]
        public ActionResult<List<ClassEntity>> Classes()
        {
            var classes = dndInfoRepository.GetClasses();
            return Ok(classes);
        }

        [HttpPost()]
        public ActionResult<List<SpellEntity>> Spells()
        {
            var spells = dndInfoRepository.GetSpells();
            return Ok(spells);
        }
        
        [HttpPost()]
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

        [HttpPost()]
        public ActionResult<List<RaceEntity>> Races()
        {
            var races = dndInfoRepository.GetRaces();
            return Ok(races);
        }

        [HttpPost()]
        public ActionResult<List<FeatEntity>> Feats()
        {
            var feats = dndInfoRepository.GetFeats();
            return Ok(feats);
        }

        [HttpPost()]
        public ActionResult<List<BackgroundEntity>> Backgrounds()
        {
            var backgrounds = dndInfoRepository.GetBackgrounds();
            return Ok(backgrounds);
        }

    }   
