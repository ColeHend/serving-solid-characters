export interface The5Esrd {
    "Legal Information":                           LegalInformation;
    Races:                                         Races;
    Barbarian:                                     Barbarian;
    Bard:                                          Bard;
    Cleric:                                        Cleric;
    Druid:                                         Druid;
    Fighter:                                       Fighter;
    Monk:                                          Monk;
    Paladin:                                       Paladin;
    Ranger:                                        Ranger;
    Rogue:                                         Rogue;
    Sorcerer:                                      Sorcerer;
    Warlock:                                       Warlock;
    Wizard:                                        Wizard;
    "Beyond 1st Level":                            Beyond1StLevel;
    Equipment:                                     Equipment;
    Feats:                                         Feats;
    "Using Ability Scores":                        UsingAbilityScores;
    Adventuring:                                   Adventuring;
    Combat:                                        Combat;
    Spellcasting:                                  The5ESRDSpellcasting;
    Traps:                                         Traps;
    Diseases:                                      Diseases;
    Madness:                                       Madness;
    Objects:                                       Objects;
    Poisons:                                       The5ESRDPoisons;
    "Magic Items":                                 MagicItems;
    Monsters:                                      Monsters;
    "Appendix PH-A: Conditions":                   AppendixPHAConditions;
    "Appendix PH-B: Fantasy-Historical Pantheons": AppendixPHBFantasyHistoricalPantheons;
    "Appendix PH-C: The Planes of Existence":      AppendixPHCThePlanesOfExistence;
    "Appendix MM-A: Miscellaneous Creatures":      AppendixMMAMiscellaneousCreatures;
    "Appendix MM-B: Nonplayer Characters":         AppendixMMBNonplayerCharacters;
}

export interface Adventuring {
    Time:                 Time;
    Movement:             Movement;
    "The Environment":    TheEnvironment;
    Resting:              Resting;
    "Between Adventures": BetweenAdventures;
}

export interface BetweenAdventures {
    content:               string[];
    "Lifestyle Expenses":  Time;
    "Downtime Activities": DowntimeActivities;
}

export interface DowntimeActivities {
    content:                   string[];
    Crafting:                  Time;
    "Practicing a Profession": Time;
    Recuperating:              LegalInformation;
    Researching:               Time;
    Training:                  Time;
}

export interface Time {
    content: string[];
}

export interface LegalInformation {
    content: Array<string[] | string>;
}

export interface Movement {
    content:                     string[];
    Speed:                       MovementSpeed;
    "Special Types of Movement": SpecialTypesOfMovement;
}

export interface SpecialTypesOfMovement {
    content:                            string;
    "Climbing, Swimming, and Crawling": string;
    Jumping:                            Time;
}

export interface MovementSpeed {
    content:             string[];
    "Travel Pace":       SpeedTravelPace;
    "Difficult Terrain": Time;
}

export interface SpeedTravelPace {
    content:       string[];
    "Travel Pace": TravelPaceTravelPace;
}

export interface TravelPaceTravelPace {
    table: TravelPaceTable;
}

export interface TravelPaceTable {
    Pace:                   string[];
    "Distance per: Minute": string[];
    Hour:                   string[];
    Day:                    string[];
    Effect:                 string[];
}

export interface Resting {
    content:      string[];
    "Short Rest": Time;
    "Long Rest":  Time;
}

export interface TheEnvironment {
    content:                    string;
    Falling:                    string;
    Suffocating:                Time;
    "Vision and Light":         VisionAndLight;
    "Food and Water":           FoodAndWater;
    "Interacting with Objects": Time;
}

export interface FoodAndWater {
    content: string;
    Food:    Time;
    Water:   Time;
}

export interface VisionAndLight {
    content:    string[];
    Blindsight: string;
    Darkvision: string;
    Truesight:  string;
}

export interface AppendixMMAMiscellaneousCreatures {
    content:                     string;
    Ape:                         Ape;
    "Awakened Shrub":            Ape;
    "Awakened Tree":             Ape;
    "Axe Beak":                  Ape;
    Baboon:                      Ape;
    Badger:                      Ape;
    Bat:                         Ape;
    "Black Bear":                Ape;
    "Blink Dog":                 Ape;
    "Blood Hawk":                Ape;
    Boar:                        Ape;
    "Brown Bear":                Ape;
    Camel:                       Ape;
    Cat:                         Ape;
    "Constrictor Snake":         Ape;
    Crab:                        Ape;
    Crocodile:                   Ape;
    "Death Dog":                 Ape;
    Deer:                        Ape;
    "Dire Wolf":                 Ape;
    "Draft Horse":               Ape;
    Eagle:                       Ape;
    Elephant:                    Ape;
    Elk:                         Ape;
    "Flying Snake":              Ape;
    Frog:                        Ape;
    "Giant Ape":                 Ape;
    "Giant Badger":              Ape;
    "Giant Bat":                 Ape;
    "Giant Boar":                Ape;
    "Giant Centipede":           Ape;
    "Giant Constrictor Snake":   Ape;
    "Giant Crab":                Ape;
    "Giant Crocodile":           Ape;
    "Giant Eagle":               Ape;
    "Giant Elk":                 Ape;
    "Giant Fire Beetle":         Ape;
    "Giant Frog":                Ape;
    "Giant Goat":                Ape;
    "Giant Hyena":               Ape;
    "Giant Lizard":              Ape;
    "Giant Octopus":             Ape;
    "Giant Owl":                 Ape;
    "Giant Poisonous Snake":     Ape;
    "Giant Rat":                 GiantRat;
    "Giant Scorpion":            Ape;
    "Giant Sea Horse":           Ape;
    "Giant Shark":               Ape;
    "Giant Spider":              Ape;
    "Giant Toad":                Ape;
    "Giant Vulture":             Ape;
    "Giant Wasp":                Ape;
    "Giant Weasel":              Ape;
    "Giant Wolf Spider":         Ape;
    Goat:                        Ape;
    Hawk:                        Ape;
    "Hunter Shark":              Ape;
    Hyena:                       Ape;
    Jackal:                      Ape;
    "Killer Whale":              Ape;
    Lion:                        Ape;
    Lizard:                      Ape;
    Mammoth:                     Ape;
    Mastiff:                     Ape;
    Mule:                        Ape;
    Octopus:                     Ape;
    Owl:                         Ape;
    Panther:                     Ape;
    "Phase Spider":              Ape;
    "Poisonous Snake":           Ape;
    "Polar Bear":                Ape;
    Pony:                        Ape;
    Quipper:                     Ape;
    Rat:                         Ape;
    Raven:                       Ape;
    "Reef Shark":                Ape;
    Rhinoceros:                  Ape;
    "Riding Horse":              Ape;
    "Saber-Toothed Tiger":       Ape;
    Scorpion:                    Ape;
    "Sea Horse":                 Ape;
    Spider:                      Ape;
    "Swarm of Bats":             Ape;
    "Swarm of Insects":          SwarmOfInsects;
    "Swarm of Poisonous Snakes": Ape;
    "Swarm of Quippers":         Ape;
    "Swarm of Rats":             Ape;
    "Swarm of Ravens":           Ape;
    Tiger:                       Ape;
    Vulture:                     Ape;
    Warhorse:                    Ape;
    Weasel:                      Ape;
    "Winter Wolf":               Ape;
    Wolf:                        Ape;
    Worg:                        Ape;
}

export interface Ape {
    content: Array<PurpleContent | string>;
}

export interface PurpleContent {
    table: PurpleTable;
}

export interface PurpleTable {
    STR: string[];
    DEX: string[];
    CON: string[];
    INT: string[];
    WIS: string[];
    CHA: string[];
}

export interface GiantRat {
    content:                        Array<PurpleContent | string>;
    "Variant: Diseased Giant Rats": Time;
}

export interface SwarmOfInsects {
    content:                  Array<PurpleContent | string>;
    "Variant: Insect Swarms": Time;
}

export interface AppendixMMBNonplayerCharacters {
    content:            string;
    "Customizing NPCs": Time;
    Acolyte:            Ape;
    Assassin:           Ape;
    Bandit:             Ape;
    "Bandit Captain":   Ape;
    Berserker:          Ape;
    Commoner:           Ape;
    Cultist:            Ape;
    "Cult Fanatic":     Ape;
    Druid:              Ape;
    Gladiator:          Ape;
    Guard:              Ape;
    Knight:             Ape;
    Mage:               Ape;
    Noble:              Ape;
    Priest:             Ape;
    Scout:              Ape;
    Spy:                Ape;
    Thug:               Ape;
    "Tribal Warrior":   Ape;
    Veteran:            Ape;
}

export interface AppendixPHAConditions {
    content:       string[];
    Blinded:       string[];
    Charmed:       string[];
    Deafened:      string[];
    Exhaustion:    Exhaustion;
    Frightened:    string[];
    Grappled:      string[];
    Incapacitated: string[];
    Invisible:     string[];
    Paralyzed:     string[];
    Petrified:     string[];
    Poisoned:      string[];
    Prone:         string[];
    Restrained:    string[];
    Stunned:       string[];
    Unconscious:   string[];
}

export interface Exhaustion {
    content: Array<FluffyContent | string>;
}

export interface FluffyContent {
    table: FluffyTable;
}

export interface FluffyTable {
    Level:  string[];
    Effect: string[];
}

export interface AppendixPHBFantasyHistoricalPantheons {
    content:                 string;
    "The Celtic Pantheon":   TheCelticPantheon;
    "The Greek Pantheon":    TheGreekPantheon;
    "The Egyptian Pantheon": TheEgyptianPantheon;
    "The Norse Pantheon":    TheNorsePantheon;
}

export interface TheCelticPantheon {
    content:          string[];
    "Celtic Deities": Deities;
}

export interface Deities {
    table: CelticDeitiesTable;
}

export interface CelticDeitiesTable {
    Deity:               string[];
    Alignment:           string[];
    "Suggested Domains": string[];
    Symbol:              string[];
}

export interface TheEgyptianPantheon {
    content:            string[];
    "Egyptian Deities": Deities;
}

export interface TheGreekPantheon {
    content:         string;
    "Greek Deities": Deities;
}

export interface TheNorsePantheon {
    content:         string[];
    "Norse Deities": Deities;
}

export interface AppendixPHCThePlanesOfExistence {
    content:               string[];
    "The Material Plane":  Time;
    "Beyond the Material": BeyondTheMaterial;
}

export interface BeyondTheMaterial {
    content:             string;
    "Planar Travel":     Time;
    "Transitive Planes": Time;
    "Inner Planes":      Time;
    "Outer Planes":      OuterPlanes;
}

export interface OuterPlanes {
    content:        string[];
    "Outer Planes": string;
    Demiplanes:     string;
}

export interface Barbarian {
    "Class Features": BarbarianClassFeatures;
}

export interface BarbarianClassFeatures {
    content:                     string;
    "Hit Points":                Time;
    Proficiencies:               Time;
    Equipment:                   LegalInformation;
    "The Barbarian":             TheBarbarian;
    Rage:                        LegalInformation;
    "Unarmored Defense":         string;
    "Reckless Attack":           string;
    "Danger Sense":              Time;
    "Primal Path":               string;
    "Ability Score Improvement": string;
    "Extra Attack":              string;
    "Fast Movement":             string;
    "Feral Instinct":            Time;
    "Brutal Critical":           Time;
    "Relentless Rage":           Time;
    "Persistent Rage":           string;
    "Indomitable Might":         string;
    "Primal Champion":           string;
    "Path of the Berserker":     PathOfTheBerserker;
}

export interface PathOfTheBerserker {
    content:                 string;
    Frenzy:                  string;
    "Mindless Rage":         string;
    "Intimidating Presence": Time;
    Retaliation:             string;
}

export interface TheBarbarian {
    table: TheBarbarianTable;
}

export interface TheBarbarianTable {
    Level:               string[];
    "Proficiency Bonus": string[];
    Features:            string[];
    Rages:               string[];
    "Rage Damage":       string[];
}

export interface Bard {
    "Class Features": BardClassFeatures;
}

export interface BardClassFeatures {
    content:                     string;
    "Hit Points":                Time;
    Proficiencies:               Time;
    Equipment:                   LegalInformation;
    "The Bard":                  TheBard;
    Spellcasting:                PurpleSpellcasting;
    "Bardic Inspiration":        Time;
    "Jack of All Trades":        string;
    "Song of Rest":              Time;
    "Bard College":              Time;
    Expertise:                   Time;
    "Ability Score Improvement": string;
    "Font of Inspiration":       string;
    Countercharm:                string;
    "Magical Secrets":           Time;
    "Superior Inspiration":      string;
    "College of Lore":           CollegeOfLore;
}

export interface CollegeOfLore {
    content:                      string[];
    "Bonus Proficiencies":        string;
    "Cutting Words":              string;
    "Additional Magical Secrets": string;
    "Peerless Skill":             string;
}

export interface PurpleSpellcasting {
    content:                                string[];
    Cantrips:                               string;
    "Spell Slots":                          Time;
    "Spells Known of 1st Level and Higher": Time;
    "Spellcasting Ability":                 Time;
    "Ritual Casting":                       string;
    "Spellcasting Focus":                   string;
}

export interface TheBard {
    table: { [key: string]: string[] };
}

export interface Beyond1StLevel {
    content:                 string[];
    "Character Advancement": CharacterAdvancement;
    Multiclassing:           Multiclassing;
    Alignment:               Beyond1StLevelAlignment;
    Languages:               Beyond1StLevelLanguages;
    Inspiration:             Inspiration;
    Backgrounds:             Backgrounds;
}

export interface Beyond1StLevelAlignment {
    content:                       Array<string[] | string>;
    "Alignment in the Multiverse": Time;
}

export interface Backgrounds {
    content:                     string[];
    Proficiencies:               Time;
    Languages:                   string;
    Equipment:                   string;
    "Suggested Characteristics": string;
    "Customizing a Background":  string;
    Acolyte:                     Acolyte;
}

export interface Acolyte {
    content:                            string[];
    "Feature: Shelter of the Faithful": Time;
    "Suggested Characteristics":        SuggestedCharacteristics;
}

export interface SuggestedCharacteristics {
    content: Array<TentacledContent | string>;
}

export interface TentacledContent {
    table: TentacledTable;
}

export interface TentacledTable {
    d8?:                  string[];
    "Personality Trait"?: string[];
    d6?:                  string[];
    Ideal?:               string[];
    Bond?:                string[];
    Flaw?:                string[];
}

export interface CharacterAdvancement {
    table: CharacterAdvancementTable;
}

export interface CharacterAdvancementTable {
    "Experience Points": string[];
    Level:               string[];
    "Proficiency Bonus": string[];
}

export interface Inspiration {
    content:               string;
    "Gaining Inspiration": Time;
    "Using Inspiration":   Time;
}

export interface Beyond1StLevelLanguages {
    content:              string[];
    "Standard Languages": Languages;
    "Exotic Languages":   Languages;
}

export interface Languages {
    table: ExoticLanguagesTable;
}

export interface ExoticLanguagesTable {
    Language:           string[];
    "Typical Speakers": string[];
    Script:             string[];
}

export interface Multiclassing {
    content:                           string[];
    Prerequisites:                     Prerequisites;
    "Experience Points":               string;
    "Hit Points and Hit Dice":         Time;
    "Multiclassing Proficiency Bonus": string;
    "Multiclassing Proficiencies":     MulticlassingMulticlassingProficiencies;
    "Multiclassing Class Features":    MulticlassingClassFeatures;
}

export interface MulticlassingClassFeatures {
    content:                                               string;
    "Channel Divinity":                                    string;
    "Extra Attack":                                        string;
    "Unarmored Defense":                                   string;
    Spellcasting:                                          Time;
    "Multiclass Spellcaster: Spell Slots per Spell Level": TheBard;
}

export interface MulticlassingMulticlassingProficiencies {
    content:                       string;
    "Multiclassing Proficiencies": MulticlassingProficienciesMulticlassingProficiencies;
}

export interface MulticlassingProficienciesMulticlassingProficiencies {
    table: MulticlassingProficienciesTable;
}

export interface MulticlassingProficienciesTable {
    Class:                  string[];
    "Proficiencies Gained": string[];
}

export interface Prerequisites {
    content:                       string;
    "Multiclassing Prerequisites": MulticlassingPrerequisites;
}

export interface MulticlassingPrerequisites {
    table: MulticlassingPrerequisitesTable;
}

export interface MulticlassingPrerequisitesTable {
    Class:                   string[];
    "Ability Score Minimum": string[];
}

export interface Cleric {
    "Class Features": ClericClassFeatures;
}

export interface ClericClassFeatures {
    content:                     string;
    "Hit Points":                Time;
    Proficiencies:               Time;
    Equipment:                   LegalInformation;
    "The Cleric":                TheCleric;
    Spellcasting:                FluffySpellcasting;
    "Divine Domain":             DivineDomain;
    "Channel Divinity":          ChannelDivinity;
    "Ability Score Improvement": string;
    "Destroy Undead":            ClassFeaturesDestroyUndead;
    "Divine Intervention":       Time;
    "Life Domain":               LifeDomain;
}

export interface ChannelDivinity {
    content:                         string[];
    "Channel Divinity: Turn Undead": Time;
}

export interface ClassFeaturesDestroyUndead {
    content:          string;
    "Destroy Undead": DestroyUndeadDestroyUndead;
}

export interface DestroyUndeadDestroyUndead {
    table: DestroyUndeadTable;
}

export interface DestroyUndeadTable {
    "Cleric Level":             string[];
    "Destroys Undead of CR...": string[];
}

export interface DivineDomain {
    content:         string;
    "Domain Spells": Time;
}

export interface LifeDomain {
    content:                           string;
    "Life Domain Spells":              LifeDomainSpells;
    "Bonus Proficiency":               string;
    "Disciple of Life":                string;
    "Channel Divinity: Preserve Life": Time;
    "Blessed Healer":                  string;
    "Divine Strike":                   string;
    "Supreme Healing":                 string;
}

export interface LifeDomainSpells {
    table: LifeDomainSpellsTable;
}

export interface LifeDomainSpellsTable {
    "Cleric Level": (Level | string)[];
    Spells:         string[];
}

export enum Level {
    The1St = "1st",
    The3RD = "3rd",
    The5Th = "5th",
    The7Th = "7th",
    The9Th = "9th",
}

export interface FluffySpellcasting {
    content:                                    string;
    Cantrips:                                   string;
    "Preparing and Casting Spells":             Time;
    "Spellcasting Ability":                     Time;
    "Ritual Casting":                           string;
    "Spellcasting Focus":                       string;
    Spellbook?:                                 string;
    "Learning Spells of 1st Level and Higher"?: string;
}

export interface TheCleric {
    content: Array<TheBard | string>;
}

export interface Combat {
    "The Order of Combat":   TheOrderOfCombat;
    "Movement and Position": MovementAndPosition;
    "Actions in Combat":     ActionsInCombat;
    "Making an Attack":      MakingAnAttack;
    Cover:                   Time;
    "Damage and Healing":    DamageAndHealing;
    "Mounted Combat":        MountedCombat;
    "Underwater Combat":     Time;
}

export interface ActionsInCombat {
    content:         string[];
    Attack:          Time;
    "Cast a Spell":  string;
    Dash:            Time;
    Disengage:       string;
    Dodge:           string;
    Help:            Time;
    Hide:            string;
    Ready:           Time;
    Search:          string;
    "Use an Object": string;
}

export interface DamageAndHealing {
    content:                               string;
    "Hit Points":                          Time;
    "Damage Rolls":                        DamageRolls;
    "Damage Resistance and Vulnerability": Time;
    Healing:                               Time;
    "Dropping to 0 Hit Points":            DroppingTo0HitPoints;
    "Knocking a Creature Out":             string;
    "Temporary Hit Points":                Time;
}

export interface DamageRolls {
    content:         string[];
    "Critical Hits": Time;
    "Damage Types":  Time;
}

export interface DroppingTo0HitPoints {
    content:                  string;
    "Instant Death":          Time;
    "Falling Unconscious":    string;
    "Death Saving Throws":    Time;
    "Stabilizing a Creature": Time;
    "Monsters and Death":     Time;
}

export interface MakingAnAttack {
    content:                        Array<string[] | string>;
    "Attack Rolls":                 AttackRolls;
    "Unseen Attackers and Targets": Time;
    "Ranged Attacks":               RangedAttacks;
    "Melee Attacks":                MeleeAttacks;
}

export interface AttackRolls {
    content:                 string;
    "Modifiers to the Roll": Time;
    "Rolling 1 or 20":       Time;
}

export interface MeleeAttacks {
    content:               string[];
    "Opportunity Attacks": Time;
    "Two-Weapon Fighting": Time;
    "Contests in Combat":  string;
    Grappling:             Time;
    "Shoving a Creature":  Time;
}

export interface RangedAttacks {
    content:                          string;
    Range:                            Time;
    "Ranged Attacks in Close Combat": string;
}

export interface MountedCombat {
    content:                    string[];
    "Mounting and Dismounting": Time;
    "Controlling a Mount":      Time;
}

export interface MovementAndPosition {
    content:                               string[];
    "Breaking Up Your Move":               BreakingUpYourMove;
    "Difficult Terrain":                   Time;
    "Being Prone":                         Time;
    "Moving Around Other Creatures":       Time;
    "Flying Movement":                     string;
    "Creature Size":                       CreatureSize;
    "Interacting with Objects Around You": LegalInformation;
}

export interface BreakingUpYourMove {
    content:                  string;
    "Moving between Attacks": string;
    "Using Different Speeds": Time;
}

export interface CreatureSize {
    content:                          string;
    "Size Categories":                CreatureSizeSizeCategories;
    Space:                            Time;
    "Squeezing into a Smaller Space": string;
}

export interface CreatureSizeSizeCategories {
    table: StickyTable;
}

export interface StickyTable {
    Size:  string[];
    Space: string[];
}

export interface TheOrderOfCombat {
    content:               string;
    "Combat Step by Step": string[];
    Surprise:              Time;
    Initiative:            Time;
    "Your Turn":           YourTurn;
    Reactions:             Time;
}

export interface YourTurn {
    content:                       string[];
    "Bonus Actions":               Time;
    "Other Activity on Your Turn": Time;
}

export interface Diseases {
    content:           string[];
    "Sample Diseases": SampleDiseases;
}

export interface SampleDiseases {
    content:        string;
    "Cackle Fever": Time;
    "Sewer Plague": Time;
    "Sight Rot":    Time;
}

export interface Druid {
    "Class Features": DruidClassFeatures;
}

export interface DruidClassFeatures {
    content:                     string;
    "Hit Points":                Time;
    Proficiencies:               Time;
    Equipment:                   LegalInformation;
    "The Druid":                 TheBard;
    Druidic:                     string;
    Spellcasting:                FluffySpellcasting;
    "Wild Shape":                WildShape;
    "Druid Circle":              string;
    "Ability Score Improvement": string;
    "Timeless Body":             string;
    "Beast Spells":              string;
    Archdruid:                   Time;
    "Circle of the Land":        CircleOfTheLand;
    "Sacred Plants and Wood":    Time;
    "Druids and the Gods":       string;
}

export interface CircleOfTheLand {
    content:              string;
    "Bonus Cantrip":      string;
    "Natural Recovery":   Time;
    "Circle Spells":      CircleSpells;
    "Land’s Stride":      Time;
    "Nature’s Ward":      string;
    "Nature’s Sanctuary": Time;
}

export interface CircleSpells {
    content:   string[];
    Arctic:    Arctic;
    Coast:     Arctic;
    Desert:    Arctic;
    Forest:    Arctic;
    Grassland: Arctic;
    Mountain:  Arctic;
    Swamp:     Arctic;
}

export interface Arctic {
    table: ArcticTable;
}

export interface ArcticTable {
    "Druid Level":   (Level | string)[];
    "Circle Spells": string[];
}

export interface WildShape {
    content:        string[];
    "Beast Shapes": BeastShapes;
}

export interface BeastShapes {
    content: Array<string[] | StickyContent | string>;
}

export interface StickyContent {
    table: IndigoTable;
}

export interface IndigoTable {
    "Max.":           string[];
    Level:            string[];
    "CR Limitations": string[];
    Example:          string[];
}

export interface Equipment {
    content:                   string[];
    "Standard Exchange Rates": StandardExchangeRates;
    "Selling Treasure":        Time;
    Armor:                     Armor;
    Weapons:                   Weapons;
    "Adventuring Gear":        AdventuringGear;
    Tools:                     EquipmentTools;
    "Mounts and Vehicles":     MountsAndVehicles;
    "Trade Goods":             EquipmentTradeGoods;
    Expenses:                  Expenses;
}

export interface AdventuringGear {
    content:              string[];
    "Adventuring Gear":   TackHarnessAndDrawnVehiclesClass;
    "Container Capacity": ContainerCapacity;
    "Equipment Packs":    Time;
}

export interface TackHarnessAndDrawnVehiclesClass {
    table: AdventuringGearTable;
}

export interface AdventuringGearTable {
    Item:   string[];
    Cost:   string[];
    Weight: string[];
}

export interface ContainerCapacity {
    content: Array<IndigoContent | string>;
}

export interface IndigoContent {
    table: IndecentTable;
}

export interface IndecentTable {
    Container: string[];
    Capacity:  string[];
}

export interface Armor {
    content:                         string[];
    "Light Armor":                   Time;
    "Medium Armor":                  Time;
    "Heavy Armor":                   Time;
    "Armor List":                    ArmorList;
    "Getting Into and Out of Armor": GettingIntoAndOutOfArmor;
}

export interface ArmorList {
    "Light Armor":  HeavyArmor;
    "Medium Armor": HeavyArmor;
    "Heavy Armor":  HeavyArmor;
    Shield:         HeavyArmor;
}

export interface HeavyArmor {
    table: HeavyArmorTable;
}

export interface HeavyArmorTable {
    Armor:              string[];
    Cost:               string[];
    "Armor Class (AC)": string[];
    Strength:           (StrengthElement | string)[];
    Stealth:            (Stealth | string)[];
    Weight:             string[];
}

export enum Stealth {
    Disadvantage = "Disadvantage",
    Empty = "—",
}

export enum StrengthElement {
    Empty = "—",
    Str13 = "Str 13",
    Str15 = "Str 15",
}

export interface GettingIntoAndOutOfArmor {
    content:                     string[];
    "Donning and Doffing Armor": DonningAndDoffingArmor;
}

export interface DonningAndDoffingArmor {
    table: DonningAndDoffingArmorTable;
}

export interface DonningAndDoffingArmorTable {
    Category: string[];
    Don:      string[];
    Doff:     string[];
}

export interface Expenses {
    content:                    string;
    "Lifestyle Expenses":       ExpensesLifestyleExpenses;
    "Food, Drink, and Lodging": ExpensesFoodDrinkAndLodging;
    Services:                   ExpensesServices;
    "Spellcasting Services":    Time;
}

export interface ExpensesFoodDrinkAndLodging {
    content:                    string;
    "Food, Drink, and Lodging": FoodDrinkAndLodgingFoodDrinkAndLodging;
}

export interface FoodDrinkAndLodgingFoodDrinkAndLodging {
    table: FoodDrinkAndLodgingTable;
}

export interface FoodDrinkAndLodgingTable {
    Item: string[];
    Cost: string[];
}

export interface ExpensesLifestyleExpenses {
    content:              string[];
    "Lifestyle Expenses": LifestyleExpensesLifestyleExpenses;
    "Self-Sufficiency":   Time;
}

export interface LifestyleExpensesLifestyleExpenses {
    content: Array<IndecentContent | string>;
}

export interface IndecentContent {
    table: HilariousTable;
}

export interface HilariousTable {
    Lifestyle:   string[];
    "Price/Day": string[];
}

export interface ExpensesServices {
    content:  string[];
    Services: ServicesServices;
}

export interface ServicesServices {
    table: ServicesTable;
}

export interface ServicesTable {
    "Service Pay": string[];
    "":            string[];
}

export interface MountsAndVehicles {
    content:                             string[];
    "Mounts and Other Animals":          MountsAndOtherAnimals;
    "Tack, Harness, and Drawn Vehicles": TackHarnessAndDrawnVehiclesClass;
    "Waterborne Vehicles":               MountsAndOtherAnimals;
}

export interface MountsAndOtherAnimals {
    table: MountsAndOtherAnimalsTable;
}

export interface MountsAndOtherAnimalsTable {
    Item:                 string[];
    Cost:                 string[];
    Speed:                string[];
    "Carrying Capacity"?: string[];
}

export interface StandardExchangeRates {
    table: StandardExchangeRatesTable;
}

export interface StandardExchangeRatesTable {
    Coin: string[];
    CP:   string[];
    SP:   string[];
    EP:   string[];
    GP:   string[];
    PP:   string[];
}

export interface EquipmentTools {
    content: string;
    Tools:   ToolsTools;
}

export interface ToolsTools {
    content: Array<TackHarnessAndDrawnVehiclesClass | string>;
}

export interface EquipmentTradeGoods {
    content:       string[];
    "Trade Goods": TradeGoodsTradeGoods;
}

export interface TradeGoodsTradeGoods {
    table: TradeGoodsTable;
}

export interface TradeGoodsTable {
    Cost:  string[];
    Goods: string[];
}

export interface Weapons {
    content:              string[];
    "Weapon Proficiency": Time;
    "Weapon Properties":  WeaponProperties;
    "Weapons List":       WeaponsList;
}

export interface WeaponProperties {
    content:              string[];
    "Improvised Weapons": Time;
    "Silvered Weapons":   string;
    "Special Weapons":    Time;
}

export interface WeaponsList {
    "Simple Melee Weapons":   MartialMeleeWeaponsClass;
    "Simple Ranged Weapons":  MartialMeleeWeaponsClass;
    "Martial Melee Weapons":  MartialMeleeWeaponsClass;
    "Martial Ranged Weapons": MartialMeleeWeaponsClass;
}

export interface MartialMeleeWeaponsClass {
    table: MartialMeleeWeaponsTable;
}

export interface MartialMeleeWeaponsTable {
    Name:       string[];
    Cost:       string[];
    Damage:     string[];
    Weight:     string[];
    Properties: string[];
}

export interface Feats {
    content:  string[];
    Grappler: LegalInformation;
}

export interface Fighter {
    "Class Features":     FighterClassFeatures;
    "Martial Archetypes": MartialArchetypes;
}

export interface FighterClassFeatures {
    content:                     string;
    "Hit Points":                Time;
    Proficiencies:               Time;
    Equipment:                   LegalInformation;
    "The Fighter":               TheFighter;
    "Fighting Style":            PurpleFightingStyle;
    "Second Wind":               string;
    "Action Surge":              Time;
    "Martial Archetype":         string;
    "Ability Score Improvement": string;
    "Extra Attack":              Time;
    Indomitable:                 Time;
}

export interface PurpleFightingStyle {
    content:                 string;
    Archery:                 string;
    Defense:                 string;
    Dueling:                 string;
    "Great Weapon Fighting": string;
    Protection:              string;
    "Two-Weapon Fighting":   string;
}

export interface TheFighter {
    table: TheFighterTable;
}

export interface TheFighterTable {
    Level:               string[];
    "Proficiency Bonus": string[];
    Features:            string[];
    "Sneak Attack"?:     string[];
}

export interface MartialArchetypes {
    content:  string;
    Champion: Champion;
}

export interface Champion {
    content:                     string;
    "Improved Critical":         string;
    "Remarkable Athlete":        Time;
    "Additional Fighting Style": string;
    "Superior Critical":         string;
    Survivor:                    string;
}

export interface Madness {
    content:           string;
    "Going Mad":       Time;
    "Madness Effects": MadnessEffects;
    "Curing Madness":  string;
}

export interface MadnessEffects {
    content:              string[];
    "Short-Term Madness": ShortTermMadness;
    "Long-Term Madness":  LongTermMadness;
    "Indefinite Madness": IndefiniteMadness;
}

export interface IndefiniteMadness {
    table: IndefiniteMadnessTable;
}

export interface IndefiniteMadnessTable {
    d100:                       string[];
    "Flaw (lasts until cured)": string[];
}

export interface LongTermMadness {
    table: LongTermMadnessTable;
}

export interface LongTermMadnessTable {
    d100:                             string[];
    "Effect (lasts 1d10 × 10 hours)": string[];
}

export interface ShortTermMadness {
    table: ShortTermMadnessTable;
}

export interface ShortTermMadnessTable {
    d100:                          string[];
    "Effect (lasts 1d10 minutes)": string[];
}

export interface MagicItems {
    content:                                          string;
    "Adamantine Armor":                               Time;
    "Ammunition, +1, +2, or +3":                      Time;
    "Amulet of Health":                               Time;
    "Amulet of Proof against Detection and Location": Time;
    "Amulet of the Planes":                           Time;
    "Animated Shield":                                Time;
    "Apparatus of the Crab":                          Time;
    "Apparatus of the Crab Levers":                   ApparatusOfTheCrabLevers;
    "Armor, +1, +2, or +3":                           Time;
    "Armor of Invulnerability":                       Time;
    "Armor of Resistance":                            OfResistance;
    "Armor of Vulnerability":                         Time;
    "Arrow-Catching Shield":                          Time;
    "Arrow of Slaying":                               Time;
    "Bag of Beans":                                   BagOfBeans;
    "Bag of Devouring":                               Time;
    "Bag of Holding":                                 Time;
    "Bag of Tricks":                                  BagOfTricks;
    "Bead of Force":                                  Time;
    "Belt of Dwarvenkind":                            LegalInformation;
    "Belt of Giant Strength":                         BeltOfGiantStrength;
    "Berserker Axe":                                  Time;
    "Boots of Elvenkind":                             Time;
    "Boots of Levitation":                            Time;
    "Boots of Speed":                                 Time;
    "Boots of Striding and Springing":                Time;
    "Boots of the Winterlands":                       LegalInformation;
    "Bowl of Commanding Water Elementals":            Time;
    "Bracers of Archery":                             Time;
    "Bracers of Defense":                             Time;
    "Brazier of Commanding Fire Elementals":          Time;
    "Brooch of Shielding":                            Time;
    "Broom of Flying":                                Time;
    "Candle of Invocation":                           CandleOfInvocation;
    "Cape of the Mountebank":                         Time;
    "Carpet of Flying":                               CarpetOfFlying;
    "Censer of Controlling Air Elementals":           Time;
    "Chime of Opening":                               Time;
    "Circlet of Blasting":                            Time;
    "Cloak of Arachnida":                             LegalInformation;
    "Cloak of Displacement":                          Time;
    "Cloak of Elvenkind":                             Time;
    "Cloak of Protection":                            Time;
    "Cloak of the Bat":                               Time;
    "Cloak of the Manta Ray":                         Time;
    "Crystal Ball":                                   Time;
    "Cube of Force":                                  Time;
    "Cube of Force Faces":                            CubeOfForceFaces;
    "Cubic Gate":                                     Time;
    "Dagger of Venom":                                Time;
    "Dancing Sword":                                  Time;
    "Decanter of Endless Water":                      LegalInformation;
    "Deck of Illusions":                              DeckOfIllusions;
    "Deck of Many Things":                            DeckOfManyThings;
    Defender:                                         Time;
    "Demon Armor":                                    Time;
    "Dimensional Shackles":                           Time;
    "Dragon Scale Mail":                              DragonScaleMail;
    "Dragon Slayer":                                  Time;
    "Dust of Disappearance":                          Time;
    "Dust of Dryness":                                Time;
    "Dust of Sneezing and Choking":                   Time;
    "Dwarven Plate":                                  Time;
    "Dwarven Thrower":                                Time;
    "Efficient Quiver":                               Time;
    "Efreeti Bottle":                                 BagOfBeans;
    "Elemental Gem":                                  ElementalGem;
    "Elven Chain":                                    Time;
    "Eversmoking Bottle":                             Time;
    "Eyes of Charming":                               Time;
    "Eyes of Minute Seeing":                          Time;
    "Eyes of the Eagle":                              Time;
    "Feather Token":                                  FeatherToken;
    "Figurine of Wondrous Power":                     FigurineOfWondrousPower;
    "Flame Tongue":                                   Time;
    "Folding Boat":                                   Time;
    "Frost Brand":                                    Time;
    "Gauntlets of Ogre Power":                        Time;
    "Gem of Brightness":                              LegalInformation;
    "Gem of Seeing":                                  Time;
    "Giant Slayer":                                   Time;
    "Glamoured Studded Leather":                      Time;
    "Gloves of Missile Snaring":                      Time;
    "Gloves of Swimming and Climbing":                Time;
    "Goggles of Night":                               Time;
    "Hammer of Thunderbolts":                         Time;
    "Handy Haversack":                                Time;
    "Hat of Disguise":                                Time;
    "Headband of Intellect":                          Time;
    "Helm of Brilliance":                             LegalInformation;
    "Helm of Comprehending Languages":                Time;
    "Helm of Telepathy":                              Time;
    "Helm of Teleportation":                          Time;
    "Holy Avenger":                                   Time;
    "Horn of Blasting":                               Time;
    "Horn of Valhalla":                               HornOfValhalla;
    "Horseshoes of a Zephyr":                         Time;
    "Horseshoes of Speed":                            Time;
    "Immovable Rod":                                  Time;
    "Instant Fortress":                               Time;
    "Ioun Stone":                                     Time;
    "Iron Bands of Binding":                          Time;
    "Iron Flask":                                     IronFlask;
    "Javelin of Lightning":                           Time;
    "Lantern of Revealing":                           Time;
    "Luck Blade":                                     Time;
    "Mace of Disruption":                             Time;
    "Mace of Smiting":                                Time;
    "Mace of Terror":                                 Time;
    "Mantle of Spell Resistance":                     Time;
    "Manual of Bodily Health":                        Time;
    "Manual of Gainful Exercise":                     Time;
    "Manual of Golems":                               ManualOfGolems;
    "Manual of Quickness of Action":                  Time;
    "Marvelous Pigments":                             Time;
    "Medallion of Thoughts":                          Time;
    "Mirror of Life Trapping":                        Time;
    "Mithral Armor":                                  Time;
    "Necklace of Adaptation":                         Time;
    "Necklace of Fireballs":                          Time;
    "Necklace of Prayer Beads":                       NecklaceOfPrayerBeads;
    "Nine Lives Stealer":                             Time;
    Oathbow:                                          Time;
    "Oil of Etherealness":                            Time;
    "Oil of Sharpness":                               Time;
    "Oil of Slipperiness":                            Time;
    "Pearl of Power":                                 Time;
    "Periapt of Health":                              Time;
    "Periapt of Proof against Poison":                Time;
    "Periapt of Wound Closure":                       Time;
    "Philter of Love":                                Time;
    "Pipes of Haunting":                              Time;
    "Pipes of the Sewers":                            Time;
    "Plate Armor of Etherealness":                    Time;
    "Portable Hole":                                  Time;
    "Potion of Animal Friendship":                    Time;
    "Potion of Clairvoyance":                         Time;
    "Potion of Climbing":                             Time;
    "Potion of Diminution":                           Time;
    "Potion of Flying":                               Time;
    "Potion of Gaseous Form":                         Time;
    "Potion of Giant Strength":                       PotionOfGiantStrength;
    "Potion of Growth":                               Time;
    "Potion of Healing":                              PotionOfHealing;
    "Potion of Heroism":                              Time;
    "Potion of Invisibility":                         Time;
    "Potion of Mind Reading":                         Time;
    "Potion of Poison":                               Time;
    "Potion of Resistance":                           OfResistance;
    "Potion of Speed":                                Time;
    "Potion of Water Breathing":                      Time;
    "Restorative Ointment":                           Time;
    "Ring of Animal Influence":                       LegalInformation;
    "Ring of Djinni Summoning":                       Time;
    "Ring of Elemental Command":                      LegalInformation;
    "Ring of Evasion":                                Time;
    "Ring of Feather Falling":                        Time;
    "Ring of Free Action":                            Time;
    "Ring of Invisibility":                           Time;
    "Ring of Jumping":                                Time;
    "Ring of Mind Shielding":                         Time;
    "Ring of Protection":                             Time;
    "Ring of Regeneration":                           Time;
    "Ring of Resistance":                             RingOfResistance;
    "Ring of Shooting Stars":                         RingOfShootingStars;
    "Ring of Spell Storing":                          Time;
    "Ring of Spell Turning":                          Time;
    "Ring of Swimming":                               Time;
    "Ring of Telekinesis":                            Time;
    "Ring of the Ram":                                Time;
    "Ring of Three Wishes":                           Time;
    "Ring of Warmth":                                 Time;
    "Ring of Water Walking":                          Time;
    "Ring of X-ray Vision":                           Time;
    "Robe of Eyes":                                   LegalInformation;
    "Robe of Scintillating Colors":                   Time;
    "Robe of Stars":                                  Time;
    "Robe of the Archmagi":                           LegalInformation;
    "Robe of Useful Items":                           RobeOfUsefulItems;
    "Rod of Absorption":                              Time;
    "Rod of Alertness":                               Time;
    "Rod of Lordly Might":                            Time;
    "Rod of Rulership":                               Time;
    "Rod of Security":                                Time;
    "Rope of Climbing":                               Time;
    "Rope of Entanglement":                           Time;
    "Scarab of Protection":                           LegalInformation;
    "Scimitar of Speed":                              Time;
    "Shield, +1, +2, or +3":                          Time;
    "Shield of Missile Attraction":                   Time;
    "Slippers of Spider Climbing":                    Time;
    "Sovereign Glue":                                 Time;
    "Spell Scroll":                                   MagicItemsSpellScroll;
    "Spellguard Shield":                              Time;
    "Sphere of Annihilation":                         SphereOfAnnihilation;
    "Staff of Charming":                              Time;
    "Staff of Fire":                                  Time;
    "Staff of Frost":                                 Time;
    "Staff of Healing":                               Time;
    "Staff of Power":                                 StaffOf;
    "Staff of Striking":                              Time;
    "Staff of Swarming Insects":                      Time;
    "Staff of the Magi":                              StaffOf;
    "Staff of the Python":                            Time;
    "Staff of the Woodlands":                         Time;
    "Staff of Thunder and Lightning":                 Time;
    "Staff of Withering":                             Time;
    "Stone of Controlling Earth Elementals":          Time;
    "Stone of Good Luck (Luckstone)":                 Time;
    "Sun Blade":                                      Time;
    "Sword of Life Stealing":                         Time;
    "Sword of Sharpness":                             Time;
    "Sword of Wounding":                              Time;
    "Talisman of Pure Good":                          Time;
    "Talisman of the Sphere":                         Time;
    "Talisman of Ultimate Evil":                      Time;
    "Tome of Clear Thought":                          Time;
    "Tome of Leadership and Influence":               Time;
    "Tome of Understanding":                          Time;
    "Trident of Fish Command":                        Time;
    "Universal Solvent":                              Time;
    "Vicious Weapon":                                 Time;
    "Vorpal Sword":                                   Time;
    "Wand of Binding":                                Time;
    "Wand of Enemy Detection":                        Time;
    "Wand of Fear":                                   Time;
    "Wand of Fireballs":                              Time;
    "Wand of Lightning Bolts":                        Time;
    "Wand of Magic Detection":                        Time;
    "Wand of Magic Missiles":                         Time;
    "Wand of Paralysis":                              Time;
    "Wand of Polymorph":                              Time;
    "Wand of Secrets":                                Time;
    "Wand of the War Mage, +1, +2, or +3":            Time;
    "Wand of Web":                                    Time;
    "Wand of Wonder":                                 BagOfBeans;
    "Weapon, +1, +2, or +3":                          Time;
    "Well of Many Worlds":                            Time;
    "Wind Fan":                                       Time;
    "Winged Boots":                                   Time;
    "Wings of Flying":                                Time;
    "Sentient Magic Items":                           SentientMagicItems;
    Artifacts:                                        Artifacts;
}

export interface ApparatusOfTheCrabLevers {
    table: ApparatusOfTheCrabLeversTable;
}

export interface ApparatusOfTheCrabLeversTable {
    Lever: string[];
    Up:    string[];
    Down:  string[];
}

export interface OfResistance {
    content: Array<HilariousContent | string>;
}

export interface HilariousContent {
    table: AmbitiousTable;
}

export interface AmbitiousTable {
    d10:           string[];
    "Damage Type": string[];
}

export interface Artifacts {
    "Orb of Dragonkind": LegalInformation;
}

export interface BagOfBeans {
    content: Array<AmbitiousContent | string>;
}

export interface AmbitiousContent {
    table: CunningTable;
}

export interface CunningTable {
    d100:   string[];
    Effect: string[];
}

export interface BagOfTricks {
    content:              string[];
    "Gray Bag of Tricks": GrayBagOfTricksClass;
    "Rust Bag of Tricks": GrayBagOfTricksClass;
    "Tan Bag of Tricks":  GrayBagOfTricksClass;
}

export interface GrayBagOfTricksClass {
    table: GrayBagOfTricksTable;
}

export interface GrayBagOfTricksTable {
    d8:       string[];
    Creature: string[];
}

export interface BeltOfGiantStrength {
    content: Array<CunningContent | string>;
}

export interface CunningContent {
    table: MagentaTable;
}

export interface MagentaTable {
    Type:     string[];
    Strength: string[];
    Rarity:   string[];
}

export interface CandleOfInvocation {
    content: Array<MagentaContent | string>;
}

export interface MagentaContent {
    table: FriskyTable;
}

export interface FriskyTable {
    d20:       string[];
    Alignment: string[];
}

export interface CarpetOfFlying {
    content: Array<FriskyContent | string>;
}

export interface FriskyContent {
    table: MischievousTable;
}

export interface MischievousTable {
    d100:           string[];
    Size:           string[];
    Capacity:       string[];
    "Flying Speed": string[];
}

export interface CubeOfForceFaces {
    content: Array<MischievousContent | string>;
}

export interface MischievousContent {
    table: BraggadociousTable;
}

export interface BraggadociousTable {
    Face?:            string[];
    Charges?:         string[];
    Effect?:          string[];
    "Spell or Item"?: string[];
    "Charges Lost"?:  string[];
}

export interface DeckOfIllusions {
    content: Array<BraggadociousContent | string>;
}

export interface BraggadociousContent {
    table: Table1;
}

export interface Table1 {
    "Playing Card": string[];
    Illusion:       string[];
}

export interface DeckOfManyThings {
    content:           Array<Content1 | string>;
    "Avatar of Death": Ape;
}

export interface Content1 {
    table: Table2;
}

export interface Table2 {
    "Playing Card": string[];
    Card:           string[];
}

export interface DragonScaleMail {
    content: Array<Content2 | string>;
}

export interface Content2 {
    table: Table3;
}

export interface Table3 {
    Dragon:     string[];
    Resistance: string[];
}

export interface ElementalGem {
    content: Array<Content3 | string>;
}

export interface Content3 {
    table: Table4;
}

export interface Table4 {
    Gem:                  string[];
    "Summoned Elemental": string[];
}

export interface FeatherToken {
    content: Array<Content4 | string>;
}

export interface Content4 {
    table: Table5;
}

export interface Table5 {
    d100:            string[];
    "Feather Token": string[];
}

export interface FigurineOfWondrousPower {
    content:     string[];
    "Giant Fly": GiantFly;
}

export interface GiantFly {
    content: Array<string[] | PurpleContent | string>;
}

export interface HornOfValhalla {
    content: Array<Content5 | string>;
}

export interface Content5 {
    table: Table6;
}

export interface Table6 {
    d100:                  string[];
    "Horn Type":           string[];
    "Berserkers Summoned": string[];
    Requirement:           string[];
}

export interface IronFlask {
    content: Array<Content6 | string>;
}

export interface Content6 {
    table: Table7;
}

export interface Table7 {
    d100:     string[];
    Contents: string[];
}

export interface ManualOfGolems {
    content: Array<Content7 | string>;
}

export interface Content7 {
    table: Table8;
}

export interface Table8 {
    d20:   string[];
    Golem: string[];
    Time:  string[];
    Cost:  string[];
}

export interface NecklaceOfPrayerBeads {
    content: Array<Content8 | string>;
}

export interface Content8 {
    table: Table9;
}

export interface Table9 {
    d20:          string[];
    "Bead of...": string[];
    Spell:        string[];
}

export interface PotionOfGiantStrength {
    content: Array<Content9 | string>;
}

export interface Content9 {
    table: Table10;
}

export interface Table10 {
    "Type of Giant": string[];
    Strength:        string[];
    Rarity:          string[];
}

export interface PotionOfHealing {
    content:              string[];
    "Potions of Healing": PotionsOfHealing;
}

export interface PotionsOfHealing {
    table: PotionsOfHealingTable;
}

export interface PotionsOfHealingTable {
    "Potion of ...": string[];
    Rarity:          string[];
    "HP Regained":   string[];
}

export interface RingOfResistance {
    content: Array<Content10 | string>;
}

export interface Content10 {
    table: Table11;
}

export interface Table11 {
    d10:           string[];
    "Damage Type": string[];
    Gem:           string[];
}

export interface RingOfShootingStars {
    content: Array<Content11 | string>;
}

export interface Content11 {
    table: Table12;
}

export interface Table12 {
    Spheres:            string[];
    "Lightning Damage": string[];
}

export interface RobeOfUsefulItems {
    content: Array<string[] | Content12 | string>;
}

export interface Content12 {
    table: Table13;
}

export interface Table13 {
    d100:  string[];
    Patch: string[];
}

export interface SentientMagicItems {
    content:                         string[];
    "Creating Sentient Magic Items": CreatingSentientMagicItems;
    Conflict:                        LegalInformation;
}

export interface CreatingSentientMagicItems {
    content:           string;
    Abilities:         string;
    Communication:     Communication;
    Senses:            CreatingSentientMagicItemsSenses;
    Alignment:         CreatingSentientMagicItemsAlignment;
    "Special Purpose": SpecialPurpose;
}

export interface CreatingSentientMagicItemsAlignment {
    content: Array<Content13 | string>;
}

export interface Content13 {
    table: Table14;
}

export interface Table14 {
    d100:      string[];
    Alignment: string[];
}

export interface Communication {
    content: Array<Content14 | string>;
}

export interface Content14 {
    table: Table15;
}

export interface Table15 {
    d100:          string[];
    Communication: string[];
}

export interface CreatingSentientMagicItemsSenses {
    content: Array<Content15 | string>;
}

export interface Content15 {
    table: Table16;
}

export interface Table16 {
    d4:     string[];
    Senses: string[];
}

export interface SpecialPurpose {
    content: Array<Content16 | string>;
}

export interface Content16 {
    table: Table17;
}

export interface Table17 {
    d10:     string[];
    Purpose: string[];
}

export interface MagicItemsSpellScroll {
    content:        string[];
    "Spell Scroll": SpellScrollSpellScroll;
}

export interface SpellScrollSpellScroll {
    content: Array<Content17 | string>;
}

export interface Content17 {
    table: Table18;
}

export interface Table18 {
    "Spell Level":  string[];
    Rarity:         string[];
    "Save DC":      string[];
    "Attack Bonus": string[];
}

export interface SphereOfAnnihilation {
    content: Array<Content18 | string>;
}

export interface Content18 {
    table: Table19;
}

export interface Table19 {
    d100:   string[];
    Result: string[];
}

export interface StaffOf {
    content: Array<Content19 | string>;
}

export interface Content19 {
    table: Table20;
}

export interface Table20 {
    "Distance from Origin": string[];
    Damage:                 string[];
}

export interface Monk {
    "Class Features":      MonkClassFeatures;
    "Monastic Traditions": MonasticTraditions;
}

export interface MonkClassFeatures {
    content:                      string;
    "Hit Points":                 Time;
    Proficiencies:                Time;
    Equipment:                    LegalInformation;
    "The Monk":                   TheMonk;
    "Unarmored Defense":          string;
    "Martial Arts":               LegalInformation;
    Ki:                           Ki;
    "Unarmored Movement":         Time;
    "Monastic Tradition":         string;
    "Deflect Missiles":           Time;
    "Ability Score Improvement":  string;
    "Slow Fall":                  string;
    "Extra Attack":               string;
    "Stunning Strike":            string;
    "Ki-Empowered Strikes":       string;
    Evasion:                      string;
    "Stillness of Mind":          string;
    "Purity of Body":             string;
    "Tongue of the Sun and Moon": string;
    "Diamond Soul":               Time;
    "Timeless Body":              string;
    "Empty Body":                 Time;
    "Perfect Self":               string;
}

export interface Ki {
    content:            string[];
    "Flurry of Blows":  string;
    "Patient Defense":  string;
    "Step of the Wind": string;
}

export interface TheMonk {
    table: TheMonkTable;
}

export interface TheMonkTable {
    Level:                string[];
    "Proficiency Bonus":  string[];
    "Martial Arts":       (MartialArt | string)[];
    "Ki Points":          string[];
    "Unarmored Movement": string[];
    Features:             string[];
}

export enum MartialArt {
    The1D10 = "1d10",
    The1D4 = "1d4",
    The1D6 = "1d6",
    The1D8 = "1d8",
}

export interface MonasticTraditions {
    content:                string;
    "Way of the Open Hand": WayOfTheOpenHand;
}

export interface WayOfTheOpenHand {
    content:               string;
    "Open Hand Technique": LegalInformation;
    "Wholeness of Body":   string;
    Tranquility:           string;
    "Quivering Palm":      Time;
}

export interface Monsters {
    content:                                        string;
    "Modifying Creatures":                          string;
    Size:                                           Size;
    Type:                                           Type;
    Alignment:                                      Time;
    "Armor Class":                                  string;
    "Hit Points":                                   HitPoints;
    Speed:                                          MonstersSpeed;
    "Ability Scores":                               string;
    "Saving Throws":                                SavingThrows;
    Skills:                                         Time;
    "Vulnerabilities, Resistances, and Immunities": string;
    Senses:                                         MonstersSenses;
    Languages:                                      MonstersLanguages;
    Challenge:                                      Challenge;
    "Special Traits":                               SpecialTraits;
    Actions:                                        Actions;
    Reactions:                                      string;
    "Limited Usage":                                LimitedUsage;
    Equipment:                                      Time;
    "Legendary Creatures":                          LegendaryCreatures;
    "Monsters (A)":                                 MonstersA;
    "Monsters (B)":                                 MonstersB;
    "Monsters (C)":                                 MonstersC;
    "Monsters (D)":                                 MonstersD;
    "Monsters (E)":                                 MonstersE;
    "Monsters (F)":                                 MonstersF;
    "Monsters (G)":                                 MonstersG;
    "Monsters (H)":                                 MonstersH;
    "Monsters (I)":                                 MonstersI;
    "Monsters (K)":                                 MonstersK;
    "Monsters (L)":                                 MonstersL;
    "Monsters (M)":                                 MonstersM;
    "Monsters (N)":                                 MonstersN;
    "Monsters (O)":                                 MonstersO;
    "Monsters (P)":                                 MonstersP;
    "Monsters (R)":                                 MonstersR;
    "Monsters (S)":                                 MonstersS;
    "Monsters (T)":                                 MonstersT;
    "Monsters (U)":                                 MonstersU;
    "Monsters (V)":                                 MonstersV;
    "Monsters (W)":                                 MonstersW;
    "Monsters (X)":                                 MonstersX;
    "Monsters (Z)":                                 MonstersZ;
}

export interface Actions {
    content:                    string;
    "Melee and Ranged Attacks": Time;
    Multiattack:                string;
    Ammunition:                 string;
}

export interface Challenge {
    content:             string[];
    "Experience Points": ExperiencePoints;
}

export interface ExperiencePoints {
    content:                                 string[];
    "Experience Points by Challenge Rating": ExperiencePointsByChallengeRating;
}

export interface ExperiencePointsByChallengeRating {
    table: ExperiencePointsByChallengeRatingTable;
}

export interface ExperiencePointsByChallengeRatingTable {
    Challenge: string[];
    XP:        string[];
}

export interface HitPoints {
    content:            string[];
    "Hit Dice by Size": HitDiceBySize;
}

export interface HitDiceBySize {
    content: Array<Content20 | string>;
}

export interface Content20 {
    table: Table21;
}

export interface Table21 {
    "Monster Size":       string[];
    "Hit Die":            string[];
    "Average HP per Die": string[];
}

export interface MonstersLanguages {
    content:   string;
    Telepathy: Time;
}

export interface LegendaryCreatures {
    content:                       string[];
    "Legendary Actions":           string;
    "A Legendary Creature’s Lair": ALegendaryCreatureSLair;
}

export interface ALegendaryCreatureSLair {
    content:            string;
    "Lair Actions":     string;
    "Regional Effects": string;
}

export interface LimitedUsage {
    content:                      string[];
    "Grapple Rules for Monsters": Time;
}

export interface MonstersA {
    Aboleth:            Ape;
    Angels:             Angels;
    "Animated Objects": AnimatedObjects;
    Ankheg:             Ape;
    Azer:               Ape;
}

export interface Angels {
    Deva:     Ape;
    Planetar: Ape;
    Solar:    Ape;
}

export interface AnimatedObjects {
    "Animated Armor":    Ape;
    "Flying Sword":      Ape;
    "Rug of Smothering": Ape;
}

export interface MonstersB {
    Basilisk: Ape;
    Behir:    Ape;
    Bugbear:  Ape;
    Bulette:  Ape;
}

export interface MonstersC {
    Centaur:    Ape;
    Chimera:    Ape;
    Chuul:      Ape;
    Cloaker:    Ape;
    Cockatrice: Ape;
    Couatl:     Ape;
}

export interface MonstersD {
    Darkmantle:           Ape;
    Demons:               Demons;
    Devils:               Devils;
    Dinosaurs:            Dinosaurs;
    Doppelganger:         Ape;
    "Dragons, Chromatic": DragonsChromatic;
    "Dragons, Metallic":  DragonsMetallic;
    "Dragon Turtle":      Ape;
    Drider:               Ape;
    Dryad:                Ape;
    Duergar:              Ape;
}

export interface Demons {
    Balor:      Ape;
    Dretch:     Ape;
    Glabrezu:   Ape;
    Hezrou:     Ape;
    Marilith:   Ape;
    Nalfeshnee: Ape;
    Quasit:     Ape;
    Vrock:      Ape;
}

export interface Devils {
    "Barbed Devil":  Ape;
    "Bearded Devil": Ape;
    "Bone Devil":    Ape;
    "Chain Devil":   Ape;
    Erinyes:         Ape;
    "Horned Devil":  Ape;
    "Ice Devil":     Ape;
    Imp:             Ape;
    Lemure:          Ape;
    "Pit Fiend":     Ape;
}

export interface Dinosaurs {
    Plesiosaurus:        Ape;
    Triceratops:         Ape;
    "Tyrannosaurus Rex": Ape;
}

export interface DragonsChromatic {
    "Black Dragon": BlackDragon;
    "Blue Dragon":  BlueDragon;
    "Green Dragon": GreenDragon;
    "Red Dragon":   RedDragon;
    "White Dragon": WhiteDragon;
}

export interface BlackDragon {
    "Ancient Black Dragon":  Ape;
    "Adult Black Dragon":    Ape;
    "Young Black Dragon":    Ape;
    "Black Dragon Wyrmling": Ape;
}

export interface BlueDragon {
    "Ancient Blue Dragon":  Ape;
    "Adult Blue Dragon":    Ape;
    "Young Blue Dragon":    Ape;
    "Blue Dragon Wyrmling": Ape;
}

export interface GreenDragon {
    "Ancient Green Dragon":  Ape;
    "Adult Green Dragon":    Ape;
    "Young Green Dragon":    Ape;
    "Green Dragon Wyrmling": Ape;
}

export interface RedDragon {
    "Ancient Red Dragon":  Ape;
    "Adult Red Dragon":    Ape;
    "Young Red Dragon":    Ape;
    "Red Dragon Wyrmling": Ape;
}

export interface WhiteDragon {
    "Ancient White Dragon":  Ape;
    "Adult White Dragon":    Ape;
    "Young White Dragon":    Ape;
    "White Dragon Wyrmling": Ape;
}

export interface DragonsMetallic {
    "Brass Dragon":  BrassDragon;
    "Bronze Dragon": BronzeDragon;
    "Copper Dragon": CopperDragon;
    "Gold Dragon":   GoldDragon;
    "Silver Dragon": SilverDragon;
}

export interface BrassDragon {
    "Ancient Brass Dragon":  Ape;
    "Adult Brass Dragon":    Ape;
    "Young Brass Dragon":    Ape;
    "Brass Dragon Wyrmling": Ape;
}

export interface BronzeDragon {
    "Ancient Bronze Dragon":  Ape;
    "Adult Bronze Dragon":    Ape;
    "Young Bronze Dragon":    Ape;
    "Bronze Dragon Wyrmling": Ape;
}

export interface CopperDragon {
    "Ancient Copper Dragon":  Ape;
    "Adult Copper Dragon":    Ape;
    "Young Copper Dragon":    Ape;
    "Copper Dragon Wyrmling": Ape;
}

export interface GoldDragon {
    "Ancient Gold Dragon":  Ape;
    "Adult Gold Dragon":    Ape;
    "Young Gold Dragon":    Ape;
    "Gold Dragon Wyrmling": Ape;
}

export interface SilverDragon {
    "Ancient Silver Dragon":  Ape;
    "Adult Silver Dragon":    Ape;
    "Young Silver Dragon":    Ape;
    "Silver Dragon Wyrmling": Ape;
}

export interface MonstersE {
    Elementals:  Elementals;
    "Elf, Drow": Ape;
    Ettercap:    Ape;
    Ettin:       Ape;
}

export interface Elementals {
    "Air Elemental":   Ape;
    "Earth Elemental": Ape;
    "Fire Elemental":  Ape;
    "Water Elemental": Ape;
}

export interface MonstersF {
    Fungi: Fungi;
}

export interface Fungi {
    Shrieker:        Ape;
    "Violet Fungus": Ape;
}

export interface MonstersG {
    Gargoyle:                    Ape;
    Genies:                      Genies;
    Ghost:                       Ape;
    Ghouls:                      Ghouls;
    Giants:                      Giants;
    "Gibbering Mouther":         Ape;
    Gnoll:                       Ape;
    "Gnome, Deep (Svirfneblin)": Ape;
    Goblin:                      Ape;
    Golems:                      Golems;
    Gorgon:                      Ape;
    Grick:                       Ape;
    Griffon:                     Ape;
    Grimlock:                    Ape;
}

export interface Genies {
    Djinni:  Ape;
    Efreeti: Ape;
}

export interface Ghouls {
    Ghast: Ape;
    Ghoul: Ape;
}

export interface Giants {
    "Cloud Giant": Ape;
    "Fire Giant":  Ape;
    "Frost Giant": Ape;
    "Hill Giant":  Ape;
    "Stone Giant": Ape;
    "Storm Giant": Ape;
}

export interface Golems {
    "Clay Golem":  Ape;
    "Flesh Golem": Ape;
    "Iron Golem":  Ape;
    "Stone Golem": Ape;
}

export interface MonstersH {
    Hags:                   Hags;
    "Half-Dragon Template": HalfDragonTemplate;
    Harpy:                  Ape;
    "Hell Hound":           Ape;
    Hippogriff:             Ape;
    Hobgoblin:              Ape;
    Homunculus:             Ape;
    Hydra:                  Ape;
}

export interface Hags {
    "Green Hag": Ape;
    "Night Hag": Ape;
    "Sea Hag":   Ape;
}

export interface HalfDragonTemplate {
    content:                   Array<Content21 | string>;
    "Half-Red Dragon Veteran": Ape;
}

export interface Content21 {
    table: Table22;
}

export interface Table22 {
    Color?:                   string[];
    "Damage Resistance"?:     string[];
    Size?:                    string[];
    "Breath Weapon"?:         string[];
    "Optional Prerequisite"?: string[];
}

export interface MonstersI {
    "Invisible Stalker": Ape;
}

export interface MonstersK {
    Kobold: Ape;
    Kraken: Ape;
}

export interface MonstersL {
    Lamia:        Ape;
    Lich:         Ape;
    Lizardfolk:   Ape;
    Lycanthropes: Lycanthropes;
}

export interface Lycanthropes {
    Werebear:  Ape;
    Wereboar:  Ape;
    Wererat:   Ape;
    Weretiger: Ape;
    Werewolf:  Ape;
}

export interface MonstersM {
    Magmin:    Ape;
    Manticore: Ape;
    Medusa:    Ape;
    Mephits:   Mephits;
    Merfolk:   Ape;
    Merrow:    Ape;
    Mimic:     Ape;
    Minotaur:  Ape;
    Mummies:   Mummies;
}

export interface Mephits {
    "Dust Mephit":  Ape;
    "Ice Mephit":   Ape;
    "Magma Mephit": Ape;
    "Steam Mephit": Ape;
}

export interface Mummies {
    Mummy:        Ape;
    "Mummy Lord": Ape;
}

export interface MonstersN {
    Nagas:     Nagas;
    Nightmare: Ape;
}

export interface Nagas {
    "Guardian Naga": Ape;
    "Spirit Naga":   Ape;
}

export interface MonstersO {
    Ogre:    Ape;
    Oni:     Ape;
    Oozes:   Oozes;
    Orc:     Ape;
    Otyugh:  Ape;
    Owlbear: Ape;
}

export interface Oozes {
    "Black Pudding":   Ape;
    "Gelatinous Cube": Ape;
    "Gray Ooze":       Ape;
    "Ochre Jelly":     Ape;
}

export interface MonstersP {
    Pegasus:       Ape;
    Pseudodragon:  Ape;
    "Purple Worm": Ape;
}

export interface MonstersR {
    Rakshasa:       Ape;
    Remorhaz:       Ape;
    Roc:            Ape;
    Roper:          Ape;
    "Rust Monster": Ape;
}

export interface MonstersS {
    Sahuagin:           Ape;
    Salamander:         Ape;
    Satyr:              Ape;
    Shadow:             Ape;
    "Shambling Mound":  Ape;
    "Shield Guardian":  Ape;
    Skeletons:          Skeletons;
    Specter:            Ape;
    Sphinxes:           Sphinxes;
    Sprite:             Ape;
    Stirge:             Ape;
    "Succubus/Incubus": Ape;
}

export interface Skeletons {
    Skeleton:            Ape;
    "Minotaur Skeleton": Ape;
    "Warhorse Skeleton": Ape;
}

export interface Sphinxes {
    Androsphinx: Ape;
    Gynosphinx:  Ape;
}

export interface MonstersT {
    Tarrasque: Ape;
    Treant:    Ape;
    Troll:     Ape;
}

export interface MonstersU {
    Unicorn: Ape;
}

export interface MonstersV {
    Vampires: Vampires;
}

export interface Vampires {
    Vampire:         Ape;
    "Vampire Spawn": Ape;
}

export interface MonstersW {
    Wight:          Ape;
    "Will-o’-Wisp": Ape;
    Wraith:         Ape;
    Wyvern:         Ape;
}

export interface MonstersX {
    Xorn: Ape;
}

export interface MonstersZ {
    Zombies: Zombies;
}

export interface Zombies {
    Zombie:        Ape;
    "Ogre Zombie": Ape;
}

export interface SavingThrows {
    content:                                 string[];
    "Proficiency Bonus by Challenge Rating": ProficiencyBonusByChallengeRating;
}

export interface ProficiencyBonusByChallengeRating {
    table: ProficiencyBonusByChallengeRatingTable;
}

export interface ProficiencyBonusByChallengeRatingTable {
    Challenge:           string[];
    "Proficiency Bonus": string[];
}

export interface MonstersSenses {
    content:     string;
    Blindsight:  Time;
    Darkvision:  Darkvision;
    Tremorsense: string;
    Truesight:   string;
}

export interface Darkvision {
    content:                                 string;
    "Armor, Weapon, and Tool Proficiencies": Time;
}

export interface Size {
    content:           string;
    "Size Categories": SizeSizeCategories;
}

export interface SizeSizeCategories {
    table: Table23;
}

export interface Table23 {
    Size:     string[];
    Space:    string[];
    Examples: string[];
}

export interface SpecialTraits {
    content:               string;
    "Innate Spellcasting": Time;
    Spellcasting:          Time;
    Psionics:              string;
}

export interface MonstersSpeed {
    content: string[];
    Burrow:  string;
    Climb:   string;
    Fly:     string;
    Swim:    string;
}

export interface Type {
    content: string[];
    Tags:    string;
}

export interface Objects {
    content:                  string[];
    "Statistics for Objects": StatisticsForObjects;
}

export interface StatisticsForObjects {
    content:              string[];
    "Object Armor Class": ObjectArmorClass;
    "Object Hit Points":  ObjectHitPoints;
}

export interface ObjectArmorClass {
    content: Array<Content22 | string>;
}

export interface Content22 {
    table: Table24;
}

export interface Table24 {
    Substance: string[];
    AC:        string[];
}

export interface ObjectHitPoints {
    content: Array<Content23 | string>;
}

export interface Content23 {
    table: Table25;
}

export interface Table25 {
    Size:      string[];
    Fragile:   string[];
    Resilient: string[];
}

export interface Paladin {
    "Class Features": PaladinClassFeatures;
    "Sacred Oaths":   SacredOaths;
}

export interface PaladinClassFeatures {
    content:                     string;
    "Hit Points":                Time;
    Proficiencies:               Time;
    Equipment:                   LegalInformation;
    "The Paladin":               The;
    "Divine Sense":              Time;
    "Lay on Hands":              Time;
    "Fighting Style":            FluffyFightingStyle;
    Spellcasting:                TentacledSpellcasting;
    "Divine Smite":              string;
    "Divine Health":             string;
    "Sacred Oath":               SacredOath;
    "Ability Score Improvement": string;
    "Extra Attack":              string;
    "Aura of Protection":        Time;
    "Aura of Courage":           Time;
    "Improved Divine Smite":     string;
    "Cleansing Touch":           Time;
}

export interface FluffyFightingStyle {
    content:                 string;
    Defense:                 string;
    Dueling:                 string;
    "Great Weapon Fighting": string;
    Protection:              string;
}

export interface SacredOath {
    content:            string[];
    "Oath Spells":      Time;
    "Channel Divinity": Time;
}

export interface TentacledSpellcasting {
    content:                        string;
    "Preparing and Casting Spells": Time;
    "Spellcasting Ability":         Time;
    "Spellcasting Focus":           string;
}

export interface The {
    table: { [key: string]: string[] };
}

export interface SacredOaths {
    content:              string;
    "Oath of Devotion":   OathOfDevotion;
    "Breaking Your Oath": Time;
}

export interface OathOfDevotion {
    content:              string;
    "Tenets of Devotion": Time;
    "Oath Spells":        OathSpells;
    "Channel Divinity":   Time;
    "Aura of Devotion":   Time;
    "Purity of Spirit":   string;
    "Holy Nimbus":        Time;
}

export interface OathSpells {
    content:                   string;
    "Oath of Devotion Spells": OathOfDevotionSpells;
}

export interface OathOfDevotionSpells {
    table: OathOfDevotionSpellsTable;
}

export interface OathOfDevotionSpellsTable {
    Level:            string[];
    "Paladin Spells": string[];
}

export interface The5ESRDPoisons {
    content:          string[];
    Poisons:          PoisonsPoisons;
    "Sample Poisons": Time;
}

export interface PoisonsPoisons {
    table: PoisonsTable;
}

export interface PoisonsTable {
    Item:             string[];
    Type:             string[];
    "Price per Dose": string[];
}

export interface Races {
    "Racial Traits": RacialTraits;
    Dwarf:           Dwarf;
    Elf:             ELF;
    Halfling:        Halfling;
    Human:           Human;
    Dragonborn:      Dragonborn;
    Gnome:           Gnome;
    "Half-Elf":      HalfELF;
    "Half-Orc":      HalfOrc;
    Tiefling:        Tiefling;
}

export interface Dragonborn {
    "Dragonborn Traits": DragonbornTraits;
}

export interface DragonbornTraits {
    content: Array<Content24 | string>;
}

export interface Content24 {
    table: Table26;
}

export interface Table26 {
    "**Dragon**":        string[];
    "**Damage Type**":   string[];
    "**Breath Weapon**": BreathWeapon[];
}

export type BreathWeapon = "15 ft. cone (Con. save)" | "15 ft. cone (Dex. save)" | "5 by 30 ft. line (Dex. save)";


export interface Dwarf {
    "Dwarf Traits": DwarfTraits;
}

export interface DwarfTraits {
    content:      string[];
    "Hill Dwarf": Time;
}

export interface ELF {
    "Elf Traits": ELFTraits;
}

export interface ELFTraits {
    content:    string[];
    "High Elf": Time;
}

export interface Gnome {
    "Gnome Traits": GnomeTraits;
}

export interface GnomeTraits {
    content:      string[];
    "Rock Gnome": LegalInformation;
}

export interface HalfELF {
    "Half-Elf Traits": Time;
}

export interface HalfOrc {
    "Half-Orc Traits": Time;
}

export interface Halfling {
    "Halfling Traits": HalflingTraits;
}

export interface HalflingTraits {
    content:   string[];
    Lightfoot: Time;
}

export interface Human {
    "Human Traits": Time;
}

export interface RacialTraits {
    content:                  string;
    "Ability Score Increase": string;
    Age:                      string;
    Alignment:                string;
    Size:                     string;
    Speed:                    string;
    Languages:                string;
    Subraces:                 string;
}

export interface Tiefling {
    "Tiefling Traits": Time;
}

export interface Ranger {
    "Class Features":    RangerClassFeatures;
    "Ranger Archetypes": RangerArchetypes;
}

export interface RangerClassFeatures {
    content:                     string;
    "Hit Points":                Time;
    Proficiencies:               Time;
    Equipment:                   LegalInformation;
    "The Ranger":                The;
    "Favored Enemy":             Time;
    "Natural Explorer":          LegalInformation;
    "Fighting Style":            TentacledFightingStyle;
    Spellcasting:                StickySpellcasting;
    "Ranger Archetype":          string;
    "Primeval Awareness":        string;
    "Ability Score Improvement": string;
    "Extra Attack":              string;
    "Land’s Stride":             Time;
    "Hide in Plain Sight":       Time;
    Vanish:                      string;
    "Feral Senses":              Time;
    "Foe Slayer":                string;
}

export interface TentacledFightingStyle {
    content:               string;
    Archery:               string;
    Defense:               string;
    Dueling:               string;
    "Two-Weapon Fighting": string;
}

export interface StickySpellcasting {
    content:                                string;
    "Spell Slots":                          Time;
    "Spells Known of 1st Level and Higher": Time;
    "Spellcasting Ability":                 Time;
}

export interface RangerArchetypes {
    content: string;
    Hunter:  Hunter;
}

export interface Hunter {
    content:                     string;
    "Hunter’s Prey":             Time;
    "Defensive Tactics":         Time;
    Multiattack:                 Time;
    "Superior Hunter’s Defense": Time;
}

export interface Rogue {
    "Class Features":     RogueClassFeatures;
    "Roguish Archetypes": RoguishArchetypes;
}

export interface RogueClassFeatures {
    content:                     string;
    "Hit Points":                Time;
    Proficiencies:               Time;
    Equipment:                   LegalInformation;
    "The Rogue":                 TheRogue;
    "Thieves’ Cant":             Time;
    "Cunning Action":            string;
    "Roguish Archetype":         string;
    "Ability Score Improvement": string;
    "Uncanny Dodge":             string;
    Evasion:                     string;
    "Reliable Talent":           string;
    Blindsense:                  string;
    "Slippery Mind":             string;
    Elusive:                     string;
    "Stroke of Luck":            Time;
}

export interface TheRogue {
    content: Array<TheFighter | string>;
}

export interface RoguishArchetypes {
    content: string;
    Thief:   Thief;
}

export interface Thief {
    content:             string;
    "Fast Hands":        string;
    "Second-Story Work": Time;
    "Supreme Sneak":     string;
    "Use Magic Device":  string;
    "Thief’s Reflexes":  string;
}

export interface Sorcerer {
    "Class Features":    SorcererClassFeatures;
    "Sorcerous Origins": SorcerousOrigins;
}

export interface SorcererClassFeatures {
    content:                     string;
    "Hit Points":                Time;
    Proficiencies:               Time;
    Equipment:                   LegalInformation;
    "The Sorcerer":              TheBard;
    Spellcasting:                Spellcasting;
    "Sorcerous Origin":          Time;
    "Font of Magic":             FontOfMagic;
    Metamagic:                   Metamagic;
    "Ability Score Improvement": string;
    "Sorcerous Restoration":     string;
}

export interface FontOfMagic {
    content:            string;
    "Sorcery Points":   string;
    "Flexible Casting": FlexibleCasting;
}

export interface FlexibleCasting {
    content:                string[];
    "Creating Spell Slots": CreatingSpellSlots;
}

export interface CreatingSpellSlots {
    content: Array<Content25 | string>;
}

export interface Content25 {
    table: Table27;
}

export interface Table27 {
    "Spell Slot Level":   string[];
    "Sorcery Point Cost": string[];
}

export interface Metamagic {
    content:            string[];
    "Careful Spell":    string;
    "Distant Spell":    Time;
    "Empowered Spell":  Time;
    "Extended Spell":   string;
    "Heightened Spell": string;
    "Quickened Spell":  string;
    "Subtle Spell":     string;
    "Twinned Spell":    Time;
}

export interface Spellcasting {
    content:                                string;
    Cantrips:                               string;
    "Spell Slots":                          Time;
    "Spells Known of 1st Level and Higher": Time;
    "Spellcasting Ability":                 Time;
    "Spellcasting Focus":                   string;
}

export interface SorcerousOrigins {
    content:              string;
    "Draconic Bloodline": DraconicBloodline;
}

export interface DraconicBloodline {
    content:               string;
    "Dragon Ancestor":     DragonAncestor;
    "Draconic Resilience": Time;
    "Elemental Affinity":  string;
    "Dragon Wings":        Time;
    "Draconic Presence":   string;
}

export interface DragonAncestor {
    content:             string;
    "Draconic Ancestry": DraconicAncestry;
}

export interface DraconicAncestry {
    content: Array<Content26 | string>;
}

export interface Content26 {
    table: Table28;
}

export interface Table28 {
    Dragon:        string[];
    "Damage Type": string[];
}

export interface The5ESRDSpellcasting {
    content:              string[];
    "What Is a Spell?":   WhatIsASpell;
    "Casting a Spell":    CastingASpell;
    "Spell Lists":        SpellLists;
    "Spell Descriptions": SpellDescriptions;
}

export interface CastingASpell {
    content:                     string[];
    "Casting Time":              CastingTime;
    "Spell Range":               Time;
    Components:                  Components;
    Duration:                    Duration;
    Targets:                     Targets;
    "Areas of Effect":           AreasOfEffect;
    "Spell Saving Throws":       Time;
    "Spell Attack Rolls":        Time;
    "Combining Magical Effects": Time;
    "The Schools of Magic":      Time;
}

export interface AreasOfEffect {
    content:  string[];
    Cone:     Time;
    Cube:     Time;
    Cylinder: Time;
    Line:     Time;
    Sphere:   Time;
}

export interface CastingTime {
    content:                string;
    "Bonus Action":         string;
    Reactions:              string;
    "Longer Casting Times": string;
}

export interface Components {
    content:        string;
    "Verbal (V)":   string;
    "Somatic (S)":  string;
    "Material (M)": Time;
}

export interface Duration {
    content:       string;
    Instantaneous: string;
    Concentration: LegalInformation;
}

export interface Targets {
    content:                      string[];
    "A Clear Path to the Target": Time;
    "Targeting Yourself":         string;
}

export interface SpellDescriptions {
    "Acid Arrow":                    Time;
    "Acid Splash":                   Time;
    Aid:                             Time;
    Alarm:                           Time;
    "Alter Self":                    Time;
    "Animal Messenger":              Time;
    "Animal Shapes":                 Time;
    "Animate Dead":                  Time;
    "Animate Objects":               AnimateObjects;
    "Antilife Shell":                Time;
    "Antimagic Field":               Time;
    "Antipathy/Sympathy":            Time;
    "Arcane Eye":                    Time;
    "Arcane Hand":                   Time;
    "Arcane Lock":                   Time;
    "Arcane Sword":                  Time;
    "Arcanist’s Magic Aura":         Time;
    "Astral Projection":             Time;
    Augury:                          LegalInformation;
    Awaken:                          Time;
    Bane:                            Time;
    Banishment:                      Time;
    Barkskin:                        Time;
    "Beacon of Hope":                Time;
    "Bestow Curse":                  LegalInformation;
    "Black Tentacles":               Time;
    "Blade Barrier":                 Time;
    Bless:                           Time;
    Blight:                          Time;
    "Blindness/Deafness":            Time;
    Blink:                           Time;
    Blur:                            Time;
    "Burning Hands":                 Time;
    "Call Lightning":                Time;
    "Calm Emotions":                 Time;
    "Chain Lightning":               Time;
    "Charm Person":                  Time;
    "Chill Touch":                   Time;
    "Circle of Death":               Time;
    Clairvoyance:                    Time;
    Clone:                           Time;
    Cloudkill:                       Time;
    "Color Spray":                   Time;
    Command:                         Time;
    Commune:                         Time;
    "Commune with Nature":           LegalInformation;
    "Comprehend Languages":          Time;
    "Cone of Cold":                  Time;
    Confusion:                       Confusion;
    "Conjure Animals":               LegalInformation;
    "Conjure Celestial":             Time;
    "Conjure Elemental":             Time;
    "Conjure Fey":                   Time;
    "Conjure Minor Elementals":      LegalInformation;
    "Conjure Woodland Beings":       LegalInformation;
    "Contact Other Plane":           Time;
    Contagion:                       Time;
    Contingency:                     Time;
    "Continual Flame":               Time;
    "Control Water":                 Time;
    "Control Weather":               Time;
    Precipitation:                   Precipitation;
    Temperature:                     Precipitation;
    Wind:                            Precipitation;
    "Create Food and Water":         Time;
    "Create or Destroy Water":       Time;
    "Create Undead":                 Time;
    Creation:                        Creation;
    "Cure Wounds":                   Time;
    "Dancing Lights":                Time;
    Darkness:                        Time;
    Darkvision:                      Time;
    Daylight:                        Time;
    "Death Ward":                    Time;
    "Delayed Blast Fireball":        Time;
    Demiplane:                       Time;
    "Detect Evil and Good":          Time;
    "Detect Magic":                  Time;
    "Detect Poison and Disease":     Time;
    "Detect Thoughts":               Time;
    "Dimension Door":                Time;
    "Disguise Self":                 Time;
    Disintegrate:                    Time;
    "Dispel Evil and Good":          Time;
    "Dispel Magic":                  Time;
    Divination:                      Time;
    "Divine Favor":                  Time;
    "Divine Word":                   LegalInformation;
    "Dominate Beast":                Time;
    "Dominate Monster":              Time;
    "Dominate Person":               Time;
    Dream:                           Time;
    Earthquake:                      Time;
    "Enhance Ability":               Time;
    "Enlarge/Reduce":                Time;
    Entangle:                        Time;
    Enthrall:                        Time;
    Etherealness:                    Time;
    "Expeditious Retreat":           Time;
    Eyebite:                         Time;
    Fabricate:                       Time;
    "Faerie Fire":                   Time;
    "Faithful Hound":                Time;
    "False Life":                    Time;
    Fear:                            Time;
    "Feather Fall":                  Time;
    Feeblemind:                      Time;
    "Find Steed":                    Time;
    "Find the Path":                 Time;
    "Find Traps":                    Time;
    "Finger of Death":               Time;
    Fireball:                        Time;
    "Fire Shield":                   Time;
    "Fire Storm":                    Time;
    "Flame Blade":                   Time;
    "Flame Strike":                  Time;
    "Flaming Sphere":                Time;
    "Flesh to Stone":                Time;
    "Floating Disk":                 Time;
    Fly:                             Time;
    "Fog Cloud":                     Time;
    Forbiddance:                     Time;
    Forcecage:                       Time;
    Foresight:                       Time;
    "Freedom of Movement":           Time;
    "Freezing Sphere":               Time;
    "Gaseous Form":                  Time;
    Gate:                            Time;
    Geas:                            Time;
    "Gentle Repose":                 Time;
    "Giant Insect":                  Time;
    Glibness:                        Time;
    "Globe of Invulnerability":      Time;
    "Glyph of Warding":              Time;
    Grease:                          Time;
    "Greater Invisibility":          Time;
    "Greater Restoration":           LegalInformation;
    "Guards and Wards":              LegalInformation;
    Guidance:                        Time;
    "Guiding Bolt":                  Time;
    "Gust of Wind":                  Time;
    Hallow:                          Time;
    "Hallucinatory Terrain":         Time;
    Harm:                            Time;
    Haste:                           Time;
    Heal:                            Time;
    "Healing Word":                  Time;
    "Heat Metal":                    Time;
    "Heroes’ Feast":                 Time;
    Heroism:                         Time;
    "Hideous Laughter":              Time;
    "Hold Monster":                  Time;
    "Hold Person":                   Time;
    "Holy Aura":                     Time;
    "Hypnotic Pattern":              Time;
    "Ice Storm":                     Time;
    Identify:                        Time;
    "Illusory Script":               Time;
    Imprisonment:                    Time;
    "Incendiary Cloud":              Time;
    "Inflict Wounds":                Time;
    "Insect Plague":                 Time;
    "Instant Summons":               Time;
    Invisibility:                    Time;
    "Irresistible Dance":            Time;
    Jump:                            Time;
    Knock:                           Time;
    "Legend Lore":                   Time;
    "Lesser Restoration":            Time;
    Levitate:                        Time;
    Light:                           Time;
    "Lightning Bolt":                Time;
    "Locate Animals or Plants":      Time;
    "Locate Creature":               Time;
    "Locate Object":                 Time;
    Longstrider:                     Time;
    "Mage Armor":                    Time;
    "Mage Hand":                     Time;
    "Magic Circle":                  LegalInformation;
    "Magic Jar":                     Time;
    "Magic Missile":                 Time;
    "Magic Mouth":                   Time;
    "Magic Weapon":                  Time;
    "Magnificent Mansion":           Time;
    "Major Image":                   Time;
    "Mass Cure Wounds":              Time;
    "Mass Heal":                     Time;
    "Mass Healing Word":             Time;
    "Mass Suggestion":               Time;
    Maze:                            Time;
    "Meld into Stone":               Time;
    Mending:                         Time;
    Message:                         Time;
    "Meteor Swarm":                  Time;
    "Mind Blank":                    Time;
    "Minor Illusion":                Time;
    "Mirage Arcane":                 Time;
    "Mirror Image":                  Time;
    Mislead:                         Time;
    "Misty Step":                    Time;
    "Modify Memory":                 Time;
    Moonbeam:                        Time;
    "Move Earth":                    Time;
    Nondetection:                    Time;
    "Pass without Trace":            Time;
    Passwall:                        Time;
    "Phantasmal Killer":             Time;
    "Phantom Steed":                 Time;
    "Planar Ally":                   Time;
    "Planar Binding":                Time;
    "Plane Shift":                   Time;
    "Plant Growth":                  Time;
    Polymorph:                       Time;
    "Power Word Kill":               Time;
    "Power Word Stun":               Time;
    "Prayer of Healing":             Time;
    Prestidigitation:                LegalInformation;
    "Prismatic Spray":               LegalInformation;
    "Prismatic Wall":                LegalInformation;
    "Private Sanctum":               LegalInformation;
    "Produce Flame":                 Time;
    "Programmed Illusion":           Time;
    "Project Image":                 Time;
    "Protection from Energy":        Time;
    "Protection from Evil and Good": Time;
    "Protection from Poison":        Time;
    "Purify Food and Drink":         Time;
    "Raise Dead":                    Time;
    "Ray of Enfeeblement":           Time;
    "Ray of Frost":                  Time;
    Regenerate:                      Time;
    Reincarnate:                     Reincarnate;
    "Remove Curse":                  Time;
    "Resilient Sphere":              Time;
    Resistance:                      Time;
    Resurrection:                    Time;
    "Reverse Gravity":               Time;
    Revivify:                        Time;
    "Rope Trick":                    Time;
    "Sacred Flame":                  Time;
    Sanctuary:                       Time;
    "Scorching Ray":                 Time;
    Scrying:                         Scrying;
    "Secret Chest":                  Time;
    "See Invisibility":              Time;
    Seeming:                         Time;
    Sending:                         Time;
    Sequester:                       Time;
    Shapechange:                     Time;
    Shatter:                         Time;
    Shield:                          Time;
    "Shield of Faith":               Time;
    Shillelagh:                      Time;
    "Shocking Grasp":                Time;
    Silence:                         Time;
    "Silent Image":                  Time;
    Simulacrum:                      Time;
    Sleep:                           Time;
    "Sleet Storm":                   Time;
    Slow:                            Time;
    "Speak with Animals":            Time;
    "Speak with Dead":               Time;
    "Speak with Plants":             Time;
    "Spider Climb":                  Time;
    "Spike Growth":                  Time;
    "Spirit Guardians":              Time;
    "Spiritual Weapon":              Time;
    "Stinking Cloud":                Time;
    "Stone Shape":                   Time;
    Stoneskin:                       Time;
    "Storm of Vengeance":            Time;
    Suggestion:                      Time;
    Sunbeam:                         Time;
    Sunburst:                        Time;
    Symbol:                          Time;
    Telekinesis:                     Time;
    "Telepathic Bond":               Time;
    Teleport:                        Teleport;
    "Teleportation Circle":          Time;
    Thaumaturgy:                     LegalInformation;
    Thunderwave:                     Time;
    "Time Stop":                     Time;
    "Tiny Hut":                      Time;
    Tongues:                         Time;
    "Transport via Plants":          Time;
    "Tree Stride":                   Time;
    "True Polymorph":                Time;
    "True Resurrection":             Time;
    "True Seeing":                   Time;
    "True Strike":                   Time;
    "Unseen Servant":                Time;
    "Vampiric Touch":                Time;
    "Wall of Fire":                  Time;
    "Wall of Force":                 Time;
    "Wall of Ice":                   Time;
    "Wall of Stone":                 Time;
    "Wall of Thorns":                Time;
    "Warding Bond":                  Time;
    "Water Breathing":               Time;
    "Water Walk":                    Time;
    Web:                             Time;
    Weird:                           Time;
    "Wind Walk":                     Time;
    "Wind Wall":                     Time;
    Wish:                            LegalInformation;
    "Word of Recall":                Time;
    "Zone of Truth":                 Time;
}

export interface AnimateObjects {
    content:                      string[];
    "Animated Object Statistics": AnimatedObjectStatistics;
}

export interface AnimatedObjectStatistics {
    content: Array<Content27 | string>;
}

export interface Content27 {
    table: Table29;
}

export interface Table29 {
    Size:   string[];
    HP:     string[];
    AC:     string[];
    Attack: string[];
    Str:    string[];
    Dex:    string[];
}

export interface Confusion {
    content: Array<Content28 | string>;
}

export interface Content28 {
    table: Table30;
}

export interface Table30 {
    d10:      string[];
    Behavior: string[];
}

export interface Creation {
    content: Array<Content29 | string>;
}

export interface Content29 {
    table: Table31;
}

export interface Table31 {
    Material: string[];
    Duration: string[];
}

export interface Precipitation {
    table: PrecipitationTable;
}

export interface PrecipitationTable {
    Stage:     string[];
    Condition: string[];
}

export interface Reincarnate {
    content: Array<Content30 | string>;
}

export interface Content30 {
    table: Table32;
}

export interface Table32 {
    d100: string[];
    Race: string[];
}

export interface Scrying {
    content: Array<Content31 | string>;
}

export interface Content31 {
    table: Table33;
}

export interface Table33 {
    Knowledge?:      string[];
    "Save Modifier": string[];
    Connection?:     string[];
}

export interface Teleport {
    content: Array<Content32 | string>;
}

export interface Content32 {
    table: Table34;
}

export interface Table34 {
    Familiarity:    string[];
    Mishap:         string[];
    "Similar Area": string[];
    "Off Target":   string[];
    "On Target":    string[];
}

export interface SpellLists {
    "Bard Spells":     { [key: string]: string[] };
    "Cleric Spells":   { [key: string]: string[] };
    "Druid Spells":    { [key: string]: string[] };
    "Paladin Spells":  Spells;
    "Ranger Spells":   Spells;
    "Sorcerer Spells": { [key: string]: string[] };
    "Warlock Spells":  { [key: string]: string[] };
    "Wizard Spells":   { [key: string]: string[] };
}

export interface Spells {
    "1st Level": string[];
    "2nd Level": string[];
    "3rd Level": string[];
    "4th Level": string[];
    "5th Level": string[];
}

export interface WhatIsASpell {
    content:                     string[];
    "Spell Level":               Time;
    "Known and Prepared Spells": Time;
    "Spell Slots":               SpellSlots;
    Cantrips:                    string;
    Rituals:                     Time;
}

export interface SpellSlots {
    content:                             string[];
    "Casting a Spell at a Higher Level": Time;
    "Casting in Armor":                  string;
}

export interface Traps {
    content:         string[];
    "Traps in Play": TrapsInPlay;
    "Sample Traps":  SampleTraps;
}

export interface SampleTraps {
    content:                  string;
    "Collapsing Roof":        Time;
    "Falling Net":            Time;
    "Fire-Breathing Statue":  Time;
    Pits:                     Time;
    "Poison Darts":           Time;
    "Poison Needle":          Time;
    "Rolling Sphere":         Time;
    "Sphere of Annihilation": Time;
}

export interface TrapsInPlay {
    content:                          string;
    "Triggering a Trap":              string;
    "Detecting and Disabling a Trap": Time;
    "Trap Effects":                   TrapEffects;
    "Complex Traps":                  Time;
}

export interface TrapEffects {
    content:                            string[];
    "Trap Save DCs and Attack Bonuses": TrapSaveDCSAndAttackBonuses;
    "Damage Severity by Level":         DamageSeverityByLevel;
}

export interface DamageSeverityByLevel {
    table: DamageSeverityByLevelTable;
}

export interface DamageSeverityByLevelTable {
    "Character Level": string[];
    Setback:           string[];
    Dangerous:         string[];
    Deadly:            string[];
}

export interface TrapSaveDCSAndAttackBonuses {
    table: TrapSaveDCSAndAttackBonusesTable;
}

export interface TrapSaveDCSAndAttackBonusesTable {
    "Trap Danger":  string[];
    "Save DC":      string[];
    "Attack Bonus": string[];
}

export interface UsingAbilityScores {
    content:                        Array<string[] | string>;
    "Ability Scores and Modifiers": AbilityScoresAndModifiers;
    "Advantage and Disadvantage":   Time;
    "Proficiency Bonus":            Time;
    "Ability Checks":               AbilityChecks;
    "Using Each Ability":           UsingEachAbility;
    "Saving Throws":                Time;
}

export interface AbilityChecks {
    content:                      string[];
    "Typical Difficulty Classes": TypicalDifficultyClasses;
    Contests:                     Time;
    Skills:                       Skills;
    "Passive Checks":             Time;
    "Working Together":           WorkingTogether;
}

export interface Skills {
    content:                                    string[];
    Strength:                                   string[];
    Dexterity:                                  string[];
    Intelligence:                               string[];
    Wisdom:                                     string[];
    Charisma:                                   LegalInformation;
    "Variant: Skills with Different Abilities": string;
}

export interface TypicalDifficultyClasses {
    content: Array<Content33 | string>;
}

export interface Content33 {
    table: Table35;
}

export interface Table35 {
    "Task Difficulty": string[];
    DC:                string[];
}

export interface WorkingTogether {
    content:        string[];
    "Group Checks": Time;
}

export interface AbilityScoresAndModifiers {
    content: Array<Content34 | string>;
}

export interface Content34 {
    table: Table36;
}

export interface Table36 {
    Score:    string[];
    Modifier: string[];
}

export interface UsingEachAbility {
    content:      string;
    Strength:     StrengthClass;
    Dexterity:    Dexterity;
    Constitution: Constitution;
    Intelligence: Intelligence;
    Wisdom:       Wisdom;
    Charisma:     Charisma;
}

export interface Charisma {
    content:                string;
    "Charisma Checks":      LegalInformation;
    "Spellcasting Ability": string;
}

export interface Constitution {
    content:               string;
    "Constitution Checks": LegalInformation;
    "Hit Points":          Time;
}

export interface Dexterity {
    content:                   string;
    "Dexterity Checks":        LegalInformation;
    "Attack Rolls and Damage": string;
    "Armor Class":             string;
    Initiative:                string;
    Hiding:                    Time;
}

export interface Intelligence {
    content:                string;
    "Intelligence Checks":  LegalInformation;
    "Spellcasting Ability": string;
}

export interface StrengthClass {
    content:                   string;
    "Strength Checks":         LegalInformation;
    "Attack Rolls and Damage": string;
    "Lifting and Carrying":    LiftingAndCarrying;
}

export interface LiftingAndCarrying {
    content:                string[];
    "Variant: Encumbrance": Time;
}

export interface Wisdom {
    content:                string;
    "Wisdom Checks":        LegalInformation;
    "Spellcasting Ability": string;
}

export interface Warlock {
    "Class Features":       WarlockClassFeatures;
    "Eldritch Invocations": EldritchInvocations;
    "Otherworldly Patrons": OtherworldlyPatrons;
}

export interface WarlockClassFeatures {
    content:                     string;
    "Hit Points":                Time;
    Proficiencies:               Time;
    Equipment:                   LegalInformation;
    "The Warlock":               TheWarlock;
    "Otherworldly Patron":       string;
    "Pact Magic":                Spellcasting;
    "Eldritch Invocations":      Time;
    "Pact Boon":                 PactBoon;
    "Ability Score Improvement": string;
    "Mystic Arcanum":            Time;
    "Eldritch Master":           string;
}

export interface PactBoon {
    content:             string;
    "Pact of the Chain": Time;
    "Pact of the Blade": Time;
    "Pact of the Tome":  Time;
}

export interface TheWarlock {
    table: TheWarlockTable;
}

export interface TheWarlockTable {
    Level:               string[];
    "Proficiency Bonus": string[];
    Features:            string[];
    "Cantrips Known":    string[];
    "Spells Known":      string[];
    "Spell Slots":       string[];
    "Slot Level":        string[];
    "Invocations Known": string[];
}

export interface EldritchInvocations {
    content:                     string;
    "Agonizing Blast":           Time;
    "Armor of Shadows":          string;
    "Ascendant Step":            Time;
    "Beast Speech":              string;
    "Beguiling Influence":       string;
    "Bewitching Whispers":       Time;
    "Book of Ancient Secrets":   Time;
    "Chains of Carceri":         Time;
    "Devil’s Sight":             string;
    "Dreadful Word":             Time;
    "Eldritch Sight":            string;
    "Eldritch Spear":            Time;
    "Eyes of the Rune Keeper":   string;
    "Fiendish Vigor":            string;
    "Gaze of Two Minds":         string;
    Lifedrinker:                 Time;
    "Mask of Many Faces":        string;
    "Master of Myriad Forms":    Time;
    "Minions of Chaos":          Time;
    "Mire the Mind":             Time;
    "Misty Visions":             string;
    "One with Shadows":          Time;
    "Otherworldly Leap":         Time;
    "Repelling Blast":           Time;
    "Sculptor of Flesh":         Time;
    "Sign of Ill Omen":          Time;
    "Thief of Five Fates":       string;
    "Thirsting Blade":           Time;
    "Visions of Distant Realms": Time;
    "Voice of the Chain Master": Time;
    "Whispers of the Grave":     Time;
    "Witch Sight":               Time;
}

export interface OtherworldlyPatrons {
    content:          string[];
    "The Fiend":      TheFiend;
    "Your Pact Boon": Time;
}

export interface TheFiend {
    content:               string;
    "Expanded Spell List": ExpandedSpellList;
    "Dark One’s Blessing": string;
    "Dark One’s Own Luck": Time;
    "Fiendish Resilience": string;
    "Hurl Through Hell":   Time;
}

export interface ExpandedSpellList {
    content:                 string;
    "Fiend Expanded Spells": FiendExpandedSpells;
}

export interface FiendExpandedSpells {
    table: FiendExpandedSpellsTable;
}

export interface FiendExpandedSpellsTable {
    "Spell Level": string[];
    Spells:        string[];
}

export interface Wizard {
    "Class Features":    WizardClassFeatures;
    "Arcane Traditions": ArcaneTraditions;
}

export interface ArcaneTraditions {
    content:               string[];
    "School of Evocation": SchoolOfEvocation;
    "Your Spellbook":      Time;
}

export interface SchoolOfEvocation {
    content:               string;
    "Evocation Savant":    string;
    "Sculpt Spells":       string;
    "Potent Cantrip":      string;
    "Empowered Evocation": string;
    Overchannel:           Time;
}

export interface WizardClassFeatures {
    content:                     string;
    "Hit Points":                Time;
    Proficiencies:               Time;
    Equipment:                   LegalInformation;
    "The Wizard":                TheBard;
    Spellcasting:                FluffySpellcasting;
    "Arcane Recovery":           Time;
    "Arcane Tradition":          Time;
    "Ability Score Improvement": string;
    "Spell Mastery":             Time;
    "Signature Spells":          Time;
}
