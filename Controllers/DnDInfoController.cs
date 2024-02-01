using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using sharpAngleTemplate;
using sharpAngleTemplate.models.DTO;
using sharpAngleTemplate.models.repositories;
using sharpAngleTemplate.tools;


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
        public ActionResult<List<ClassDTO>> Classes()
        {
            // var classes = dndInfoRepository.GetClasses();
            var classes = jsonService.GetThe5EClasses().ToList();
            return Ok(classes);
        }
        
        [HttpPost()]
        public IActionResult Spells()
        {
            var spells = dndInfoRepository.GetSpells();
            return Ok(spells);
        }
    }   
