
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace sharpAngleTemplate.models.entities
{
  public class SpellEntity {
        public string Name { get; set; } = string.Empty;
        
        [JsonPropertyName("description")]
        public string Desc { get; set; } = string.Empty;
        public string Duration { get; set; } = string.Empty;
        public string? Level { get; set; } = string.Empty;
        public string Range { get; set; } = string.Empty;

        [JsonPropertyName("casting_time")]
        public string CastingTime { get; set; } = string.Empty;

        public string Components { get; set; } = string.Empty;

        [JsonPropertyName("is_concentration")]
        public bool Concentration { get; set; } = false;
        [JsonPropertyName("is_ritual")]
        public bool Ritual { get; set; } = false;
        public string School { get; set; } = string.Empty;
        
        [JsonPropertyName("damage_type")]
        public string DamageType { get; set; } = string.Empty;
        public string Page { get; set; } = string.Empty;
        public bool IsMaterial { get; set; } = false;
        public bool IsSomatic { get; set; } = false;
        public bool IsVerbal { get; set; } = false;
        public string? Materials_Needed { get; set; } = string.Empty;
        public string? HigherLevel { get; set; } = string.Empty;
        public List<string> Classes { get; set; } = new List<string>();
        public List<string> SubClasses { get; set; } = new List<string>();
    }
}