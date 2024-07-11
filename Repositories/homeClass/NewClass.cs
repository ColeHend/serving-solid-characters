using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ClassesEntity;
using CoreModels;

namespace sharpAngleTemplate.models.repositories
{
    public static class AddClasses
    {
        public static List<ClassEntity> AddForgemaster(this List<ClassEntity> classes)
        {
            classes.Add(new ClassEntity(){
                Id = 13,
                Name = "Forgemaster",
                HitDie = 8,
                ProficiencyChoices = new List<ChoicesEntity<string>>(){
                    new ChoicesEntity<string>(){
                        Choose = 3,
                        Type = "proficiencies",
                        Choices = new List<string>(){
                            "Mason's Tools",
                            "Leatherworker's Tools",
                            "Woodcarver's Tools",
                            "Smith's Tools",
                            "Tinker's Tools",
                            "Carpenter's Tools",
                            "Jeweler's Tools",
                            "Glassblower's Tools",
                            "Potter's Tools",
                            "Weaver's Tools",
                            "Cook's Utensils",
                            "Brewer's Supplies",
                            "Calligrapher's Supplies",
                            "Painter's Supplies",
                            "Cartographer's Tools",
                            "Navigator's Tools",
                            "Thieves' Tools",

                        }
                    },
                },
                Proficiencies = new List<string>(){
                    "Light armor",
                    "Medium armor",
                    "Shields",
                    "Simple weapons",
                    "Martial weapons",
                },
                SavingThrows = new List<string>(){
                    "Intelligence",
                    "Constitution",
                },
                StartingEquipment = new StartingEquipmentDto(){
                    Class = "Forgemaster",
                    Quantity = 1,
                    Choice1 = new List<EquipmentChoicesDto>(){
                        new EquipmentChoicesDto(){
                            Choose = 2,
                            Type = "equipment",
                            Choices = new List<ItemDto>(){
                                new ItemDto(){
                                    Item = "Iron Fist Level 1",
                                    Desc = new List<string>(){
                                        "A gauntlet that can be used as a weapon. It deals 1d6 bludgeoning damage and has the finesse, and light property.",
                                        "range 5 ft",
                                        "This is an iron fist gauntlet that can launch off your fist and strike an enemy and retract back to your hand as part of the attack.",
                                    }
                                },
                                new ItemDto() {
                                    Item = "Item Crafting Template",
                                    Desc = new List<string>(){
                                        "Weapons, Armor, or Adventuring gear can be created from the equipment list. All listed categories of items are considered a level 1 build.",
                                        "The default build speed is up to 10 gp of crafting in one workday or 50 gp per week. Spell scrolls or Potions of healing can’t be made with this. Tools required to craft items vary weapons are smiths tools or wood carvers tools.",
                                        "Armor is smiths tools or leather workers tools. Adventuring gear varies a bit, mostly Tinker’s Tools, and Alchemist Supplies."
                                    }
                                },
                                }
                            }
                    },
                    
                    Choice2 = new List<EquipmentChoicesDto>(){
                        new EquipmentChoicesDto(){
                            Choose = 1,
                            Type = "equipment",
                            Choices = new List<ItemDto>(){
                                new ItemDto(){
                                    Item = "Dungeoneer’s Pack",
                                    Desc = new List<string>(){}
                                },
                                new ItemDto(){
                                    Item = "Dungeoneer’s Pack",
                                    Desc = new List<string>(){}
                                },
                            }
                        }
                    },
                    Choice3 = new List<EquipmentChoicesDto>(){
                        new EquipmentChoicesDto(){
                            Choose = 1,
                            Type = "equipment",
                            Choices = new List<ItemDto>(){
                                new ItemDto(){
                                    Item = "Smith’s Tools",
                                    Desc = new List<string>(){}
                                }
                            }
                        }
                    },
                },
                Spellcasting = new SpellCastingDto(){
                    Name = "Spellcasting",
                    Level = 1,
                    SpellcastingAbility = "Intelligence",
                    Info = new List<InfoDto>(){
                        new InfoDto(){
                            Name = "Spell List",
                            Desc = new List<string>(){
                                "This gives you the ability to cast spells from the wizard spell list that you know. But they must be from either the Abjuration, Evocation, Illusion, or Transmutation schools of magic. Your spell focus can be any arcane focus. And you may choose 2 cantrips from the wizard spell list at level 1."
                            }
                        },
                        new InfoDto(){
                            Name = "Spell Known",
                            Desc = new List<string>(){
                                "The amount of spells you know are equal to your INT modifier + Half your Forgemaster level (rounded up). In addition at levels 5, 9, 13, and 17, you can choose a spell outside those schools restricted above from the wizard spell list. "
                            }
                        },
                        new InfoDto(){
                            Name = "Spells Memorization",
                            Desc = new List<string>(){
                                "And every long rest you can study and swap out one of known spells for a different one. But both spells must be one of the 4 schools listed above from the wizard spell list. "
                            }
                        },
                        new InfoDto(){
                            Name = "Spell save DC = 8 + your proficiency bonus + your Intelligence modifier",
                            Desc = new List<string>(){
                                "Spell attack modifier = your proficiency bonus + your Intelligence modifier"
                            }
                        }
                    }
                },
                ClassLevels = new List<LevelEntity>(){
                    new LevelEntity(){
                        Info = new Info<string>(){
                            ClassName = "Forgemaster",
                            Level = 1,
                            Type = "Class Feature",
                        },
                        ProfBonus = 2,
                        ClassSpecific = new Dictionary<string, string>(){
                            {"freeModifications", "-"}
                        },
                        Features = new List<Feature<object, string>>(){
                            new Feature<object, string>(){
                                Name = "Spellcasting",
                                Value = new List<string>() {
                                    "This gives you the ability to cast spells from the wizard spell list that you know. But they must be from either the Abjuration, Evocation, Illusion, or Transmutation schools of magic. Your spell focus can be any arcane focus.",
                                    "The amount of spells you know are equal to your INT modifier + Half your Forgemaster level (rounded up). In addition at levels 5, 9, 13, and 17, you can choose a spell outside those schools restricted above from the wizard spell list. ",
                                    "And every long rest you can study and swap out one of known spells for a different one. But both spells must be one of the 4 schools listed above from the wizard spell list. ",
                                    "Your Spell casting modifier is equal to your INT modifier + proficiency bonus. And your save is 8 + proficiency bonus + INT modifier."
                                }
                            },
                            new Feature<object, string>(){
                                Name = "Forgemaster Expertise",
                                Value = "You gain proficiency in the arcana skill and you gain proficiency with smiths tools in addition, this gives you expertise in two skills that you are proficient in."
                            }
                        },
                        Spellcasting = new Dictionary<string, int>(){
                            {"cantrips_known",2},
                            {"spells_known", 0},
                            {"spell_slots_level_1", 2},
                            {"spell_slots_level_2", 0},
                            {"spell_slots_level_3", 0},
                            {"spell_slots_level_4", 0},
                            {"spell_slots_level_5", 0},
                            {"spell_slots_level_6", 0},
                            {"spell_slots_level_7", 0},
                            {"spell_slots_level_8", 0},
                            {"spell_slots_level_9", 0}
                        }
                    },
                    new LevelEntity(){
                        Info = new Info<string>(){
                            ClassName = "Forgemaster",
                            Level = 2,
                            Type = "Class Feature",
                        },
                        ProfBonus = 2,
                        ClassSpecific = new Dictionary<string, string>(){
                            {"freeModifications", "2"}
                        },
                        Features = new List<Feature<object, string>>(){
                            new Feature<object, string>(){
                                Name = "Apprentice Forgemaster",
                                Value = new List<string>(){
                                    "This feature allows you to build any of the level 1 Item templates for the cost listed in the template. You may also access any of the Mechanical Modifications. For no added cost you can place up to the number of Modifications shown on the class table for your level on any items that meet the requirements for the modifications.",
                                    "You can make any item outside the amount limited by your proficiency bonus but you must pay the cost listed in the template and the cost listed in the modifications representing the materials required.",
                                    "The item must meet the given requirement for being the right type of item described in the description of the modification. The default time taken is shown on the template. At higher levels this may not be accurate for your character.",
                                    "You may only access level 1 modifications or templates. And on objects that are medium sized and smaller you may place 1 modification per item and the item you make modifications to must be non-magical. This limit doubles repeatedly for every size above medium.",
                                    "You also gain the mending cantrip. And if you cast it on any object or construct (such as a ship’s hull or spell engine) over 1 minute at the end of the minute it recovers an amount of hp equal to your Forgemaster Level."
                                }
                            }
                        },
                        Spellcasting = new Dictionary<string, int>(){
                            {"cantrips_known",2},
                            {"spells_known", 0},
                            {"spell_slots_level_1", 2},
                            {"spell_slots_level_2", 0},
                            {"spell_slots_level_3", 0},
                            {"spell_slots_level_4", 0},
                            {"spell_slots_level_5", 0},
                            {"spell_slots_level_6", 0},
                            {"spell_slots_level_7", 0},
                            {"spell_slots_level_8", 0},
                            {"spell_slots_level_9", 0}
                        }
                    },
                    new LevelEntity(){
                        Info = new Info<string>(){
                            ClassName = "Forgemaster",
                            Level = 3,
                            Type = "Class Feature",
                        },
                        ProfBonus = 2,
                        Features = new List<Feature<object, string>>(){
                            new Feature<object, string>(){
                                Name = "Forgemaster Focus feature",
                                Value = "You gain a subclass feature at this level."
                            }
                        },
                        ClassSpecific = new Dictionary<string, string>(){
                            {"freeModifications", "2"}
                        },
                        Spellcasting = new Dictionary<string, int>(){
                            {"cantrips_known",2},
                            {"spells_known", 0},
                            {"spell_slots_level_1", 3},
                            {"spell_slots_level_2", 0},
                            {"spell_slots_level_3", 0},
                            {"spell_slots_level_4", 0},
                            {"spell_slots_level_5", 0},
                            {"spell_slots_level_6", 0},
                            {"spell_slots_level_7", 0},
                            {"spell_slots_level_8", 0},
                            {"spell_slots_level_9", 0}
                        }
                    },
                    new LevelEntity(){
                        Info = new Info<string>(){
                            ClassName = "Forgemaster",
                            Level = 4,
                            Type = "Class Feature",
                        },
                        ProfBonus = 2,
                        Features = new List<Feature<object, string>>(){
                            new Feature<object, string>(){
                                Name = "Ability Score Improvement",
                                Value = "When you reach 4th level, and again at 8th, 10th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1. As normal, you can't increase an ability score above 20 using this feature."
                            }
                        },
                        ClassSpecific = new Dictionary<string, string>(){
                            {"freeModifications", "2"}
                        },
                        Spellcasting = new Dictionary<string, int>(){
                            {"cantrips_known",2},
                            {"spells_known", 0},
                            {"spell_slots_level_1", 3},
                            {"spell_slots_level_2", 0},
                            {"spell_slots_level_3", 0},
                            {"spell_slots_level_4", 0},
                            {"spell_slots_level_5", 0},
                            {"spell_slots_level_6", 0},
                            {"spell_slots_level_7", 0},
                            {"spell_slots_level_8", 0},
                            {"spell_slots_level_9", 0}
                        }
                    },
                    new LevelEntity(){
                        Info = new Info<string>(){
                            ClassName = "Forgemaster",
                            Level = 5,
                            Type = "Class Feature",
                        },
                        ProfBonus = 3,
                        ClassSpecific = new Dictionary<string, string>(){
                            {"freeModifications", "3"}
                        },
                        Features = new List<Feature<object, string>>(){
                            new Feature<object, string>(){
                                Name = "Adept Forgemaster",
                                Value = new List<string>() {
                                    "This ability allows you to access magical modifications. You can give the magical modifications you can place a number of charges equal to your INT modifier for free if it is one of your freely placed modifications. And you can access level 2 templates and modifications.",
                                    "You can also upgrade Template Items you built from level 1 to level 2 for just the single level cost difference. So (level 2 material cost - level 1 material cost). But the time is the same. The template must specify multiple levels.",
                                    "You also gain the ability to spend 8 hours and disassemble up to your proficiency bonus number of non-magical items into half of their value worth of raw materials that you can use instead of the gold cost to make new items."
                                }
                            },
                            new Feature<object, string>(){
                                Name = "Extra Attack",
                                Value = "Beginning at 5th Level, you can Attack twice, instead of once, whenever you take the Attack Action on Your Turn."
                            }
                        },
                        Spellcasting = new Dictionary<string, int>(){
                            {"cantrips_known",2},
                            {"spells_known", 0},
                            {"spell_slots_level_1", 4},
                            {"spell_slots_level_2", 2},
                            {"spell_slots_level_3", 0},
                            {"spell_slots_level_4", 0},
                            {"spell_slots_level_5", 0},
                            {"spell_slots_level_6", 0},
                            {"spell_slots_level_7", 0},
                            {"spell_slots_level_8", 0},
                            {"spell_slots_level_9", 0}
                        }
                    },
                    new LevelEntity(){
                        Info = new Info<string>(){
                            ClassName = "Forgemaster",
                            Level = 6,
                            Type = "Class Feature",
                        },
                        ProfBonus = 3,
                        ClassSpecific = new Dictionary<string, string>(){
                            {"freeModifications", "3"}
                        },
                        Features = new List<Feature<object, string>>(){
                            new Feature<object, string>(){
                                Name = "Specialty Build",
                                Value = "Beginning at 6th Level, you can choose one Template (For the Item crafting Template you can select one type of item either weapons, armor, or adventuring gear). It becomes your Specialty Build and instead of determining the work weeks by 50 / item value, you can determine when building your specialty build by 100 / item value."
                            }
                        },
                        Spellcasting = new Dictionary<string, int>(){
                            {"cantrips_known",2},
                            {"spells_known", 0},
                            {"spell_slots_level_1", 4},
                            {"spell_slots_level_2", 2},
                            {"spell_slots_level_3", 0},
                            {"spell_slots_level_4", 0},
                            {"spell_slots_level_5", 0},
                            {"spell_slots_level_6", 0},
                            {"spell_slots_level_7", 0},
                            {"spell_slots_level_8", 0},
                            {"spell_slots_level_9", 0}
                        }
                    },
                    new LevelEntity(){
                        Info = new Info<string>(){
                            ClassName = "Forgemaster",
                            Level = 7,
                            Type = "Class Feature",
                        },
                        ProfBonus = 3,
                        ClassSpecific = new Dictionary<string, string>(){
                            {"freeModifications", "3"}
                        },
                        Features = new List<Feature<object, string>>(){
                            new Feature<object, string>(){
                                Name = "Forgemaster Focus feature",
                                Value = "You gain a subclass feature at this level."
                            }
                        },
                        Spellcasting = new Dictionary<string, int>(){
                            {"cantrips_known",3},
                            {"spells_known", 0},
                            {"spell_slots_level_1", 4},
                            {"spell_slots_level_2", 3},
                            {"spell_slots_level_3", 0},
                            {"spell_slots_level_4", 0},
                            {"spell_slots_level_5", 0},
                            {"spell_slots_level_6", 0},
                            {"spell_slots_level_7", 0},
                            {"spell_slots_level_8", 0},
                            {"spell_slots_level_9", 0}
                        }
                    },
                    new LevelEntity(){
                        Info = new Info<string>(){
                            ClassName = "Forgemaster",
                            Level = 8,
                            Type = "Class Feature",
                        },
                        ProfBonus = 3,
                        ClassSpecific = new Dictionary<string, string>(){
                            {"freeModifications", "3"}
                        },
                        Features = new List<Feature<object, string>>(){
                            new Feature<object, string>(){
                                Name = "Ability Score Improvement",
                                Value = "When you reach 4th level, and again at 8th, 10th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1. As normal, you can't increase an ability score above 20 using this feature."
                            }
                        },
                        Spellcasting = new Dictionary<string, int>(){
                            {"cantrips_known",3},
                            {"spells_known", 0},
                            {"spell_slots_level_1", 4},
                            {"spell_slots_level_2", 3},
                            {"spell_slots_level_3", 0},
                            {"spell_slots_level_4", 0},
                            {"spell_slots_level_5", 0},
                            {"spell_slots_level_6", 0},
                            {"spell_slots_level_7", 0},
                            {"spell_slots_level_8", 0},
                            {"spell_slots_level_9", 0}
                        }
                    },
                    new LevelEntity(){
                        Info = new Info<string>(){
                            ClassName = "Forgemaster",
                            Level = 9,
                            Type = "Class Feature",
                        },
                        ProfBonus = 4,
                        ClassSpecific = new Dictionary<string, string>(){
                            {"freeModifications", "4"}
                        },
                        Features = new List<Feature<object, string>>(){
                            new Feature<object, string>(){
                                Name = "Expert Forgemaster",
                                Value = new List<string>() {
                                    "Starting at 9th Level, you can build structural modifications which some have a requirement of the type of structure or build (like must be on a boat's oars). The rest can be built and added to a structure to expand what is possible to do in that location with your builds. And you can now access level 3 Templates and modifications. The base number of modifications you can make to an item is increased from 1 to 2.",
                                    "You can also upgrade Template Items you built from level 2 to level 3 for just the single level cost difference.",
                                    "You also learn the dispel magic spell. In addition you can disassemble up to half your proficiency bonus (rounded down) number of magic items but you must make a spellcasting ability check DC of 10 + Spell Level of the effect on the item. And you gain half their cost in value of raw materials. "
                                }
                            }
                        },
                        Spellcasting = new Dictionary<string, int>(){
                            {"cantrips_known",3},
                            {"spells_known", 0},
                            {"spell_slots_level_1", 4},
                            {"spell_slots_level_2", 3},
                            {"spell_slots_level_3", 2},
                            {"spell_slots_level_4", 0},
                            {"spell_slots_level_5", 0},
                            {"spell_slots_level_6", 0},
                            {"spell_slots_level_7", 0},
                            {"spell_slots_level_8", 0},
                            {"spell_slots_level_9", 0}
                        }
                    },
                    new LevelEntity(){
                        Info = new Info<string>()
                        {
                            ClassName = "Forgemaster",
                            Level = 10,
                            Type = "Class Feature",
                        },
                        ProfBonus = 4,
                        ClassSpecific = new Dictionary<string, string>(){
                            {"freeModifications", "4"}
                        },
                        Features = new List<Feature<object, string>>()
                        {
                            new Feature<object, string>(){
                                Name = "Forgemaster Expertise",
                                Value = "Starting at 10th Level you gain expertise in one skill that you are proficient in."
                            }
                        },
                        Spellcasting = new Dictionary<string, int>()
                        {
                            {"cantrips_known",3},
                            {"spells_known", 0},
                            {"spell_slots_level_1", 4},
                            {"spell_slots_level_2", 3},
                            {"spell_slots_level_3", 2},
                            {"spell_slots_level_4", 0},
                            {"spell_slots_level_5", 0},
                            {"spell_slots_level_6", 0},
                            {"spell_slots_level_7", 0},
                            {"spell_slots_level_8", 0},
                            {"spell_slots_level_9", 0}
                        }
                    },
                    new LevelEntity(){
                        Info = new Info<string>(){
                            ClassName = "Forgemaster",
                            Level = 11,
                            Type = "Class Feature",
                        },
                        ProfBonus = 4,
                        ClassSpecific = new Dictionary<string, string>(){
                            {"freeModifications", "4"}
                        },
                        Features = new List<Feature<object, string>>(){
                            new Feature<object, string>(){
                                Name = "Forgemaster Focus feature",
                                Value = "You gain a subclass feature at this level."
                            }
                        },
                        Spellcasting = new Dictionary<string, int>(){
                            {"cantrips_known",4},
                            {"spells_known", 0},
                            {"spell_slots_level_1", 4},
                            {"spell_slots_level_2", 3},
                            {"spell_slots_level_3", 3},
                            {"spell_slots_level_4", 0},
                            {"spell_slots_level_5", 0},
                            {"spell_slots_level_6", 0},
                            {"spell_slots_level_7", 0},
                            {"spell_slots_level_8", 0},
                            {"spell_slots_level_9", 0}
                        }
                    },
                    new LevelEntity(){
                        Info = new Info<string>(){
                            ClassName = "Forgemaster",
                            Level = 12,
                            Type = "Class Feature",
                        },
                        ProfBonus = 4,
                        ClassSpecific = new Dictionary<string, string>(){
                            {"freeModifications", "4"}
                        },
                        Features = new List<Feature<object, string>>(){
                            new Feature<object, string>(){
                                Name = "Ability Score Improvement",
                                Value = "When you reach 4th level, and again at 8th, 10th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1. As normal, you can't increase an ability score above 20 using this feature."
                            }
                        },
                        Spellcasting = new Dictionary<string, int>(){
                            {"cantrips_known",4},
                            {"spells_known", 0},
                            {"spell_slots_level_1", 4},
                            {"spell_slots_level_2", 3},
                            {"spell_slots_level_3", 3},
                            {"spell_slots_level_4", 0},
                            {"spell_slots_level_5", 0},
                            {"spell_slots_level_6", 0},
                            {"spell_slots_level_7", 0},
                            {"spell_slots_level_8", 0},
                            {"spell_slots_level_9", 0}
                        }
                    },
                    new LevelEntity(){
                        Info = new Info<string>(){
                            ClassName = "Forgemaster",
                            Level = 13,
                            Type = "Class Feature",
                        },
                        ProfBonus = 5,
                        ClassSpecific = new Dictionary<string, string>(){
                            {"freeModifications", "5"}
                        },
                        Features = new List<Feature<object, string>>(){
                            new Feature<object, string>(){
                                Name = "True Forgemaster",
                                Value = new List<string>() {
                                    "Beginning at 13th Level, your mastery of crafting allows you to master one of 4 crafts. And at 20th level you can choose one more new craft to master.",
                                    "Weapon Crafting Master - Any weapons you craft use 1 damage die higher than normal (up to a d12). For example 1d6 would become 1d8 or 2d6 would become 2d8.",
                                    "Armor crafting Master - Allows you to build armor that gives the wearer temporary hp equal to your INT modifier + your Proficiency Bonus, when they roll initiative for combat.",
                                    "Frugal Craftsmen - Allows you to build items with less materials when determining the cost of materials needed and take 10% off the items total value.",
                                    "Durable Builds - When you build something that has its own hp and ac you can increase its ac half your proficiency bonus (rounded down). If it has multiple ac and hp blocks it applies to all of them. And you can increase their hp by your Forgemaster Level."
                                }
                            }
                        },
                        Spellcasting = new Dictionary<string, int>(){
                            {"cantrips_known",4},
                            {"spells_known", 0},
                            {"spell_slots_level_1", 4},
                            {"spell_slots_level_2", 3},
                            {"spell_slots_level_3", 3},
                            {"spell_slots_level_4", 1},
                            {"spell_slots_level_5", 0},
                            {"spell_slots_level_6", 0},
                            {"spell_slots_level_7", 0},
                            {"spell_slots_level_8", 0},
                            {"spell_slots_level_9", 0}
                        }
                    },
                    new LevelEntity(){
                        Info = new Info<string>(){
                            ClassName = "Forgemaster",
                            Level = 14,
                            Type = "Class Feature",
                        },
                        ProfBonus = 5,
                        ClassSpecific = new Dictionary<string, string>(){
                            {"freeModifications", "5"}
                        },
                        Features = new List<Feature<object, string>>(){
                            new Feature<object, string>(){
                                Name = "Mobile Builds",
                                Value = "Starting at 14th Level, you can miniaturize your Large or bigger builds that you crafted into a small unusable object as an action. And their weight is reduced by 75%. You can return it to full size as an action but the area must be free of obstructions it might collide with."
                            }
                        },
                        Spellcasting = new Dictionary<string, int>(){
                            {"cantrips_known",4},
                            {"spells_known", 0},
                            {"spell_slots_level_1", 4},
                            {"spell_slots_level_2", 3},
                            {"spell_slots_level_3", 3},
                            {"spell_slots_level_4", 1},
                            {"spell_slots_level_5", 0},
                            {"spell_slots_level_6", 0},
                            {"spell_slots_level_7", 0},
                            {"spell_slots_level_8", 0},
                            {"spell_slots_level_9", 0}
                        }
                    },
                    new LevelEntity(){
                        Info = new Info<string>(){
                            ClassName = "Forgemaster",
                            Level = 15,
                            Type = "Class Feature",
                        },
                        ProfBonus = 5,
                        ClassSpecific = new Dictionary<string, string>(){
                            {"freeModifications", "5"}
                        },
                        Features = new List<Feature<object, string>>(){
                            new Feature<object, string>(){
                                Name = "Forgemaster Focus feature",
                                Value = "You gain a subclass feature at this level."
                            }
                        },
                        Spellcasting = new Dictionary<string, int>(){
                            {"cantrips_known",4},
                            {"spells_known", 0},
                            {"spell_slots_level_1", 4},
                            {"spell_slots_level_2", 3},
                            {"spell_slots_level_3", 3},
                            {"spell_slots_level_4", 2},
                            {"spell_slots_level_5", 0},
                            {"spell_slots_level_6", 0},
                            {"spell_slots_level_7", 0},
                            {"spell_slots_level_8", 0},
                            {"spell_slots_level_9", 0}
                        }
                    },
                    new LevelEntity(){
                        Info = new Info<string>(){
                            ClassName = "Forgemaster",
                            Level = 16,
                            Type = "Class Feature",
                        },
                        ProfBonus = 5,
                        ClassSpecific = new Dictionary<string, string>(){
                            {"freeModifications", "5"}
                        },
                        Features = new List<Feature<object, string>>(){
                            new Feature<object, string>(){
                                Name = "Ability Score Improvement",
                                Value = "When you reach 4th level, and again at 8th, 10th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1. As normal, you can't increase an ability score above 20 using this feature."
                            }
                        },
                        Spellcasting = new Dictionary<string, int>(){
                            {"cantrips_known",4},
                            {"spells_known", 0},
                            {"spell_slots_level_1", 4},
                            {"spell_slots_level_2", 3},
                            {"spell_slots_level_3", 3},
                            {"spell_slots_level_4", 2},
                            {"spell_slots_level_5", 0},
                            {"spell_slots_level_6", 0},
                            {"spell_slots_level_7", 0},
                            {"spell_slots_level_8", 0},
                            {"spell_slots_level_9", 0}
                        }
                    },
                    new LevelEntity(){
                        Info = new Info<string>(){
                            ClassName = "Forgemaster",
                            Level = 17,
                            Type = "Class Feature",
                        },
                        ProfBonus = 6,
                        ClassSpecific = new Dictionary<string, string>(){
                            {"freeModifications", "6"}
                        },
                        Features = new List<Feature<object, string>>(){
                            new Feature<object, string>(){
                                Name = "Grand Forgemaster",
                                Value = new List<string>() {
                                    "Beginning at 17th Level, if you use a weapon you made yourself to make an attack roll you gain advantage on that attack. And if you are wearing armor you made yourself you gain a +2 bonus to your defense. In addition you can access level 4 templates and modifications.",
                                    "You can also upgrade Template Items you built from level 3 to level 4 for just the single level cost difference.",
                                    "And the base number of modifications you can make to an item increases from 2 to 3. In addition when determining how many work weeks crafting an item will take the division goes up by 50. (instead of 50/value goes up to 100/value). This stacks on top of your specialty builds time.",
                                }
                            }
                        },
                        Spellcasting = new Dictionary<string, int>(){
                            {"cantrips_known",5},
                            {"spells_known", 0},
                            {"spell_slots_level_1", 4},
                            {"spell_slots_level_2", 3},
                            {"spell_slots_level_3", 3},
                            {"spell_slots_level_4", 3},
                            {"spell_slots_level_5", 1},
                            {"spell_slots_level_6", 0},
                            {"spell_slots_level_7", 0},
                            {"spell_slots_level_8", 0},
                            {"spell_slots_level_9", 0}
                        }
                    },
                    new LevelEntity(){
                        Info = new Info<string>(){
                            ClassName = "Forgemaster",
                            Level = 18,
                            Type = "Class Feature",
                        },
                        ProfBonus = 6,
                        ClassSpecific = new Dictionary<string, string>(){
                            {"freeModifications", "6"}
                        },
                        Features = new List<Feature<object, string>>(){
                            new Feature<object, string>(){
                                Name = "Legendary Builds",
                                Value = new List<string>() {
                                    "Starting at 18th Level, once every 25 work weeks you can make a weapon of legendary quality that gains one of a few additional abilities listed below depending on the item being made. When you complete the item it will require attunement.",
                                    "Melee Weapons ) Vorpal -  the weapon ignores resistance to the damage it deals (bludgeons, slashing, or piercing damage). When you attack a creature that has at least one head with this weapon and roll a 20 on the attack roll, you cut/knock off one of the creature's heads. The creature dies if it can't survive without the lost head. A creature is immune to this effect if it is immune to the weapons damage, doesn't have or need a head, has legendary actions, or the DM decides that the creature is too big for its head to be cut off with this weapon. Such a creature instead takes an extra 6d8 weapon damage from the hit.",
                                    "Ranged Weapons ) Force Strike - The ranged weapon with this ability now magically creates magical force arrows that now deal force damage and no longer require ammunition. And the die damage dealt by the weapon increases by 1 die. (example 1d6 to 2d6). The die size maxes out at a d12. This does stack with Weapon Crafting Master if chosen at level 13.",
                                    "Armor ) Legendary Resistance - If you fail a save once per combat encounter the wearer can choose to succeed instead.",
                                    "Magic Focus ) Rising Power - When the caster casts a spell with the focus if it can be upcast by 1 spell slot for free. (example: cast a 2nd level spell as a 3rd level spell and consume a 2nd level spell slot). Can be used 3 times per day."
                                }
                            }
                        },
                        Spellcasting = new Dictionary<string, int>(){
                            {"cantrips_known",5},
                            {"spells_known", 0},
                            {"spell_slots_level_1", 4},
                            {"spell_slots_level_2", 3},
                            {"spell_slots_level_3", 3},
                            {"spell_slots_level_4", 3},
                            {"spell_slots_level_5", 1},
                            {"spell_slots_level_6", 0},
                            {"spell_slots_level_7", 0},
                            {"spell_slots_level_8", 0},
                            {"spell_slots_level_9", 0}
                        }
                    },
                    new LevelEntity(){
                        Info = new Info<string>(){
                            ClassName = "Forgemaster",
                            Level = 19,
                            Type = "Class Feature",
                        },
                        ProfBonus = 6,
                        ClassSpecific = new Dictionary<string, string>(){
                            {"freeModifications", "6"}
                        },
                        Features = new List<Feature<object, string>>(){
                            new Feature<object, string>(){
                                Name = "Ability Score Improvement",
                                Value = "When you reach 4th level, and again at 8th, 10th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1. As normal, you can't increase an ability score above 20 using this feature."
                            }
                        },
                        Spellcasting = new Dictionary<string, int>(){
                            {"cantrips_known",5},
                            {"spells_known", 0},
                            {"spell_slots_level_1", 4},
                            {"spell_slots_level_2", 3},
                            {"spell_slots_level_3", 3},
                            {"spell_slots_level_4", 3},
                            {"spell_slots_level_5", 2},
                            {"spell_slots_level_6", 0},
                            {"spell_slots_level_7", 0},
                            {"spell_slots_level_8", 0},
                            {"spell_slots_level_9", 0}
                        }
                    },
                    new LevelEntity(){
                        Info = new Info<string>(){
                            ClassName = "Forgemaster",
                            Level = 20,
                            Type = "Class Feature",
                        },
                        ProfBonus = 6,
                        Features = new List<Feature<object, string>>(){
                            new Feature<object, string>(){
                                Name = "Forgemaster Focus feature",
                                Value = "You gain a subclass feature at this level."
                            }
                        },
                        ClassSpecific = new Dictionary<string, string>(){
                            {"freeModifications", "6"}
                        },
                        Spellcasting = new Dictionary<string, int>(){
                            {"cantrips_known",5},
                            {"spells_known", 0},
                            {"spell_slots_level_1", 4},
                            {"spell_slots_level_2", 3},
                            {"spell_slots_level_3", 3},
                            {"spell_slots_level_4", 3},
                            {"spell_slots_level_5", 2},
                            {"spell_slots_level_6", 0},
                            {"spell_slots_level_7", 0},
                            {"spell_slots_level_8", 0},
                            {"spell_slots_level_9", 0}
                        }
                    },
                },
                Subclasses = new List<Subclass>(){
                    new Subclass(){
                        Id = 1,
                        Name = "Soulbinder Focus",
                        SubclassFlavor = "A Forgemaster that has learned to bind souls to their creations.",
                        Desc = new List<string>(){
                            "The Soulbinder Focus is a subclass that allows"
                        },
                        Class = "Forgemaster",
                        Features = new List<Feature<object, string>>(){
                            new Feature<object, string>() {
                                Info = new Info<string>(){
                                    ClassName = "Forgemaster",
                                    Level = 3,
                                    Type = "Subclass",
                                },
                                Name = "Soul Gem",
                                Value = new List<string>(){
                                    "Starting at level 3, over a short rest you can create a soul gem you can use to make certain builds sentient. You can use a first level spell slot to place a familiar spirit into the soul gem that will follow your commands. You may only have a number of created soul gems equal to your proficiency bonus at a time. And you may only have 1 familiar gem at a time.",
                                    "You also gain a Level 1 Steel Companion for free that you built in your down time. In Addition any steel companions you put your made soul gem in with the familiar spirit inside it can add your Forgemaster Level x Your INT Mod to its HP. Also instead of commanding it with your bonus action if you use your action you can replace your attacks for its attacks and add your intelligence modifier to each damage roll. And it's to hit value and other values that rely on the crafters stats goes up as yours does, as you tweak and update it as you get stronger."
                                }
                            },
                            new Feature<object, string>() {
                                Info = new Info<string>(){
                                    ClassName = "Forgemaster",
                                    Level = 7,
                                    Type = "Subclass",
                                },
                                Name = "Magic Bond",
                                Value = "Starting at level 7, if you use your action to command your steel companion to attack you can cast a cantrip as a bonus action."
                            },
                            new Feature<object, string>() {
                                Info = new Info<string>(){
                                    ClassName = "Forgemaster",
                                    Level = 11,
                                    Type = "Subclass",
                                },
                                Name = "Fueled Power",
                                Value = "Starting at level 11, You gain the spell spirit shroud and if you are concentrating on it your steel companion with a familiar soul gem gains the damage boosting effects also."
                            },
                            new Feature<object, string>() {
                                Info = new Info<string>(){
                                    ClassName = "Forgemaster",
                                    Level = 15,
                                    Type = "Subclass",
                                },
                                Name = "Magical Emergency Repairs",
                                Value = "Starting at level 15, Once per day if your steel companion with a familiar soul gem hits zero hp as a reaction you can expend a spell slot and heal it 2d8 per slot level if you are within 60 ft of it. And magically repair its damage."
                            },
                            new Feature<object, string>() {
                                Info = new Info<string>(){
                                    ClassName = "Forgemaster",
                                    Level = 20,
                                    Type = "Subclass",
                                },
                                Name = "Failed Robotics",
                                Value = "Starting at level 20, you can use your reaction to cause your steel companion with a familiar soul gem to explode, completely destroying it and dealing 20d6 fire damage + 40 Force Damage. To everything in a 30 ft radius must make a dex save against the creator's spell save. On a successful save they take half damage. It must be within 1 mile of you."
                            },
                        }
                    },
                    new Subclass(){
                        Id = 2,
                        Name = "Clockwork Focus",
                        SubclassFlavor = "A Forgemaster that has learned to bind souls to their creations.",
                        Desc = new List<string>(){
                            "The Soulbinder Focus is a subclass that allows"
                        },
                        Class = "Forgemaster",
                        Features = new List<Feature<object, string>>(){
                            new Feature<object, string>() {
                                Info = new Info<string>(){
                                    ClassName = "Forgemaster",
                                    Level = 3,
                                    Type = "Subclass",
                                },
                                Name = "Internal Modifications",
                                Value = new List<string>() {
                                    "Starting at level 3, You gain proficiency in heavy armor, and you can integrate up to 2 Templates into your body that don’t have the two-handed property. If it has the loading property it loses it but ranged weapons still require ammunition if they normally do. And you may choose two level 1 templates worth 75 gp or less each for free to integrate. You may also add your free modifications to them. You can swap a template when you finish a long rest if you have the item you want to swap with ready. Any weapons you integrate into your body use INT instead of STR or DEX for hit or damage calculations. And as you level the template limit goes up also to:  7th) 3, 11th) 4, 15th) 5 19th) 6 ",
                                    "Drawing melee weapons still follow the same rules they just instead draw out of your body. While a ranged weapon you might aim with your hand and have the arrows shoot out your palm. Bodies with templates integrated into them usually have signs like metallic looking skin at the least."
                                }
                            },
                            new Feature<object, string>() {
                                Info = new Info<string>(){
                                    ClassName = "Forgemaster",
                                    Level = 7,
                                    Type = "Subclass",
                                },
                                Name = "Dynamic Modifications",
                                Value = "Starting at level 7, you figure out how to swap out your Internal Modifications much faster and at the end of a short rest you can swap out a Template you have integrated into your body with a different one if you have the item ready."
                            },
                            new Feature<object, string>() {
                                Info = new Info<string>(){
                                    ClassName = "Forgemaster",
                                    Level = 11,
                                    Type = "Subclass",
                                },
                                Name = "Mechanical Physique",
                                Value = new List<string>() {
                                    "Starting at level 11, As you’ve gotten more skilled  you’ve learned how to mechanically enhance your physique to enhance your strength or dexterity letting you choose one of the two following abilities.",
                                    "- Your walking speed increases by 15 ft. You gain advantage on Dexterity checks",
                                    "- You count as one size larger when determining your carrying capacity and the weight you can push, drag, or lift. You gain advantage on strength checks and your jumping distance is tripled."


                                }
                            },
                            new Feature<object, string>() {
                                Info = new Info<string>(){
                                    ClassName = "Forgemaster",
                                    Level = 15,
                                    Type = "Subclass",
                                },
                                Name = "Enhanced Senses",
                                Value = "Starting at level 15, You’ve learned how to enhance your sight and hearing, giving you darkvision if you didn’t have it or extending it 30 ft if you did. And giving you advantage on perception checks."
                            },
                            new Feature<object, string>() {
                                Info = new Info<string>(){
                                    ClassName = "Forgemaster",
                                    Level = 20,
                                    Type = "Subclass",
                                },
                                Name = "Missile Storm",
                                Value = "Starting at level 20, You can create eight missiles of magical force. Each missile hits a target of your choice that you can see within range. A missile deals 2d6 + 3 force damage to its target. The missiles all strike simultaneously, and you can direct them to hit one target or several. This can be used once per day. This can be blocked with the shield spell."
                            },
                        }
                    },
                    new Subclass(){
                        Id = 3,
                        Name = "Elemental Focus",
                        SubclassFlavor = "A Forgemaster that has learned to bind souls to their creations.",
                        Desc = new List<string>(){
                            "The Soulbinder Focus is a subclass that allows"
                        },
                        Class = "Forgemaster",
                        Features = new List<Feature<object, string>>(){
                            new Feature<object, string>() {
                                Info = new Info<string>(){
                                    ClassName = "Forgemaster",
                                    Level = 3,
                                    Type = "Subclass",
                                },
                                Name = "Elemental Potency",
                                Value = "Starting at level 3, when you cast any spell that does fire, ice, or lightning damage you can add your intelligence modifier to the damage roll. And you can cast a forgemaster cantrip that does fire, ice, or lightning damage as a bonus action if you take the attack action."
                            },
                            new Feature<object, string>() {
                                Info = new Info<string>(){
                                    ClassName = "Forgemaster",
                                    Level = 7,
                                    Type = "Subclass",
                                },
                                Name = "Fire Specialty",
                                Value = "Starting at level 7, when you roll for fire damage and roll any 1’s you roll for fire damage can consider them as a 3 instead. This effect is also on weapons that deal fire damage you create."
                            },
                            new Feature<object, string>() {
                                Info = new Info<string>(){
                                    ClassName = "Forgemaster",
                                    Level = 11,
                                    Type = "Subclass",
                                },
                                Name = "Water Specialty",
                                Value = new Feature<List<string>, string>() {
                                    Name = "Starting at level 11, you gain a new action you can do called bubble coating while you are in a breathable atmosphere. It is a magical process that allows you to coat objects or creatures in a durable bubble that objects, spells, attacks, and creatures pass right through; it consumes a first level spell slot in the process. But it always stays around it and it keeps the atmosphere around it in tack so creatures inside can breathe underwater or in space. The amount of fresh air available depends on the size, see the table below for the amount. The fresh air inside replenishes if you enter a breathable atmosphere again. The amount of time it takes to coat it depends on the size also see the table below. If a spell like toxic cloud is cast inside the bubble the air may be contaminated faster. The duration starts at the end of the Build Time.",
                                    Value = new List<string>() {
                                        "{\"Size\":q\"Tiny\", \"Air\":q\"10 sec\", \"Time\":q\"1 action\", \"Duration\": \"1 hour\"}",
                                        "{\"Size\":q\"Small\", \"Air\":q\"1 hour\", \"Time\":q\"1 action\", \"Duration\": \"1 hour\"}",
                                        "{\"Size\":q\"Medium\", \"Air\":q\"1 hour\", \"Time\":q\"1 action\", \"Duration\": \"1 hour\"}",
                                        "{\"Size\":q\"Large\", \"Air\":q\"1 hour\", \"Time\":q\"10 minute\", \"Duration\": \"24 hour\"}",
                                        "{\"Size\":q\"Huge\", \"Air\":q\"4 hour\", \"Time\":q\"1 hour\", \"Duration\": \"24 hour\"}",
                                        "{\"Size\":q\"Gargantuan\", \"Air\":q\"24 hour\", \"Time\":q\"4 hours\", \"Duration\": \"72 hour\"}",
                                    }
                                }
                            },
                            new Feature<object, string>() {
                                Info = new Info<string>(){
                                    ClassName = "Forgemaster",
                                    Level = 15,
                                    Type = "Subclass",
                                },
                                Name = "Wind Specialty",
                                Value = "Starting at level 15, you learn the fly spell if you don’t know it already. If you do, you may choose another transmutation spell of 3rd level or lower. In addition you can cast fly as a 4th level spell on objects with a helm or method of controlling their movement. And the spell targets just that object and lasts for 1 hour instead of 10 minutes. And the object (such as a ship) gains a 60 ft fly speed. And if you target creatures with the spell you can target 2 additional creatures for free."
                            },
                            new Feature<object, string>() {
                                Info = new Info<string>(){
                                    ClassName = "Forgemaster",
                                    Level = 20,
                                    Type = "Subclass",
                                },
                                Name = "Lightning Specialist",
                                Value = "Starting at level 20, you learn the lightning bolt spell if you don’t know it already. If you do, you may choose another evocation spell. In addition if you target a steel companion with a lightning spell you may temporarily animate it for 2 rounds per spell slot the electricity spell used. Temporarily bypassing its soul gem requirement, if you animate multiple you may give them all the same simple command as a bonus action."
                            },
                        }
                    }
                }
            });
            return classes;
        }
    }
}