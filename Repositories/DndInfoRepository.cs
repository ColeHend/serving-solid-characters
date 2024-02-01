using DndClassJson;
using Newtonsoft.Json;
using sharpAngleTemplate.models.DTO;
using sharpAngleTemplate.tools;

namespace sharpAngleTemplate.models.repositories
{
    public class DndInfoRepository : IDndInfoRepository
    {
        private readonly IDbJsonService jsonService;
        private List<The5EClasses> classDTOs;
        private List<SpellDto> spellDTOs;
        public DndInfoRepository(IDbJsonService jsonService)
        {
            this.jsonService = jsonService;
            // var classJson = jsonService.GetJson<The5EClasses[]>("classes");
            var spellJson = jsonService.GetJson<SpellDto[]>("spells");

            // classDTOs = classJson!.ToList();
            spellDTOs = spellJson!.ToList();
        }

        // public List<The5EClasses> GetClasses()
        // {
        //     return classDTOs;
        // }
        public List<SpellDto> GetSpells()
        {
            return spellDTOs;
        }


    }

    public interface IDndInfoRepository
    {
        // List<The5EClasses> GetClasses();
        List<SpellDto> GetSpells();

    }
}