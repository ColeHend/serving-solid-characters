// <auto-generated />
//
// To parse this JSON data, add NuGet 'Newtonsoft.Json' then do:
//
//    using DndClassJson;
//
//    var the5EClasses = The5EClasses.FromJson(jsonString);

namespace DndClassJson
{
    using System;
    using System.Collections.Generic;

    using System.Globalization;
    using Newtonsoft.Json;
    using Newtonsoft.Json.Converters;

    public partial class The5EClasses
    {
        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("hit_die")]
        public long HitDie { get; set; }

        [JsonProperty("proficiency_choices")]
        public List<string> ProficiencyChoices { get; set; }

        [JsonProperty("saving_throws")]
        public List<string> SavingThrows { get; set; }

        [JsonProperty("skills")]
        public Skills Skills { get; set; }

        [JsonProperty("starting_equipment")]
        public List<string> StartingEquipment { get; set; }

        [JsonProperty("class_levels")]
        public List<ClassLevel> ClassLevels { get; set; }

        [JsonProperty("invocations", NullValueHandling = NullValueHandling.Ignore)]
        public List<Invocation> Invocations { get; set; }
    }

    public partial class ClassLevel
    {
        [JsonProperty("level")]
        public long Level { get; set; }

        [JsonProperty("proficiency_bonus")]
        public long ProficiencyBonus { get; set; }

        [JsonProperty("features")]
        public string Features { get; set; }

        [JsonProperty("other", NullValueHandling = NullValueHandling.Ignore)]
        public Other Other { get; set; }

        [JsonProperty("spellcasting", NullValueHandling = NullValueHandling.Ignore)]
        public SpellcastingClass Spellcasting { get; set; }
    }

    public partial class Other
    {
        [JsonProperty("Rage", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge Rage { get; set; }

        [JsonProperty("Unarmored Defense", NullValueHandling = NullValueHandling.Ignore)]
        public string UnarmoredDefense { get; set; }

        [JsonProperty("Reckless Attack", NullValueHandling = NullValueHandling.Ignore)]
        public string RecklessAttack { get; set; }

        [JsonProperty("Danger Sense", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge DangerSense { get; set; }

        [JsonProperty("Primal Path", NullValueHandling = NullValueHandling.Ignore)]
        public string PrimalPath { get; set; }

        [JsonProperty("Ability Score Improvement", NullValueHandling = NullValueHandling.Ignore)]
        public string AbilityScoreImprovement { get; set; }

        [JsonProperty("Extra Attack", NullValueHandling = NullValueHandling.Ignore)]
        public ExtraAttack? ExtraAttack { get; set; }

        [JsonProperty("Fast Movement", NullValueHandling = NullValueHandling.Ignore)]
        public string FastMovement { get; set; }

        [JsonProperty("Path Feature", NullValueHandling = NullValueHandling.Ignore)]
        public ArcaneTraditionFeature? PathFeature { get; set; }

        [JsonProperty("Feral Instinct", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge FeralInstinct { get; set; }

        [JsonProperty("Brutal Critical", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge BrutalCritical { get; set; }

        [JsonProperty("Relentless", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge Relentless { get; set; }

        [JsonProperty("Persistent Rage", NullValueHandling = NullValueHandling.Ignore)]
        public string PersistentRage { get; set; }

        [JsonProperty("Indomitable Might", NullValueHandling = NullValueHandling.Ignore)]
        public string IndomitableMight { get; set; }

        [JsonProperty("Primal Champion", NullValueHandling = NullValueHandling.Ignore)]
        public string PrimalChampion { get; set; }

        [JsonProperty("Spellcasting", NullValueHandling = NullValueHandling.Ignore)]
        public Spellcasting Spellcasting { get; set; }

        [JsonProperty("Jack of All Trades", NullValueHandling = NullValueHandling.Ignore)]
        public string JackOfAllTrades { get; set; }

        [JsonProperty("Expertise", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge Expertise { get; set; }

        [JsonProperty("Font of Inspiration", NullValueHandling = NullValueHandling.Ignore)]
        public string FontOfInspiration { get; set; }

        [JsonProperty("Bard College", NullValueHandling = NullValueHandling.Ignore)]
        public List<string> BardCollege { get; set; }

        [JsonProperty("Countercharm", NullValueHandling = NullValueHandling.Ignore)]
        public string Countercharm { get; set; }

        [JsonProperty("Magical Secrets", NullValueHandling = NullValueHandling.Ignore)]
        public List<string> MagicalSecrets { get; set; }

        [JsonProperty("Superior Inspiration", NullValueHandling = NullValueHandling.Ignore)]
        public string SuperiorInspiration { get; set; }

        [JsonProperty("Divine Domain", NullValueHandling = NullValueHandling.Ignore)]
        public DivineDomain DivineDomain { get; set; }

        [JsonProperty("Destroy Undead", NullValueHandling = NullValueHandling.Ignore)]
        public OtherDestroyUndead DestroyUndead { get; set; }

        [JsonProperty("Divine Intervention", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge DivineIntervention { get; set; }

        [JsonProperty("Channal Divinity", NullValueHandling = NullValueHandling.Ignore)]
        public ChannalDivinity ChannalDivinity { get; set; }

        [JsonProperty("Wild Shape", NullValueHandling = NullValueHandling.Ignore)]
        public WildShape WildShape { get; set; }

        [JsonProperty("Druid Circle", NullValueHandling = NullValueHandling.Ignore)]
        public string DruidCircle { get; set; }

        [JsonProperty("Timeless Body", NullValueHandling = NullValueHandling.Ignore)]
        public string TimelessBody { get; set; }

        [JsonProperty("Beast Spells", NullValueHandling = NullValueHandling.Ignore)]
        public string BeastSpells { get; set; }

        [JsonProperty("Archdruid", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge Archdruid { get; set; }

        [JsonProperty("Fighting Style", NullValueHandling = NullValueHandling.Ignore)]
        public FightingStyle FightingStyle { get; set; }

        [JsonProperty("Second Wind", NullValueHandling = NullValueHandling.Ignore)]
        public string SecondWind { get; set; }

        [JsonProperty("Action Surge", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge ActionSurge { get; set; }

        [JsonProperty("Martial Archetype Feature", NullValueHandling = NullValueHandling.Ignore)]
        public string MartialArchetypeFeature { get; set; }

        [JsonProperty("Indomitable", NullValueHandling = NullValueHandling.Ignore)]
        public List<string> Indomitable { get; set; }

        [JsonProperty("Martial Arts", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge MartialArts { get; set; }

        [JsonProperty("Ki", NullValueHandling = NullValueHandling.Ignore)]
        public Ki Ki { get; set; }

        [JsonProperty("Unarmored Movement", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge UnarmoredMovement { get; set; }

        [JsonProperty("Monastic Tradition", NullValueHandling = NullValueHandling.Ignore)]
        public string MonasticTradition { get; set; }

        [JsonProperty("Deflect Missiles", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge DeflectMissiles { get; set; }

        [JsonProperty("Slow Fall", NullValueHandling = NullValueHandling.Ignore)]
        public string SlowFall { get; set; }

        [JsonProperty("Stunning Strike", NullValueHandling = NullValueHandling.Ignore)]
        public string StunningStrike { get; set; }

        [JsonProperty("Ki-Empowered Strikes", NullValueHandling = NullValueHandling.Ignore)]
        public string KiEmpoweredStrikes { get; set; }

        [JsonProperty("Monastic Tradition Feature", NullValueHandling = NullValueHandling.Ignore)]
        public ArcaneTraditionFeature? MonasticTraditionFeature { get; set; }

        [JsonProperty("Evasion", NullValueHandling = NullValueHandling.Ignore)]
        public string Evasion { get; set; }

        [JsonProperty("Stillness of Mind", NullValueHandling = NullValueHandling.Ignore)]
        public string StillnessOfMind { get; set; }

        [JsonProperty("Unarmored Movement Improvement", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge UnarmoredMovementImprovement { get; set; }

        [JsonProperty("Purity of Body", NullValueHandling = NullValueHandling.Ignore)]
        public string PurityOfBody { get; set; }

        [JsonProperty("Tongue of the Sun and Moon", NullValueHandling = NullValueHandling.Ignore)]
        public string TongueOfTheSunAndMoon { get; set; }

        [JsonProperty("Diamond Soul", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge DiamondSoul { get; set; }

        [JsonProperty("Empty Body", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge EmptyBody { get; set; }

        [JsonProperty("Divine Sense", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge DivineSense { get; set; }

        [JsonProperty("Lay on Hands", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge LayOnHands { get; set; }

        [JsonProperty("Divine Smite", NullValueHandling = NullValueHandling.Ignore)]
        public string DivineSmite { get; set; }

        [JsonProperty("Divine Health", NullValueHandling = NullValueHandling.Ignore)]
        public string DivineHealth { get; set; }

        [JsonProperty("Sacred Oath", NullValueHandling = NullValueHandling.Ignore)]
        public SacredOath SacredOath { get; set; }

        [JsonProperty("Aura of Protection", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge AuraOfProtection { get; set; }

        [JsonProperty("Sacred Oath Feature", NullValueHandling = NullValueHandling.Ignore)]
        public ArcaneTraditionFeature? SacredOathFeature { get; set; }

        [JsonProperty("Aura of Courage", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge AuraOfCourage { get; set; }

        [JsonProperty("Improved Divine Smite", NullValueHandling = NullValueHandling.Ignore)]
        public string ImprovedDivineSmite { get; set; }

        [JsonProperty("Cleansing Touch", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge CleansingTouch { get; set; }

        [JsonProperty("Aura Improvements", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge AuraImprovements { get; set; }

        [JsonProperty("Aura of Devotion", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge AuraOfDevotion { get; set; }

        [JsonProperty("Favored Enemy", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge FavoredEnemy { get; set; }

        [JsonProperty("Natural Explorer", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge NaturalExplorer { get; set; }

        [JsonProperty("Ranger Archetype", NullValueHandling = NullValueHandling.Ignore)]
        public string RangerArchetype { get; set; }

        [JsonProperty("Favored Enemy and Natural Explorer Improvements", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge FavoredEnemyAndNaturalExplorerImprovements { get; set; }

        [JsonProperty("Land's Stride", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge LandSStride { get; set; }

        [JsonProperty("Natural Explorer Improvement", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge NaturalExplorerImprovement { get; set; }

        [JsonProperty("Hide in Plain Sight", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge HideInPlainSight { get; set; }

        [JsonProperty("Ranger Archetype Feature", NullValueHandling = NullValueHandling.Ignore)]
        public ArcaneTraditionFeature? RangerArchetypeFeature { get; set; }

        [JsonProperty("Favored Enemy Improvement", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge FavoredEnemyImprovement { get; set; }

        [JsonProperty("Vanish", NullValueHandling = NullValueHandling.Ignore)]
        public string Vanish { get; set; }

        [JsonProperty("Feral Senses", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge FeralSenses { get; set; }

        [JsonProperty("Foe Slayer", NullValueHandling = NullValueHandling.Ignore)]
        public string FoeSlayer { get; set; }

        [JsonProperty("Thieves' Cant", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge ThievesCant { get; set; }

        [JsonProperty("Cunning Action", NullValueHandling = NullValueHandling.Ignore)]
        public string CunningAction { get; set; }

        [JsonProperty("Roguish Archetype", NullValueHandling = NullValueHandling.Ignore)]
        public string RoguishArchetype { get; set; }

        [JsonProperty("Sneak Attack", NullValueHandling = NullValueHandling.Ignore)]
        public string SneakAttack { get; set; }

        [JsonProperty("Uncanny Dodge", NullValueHandling = NullValueHandling.Ignore)]
        public string UncannyDodge { get; set; }

        [JsonProperty("Reliable Talent", NullValueHandling = NullValueHandling.Ignore)]
        public string ReliableTalent { get; set; }

        [JsonProperty("Blindsense", NullValueHandling = NullValueHandling.Ignore)]
        public string Blindsense { get; set; }

        [JsonProperty("Slippery Mind", NullValueHandling = NullValueHandling.Ignore)]
        public string SlipperyMind { get; set; }

        [JsonProperty("Roguish Archetype Feature", NullValueHandling = NullValueHandling.Ignore)]
        public ArcaneTraditionFeature? RoguishArchetypeFeature { get; set; }

        [JsonProperty("Elusive", NullValueHandling = NullValueHandling.Ignore)]
        public string Elusive { get; set; }

        [JsonProperty("Stroke of Luck", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge StrokeOfLuck { get; set; }

        [JsonProperty("Sorcerous Origin", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge SorcerousOrigin { get; set; }

        [JsonProperty("Font of Magic", NullValueHandling = NullValueHandling.Ignore)]
        public FontOfMagic FontOfMagic { get; set; }

        [JsonProperty("Metamagic", NullValueHandling = NullValueHandling.Ignore)]
        public Metamagic Metamagic { get; set; }

        [JsonProperty("Sorcerous Origin Feature", NullValueHandling = NullValueHandling.Ignore)]
        public ArcaneTraditionFeature? SorcerousOriginFeature { get; set; }

        [JsonProperty("Sorcerous Restoration", NullValueHandling = NullValueHandling.Ignore)]
        public string SorcerousRestoration { get; set; }

        [JsonProperty("Otherworldly Patron", NullValueHandling = NullValueHandling.Ignore)]
        public string OtherworldlyPatron { get; set; }

        [JsonProperty("Pact Magic", NullValueHandling = NullValueHandling.Ignore)]
        public PactMagic PactMagic { get; set; }

        [JsonProperty("Eldritch Invocations", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge EldritchInvocations { get; set; }

        [JsonProperty("Pact Boon", NullValueHandling = NullValueHandling.Ignore)]
        public PactBoon PactBoon { get; set; }

        [JsonProperty("Mystic Arcanum", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge MysticArcanum { get; set; }

        [JsonProperty("Eldritch Master", NullValueHandling = NullValueHandling.Ignore)]
        public string EldritchMaster { get; set; }

        [JsonProperty("Arcane Recovery", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge ArcaneRecovery { get; set; }

        [JsonProperty("Arcane Tradition", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge ArcaneTradition { get; set; }

        [JsonProperty("Arcane Tradition Feature", NullValueHandling = NullValueHandling.Ignore)]
        public ArcaneTraditionFeature? ArcaneTraditionFeature { get; set; }

        [JsonProperty("Spell Mastery", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge SpellMastery { get; set; }

        [JsonProperty("Signature Spells", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge SignatureSpells { get; set; }
    }

    public partial class ActionSurge
    {
        [JsonProperty("content")]
        public List<string> Content { get; set; }
    }

    public partial class ChannalDivinity
    {
        [JsonProperty("content")]
        public List<string> Content { get; set; }

        [JsonProperty("Channel Divinity: Turn Undead")]
        public ActionSurge ChannelDivinityTurnUndead { get; set; }
    }

    public partial class OtherDestroyUndead
    {
        [JsonProperty("content")]
        public string Content { get; set; }

        [JsonProperty("Destroy Undead")]
        public DestroyUndeadDestroyUndead DestroyUndead { get; set; }
    }

    public partial class DestroyUndeadDestroyUndead
    {
        [JsonProperty("table")]
        public DestroyUndeadTable Table { get; set; }
    }

    public partial class DestroyUndeadTable
    {
        [JsonProperty("Cleric Level")]
        public List<string> ClericLevel { get; set; }

        [JsonProperty("Destroys Undead of CR...")]
        public List<string> DestroysUndeadOfCr { get; set; }
    }

    public partial class DivineDomain
    {
        [JsonProperty("content")]
        public string Content { get; set; }

        [JsonProperty("Domain Spells")]
        public ActionSurge DomainSpells { get; set; }
    }

    public partial class FightingStyle
    {
        [JsonProperty("content")]
        public string Content { get; set; }

        [JsonProperty("Archery", NullValueHandling = NullValueHandling.Ignore)]
        public string Archery { get; set; }

        [JsonProperty("Defense")]
        public string Defense { get; set; }

        [JsonProperty("Dueling")]
        public string Dueling { get; set; }

        [JsonProperty("Great Weapon Fighting", NullValueHandling = NullValueHandling.Ignore)]
        public string GreatWeaponFighting { get; set; }

        [JsonProperty("Protection", NullValueHandling = NullValueHandling.Ignore)]
        public string Protection { get; set; }

        [JsonProperty("Two-Weapon Fighting", NullValueHandling = NullValueHandling.Ignore)]
        public string TwoWeaponFighting { get; set; }
    }

    public partial class FontOfMagic
    {
        [JsonProperty("content")]
        public string Content { get; set; }

        [JsonProperty("Sorcery Points")]
        public string SorceryPoints { get; set; }

        [JsonProperty("Flexible Casting")]
        public FlexibleCasting FlexibleCasting { get; set; }
    }

    public partial class FlexibleCasting
    {
        [JsonProperty("content")]
        public List<string> Content { get; set; }

        [JsonProperty("Creating Spell Slots")]
        public CreatingSpellSlots CreatingSpellSlots { get; set; }
    }

    public partial class CreatingSpellSlots
    {
        [JsonProperty("content")]
        public List<CreatingSpellSlotsContent> Content { get; set; }
    }

    public partial class CreatingSpellSlotsContent
    {
        [JsonProperty("table", NullValueHandling = NullValueHandling.Ignore)]
        public PurpleTable Table { get; set; }

        [JsonProperty("content", NullValueHandling = NullValueHandling.Ignore)]
        public string Content { get; set; }
    }

    public partial class PurpleTable
    {
        [JsonProperty("Spell Slot Level")]
        public List<string> SpellSlotLevel { get; set; }

        [JsonProperty("Sorcery Point Cost")]
        [JsonConverter(typeof(DecodeArrayConverter))]
        public List<long> SorceryPointCost { get; set; }
    }

    public partial class Ki
    {
        [JsonProperty("content")]
        public List<string> Content { get; set; }

        [JsonProperty("Flurry of Blows")]
        public string FlurryOfBlows { get; set; }

        [JsonProperty("Patient Defense")]
        public string PatientDefense { get; set; }

        [JsonProperty("Step of the Wind")]
        public string StepOfTheWind { get; set; }
    }

    public partial class Metamagic
    {
        [JsonProperty("content")]
        public List<string> Content { get; set; }

        [JsonProperty("Careful Spell")]
        public string CarefulSpell { get; set; }

        [JsonProperty("Distant Spell")]
        public ActionSurge DistantSpell { get; set; }

        [JsonProperty("Empowered Spell")]
        public ActionSurge EmpoweredSpell { get; set; }

        [JsonProperty("Extended Spell")]
        public string ExtendedSpell { get; set; }

        [JsonProperty("Heightened Spell")]
        public string HeightenedSpell { get; set; }

        [JsonProperty("Quickened Spell")]
        public string QuickenedSpell { get; set; }

        [JsonProperty("Subtle Spell")]
        public string SubtleSpell { get; set; }

        [JsonProperty("Twinned Spell")]
        public ActionSurge TwinnedSpell { get; set; }
    }

    public partial class PactBoon
    {
        [JsonProperty("content")]
        public string Content { get; set; }

        [JsonProperty("Pact of the Chain")]
        public ActionSurge PactOfTheChain { get; set; }

        [JsonProperty("Pact of the Blade")]
        public ActionSurge PactOfTheBlade { get; set; }

        [JsonProperty("Pact of the Tome")]
        public ActionSurge PactOfTheTome { get; set; }
    }

    public partial class PactMagic
    {
        [JsonProperty("content")]
        public string Content { get; set; }

        [JsonProperty("Cantrips")]
        public string Cantrips { get; set; }

        [JsonProperty("Spell Slots")]
        public ActionSurge SpellSlots { get; set; }

        [JsonProperty("Spells Known of 1st Level and Higher")]
        public ActionSurge SpellsKnownOf1StLevelAndHigher { get; set; }

        [JsonProperty("Spellcasting Ability")]
        public ActionSurge SpellcastingAbility { get; set; }

        [JsonProperty("Spellcasting Focus")]
        public string SpellcastingFocus { get; set; }
    }

    public partial class SacredOath
    {
        [JsonProperty("content")]
        public List<string> Content { get; set; }

        [JsonProperty("Oath Spells")]
        public ActionSurge OathSpells { get; set; }

        [JsonProperty("Channel Divinity")]
        public ActionSurge ChannelDivinity { get; set; }
    }

    public partial class Spellcasting
    {
        [JsonProperty("content")]
        public Desc Content { get; set; }

        [JsonProperty("Cantrips", NullValueHandling = NullValueHandling.Ignore)]
        public string Cantrips { get; set; }

        [JsonProperty("Spell Slots", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge SpellSlots { get; set; }

        [JsonProperty("Spells Known of 1st Level and Higher", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge SpellsKnownOf1StLevelAndHigher { get; set; }

        [JsonProperty("Spellcasting Ability")]
        public ActionSurge SpellcastingAbility { get; set; }

        [JsonProperty("Ritual Casting", NullValueHandling = NullValueHandling.Ignore)]
        public string RitualCasting { get; set; }

        [JsonProperty("Spellcasting Focus", NullValueHandling = NullValueHandling.Ignore)]
        public string SpellcastingFocus { get; set; }

        [JsonProperty("Preparing and Casting Spells", NullValueHandling = NullValueHandling.Ignore)]
        public ActionSurge PreparingAndCastingSpells { get; set; }

        [JsonProperty("Spellbook", NullValueHandling = NullValueHandling.Ignore)]
        public string Spellbook { get; set; }

        [JsonProperty("Learning Spells of 1st Level and Higher", NullValueHandling = NullValueHandling.Ignore)]
        public string LearningSpellsOf1StLevelAndHigher { get; set; }
    }

    public partial class WildShape
    {
        [JsonProperty("content")]
        public List<string> Content { get; set; }

        [JsonProperty("Beast Shapes")]
        public BeastShapes BeastShapes { get; set; }
    }

    public partial class BeastShapes
    {
        [JsonProperty("content")]
        public List<ContentUnion> Content { get; set; }
    }

    public partial class ContentContent
    {
        [JsonProperty("table")]
        public FluffyTable Table { get; set; }
    }

    public partial class FluffyTable
    {
        [JsonProperty("Max.")]
        public List<string> Max { get; set; }

        [JsonProperty("Level")]
        public List<string> Level { get; set; }

        [JsonProperty("CR Limitations")]
        public List<string> CrLimitations { get; set; }

        [JsonProperty("Example")]
        public List<string> Example { get; set; }
    }

    public partial class SpellcastingClass
    {
        [JsonProperty("spellsKnown")]
        public long? SpellsKnown { get; set; }

        [JsonProperty("spellSlots")]
        public List<InvocationsKnown> SpellSlots { get; set; }

        [JsonProperty("cantripsKnown")]
        public long CantripsKnown { get; set; }

        [JsonProperty("slotLevel", NullValueHandling = NullValueHandling.Ignore)]
        public string SlotLevel { get; set; }

        [JsonProperty("invocationsKnown", NullValueHandling = NullValueHandling.Ignore)]
        public InvocationsKnown? InvocationsKnown { get; set; }
    }

    public partial class Invocation
    {
        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("desc")]
        public Desc Desc { get; set; }

        [JsonProperty("level")]
        public long Level { get; set; }
    }

    public partial class Skills
    {
        [JsonProperty("amount")]
        public long Amount { get; set; }

        [JsonProperty("skills")]
        public List<string> SkillsSkills { get; set; }
    }

    public enum ArcaneTraditionFeature { Empty };

    public partial struct ExtraAttack
    {
        public ActionSurge ActionSurge;
        public string String;

        public static implicit operator ExtraAttack(ActionSurge ActionSurge) => new ExtraAttack { ActionSurge = ActionSurge };
        public static implicit operator ExtraAttack(string String) => new ExtraAttack { String = String };
    }

    public partial struct Desc
    {
        public string String;
        public List<string> StringArray;

        public static implicit operator Desc(string String) => new Desc { String = String };
        public static implicit operator Desc(List<string> StringArray) => new Desc { StringArray = StringArray };
    }

    public partial struct ContentUnion
    {
        public ContentContent ContentContent;
        public string String;

        public static implicit operator ContentUnion(ContentContent ContentContent) => new ContentUnion { ContentContent = ContentContent };
        public static implicit operator ContentUnion(string String) => new ContentUnion { String = String };
    }

    public partial struct InvocationsKnown
    {
        public ArcaneTraditionFeature? Enum;
        public long? Integer;

        public static implicit operator InvocationsKnown(ArcaneTraditionFeature Enum) => new InvocationsKnown { Enum = Enum };
        public static implicit operator InvocationsKnown(long Integer) => new InvocationsKnown { Integer = Integer };
    }

    public partial class The5EClasses
    {
        public static List<The5EClasses> FromJson(string json) => JsonConvert.DeserializeObject<List<The5EClasses>>(json, DndClassJson.Converter.Settings);
    }

    public static class Serialize
    {
        public static string ToJson(this List<The5EClasses> self) => JsonConvert.SerializeObject(self, DndClassJson.Converter.Settings);
    }

    internal static class Converter
    {
        public static readonly JsonSerializerSettings Settings = new JsonSerializerSettings
        {
            MetadataPropertyHandling = MetadataPropertyHandling.Ignore,
            DateParseHandling = DateParseHandling.None,
            Converters =
            {
                ArcaneTraditionFeatureConverter.Singleton,
                ExtraAttackConverter.Singleton,
                DescConverter.Singleton,
                ContentUnionConverter.Singleton,
                InvocationsKnownConverter.Singleton,
                new IsoDateTimeConverter { DateTimeStyles = DateTimeStyles.AssumeUniversal }
            },
        };
    }

    internal class ArcaneTraditionFeatureConverter : JsonConverter
    {
        public override bool CanConvert(Type t) => t == typeof(ArcaneTraditionFeature) || t == typeof(ArcaneTraditionFeature?);

        public override object ReadJson(JsonReader reader, Type t, object existingValue, JsonSerializer serializer)
        {
            if (reader.TokenType == JsonToken.Null) return null;
            var value = serializer.Deserialize<string>(reader);
            if (value == "-")
            {
                return ArcaneTraditionFeature.Empty;
            }
            throw new Exception("Cannot unmarshal type ArcaneTraditionFeature");
        }

        public override void WriteJson(JsonWriter writer, object untypedValue, JsonSerializer serializer)
        {
            if (untypedValue == null)
            {
                serializer.Serialize(writer, null);
                return;
            }
            var value = (ArcaneTraditionFeature)untypedValue;
            if (value == ArcaneTraditionFeature.Empty)
            {
                serializer.Serialize(writer, "-");
                return;
            }
            throw new Exception("Cannot marshal type ArcaneTraditionFeature");
        }

        public static readonly ArcaneTraditionFeatureConverter Singleton = new ArcaneTraditionFeatureConverter();
    }

    internal class ExtraAttackConverter : JsonConverter
    {
        public override bool CanConvert(Type t) => t == typeof(ExtraAttack) || t == typeof(ExtraAttack?);

        public override object ReadJson(JsonReader reader, Type t, object existingValue, JsonSerializer serializer)
        {
            switch (reader.TokenType)
            {
                case JsonToken.String:
                case JsonToken.Date:
                    var stringValue = serializer.Deserialize<string>(reader);
                    return new ExtraAttack { String = stringValue };
                case JsonToken.StartObject:
                    var objectValue = serializer.Deserialize<ActionSurge>(reader);
                    return new ExtraAttack { ActionSurge = objectValue };
            }
            throw new Exception("Cannot unmarshal type ExtraAttack");
        }

        public override void WriteJson(JsonWriter writer, object untypedValue, JsonSerializer serializer)
        {
            var value = (ExtraAttack)untypedValue;
            if (value.String != null)
            {
                serializer.Serialize(writer, value.String);
                return;
            }
            if (value.ActionSurge != null)
            {
                serializer.Serialize(writer, value.ActionSurge);
                return;
            }
            throw new Exception("Cannot marshal type ExtraAttack");
        }

        public static readonly ExtraAttackConverter Singleton = new ExtraAttackConverter();
    }

    internal class DecodeArrayConverter : JsonConverter
    {
        public override bool CanConvert(Type t) => t == typeof(List<long>);

        public override object ReadJson(JsonReader reader, Type t, object existingValue, JsonSerializer serializer)
        {
            reader.Read();
            var value = new List<long>();
            while (reader.TokenType != JsonToken.EndArray)
            {
                var converter = ParseStringConverter.Singleton;
                var arrayItem = (long)converter.ReadJson(reader, typeof(long), null, serializer);
                value.Add(arrayItem);
                reader.Read();
            }
            return value;
        }

        public override void WriteJson(JsonWriter writer, object untypedValue, JsonSerializer serializer)
        {
            var value = (List<long>)untypedValue;
            writer.WriteStartArray();
            foreach (var arrayItem in value)
            {
                var converter = ParseStringConverter.Singleton;
                converter.WriteJson(writer, arrayItem, serializer);
            }
            writer.WriteEndArray();
            return;
        }

        public static readonly DecodeArrayConverter Singleton = new DecodeArrayConverter();
    }

    internal class ParseStringConverter : JsonConverter
    {
        public override bool CanConvert(Type t) => t == typeof(long) || t == typeof(long?);

        public override object ReadJson(JsonReader reader, Type t, object existingValue, JsonSerializer serializer)
        {
            if (reader.TokenType == JsonToken.Null) return null;
            var value = serializer.Deserialize<string>(reader);
            long l;
            if (Int64.TryParse(value, out l))
            {
                return l;
            }
            throw new Exception("Cannot unmarshal type long");
        }

        public override void WriteJson(JsonWriter writer, object untypedValue, JsonSerializer serializer)
        {
            if (untypedValue == null)
            {
                serializer.Serialize(writer, null);
                return;
            }
            var value = (long)untypedValue;
            serializer.Serialize(writer, value.ToString());
            return;
        }

        public static readonly ParseStringConverter Singleton = new ParseStringConverter();
    }

    internal class DescConverter : JsonConverter
    {
        public override bool CanConvert(Type t) => t == typeof(Desc) || t == typeof(Desc?);

        public override object ReadJson(JsonReader reader, Type t, object existingValue, JsonSerializer serializer)
        {
            switch (reader.TokenType)
            {
                case JsonToken.String:
                case JsonToken.Date:
                    var stringValue = serializer.Deserialize<string>(reader);
                    return new Desc { String = stringValue };
                case JsonToken.StartArray:
                    var arrayValue = serializer.Deserialize<List<string>>(reader);
                    return new Desc { StringArray = arrayValue };
            }
            throw new Exception("Cannot unmarshal type Desc");
        }

        public override void WriteJson(JsonWriter writer, object untypedValue, JsonSerializer serializer)
        {
            var value = (Desc)untypedValue;
            if (value.String != null)
            {
                serializer.Serialize(writer, value.String);
                return;
            }
            if (value.StringArray != null)
            {
                serializer.Serialize(writer, value.StringArray);
                return;
            }
            throw new Exception("Cannot marshal type Desc");
        }

        public static readonly DescConverter Singleton = new DescConverter();
    }

    internal class ContentUnionConverter : JsonConverter
    {
        public override bool CanConvert(Type t) => t == typeof(ContentUnion) || t == typeof(ContentUnion?);

        public override object ReadJson(JsonReader reader, Type t, object existingValue, JsonSerializer serializer)
        {
            switch (reader.TokenType)
            {
                case JsonToken.String:
                case JsonToken.Date:
                    var stringValue = serializer.Deserialize<string>(reader);
                    return new ContentUnion { String = stringValue };
                case JsonToken.StartObject:
                    var objectValue = serializer.Deserialize<ContentContent>(reader);
                    return new ContentUnion { ContentContent = objectValue };
            }
            throw new Exception("Cannot unmarshal type ContentUnion");
        }

        public override void WriteJson(JsonWriter writer, object untypedValue, JsonSerializer serializer)
        {
            var value = (ContentUnion)untypedValue;
            if (value.String != null)
            {
                serializer.Serialize(writer, value.String);
                return;
            }
            if (value.ContentContent != null)
            {
                serializer.Serialize(writer, value.ContentContent);
                return;
            }
            throw new Exception("Cannot marshal type ContentUnion");
        }

        public static readonly ContentUnionConverter Singleton = new ContentUnionConverter();
    }

    internal class InvocationsKnownConverter : JsonConverter
    {
        public override bool CanConvert(Type t) => t == typeof(InvocationsKnown) || t == typeof(InvocationsKnown?);

        public override object ReadJson(JsonReader reader, Type t, object existingValue, JsonSerializer serializer)
        {
            switch (reader.TokenType)
            {
                case JsonToken.String:
                case JsonToken.Date:
                    var stringValue = serializer.Deserialize<string>(reader);
                    if (stringValue == "-")
                    {
                        return new InvocationsKnown { Enum = ArcaneTraditionFeature.Empty };
                    }
                    long l;
                    if (Int64.TryParse(stringValue, out l))
                    {
                        return new InvocationsKnown { Integer = l };
                    }
                    break;
            }
            throw new Exception("Cannot unmarshal type InvocationsKnown");
        }

        public override void WriteJson(JsonWriter writer, object untypedValue, JsonSerializer serializer)
        {
            var value = (InvocationsKnown)untypedValue;
            if (value.Enum != null)
            {
                if (value.Enum == ArcaneTraditionFeature.Empty)
                {
                    serializer.Serialize(writer, "-");
                    return;
                }
            }
            if (value.Integer != null)
            {
                serializer.Serialize(writer, value.Integer.Value.ToString());
                return;
            }
            throw new Exception("Cannot marshal type InvocationsKnown");
        }

        public static readonly InvocationsKnownConverter Singleton = new InvocationsKnownConverter();
    }
}
