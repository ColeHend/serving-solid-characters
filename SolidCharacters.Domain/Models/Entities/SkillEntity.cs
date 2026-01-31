using System.ComponentModel.DataAnnotations;

namespace SolidCharacters.Domain.Entities
{
    public class SkillEntity
    {
        [Key]
        public int Id { get; set; }
        public int Amount { get; set; }
        public List<SkillsTextEntity> Skills { get; set; }
    }
    public class SkillsTextEntity
    {
        [Key]
        public int Id { get; set; }
        public string Skill { get; set; }
    }
    public class SkillDTO
    {
        public int Amount { get; set; }
        public List<string> Skills { get; set; }
    }
}