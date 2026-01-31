using SolidCharacters.Domain.Core;

namespace SolidCharacters.Domain.FeatsEntity
{
    public class FeatEntity
    {
        public string Name { get; set; }
        public List<string> Desc { get; set; }
        public List<Feature<string, string>> PreReqs { get; set; } 
    }
}