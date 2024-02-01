using System.Collections.ObjectModel;
using System.ComponentModel.DataAnnotations;

namespace sharpAngleTemplate.models.entities
{
    public class ClassEntity
    {
        [Key]
        public int Id { get; set; }
        public string Name { get; set; }
        public int HitDie { get; set; }
        public virtual List<ProficiencyChoicesEntity> ProficiencyChoices { get; set; }
        public int ProficiencyChoiceCount { get; set; }
        public virtual List<SavingThrowsEntity> SavingThrows { get; set; }
        public virtual List<StartingEquipmentEntity> StartingEquipment { get; set; }
        public virtual List<ClassLevelEntity> ClassLevels { get; set; }
        public virtual List<SubclassesEntity> Subclasses { get; set; }
        public string SpellCastingAbility { get; set; }
        public virtual List<ClassLevelEntity> SpellCastingLevel { get; set; }
        public SkillEntity Skills { get; set; }
        public virtual List<ClassInvocationsEntity> Invocations { get; set; }
    }
    public class ClassLevelEntity
    {
        [Key]
        public int Id { get; set; }
        public int Level { get; set; }
        public int ProficiencyBonus { get; set; }
        public string Features { get; set; }
        public ClassLevelSpellcastingEntity Spellcasting { get; set; }
        public string Other { get; set; }
    }

    public class ClassLevelSpellcastingEntity
    {
        [Key]
        public int Id { get; set; }
        public int Level { get; set; }
        public int CantripsKnown { get; set; }
        public string SpellSlotLevel { get; set; }
        public string InvocationsKnown { get; set; }
        public string SpellSlotsLevel1 { get; set; }
        public string SpellSlotsLevel2 { get; set; }
        public string SpellSlotsLevel3 { get; set; }
        public string SpellSlotsLevel4 { get; set; }
        public string SpellSlotsLevel5 { get; set; }
        public string SpellSlotsLevel6 { get; set; }
        public string SpellSlotsLevel7 { get; set; }
        public string SpellSlotsLevel8 { get; set; }
        public string SpellSlotsLevel9 { get; set; }
    }

    public class ClassInvocationsEntity
    {
        [Key]
        public int Id { get; set; }
        public string Name { get; set; }
        public virtual List<ClassInvocationDescriptionEntity> Description { get; set; }
        public int Level { get; set; }
        public virtual List<InvocationsEntity> Invocations { get; set; }
    }
    public class ClassInvocationDescriptionEntity
    {
        [Key]
        public int Id { get; set; }
        public string Text { get; set; }
    }
    public class ProficiencyChoicesEntity 
    {
        [Key]
        public int Id { get; set; }
        public string Text { get; set; }
    }
    public class SavingThrowsEntity
    {
        [Key]
        public int Id { get; set; }
        public string Text { get; set; }
    }
    public class StartingEquipmentEntity
    {
        [Key]
        public int Id { get; set; }
        public string Text { get; set; }
    }
    public class SubclassesEntity
    {
        [Key]
        public int Id { get; set; }
        public string Name { get; set; }
    }

    public class InvocationsEntity
    {
        [Key]
        public int Id { get; set; }
        public string Text { get; set; }
    }
}