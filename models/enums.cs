namespace sharpAngleTemplate.models.DTO.Updated;


public enum PrerequisiteType
{
  String,
  Level,
  Class,
  Subclass,
  Feat,
  Race,
  Item,
  Stat
}

public enum FeatureTypes
{
    Class = 0,
    Subclass,
    Feat,
    Race,
    Background,
    Language,
    AbilityScore,
    CharacterLevel,
    Classes,
    Item,
    Weapon,
    Armor,
    Subrace
}

public enum CharacterChangeTypes
{
  AbilityScore = 0,
  HP,
  Speed,
  AC,
  Initiative,
  Save,
  AttackRoll,
  Spell,
  SpellSlot
}

public enum SetMethod
{
  Set,
  Add,
  Subtract,
  Multiply,
  Divide
}

public enum IncreaseMethod
{
  Number,
  Die,
  Stat
}

public enum AbilityScores
{
  STR = 0,
  DEX,
  CON,
  INT,
  WIS,
  CHA,
  CHOICE,
  ALL
}

public enum TypeRestrictions
{
  SpellOnly = 0,
  MeleeOnly,
  RangedOnly,
  RangeReduced
}

public enum MovementTypes
{
    Walk = 0,
    Swim,
    Fly,
    Climb,
    Burrow
}

public enum ItemType
{
    Weapon,
    Armor,
    Tool,
    Item
}

public enum CasterType
{
  None,
  Third,
  Half,
  Full,
  Pact
}

public enum SpellKnownType   // maps the literal union "number" | "calc"
{
  Number,
  Calc
}

public enum SpellCalcLevel   // maps the literal union "full" | "half"
{
  Full,
  Half
}