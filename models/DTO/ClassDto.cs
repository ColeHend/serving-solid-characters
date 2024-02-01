using sharpAngleTemplate.models.entities;

namespace sharpAngleTemplate.models.DTO
{
    public class ClassDTO
    {
        public string Name { get; set; } = string.Empty;
        public int Hit_Die { get; set; }
        public List<string> Proficiency_Choices { get; set; } = new List<string>();
        public List<string> Saving_Throws { get; set; } = new List<string>();
        public List<string> Starting_Equipment { get; set; } = new List<string>();
        public List<string> Subclasses { get; set; } = new List<string>();

        public string SpellCastingAbility { get; set; } = string.Empty;
        public List<ClassLevelDTO> Class_Levels { get; set; } = new List<ClassLevelDTO>();
        public SkillDTO Skills { get; set; } = new SkillDTO();
        public ClassInvocationsEntity[]? Invocations { get; set; }

    }

    public class ClassLevelDTO {
        public int Level { get; set; }
        public int ProficiencyBonus { get; set; }
        public string Features { get; set; } = string.Empty;
        public ClassLevelSpellcastingDTO? Spellcasting { get; set; }
        public Other Other { get; set; } = new Other();
    }

    public class ClassLevelContentDTO 
    {
        public string[] Content { get; set; } = new string[0];
    }

    public class ClassLevelSpellcastingDTO {
        public int CantripsKnown { get; set; }
        public string? SpellSlotLevel { get; set; }
        public string? InvocationsKnown { get; set; }
        public string? SpellSlotsLevel1 { get; set; }
        public string? SpellSlotsLevel2 { get; set; }
        public string? SpellSlotsLevel3 { get; set; }
        public string? SpellSlotsLevel4 { get; set; }
        public string? SpellSlotsLevel5 { get; set; }
        public string? SpellSlotsLevel6 { get; set; }
        public string? SpellSlotsLevel7 { get; set; }
        public string? SpellSlotsLevel8 { get; set; }
        public string? SpellSlotsLevel9 { get; set; }
    }

    public class ClassInvocationsDTO {
        public string Name { get; set; } = string.Empty;
        public string[] Description { get; set; } = new string[0];
        public int Level { get; set; }
        public string[] Invocations { get; set; } = new string[0];
        
    }

    public partial class Other
    {
        public string? Rage { get; set; }

        public string? UnarmoredDefense { get; set; }

        public string? RecklessAttack { get; set; }

        public List<string>? DangerSense { get; set; }

        public string? PrimalPath { get; set; }

        public string? AbilityScoreImprovement { get; set; }

        public string? ExtraAttack { get; set; }

        public string? FastMovement { get; set; }

        public string? PathFeature { get; set; }

        public List<string>? FeralInstinct { get; set; }

        public List<string>? BrutalCritical { get; set; }

         public List<string>? Relentless { get; set; }

        public string? PersistentRage { get; set; }

        public string? IndomitableMight { get; set; }

        public string? PrimalChampion { get; set; }


        public string? JackOfAllTrades { get; set; }


        public string? FontOfInspiration { get; set; }

        public List<string>? BardCollege { get; set; }

        public string? Countercharm { get; set; }

        public List<string>? MagicalSecrets { get; set; }
        public List<string>? Expertise { get; set; }

        public string? SuperiorInspiration { get; set; }



        public List<string>? DivineIntervention { get; set; }

        public string? DruidCircle { get; set; }

        public string? TimelessBody { get; set; }

        public string? BeastSpells { get; set; }

        public List<string>? Archdruid { get; set; }


        public string? SecondWind { get; set; }

        public List<string>? ActionSurge { get; set; }

        public string? MartialArchetypeFeature { get; set; }

        public List<string>? Indomitable { get; set; }


        public List<string>? UnarmoredMovement { get; set; }

        public string? MonasticTradition { get; set; }

        public List<string>? DeflectMissiles { get; set; }

        public string? SlowFall { get; set; }

        public string? StunningStrike { get; set; }

        public string? KiEmpoweredStrikes { get; set; }


        public string? Evasion { get; set; }

        public string? StillnessOfMind { get; set; }

        public List<string>? UnarmoredMovementImprovement { get; set; }

        public string? PurityOfBody { get; set; }

        public string? TongueOfTheSunAndMoon { get; set; }

        public List<string>? DiamondSoul { get; set; }

        public List<string>? EmptyBody { get; set; }

        public List<string>? DivineSense { get; set; }

        public List<string>? LayOnHands { get; set; }

        public string? DivineSmite { get; set; }

        public string? DivineHealth { get; set; }


        public List<string>? AuraOfProtection { get; set; }


        public List<string>? AuraOfCourage { get; set; }

         public string? ImprovedDivineSmite { get; set; }

        public List<string>? CleansingTouch { get; set; }

        public List<string>? AuraImprovements { get; set; }

        public List<string>? AuraOfDevotion { get; set; }

        public List<string>? FavoredEnemy { get; set; }


        public string? RangerArchetype { get; set; }

        public List<string>? FavoredEnemyAndNaturalExplorerImprovements { get; set; }

        public List<string>? LandSStride { get; set; }

       public string? NaturalExplorerImprovement { get; set; }

        public List<string>? HideInPlainSight { get; set; }


        public List<string>? FavoredEnemyImprovement { get; set; }

        public string? Vanish { get; set; }

        public List<string>? FeralSenses { get; set; }
        public string? FoeSlayer { get; set; }

        public List<string>? ThievesCant { get; set; }

        public string? CunningAction { get; set; }

        public string? RoguishArchetype { get; set; }

        public string? SneakAttack { get; set; }

        public string? UncannyDodge { get; set; }

        public string? ReliableTalent { get; set; }

        public string? Blindsense { get; set; }

        public string? SlipperyMind { get; set; }


        public string? Elusive { get; set; }

        public List<string>? StrokeOfLuck { get; set; }

        public List<string>? SorcerousOrigin { get; set; }




        public string? SorcerousRestoration { get; set; }

        public string? OtherworldlyPatron { get; set; }


        public List<string>? EldritchInvocations { get; set; }

        public List<string>? MysticArcanum { get; set; }
        public string? EldritchMaster { get; set; }

        public List<string>? ArcaneRecovery { get; set; }

        public List<string>? ArcaneTradition { get; set; }

        public List<string>? SpellMastery { get; set; }

        public List<string>? SignatureSpells { get; set; }
        public Spellcasting? Spellcasting { get; set; }
        public string? DivineDomain { get; set; }
        public string? DestroyUndead { get; set; }

        public string? ChannalDivinity { get; set; }

        public string? WildShape { get; set; }
        public string? FightingStyle { get; set; }
        public string? MartialArts { get; set; }
        public string? NaturalExplorer { get; set; }


        public string? Ki { get; set; }
        public string? MonasticTraditionFeature { get; set; }
        public string? SacredOath { get; set; }
        public string? SacredOathFeature { get; set; }
        public string? RangerArchetypeFeature { get; set; }
        public string? RoguishArchetypeFeature { get; set; }
        public string? FontOfMagic { get; set; }
        public string? Metamagic { get; set; }
        public string? SorcerousOriginFeature { get; set; }
        public string? PactMagic { get; set; }
        public string? PactBoon { get; set; }
        public string? ArcaneTraditionFeature { get; set; }
    }

    public partial class ActionSurge
    {
        public List<string> Content { get; set; }
    }

    public partial class ChannalDivinity
    {
        public List<string> Content { get; set; }

        public List<string> ChannelDivinityTurnUndead { get; set; }
    }

    public partial class OtherDestroyUndead
    {
        public string Content { get; set; }

        public DestroyUndeadTable DestroyUndead { get; set; }
    }

    public partial class DestroyUndeadDestroyUndead
    {
        public DestroyUndeadTable Table { get; set; }
    }

    public partial class DestroyUndeadTable
    {
        public List<string> ClericLevel { get; set; }

        public List<string> DestroysUndeadOfCr { get; set; }
    }

    public partial class DivineDomain
    {
        public string Content { get; set; }
        public List<string> DomainSpells { get; set; }
    }

    public partial class FightingStyle
    {
        public string Content { get; set; }

        public string Archery { get; set; }

        public string Defense { get; set; }

        public string Dueling { get; set; }

        public string GreatWeaponFighting { get; set; }

        public string Protection { get; set; }

        public string TwoWeaponFighting { get; set; }
    }

    public partial class FontOfMagic
    {
        public string Content { get; set; }

        public string SorceryPoints { get; set; }

        public FlexibleCasting FlexibleCasting { get; set; }
    }

    public partial class FlexibleCasting
    {
        public List<string> Content { get; set; }

        public CreatingSpellSlots CreatingSpellSlots { get; set; }
    }

    public partial class CreatingSpellSlots
    {
        public List<CreatingSpellSlotsContent> Content { get; set; }
    }

    public partial class PurpleContent
    {
        public PurpleTable Table { get; set; }
    }

    public partial class PurpleTable
    {
        public List<string> SpellSlotLevel { get; set; }

        public List<long> SorceryPointCost { get; set; }
    }

    public partial class Ki
    {
        public List<string> Content { get; set; }

        public string FlurryOfBlows { get; set; }

        public string PatientDefense { get; set; }

        public string StepOfTheWind { get; set; }
    }

    public partial class MartialArts
    {
        public List<Desc> Content { get; set; }
    }

    public partial class Metamagic
    {
        public List<string> Content { get; set; }

        public string CarefulSpell { get; set; }

        public ActionSurge DistantSpell { get; set; }

        public ActionSurge EmpoweredSpell { get; set; }

        public string ExtendedSpell { get; set; }

        public string HeightenedSpell { get; set; }

        public string QuickenedSpell { get; set; }

        public string SubtleSpell { get; set; }

        public ActionSurge TwinnedSpell { get; set; }
    }


    public partial class PactBoon
    {
        public string Content { get; set; }

        public ActionSurge PactOfTheChain { get; set; }

        public ActionSurge PactOfTheBlade { get; set; }

        public ActionSurge PactOfTheTome { get; set; }
    }

    public partial class PactMagic
    {
        public string Content { get; set; }

        public string Cantrips { get; set; }

        public ActionSurge SpellSlots { get; set; }

        public ActionSurge SpellsKnownOf1StLevelAndHigher { get; set; }

        public ActionSurge SpellcastingAbility { get; set; }

        public string SpellcastingFocus { get; set; }
    }

    public partial class SacredOath
    {
        public List<string> Content { get; set; }

        public ActionSurge OathSpells { get; set; }

        public ActionSurge ChannelDivinity { get; set; }
    }

    public partial class Spellcasting
    {
        public string? Content { get; set; }

        public string Cantrips { get; set; }
       
        public List<string> SpellSlots { get; set; }

        public List<string> SpellsKnownOf1StLevelAndHigher { get; set; }

        public List<string> SpellcastingAbility { get; set; }

        public string RitualCasting { get; set; }

        public string SpellcastingFocus { get; set; }

        public List<string> PreparingAndCastingSpells { get; set; }

        public string Spellbook { get; set; }

        public string LearningSpellsOf1StLevelAndHigher { get; set; }
    }

    public partial class WildShape
    {
        public List<string> Content { get; set; }

        public List<FluffyTable> BeastShapes { get; set; }
    }

    public partial class BeastShapes
    {
        public List<BeastShapesContent> Content { get; set; }
    }

    public partial class FluffyContent
    {
        public FluffyTable Table { get; set; }
    }

    public partial class FluffyTable
    {
        public List<string> Max { get; set; }

        public List<string> Level { get; set; }

        public List<string> CrLimitations { get; set; }

        public List<string> Example { get; set; }
    }

    public partial class SpellcastingClass
    {
        public long? SpellsKnown { get; set; }

        public List<InvocationsKnown> SpellSlots { get; set; }

        public long CantripsKnown { get; set; }

        public string SlotLevel { get; set; }

        public InvocationsKnown? InvocationsKnown { get; set; }
    }

    public partial class Invocation
    {
        public string Name { get; set; }

        public Desc Desc { get; set; }

        public long Level { get; set; }
    }

    public partial class Skills
    {
        public long Amount { get; set; }

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

    public partial struct CreatingSpellSlotsContent
    {
        public PurpleContent PurpleContent;
        public string String;

        public static implicit operator CreatingSpellSlotsContent(PurpleContent PurpleContent) => new CreatingSpellSlotsContent { PurpleContent = PurpleContent };
        public static implicit operator CreatingSpellSlotsContent(string String) => new CreatingSpellSlotsContent { String = String };
    }

    public partial struct Desc
    {
        public string String;
        public List<string> StringArray;

        public static implicit operator Desc(string String) => new Desc { String = String };
        public static implicit operator Desc(List<string> StringArray) => new Desc { StringArray = StringArray };
    }

    public partial struct BeastShapesContent
    {
        public FluffyContent FluffyContent;
        public string String;
        public List<string> StringArray;

        public static implicit operator BeastShapesContent(FluffyContent FluffyContent) => new BeastShapesContent { FluffyContent = FluffyContent };
        public static implicit operator BeastShapesContent(string String) => new BeastShapesContent { String = String };
        public static implicit operator BeastShapesContent(List<string> StringArray) => new BeastShapesContent { StringArray = StringArray };
    }

    public partial struct InvocationsKnown
    {
        public ArcaneTraditionFeature? Enum;
        public long? Integer;

        public static implicit operator InvocationsKnown(ArcaneTraditionFeature Enum) => new InvocationsKnown { Enum = Enum };
        public static implicit operator InvocationsKnown(long Integer) => new InvocationsKnown { Integer = Integer };
    }

}