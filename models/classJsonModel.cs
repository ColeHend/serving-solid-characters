namespace DndClassJson
{
  using System.Collections.Generic;
	using System.Text.Json.Serialization;
	using Newtonsoft.Json;
	  public class Choice
    {
        [JsonProperty("Item", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Item")]
        public string Item;

        [JsonProperty("Quantity", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Quantity")]
        public int? Quantity;

        [JsonProperty("Desc", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Desc")]
        public object Desc;
    }

    public class Choice1
    {
        [JsonProperty("Choose", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Choose")]
        public int? Choose;

        [JsonProperty("Type", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Type")]
        public string Type;

        [JsonProperty("Choices", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Choices")]
        public List<Choice> Choices;
    }

    public class Choice2
    {
        [JsonProperty("Choose", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Choose")]
        public int? Choose;

        [JsonProperty("Type", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Type")]
        public string Type;

        [JsonProperty("Choices", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Choices")]
        public List<Choice> Choices;
    }

    public class Choice3
    {
        [JsonProperty("Choose", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Choose")]
        public int? Choose;

        [JsonProperty("Type", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Type")]
        public string Type;

        [JsonProperty("Choices", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Choices")]
        public List<Choice> Choices;
    }

    public class Choice4
    {
        [JsonProperty("Choose", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Choose")]
        public int? Choose;

        [JsonProperty("Type", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Type")]
        public string Type;

        [JsonProperty("Choices", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Choices")]
        public List<Choice> Choices;
    }

    public class Choice5
    {
        [JsonProperty("Choose", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Choose")]
        public int? Choose;

        [JsonProperty("Type", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Type")]
        public string Type;

        [JsonProperty("Choices", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Choices")]
        public List<Choice> Choices;
    }

    public class ClassLevel
    {
        [JsonProperty("Info", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Info")]
        public Info Info;

        [JsonProperty("Features", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Features")]
        public List<Feature> Features;

        [JsonProperty("ClassSpecific", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("ClassSpecific")]
        public ClassSpecific ClassSpecific;

        [JsonProperty("AbilityScoreBonus", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("AbilityScoreBonus")]
        public int? AbilityScoreBonus;

        [JsonProperty("ProfBonus", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("ProfBonus")]
        public int? ProfBonus;

        [JsonProperty("Spellcasting", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Spellcasting")]
        public Spellcasting Spellcasting;
    }

    public class ClassSpecific
    {
        [JsonProperty("RageDamageBonus", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("RageDamageBonus")]
        public string RageDamageBonus;

        [JsonProperty("RageCount", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("RageCount")]
        public string RageCount;

        [JsonProperty("BrutalCriticalDice", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("BrutalCriticalDice")]
        public string BrutalCriticalDice;

        [JsonProperty("AdditionalMagicalSecretsMaxLvl", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("AdditionalMagicalSecretsMaxLvl")]
        public string AdditionalMagicalSecretsMaxLvl;

        [JsonProperty("BardicInspirationDie", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("BardicInspirationDie")]
        public string BardicInspirationDie;

        [JsonProperty("MagicalSecretsMax5", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("MagicalSecretsMax5")]
        public string MagicalSecretsMax5;

        [JsonProperty("MagicalSecretsMax7", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("MagicalSecretsMax7")]
        public string MagicalSecretsMax7;

        [JsonProperty("MagicalSecretsMax9", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("MagicalSecretsMax9")]
        public string MagicalSecretsMax9;

        [JsonProperty("SongOfRestDie", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("SongOfRestDie")]
        public string SongOfRestDie;

        [JsonProperty("ChannelDivinityCharges", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("ChannelDivinityCharges")]
        public string ChannelDivinityCharges;

        [JsonProperty("DestroyUndeadCr", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("DestroyUndeadCr")]
        public string DestroyUndeadCr;

        [JsonProperty("WildShapeMaxCr", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("WildShapeMaxCr")]
        public string WildShapeMaxCr;

        [JsonProperty("WildShapeFly", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("WildShapeFly")]
        public string WildShapeFly;

        [JsonProperty("WildShapeSwim", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("WildShapeSwim")]
        public string WildShapeSwim;

        [JsonProperty("ActionSurges", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("ActionSurges")]
        public string ActionSurges;

        [JsonProperty("ExtraAttacks", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("ExtraAttacks")]
        public string ExtraAttacks;

        [JsonProperty("IndomitableUses", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("IndomitableUses")]
        public string IndomitableUses;

        [JsonProperty("MartialArts", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("MartialArts")]
        public string MartialArts;

        [JsonProperty("UnarmoredMovement", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("UnarmoredMovement")]
        public string UnarmoredMovement;

        [JsonProperty("AuraRange", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("AuraRange")]
        public string AuraRange;

        [JsonProperty("FavoredEnemies", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("FavoredEnemies")]
        public string FavoredEnemies;

        [JsonProperty("FavoredTerrain", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("FavoredTerrain")]
        public string FavoredTerrain;

        [JsonProperty("SneakAttack", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("SneakAttack")]
        public string SneakAttack;

        [JsonProperty("CreatingSpellSlots", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("CreatingSpellSlots")]
        public string CreatingSpellSlots;

        [JsonProperty("MetamagicKnown", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("MetamagicKnown")]
        public string MetamagicKnown;

        [JsonProperty("SorceryPoints", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("SorceryPoints")]
        public string SorceryPoints;

        [JsonProperty("InvocationsKnown", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("InvocationsKnown")]
        public string InvocationsKnown;

        [JsonProperty("MysticArcanumLevel6", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("MysticArcanumLevel6")]
        public string MysticArcanumLevel6;

        [JsonProperty("MysticArcanumLevel7", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("MysticArcanumLevel7")]
        public string MysticArcanumLevel7;

        [JsonProperty("MysticArcanumLevel8", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("MysticArcanumLevel8")]
        public string MysticArcanumLevel8;

        [JsonProperty("MysticArcanumLevel9", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("MysticArcanumLevel9")]
        public string MysticArcanumLevel9;

        [JsonProperty("ArcaneRecoveryLevels", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("ArcaneRecoveryLevels")]
        public string ArcaneRecoveryLevels;
    }

    public class Feature
    {
        [JsonProperty("Info", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Info")]
        public Info Info;

        [JsonProperty("Name", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Name")]
        public string Name;

        [JsonProperty("Value", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Value")]
        public Value Value;
    }

    public class Info
    {
        [JsonProperty("ClassName", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("ClassName")]
        public string ClassName;

        [JsonProperty("SubclassName", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("SubclassName")]
        public string SubclassName;

        [JsonProperty("Level", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Level")]
        public int? Level;

        [JsonProperty("Type", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Type")]
        public object Type;

        [JsonProperty("Other", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Other")]
        public object Other;
    }

    public class ProficiencyChoice
    {
        [JsonProperty("Choose", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Choose")]
        public int? Choose;

        [JsonProperty("Type", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Type")]
        public string Type;

        [JsonProperty("Choices", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Choices")]
        public List<string> Choices;
    }

    public class Root
    {
        [JsonProperty("Id", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Id")]
        public int? Id;

        [JsonProperty("Name", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Name")]
        public string Name;

        [JsonProperty("HitDie", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("HitDie")]
        public int? HitDie;

        [JsonProperty("ProficiencyChoices", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("ProficiencyChoices")]
        public List<ProficiencyChoice> ProficiencyChoices;

        [JsonProperty("Proficiencies", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Proficiencies")]
        public List<string> Proficiencies;

        [JsonProperty("SavingThrows", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("SavingThrows")]
        public List<string> SavingThrows;

        [JsonProperty("ClassLevels", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("ClassLevels")]
        public List<ClassLevel> ClassLevels;

        [JsonProperty("Subclasses", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Subclasses")]
        public List<Subclass> Subclasses;

        [JsonProperty("Spellcasting", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Spellcasting")]
        public object Spellcasting;

        [JsonProperty("StartingEquipment", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("StartingEquipment")]
        public StartingEquipment StartingEquipment;
    }

    public class Spellcasting
    {
        [JsonProperty("cantrips_known", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("cantrips_known")]
        public int? CantripsKnown;

        [JsonProperty("spells_known", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("spells_known")]
        public int? SpellsKnown;

        [JsonProperty("spell_slots_level_1", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("spell_slots_level_1")]
        public int? SpellSlotsLevel1;

        [JsonProperty("spell_slots_level_2", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("spell_slots_level_2")]
        public int? SpellSlotsLevel2;

        [JsonProperty("spell_slots_level_3", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("spell_slots_level_3")]
        public int? SpellSlotsLevel3;

        [JsonProperty("spell_slots_level_4", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("spell_slots_level_4")]
        public int? SpellSlotsLevel4;

        [JsonProperty("spell_slots_level_5", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("spell_slots_level_5")]
        public int? SpellSlotsLevel5;

        [JsonProperty("spell_slots_level_6", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("spell_slots_level_6")]
        public int? SpellSlotsLevel6;

        [JsonProperty("spell_slots_level_7", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("spell_slots_level_7")]
        public int? SpellSlotsLevel7;

        [JsonProperty("spell_slots_level_8", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("spell_slots_level_8")]
        public int? SpellSlotsLevel8;

        [JsonProperty("spell_slots_level_9", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("spell_slots_level_9")]
        public int? SpellSlotsLevel9;
    }

    public class StartingEquipment
    {
        [JsonProperty("Class", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Class")]
        public string Class;

        [JsonProperty("Quantity", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Quantity")]
        public object Quantity;

        [JsonProperty("Choice1", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Choice1")]
        public List<Choice1> Choice1;

        [JsonProperty("Choice2", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Choice2")]
        public List<Choice2> Choice2;

        [JsonProperty("Choice3", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Choice3")]
        public List<Choice3> Choice3;

        [JsonProperty("Choice4", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Choice4")]
        public List<Choice4> Choice4;

        [JsonProperty("Choice5", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Choice5")]
        public List<Choice5> Choice5;
    }

    public class Subclass
    {
        [JsonProperty("Id", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Id")]
        public int? Id;

        [JsonProperty("Name", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Name")]
        public string Name;

        [JsonProperty("SubclassFlavor", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("SubclassFlavor")]
        public string SubclassFlavor;

        [JsonProperty("Desc", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Desc")]
        public List<string> Desc;

        [JsonProperty("Features", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Features")]
        public List<Feature> Features;

        [JsonProperty("Class", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Class")]
        public string Class;

        [JsonProperty("Spells", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Spells")]
        public object Spells;
    }

    public class Value
    {
        [JsonProperty("Name", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Name")]
        public string Name;

        [JsonProperty("Desc", NullValueHandling = NullValueHandling.Ignore)]
        [JsonPropertyName("Desc")]
        public List<string> Desc;
    }
}
