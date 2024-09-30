using CoreModels;

namespace ClassesEntity
{
	public class ClassEntity
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int HitDie { get; set; }
        public List<ChoicesEntity<string>> ProficiencyChoices { get; set; }
        public List<string> Proficiencies { get; set; }
        public List<string> SavingThrows { get; set; }
        public List<LevelEntity> ClassLevels { get; set; }
        public List<SubclassEntity> Subclasses { get; set; }
        public SpellCastingDto? Spellcasting { get; set; }
        public StartingEquipmentDto StartingEquipment { get; set; }

				public ClassMetadata ClassMetadata { get; set; }

    }
    public class ClassDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int HitDie { get; set; }
        public List<ChoicesEntity<string>> ProficiencyChoices { get; set; }
        public List<string> Proficiencies { get; set; }
        public List<string> SavingThrows { get; set; }
        public List<LevelDTO> ClassLevels { get; set; }
        public List<SubclassDTO> Subclasses { get; set; }
        public SpellCastingDto? Spellcasting { get; set; }
        public StartingEquipmentDto StartingEquipment { get; set; }

				public ClassMetadata ClassMetadata { get; set; }

    }

		public class ClassMetadata
		{
			public List<int> SubclassLevels { get; set; }
			public string SubclassType { get; set; }
			public string SubclassTypePosition { get; set; }
		}

    public class SubclassDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string SubclassFlavor { get; set; }
        public List<string> Desc { get; set; }
        public List<Feature<string, string>> Features { get; set; }
        public string Class { get; set; }
        public List<SpellsDto> Spells { get; set; }
    }
		public class SubclassEntity
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string SubclassFlavor { get; set; }
        public List<string> Desc { get; set; }
        public List<Feature<object, string>> Features { get; set; }
        public string Class { get; set; }
        public List<SpellsDto> Spells { get; set; }
    }

    public class LevelEntity
    {
        public Info<string> Info { get; set; } = new Info<string>();
        public List<Feature<object, string>> Features { get; set; } = new List<Feature<object, string>>();
        public Dictionary<string, string> ClassSpecific { get; set; } = new Dictionary<string, string>();
        public int AbilityScoreBonus { get; set; }
        public int ProfBonus { get; set; }
        public Dictionary<string, int> Spellcasting { get; set; } = new Dictionary<string, int>();
    }
		public class LevelDTO
    {
        public Info<string> Info { get; set; } = new Info<string>();
        public List<Feature<string, string>> Features { get; set; } = new List<Feature<string, string>>();
        public Dictionary<string, string> ClassSpecific { get; set; } = new Dictionary<string, string>();
        public int AbilityScoreBonus { get; set; }
        public int ProfBonus { get; set; }
        public Dictionary<string, int> Spellcasting { get; set; } = new Dictionary<string, int>();
    }
		public class ValueDTO
		{
			public string Name { get; set; }
			public List<string> Desc { get; set; }
		}

    public class SpellsDto
    {
        public List<Prerequisite> Prerequisites { get; set; }
        public string Name { get; set; }

    }

    public class BaseDesc {
        public string Name { get; set;}
        public List<string> Desc { get; set; }
    }

    public class StartingEquipmentDto
    {
        public string Class { get; set; }
        public int? Quantity { get; set; }
        public List<EquipmentChoicesDto> Choice1 { get; set; }
        public List<EquipmentChoicesDto> Choice2 { get; set; }
        public List<EquipmentChoicesDto> Choice3 { get; set; }
        public List<EquipmentChoicesDto> Choice4 { get; set; }
        public List<EquipmentChoicesDto> Choice5 { get; set; }
    }

    
    public class Prerequisite
    {
        public string Name { get; set; }
        public string Type { get; set; }
    }

    public class SpellCastingDto
    {
        public string Name { get; set; }
        public int Level { get; set; }
        public string SpellcastingAbility { get; set; }
				public string CasterType { get; set; }
				public bool SpellsKnownRoundup { get; set; }
				public string SpellsKnownCalc { get; set; }
        public List<InfoDto> Info { get; set; }

    }
    
    public class InfoDto
    {
        public string Name { get; set; }
        public List<string> Desc { get; set; }

    }
   
    public class EquipmentChoicesDto
    {
        public int Choose { get; set; }
        public string Type { get; set; }
        public List<ItemDto> Choices { get; set; }
    }

    public class ItemDto
    {
        public string Item { get; set; }
        public int? Quantity { get; set; } = null;

        public List<string>? Desc { get; set; } = null;

    }
}