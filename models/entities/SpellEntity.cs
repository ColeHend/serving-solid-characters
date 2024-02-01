
using System.ComponentModel.DataAnnotations;

namespace sharpAngleTemplate.models.entities
{
  public class SpellEntity
    {
        [Key]
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string HigherLevels { get; set; }
        public string Range { get; set; }
        public string Components { get; set; }
        public string Duration { get; set; }
        public string CastingTime { get; set; }
        public bool IsRitual { get; set; }
        public bool IsConcentration { get; set; }
        public int Level { get; set; }
        public string School { get; set; }
        public string DamageType { get; set; }
        public string AttackType { get; set; }
        public string Dc { get; set; }
        public string HealAtSlotLevel { get; set; }
        public string AreaOfEffect { get; set; }
        public virtual List<SpellClassNamesEntity> Classes { get; set; }
    }
    public class SpellClassNamesEntity {
        [Key]
        public int Id { get; set; }
        public string Name { get; set; }
    }
}