using SolidCharacters.Domain.Core;

namespace SolidCharacters.Domain.RacesEntity
{
    public class RaceEntity
    {
        public string Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Speed { get; set; } = string.Empty;
        public List<Feature<int, string>> AbilityBonuses { get; set; } = new List<Feature<int, string>>();
        public ChoicesEntity<Feature<int, string>>? AbilityBonusChoice { get; set; } = null;
        public string Alignment { get; set; } = string.Empty;
        public string Age { get; set; } = string.Empty;
        public string Size { get; set; } = string.Empty;
        public string SizeDescription { get; set; } = string.Empty;
        public List<Feature<string, string>>? StartingProficencies { get; set; } = null;
        public ChoicesEntity<Feature<string, string>>? StartingProficenciesChoice { get; set; } = null;
        public List<string> Languages { get; set; } = new List<string>();
        public ChoicesEntity<string>? LanguageChoice { get; set; } = null;
        public string LanguageDesc { get; set; } = string.Empty;
        public List<Feature<List<string>, string>>? Traits { get; set; } = null;
        public ChoicesEntity<Feature<List<string>, string>>? TraitChoice { get; set; } = null;

        public List<SubRaceEntity> SubRaces { get; set; } = new List<SubRaceEntity>();

    }

    public class SubRaceEntity
    {
        public string Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Desc { get; set; } = string.Empty;
        public List<Feature<int, string>> AbilityBonuses { get; set; } = new List<Feature<int, string>>();
        public ChoicesEntity<Feature<int, string>>? AbilityBonusChoice { get; set; } = null;
        public string Alignment { get; set; } = string.Empty;
        public string Age { get; set; } = string.Empty;
        public string Size { get; set; } = string.Empty;
        public string SizeDescription { get; set; } = string.Empty;
        public List<Feature<string, string>>? StartingProficencies { get; set; } = null;
        public ChoicesEntity<Feature<string, string>>? StartingProficenciesChoice { get; set; } = null;
        public List<string> Languages { get; set; } = new List<string>();
        public ChoicesEntity<string>? LanguageChoice { get; set; } = null;
        public List<Feature<List<string>, string>>? Traits { get; set; } = null;
        public ChoicesEntity<Feature<List<string>, string>>? TraitChoice { get; set; } = null;
    }

    public class RaceDto
    {
        public string Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Speed { get; set; } = string.Empty;
        public List<Feature<int, string>> AbilityBonuses { get; set; } = new List<Feature<int, string>>();
        public ChoicesEntity<Feature<int, string>>? AbilityBonusChoice { get; set; } = null;
        public string Alignment { get; set; } = string.Empty;
        public string Age { get; set; } = string.Empty;
        public string Size { get; set; } = string.Empty;
        public string SizeDescription { get; set; } = string.Empty;
        public List<Feature<string, string>>? StartingProficencies { get; set; } = null;
        public ChoicesEntity<Feature<string, string>>? StartingProficenciesChoice { get; set; } = null;
        public List<string> Languages { get; set; } = new List<string>();
        public ChoicesEntity<string>? LanguageChoice { get; set; } = null;
        public string LanguageDesc { get; set; } = string.Empty;
        public List<Feature<List<string>, string>>? Traits { get; set; } = null;
        public ChoicesEntity<Feature<List<string>, string>>? TraitChoice { get; set; } = null;

        public List<SubRaceEntity> SubRaces { get; set; } = new List<SubRaceEntity>();
    }
}