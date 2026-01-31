using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SolidCharacters.Domain.Core
{
    /// <summary>
    /// Class Levels Entity
    /// </summary>
    public class ChoicesEntity<T>
    {
        public int Choose { get; set; }
        public string Type { get; set; }
        public List<T> Choices { get; set; }
    }
    /// <summary>
    /// Featues Entity. TODO: change To inheritance structure.
    /// </summary>
    /// <typeparam name="K"></typeparam>
    public class Feature<K, T>
    {
        public Info<T>? Info { get; set; } = null;
        public string Name { get; set; } = "";
        public K Value { get; set; } = default;
    }

    public class Info<T>
    {
        public string? ClassName { get; set; }
        public string? SubclassName { get; set; }
        public int Level { get; set; } = 0;
        public string? Type { get; set; } = null;
        public T? Other { get; set; }
    }
    public class StartingEquipmentEntity
    {
        public string Class { get; set; }
        public int? Quantity { get; set; }
        public List<ChoicesEntity<string>> Choice1 { get; set; }
        public List<ChoicesEntity<string>> Choice2 { get; set; }
        public List<ChoicesEntity<Feature<int, string>>> Choice3 { get; set; }
        public List<ChoicesEntity<Feature<int, string>>> Choice4 { get; set; }
        public List<ChoicesEntity<Feature<int, string>>> Choice5 { get; set; }

    }

    public interface IRunOnStartup
    {
        void Run();
    }
}