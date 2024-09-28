using Newtonsoft.Json;
using sharpAngleTemplate.models.DTO;
using ClassesEntity;
using Items;
using RacesEntity;
using sharpAngleTemplate.models.entities;
using sharpAngleTemplate.tools;
using FeatsEntity;
using BackgroundsEntity;
using CoreModels;
using SRDSpellsjson;

namespace sharpAngleTemplate.models.repositories
{
    public class DndInfoRepository : IDndInfoRepository
    {
        private readonly IDbJsonService jsonService;
        private readonly List<ClassEntity> classDTOs;
        private readonly List<SpellEntity> spellDTOs;
        private readonly List<RaceEntity> raceDTOs;
        private readonly List<Item> itemsDTOs;
        private readonly List<Weapon> weaponsDtos;
        private readonly List<Armor> armorDtos;
        private readonly List<FeatEntity> featDTOs;
        private readonly List<BackgroundEntity> backgroundDTOs;
        public DndInfoRepository(IDbJsonService jsonService)
        {
            this.jsonService = jsonService;
            var classJson = jsonService.GetJson<List<ClassEntity>>("srd/classes");
            var spellJson = jsonService.GetJson<SpellEntity[]>("srd/spells");
            var raceJson = jsonService.GetJson<RaceEntity[]>("srd/races");
            var itemJson = jsonService.GetJson<Item[]>("srd/items");
            var weaponJson = jsonService.GetJson<Weapon[]>("srd/weapons");
            var armorJson = jsonService.GetJson<Armor[]>("srd/armor");
            var featJson = jsonService.GetJson<FeatEntity[]>("srd/feats");
            var backgroundJson = jsonService.GetJson<BackgroundEntity[]>("srd/backgrounds");

            classDTOs = classJson!;
            spellDTOs = spellJson!.ToList();
            raceDTOs = raceJson!.ToList();
            itemsDTOs = itemJson!.ToList();
            weaponsDtos = weaponJson!.ToList();
            armorDtos = armorJson!.ToList();
            featDTOs = featJson!.ToList();
            backgroundDTOs = backgroundJson!.ToList();
        }

        public List<ClassesEntity.ClassDTO> GetClasses()
        { 
					Console.WriteLine($"\n\nClassCount: {classDTOs.Count}");
					var classList = classDTOs.Select(x=>x.ToDTO()).ToList();
					Console.WriteLine($"\n\nDTOClassCount: {classList.Count}");
          return classList.AddForgemaster();
        }
        public List<SpellEntity> GetSpells()
        {
            return spellDTOs;
        }

        public List<RaceEntity> GetRaces()
        {
            return raceDTOs;
        }

        public List<Item> GetItems()
        {
            return itemsDTOs;
        }
        public List<Weapon> GetWeapons()
        {
            return weaponsDtos;
        }
        public List<Armor> GetArmor()
        {
            return armorDtos;
        }
        public List<FeatEntity> GetFeats()
        {
            return featDTOs;
        }
        public List<BackgroundEntity> GetBackgrounds()
        {
            return backgroundDTOs;
        }
    }
    public interface IDndInfoRepository
    {
        List<ClassesEntity.ClassDTO> GetClasses();
        List<SpellEntity> GetSpells();
        List<RaceEntity> GetRaces();
        List<Item> GetItems();
        List<Weapon> GetWeapons();
        List<Armor> GetArmor();
        List<FeatEntity> GetFeats();
        List<BackgroundEntity> GetBackgrounds();

    }
}