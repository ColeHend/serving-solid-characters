
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace sharpAngleTemplate.models.entities
{
  public class SpellEntity {
        public string Name { get; set; } = string.Empty;
        
        [JsonPropertyName("description")] public string Description { get; set; } = string.Empty;
        public string Duration { get; set; } = string.Empty;
        public string? Level { get; set; } = string.Empty;
        public string Range { get; set; } = string.Empty;

        [JsonPropertyName("casting_time")]
        public string Casting_time { get; set; } = string.Empty;

        public string Components { get; set; } = string.Empty;

        [JsonPropertyName("is_concentration")]
        public bool Is_concentration { get; set; } = false;
        [JsonPropertyName("is_ritual")]
        public bool Is_ritual { get; set; } = false;
        public string School { get; set; } = string.Empty;
        
        [JsonPropertyName("damage_type")]
        public string Damage_type { get; set; } = string.Empty;
        public string Page { get; set; } = string.Empty;
        public bool IsMaterial { get; set; } = false;
        public bool IsSomatic { get; set; } = false;
        public bool IsVerbal { get; set; } = false;
        public string? Materials_Needed { get; set; } = string.Empty;
        public string? Higher_Level { get; set; } = string.Empty;
        public List<string> Classes { get; set; } = new List<string>();
        public List<string> SubClasses { get; set; } = new List<string>();
    }
}