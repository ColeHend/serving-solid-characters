using SolidCharacters.Domain.Core;
using SolidCharacters.Domain.ClassesEntity;
using SolidCharacters.Domain.RacesEntity;
using SolidCharacters.Domain.DTO.Updated;
using ColesTypescriptToCSharp;
using ColesTypescriptToCSharp.Models;

namespace SolidCharacters.HostedServices
{
    public sealed class TypeGenStartupService : IRunOnStartup
    {
        public void Run()
        {
            Console.WriteLine("Starting TypeScript generation...");
            var converter = new TypeScriptConverter(new TypeScriptConverterOptions
            {
                // Enum output style: Numeric or StringLiteral
                EnumStyle = EnumStyle.Numeric,
                // Property naming: CamelCase or PreserveOriginal
                PropertyNaming = PropertyNamingStyle.CamelCase,
                // File naming: Dots (MyApp.Models.ts) or Underscores (MyApp_Models.ts)
                FileNaming = FileNamingStyle.Dots,
                // Include 'extends' for classes with base types
                IncludeInheritance = true,
                // Nullable handling: UseNullUnion (T | null), Optional (T?), or Ignore
                NullableHandling = NullableHandling.Optional,
                // Generate index.ts barrel file
                GenerateBarrelFile = true,
            });

            converter.AddType<Spell>();
            converter.AddType<Item>();
            converter.AddType<Class5E>();
            converter.AddType<Subclass>();
            converter.AddType<Race>();
            converter.AddType<Subrace>();
            converter.AddType<Feat>();
            converter.AddType<WeaponMastery>();
            converter.AddType<MagicItem>();
            converter.AddType<Background>();

            converter.WriteToDirectory("./client/src/models/generated");
            Console.WriteLine("TypeScript generation completed.");

        }
    }
}
