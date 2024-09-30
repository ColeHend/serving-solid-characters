
using System.Linq;
using System.Collections.Generic;
using DndClassJson;
using sharpAngleTemplate.Repositories;
using DndClassJson;
using sharpAngleTemplate.models.DTO;
using sharpAngleTemplate.models.entities;
using SRDSpellsjson;
using ClassesEntity;
using CoreModels;
using Newtonsoft.Json; // Add missing using directive

namespace sharpAngleTemplate
{
    public static class ClassMappers
    {

				public static ClassesEntity.ClassDTO ToDTO(this ClassEntity classEntity)
				{
					var getFeatureValue = (Feature<object, string> feature) => {

						return JsonConvert.SerializeObject(feature.Value);
					};
					return new ClassesEntity.ClassDTO()
					{
						Name = classEntity.Name,
						HitDie = classEntity.HitDie,
						ProficiencyChoices = classEntity.ProficiencyChoices.Select(x => new ChoicesEntity<string>()
						{
							Choose = x.Choose,
							Type = x.Type,
							Choices = x.Choices
						}).ToList(),
						Proficiencies = classEntity.Proficiencies,
						SavingThrows = classEntity.SavingThrows,
						Spellcasting = classEntity.Spellcasting,
						StartingEquipment = classEntity.StartingEquipment,
						ClassLevels = classEntity.ClassLevels.Select(x => new LevelDTO()
						{
							Info = new Info<string>()
							{
								ClassName = classEntity.Name,
								Level = x.Info.Level,
							},
							Features = x.Features.Select(f => new Feature<string, string>()
							{
								Name = f.Name,
								Value = getFeatureValue(f),
								Info = f.Info
							}).ToList(),
							ClassSpecific = new Dictionary<string, string>(x.ClassSpecific),
							AbilityScoreBonus = x.AbilityScoreBonus,
							ProfBonus = x.ProfBonus,
							Spellcasting = new Dictionary<string, int>(x.Spellcasting)
						}).ToList(),
						Subclasses = classEntity.Subclasses.Select(x => new SubclassDTO()
						{
							Name = x.Name,
							SubclassFlavor = x.SubclassFlavor,
							Desc = x.Desc,
							Features = x.Features.Select(f => new Feature<string, string>()
							{
								Name = f.Name,
								Value = getFeatureValue(f),
								Info = f.Info
							}).ToList(),
							Class = x.Class,
							Spells = x.Spells
						}).ToList(),
					};
				}
		}
    
}
