using SolidCharacters.Domain.ClassesEntity;
using SolidCharacters.Domain.Core;

namespace SolidCharacters.Domain.BackgroundsEntity
{
    public class BackgroundEntity
    {
        public string Name { get; set; }
        public List<Feature<string, string>>? StartingProficiencies { get; set; }
        public ChoicesEntity<string>? LanguageChoice { get; set; }

        public List<ItemDto> StartingEquipment { get; set; }

        public List<EquipmentChoicesDto> StartingEquipmentChoices { get; set; }

        public List<Feature<List<string>, string>>? Feature { get; set; }
    }
}