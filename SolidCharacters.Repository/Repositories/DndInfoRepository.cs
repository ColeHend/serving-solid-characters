using Newtonsoft.Json;
using ClassesNS = SolidCharacters.Domain.ClassesEntity;
using SolidCharacters.Domain.RacesEntity;
using SolidCharacters.Domain.Entities;
using SolidCharacters.Repository.Services;
using SolidCharacters.Repository.Extensions;
using SolidCharacters.Domain.FeatsEntity;
using SolidCharacters.Domain.BackgroundsEntity;
using SolidCharacters.Domain.Core;
using ItemsNS = SolidCharacters.Domain.Items;

namespace SolidCharacters.Repository
{
    public class DndInfoRepository : IDndInfoRepository
    {
        private readonly IDbJsonService jsonService;
        private readonly List<ClassesNS.ClassEntity> classDTOs;
        private readonly List<SpellEntity> spellDTOs;
        private readonly List<RaceEntity> raceDTOs;
        private readonly List<ItemsNS.Item> itemsDTOs;
        private readonly List<ItemsNS.Weapon> weaponsDtos;
        private readonly List<ItemsNS.Armor> armorDtos;
        private readonly List<FeatEntity> featDTOs;
        private readonly List<BackgroundEntity> backgroundDTOs;
        public DndInfoRepository(IDbJsonService jsonService)
        {
            this.jsonService = jsonService;
            var classJson = jsonService.GetJson<List<ClassesNS.ClassEntity>>("srd/old/classes");
            var spellJson = jsonService.GetJson<SpellEntity[]>("srd/old/spells");
            var raceJson = jsonService.GetJson<RaceEntity[]>("srd/old/races");
            var itemJson = jsonService.GetJson<ItemsNS.Item[]>("srd/old/items");
            var weaponJson = jsonService.GetJson<ItemsNS.Weapon[]>("srd/old/weapons");
            var armorJson = jsonService.GetJson<ItemsNS.Armor[]>("srd/old/armor");
            var featJson = jsonService.GetJson<FeatEntity[]>("srd/old/feats");
            var backgroundJson = jsonService.GetJson<BackgroundEntity[]>("srd/old/backgrounds");

            classDTOs = classJson!;
            spellDTOs = spellJson!.ToList();
            raceDTOs = raceJson!.ToList();
            itemsDTOs = itemJson!.ToList();
            weaponsDtos = weaponJson!.ToList();
            armorDtos = armorJson!.ToList();
            featDTOs = featJson!.ToList();
            backgroundDTOs = backgroundJson!.ToList();
        }

        public List<ClassesNS.ClassDTO> GetClasses()
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

        public List<ItemsNS.Item> GetItems()
        {
            return itemsDTOs;
        }
        public List<ItemsNS.Weapon> GetWeapons()
        {
            return weaponsDtos;
        }
        public List<ItemsNS.Armor> GetArmor()
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
        List<ClassesNS.ClassDTO> GetClasses();
        List<SpellEntity> GetSpells();
        List<RaceEntity> GetRaces();
        List<ItemsNS.Item> GetItems();
        List<ItemsNS.Weapon> GetWeapons();
        List<ItemsNS.Armor> GetArmor();
        List<FeatEntity> GetFeats();
        List<BackgroundEntity> GetBackgrounds();

    }
}