using Newtonsoft.Json;

namespace SolidCharacters.Domain.DTO.Updated
{

// ─────────────────────────────────────────────────────────────────────────────
// RULES DICTIONARY
// ─────────────────────────────────────────────────────────────────────────────

/// <summary>A rules-dictionary entry (e.g. "Jumping", "Cover", "Grappling"). Flat, content-only.</summary>
public class Rule
{
  [JsonProperty("id")] public string Id { get; set; } = null!;
  /// <summary>True for 2014 (legacy) SRD data, false for 2024; null when unknown (homebrew, stale caches).</summary>
  [JsonProperty("legacy")] public bool? Legacy { get; set; }
  /// <summary>Provenance label, e.g. "SRD 5.1", "SRD 5.2"; null = unlabeled (display falls back on Legacy: true → SRD 5.1, false/null → SRD 5.2).</summary>
  [JsonProperty("source")] public string? Source { get; set; }
  [JsonProperty("name")] public string Name { get; set; } = null!;
  [JsonProperty("description")] public string Description { get; set; } = null!;
  /// <summary>Broad grouping for browsing, e.g. "Combat", "Movement", "Exploration", "Social".</summary>
  [JsonProperty("category")] public string? Category { get; set; }
  /// <summary>Topic tags for search/filter. Mirrors the existing Items.Item.Tags precedent.</summary>
  [JsonProperty("tags")] public List<string> Tags { get; set; } = new();
  /// <summary>Names of related rules for cross-linking (the 2024 glossary has "See also" refs). Optional.</summary>
  [JsonProperty("related")] public List<string>? Related { get; set; }
  /// <summary>Optional source page reference; mirrors Spell.Page.</summary>
  [JsonProperty("page")] public string? Page { get; set; }
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED CREATURE PRIMITIVES
// C# embodiment of the client character-model shapes (the character aggregate is
// TypeScript-only, so this is their canonical server-side home — reusable by a
// future C# character). Kept as plain strings for ability/roll/action kinds to
// mirror the client's string-union types and to avoid System.Text.Json emitting
// C# enums as numbers.
// ─────────────────────────────────────────────────────────────────────────────

/// <summary>Ability score block — mirrors the client `Stats` (str..cha).</summary>
public class Stats
{
  [JsonProperty("str")] public int Str { get; set; }
  [JsonProperty("dex")] public int Dex { get; set; }
  [JsonProperty("con")] public int Con { get; set; }
  [JsonProperty("int")] public int Int { get; set; }
  [JsonProperty("wis")] public int Wis { get; set; }
  [JsonProperty("cha")] public int Cha { get; set; }
}

/// <summary>Mirrors `CharacterHealth`. For a statblock, Max is the listed HP; Current/Temp are runtime state.</summary>
public class Health
{
  [JsonProperty("max")] public int Max { get; set; }
  [JsonProperty("current")] public int Current { get; set; }
  [JsonProperty("temp")] public int Temp { get; set; }
}

/// <summary>Non-walking speeds in feet (walking speed lives on Monster.Speed) — mirrors `MovementSpeeds`.</summary>
public class MovementSpeeds
{
  [JsonProperty("fly")] public int? Fly { get; set; }
  [JsonProperty("swim")] public int? Swim { get; set; }
  [JsonProperty("climb")] public int? Climb { get; set; }
  [JsonProperty("burrow")] public int? Burrow { get; set; }
  [JsonProperty("hover")] public bool? Hover { get; set; }
}

/// <summary>Special senses + ranges in feet — mirrors `CharacterSenses`, plus the pre-computed passive Perception.</summary>
public class CreatureSenses
{
  [JsonProperty("darkvision")] public int? Darkvision { get; set; }
  [JsonProperty("blindsight")] public int? Blindsight { get; set; }
  [JsonProperty("tremorsense")] public int? Tremorsense { get; set; }
  [JsonProperty("truesight")] public int? Truesight { get; set; }
  [JsonProperty("passive_perception")] public int? PassivePerception { get; set; }
}

/// <summary>Mirrors `CharacterSavingThrow { stat; proficient }`. Bonus DERIVES = mod + (proficient ? PB : 0).</summary>
public class SavingThrow
{
  [JsonProperty("stat")] public string Stat { get; set; } = null!;   // "str".."cha"
  [JsonProperty("proficient")] public bool Proficient { get; set; }
}

/// <summary>Mirrors `CharacterProficiency`: skills keyed by name + other (tools) name→proficient.</summary>
public class CreatureProficiency
{
  [JsonProperty("skills")] public Dictionary<string, SkillProficiency> Skills { get; set; } = new();
  [JsonProperty("other")] public Dictionary<string, bool> Other { get; set; } = new();
}

/// <summary>Mirrors `CharacterSkillProficiency`.</summary>
public class SkillProficiency
{
  [JsonProperty("stat")] public string Stat { get; set; } = null!;   // governing ability
  [JsonProperty("value")] public int Value { get; set; }             // computed modifier (statblocks list it)
  [JsonProperty("proficient")] public bool Proficient { get; set; }
  [JsonProperty("expertise")] public bool Expertise { get; set; }
}

/// <summary>Mirrors `DamageAffinity { type; value }`, used for resistances/vulnerabilities/immunities.</summary>
public class DamageAffinity
{
  [JsonProperty("type")] public string Type { get; set; } = null!;   // "fire", "slashing", ...
  [JsonProperty("value")] public bool Value { get; set; }
}

/// <summary>Mirrors `GrantedAction`: a named narrative action/bonus action/reaction (no attack math).</summary>
public class GrantedAction
{
  [JsonProperty("name")] public string Name { get; set; } = null!;
  [JsonProperty("action_type")] public string ActionType { get; set; } = null!; // "action"|"bonusAction"|"reaction"
  [JsonProperty("description")] public string? Description { get; set; }
  [JsonProperty("source")] public string? Source { get; set; }
}

/// <summary>Mirrors `RollAdvantage` (e.g. Pack Tactics advantage on attacks).</summary>
public class RollAdvantage
{
  [JsonProperty("roll_type")] public string RollType { get; set; } = null!; // "WeaponAttack"|"SavingThrow"|...
  [JsonProperty("mode")] public string Mode { get; set; } = null!;          // "advantage"|"disadvantage"
  [JsonProperty("stat")] public string? Stat { get; set; }
  [JsonProperty("condition")] public string? Condition { get; set; }
  [JsonProperty("source")] public string? Source { get; set; }
}

/// <summary>Mirrors `RollBonus`.</summary>
public class RollBonus
{
  [JsonProperty("roll_type")] public string RollType { get; set; } = null!;
  [JsonProperty("bonus")] public int? Bonus { get; set; }
  [JsonProperty("proficiency_bonus")] public string? ProficiencyBonus { get; set; } // "Third PB"|"Half PB"|"Full PB"
  [JsonProperty("stat")] public string? Stat { get; set; }
  [JsonProperty("condition")] public string? Condition { get; set; }
  [JsonProperty("source")] public string? Source { get; set; }
}

// ─────────────────────────────────────────────────────────────────────────────
// MONSTER ATTACK TYPES (character-style: dice strings + derived numbers, NOT MADS)
// ─────────────────────────────────────────────────────────────────────────────

/// <summary>One damage component — mirrors the client `DamageEntryDraft { dice; type; bonus? }`.
/// The governing ability modifier is added at calc time (character-style) when AddAbilityModifier is true;
/// riders (e.g. "+ 7 (2d6) fire") set it false.</summary>
public class DamageEntry
{
  [JsonProperty("dice")] public string Dice { get; set; } = null!;  // "2d6" — parseDiceExpression consumes it -> DiceGroup[]
  [JsonProperty("type")] public string Type { get; set; } = null!;  // "Slashing", "Fire"
  [JsonProperty("add_ability_modifier")] public bool AddAbilityModifier { get; set; } // primary weapon damage = true
  [JsonProperty("bonus")] public int? Bonus { get; set; }           // flat magic bonus (e.g. +1); optional
}

/// <summary>Save specifier for save-based attacks (breath weapons). DC DERIVES = 8 + PB + mod(DcAbility).</summary>
public class MonsterSave
{
  [JsonProperty("target_ability")] public string TargetAbility { get; set; } = null!; // ability the TARGET rolls, e.g. "dex"
  [JsonProperty("dc_ability")] public string? DcAbility { get; set; }                  // monster ability that sets the DC (derive)
  [JsonProperty("dc_override")] public int? DcOverride { get; set; }                   // escape hatch when non-standard
  [JsonProperty("type")] public string Type { get; set; } = "half";                    // "negates"|"half"|"none"
}

/// <summary>A monster's natural attack — the analogue of a character's equipped weapon. To-hit and the primary
/// damage bonus DERIVE from the monster's stats + proficiency (character-style), so nothing pre-computed drifts.
/// Reuses the GrantedAction idiom (name/actionType/description) + a weapon-like damage payload.</summary>
public class MonsterAttack
{
  [JsonProperty("name")] public string Name { get; set; } = null!;                 // "Bite", "Fire Breath"
  [JsonProperty("action_type")] public string ActionType { get; set; } = "action"; // "action"|"bonusAction"|"reaction"
  [JsonProperty("description")] public string? Description { get; set; }            // full statblock text
  [JsonProperty("attack_type")] public string? AttackType { get; set; }            // "melee"|"ranged"|"melee_or_ranged"

  /// <summary>Governing ability ("str".."cha"): drives derived to-hit (mod + PB) and primary damage (mod).</summary>
  [JsonProperty("ability")] public string? Ability { get; set; }
  [JsonProperty("proficient")] public bool Proficient { get; set; } = true;         // PB adds to the attack roll
  [JsonProperty("to_hit_override")] public int? ToHitOverride { get; set; }         // explicit total to-hit (non-standard)
  [JsonProperty("crit_threshold")] public int? CritThreshold { get; set; }

  [JsonProperty("reach")] public string? Reach { get; set; }
  [JsonProperty("range")] public string? Range { get; set; }

  /// <summary>Present for save-based attacks (breath weapons); null for weapon attacks.</summary>
  [JsonProperty("save")] public MonsterSave? Save { get; set; }
  [JsonProperty("target_count")] public int? TargetCount { get; set; }

  [JsonProperty("damage")] public List<DamageEntry> Damage { get; set; } = new();

  /// <summary>Times this attack is made per turn in a multiattack (default 1) -> AttackEntry.numberOfAttacks.</summary>
  [JsonProperty("count")] public int? Count { get; set; }

  [JsonProperty("recharge")] public string? Recharge { get; set; }   // "5-6" — base round-DPR ignores it
  [JsonProperty("uses")] public string? Uses { get; set; }           // "1/Day"
}

// ─────────────────────────────────────────────────────────────────────────────
// MONSTER STATBLOCK (structured like the character model)
// ─────────────────────────────────────────────────────────────────────────────

/// <summary>A monster statblock, structured like the character model. Identical shape for 2014 and 2024;
/// ruleset carried by folder + legacy flag. Combat numbers derive from `Stats` — nothing pre-computed is stored.</summary>
public class Monster
{
  [JsonProperty("id")] public string Id { get; set; } = null!;
  /// <summary>True for 2014 (legacy) SRD data, false for 2024; null when unknown.</summary>
  [JsonProperty("legacy")] public bool? Legacy { get; set; }
  /// <summary>Provenance label, e.g. "SRD 5.1", "SRD 5.2"; null = unlabeled (display falls back on Legacy: true → SRD 5.1, false/null → SRD 5.2).</summary>
  [JsonProperty("source")] public string? Source { get; set; }

  [JsonProperty("name")] public string Name { get; set; } = null!;
  [JsonProperty("size")] public string Size { get; set; } = null!;   // "Tiny".."Gargantuan"
  [JsonProperty("type")] public string Type { get; set; } = null!;   // creature type: "humanoid", "dragon"
  [JsonProperty("subtype")] public string? Subtype { get; set; }
  [JsonProperty("alignment")] public string? Alignment { get; set; }

  // ── Reused character shapes ──
  [JsonProperty("stats")] public Stats Stats { get; set; } = new();
  [JsonProperty("armor_class")] public int ArmorClass { get; set; }  // mirrors Character.ArmorClass (also AttackParams.targetAC when targeted)
  [JsonProperty("armor_desc")] public string? ArmorDesc { get; set; }
  [JsonProperty("health")] public Health Health { get; set; } = new();
  [JsonProperty("hit_dice")] public string? HitDice { get; set; }    // "12d10+48"

  [JsonProperty("speed")] public int Speed { get; set; }             // walking speed (mirrors Character.Speed)
  [JsonProperty("movement_speeds")] public MovementSpeeds MovementSpeeds { get; set; } = new();
  [JsonProperty("senses")] public CreatureSenses Senses { get; set; } = new();

  [JsonProperty("saving_throws")] public List<SavingThrow> SavingThrows { get; set; } = new();
  [JsonProperty("proficiencies")] public CreatureProficiency Proficiencies { get; set; } = new();

  [JsonProperty("resistances")] public List<DamageAffinity> Resistances { get; set; } = new();
  [JsonProperty("vulnerabilities")] public List<DamageAffinity> Vulnerabilities { get; set; } = new();
  [JsonProperty("immunities")] public List<DamageAffinity> Immunities { get; set; } = new();
  /// <summary>No character parallel exists; simplest faithful form is a string list.</summary>
  [JsonProperty("condition_immunities")] public List<string> ConditionImmunities { get; set; } = new();

  [JsonProperty("languages")] public List<string> Languages { get; set; } = new();

  /// <summary>Passive/triggered traits (Pack Tactics, Nimble Escape). Reuses FeatureDetail (metadata: uses/recharge).</summary>
  [JsonProperty("features")] public List<FeatureDetail> Features { get; set; } = new();
  /// <summary>Named utility actions with no attack math (Frightful Presence). Mirrors Character.grantedActions.</summary>
  [JsonProperty("granted_actions")] public List<GrantedAction> GrantedActions { get; set; } = new();
  [JsonProperty("roll_advantages")] public List<RollAdvantage> RollAdvantages { get; set; } = new();
  [JsonProperty("roll_bonuses")] public List<RollBonus> RollBonuses { get; set; } = new();

  // ── Attacks (character-style derivation; the calculator-facing part) ──
  /// <summary>Natural attacks — the analogue of a character's equipped weapons.</summary>
  [JsonProperty("attacks")] public List<MonsterAttack> Attacks { get; set; } = new();
  /// <summary>Mirrors Character.attacksPerAction. Per-attack `count` drives the DPR sum for heterogeneous multiattacks.</summary>
  [JsonProperty("attacks_per_action")] public int AttacksPerAction { get; set; } = 1;
  [JsonProperty("legendary_actions")] public List<MonsterAttack>? LegendaryActions { get; set; }
  [JsonProperty("legendary_action_count")] public int? LegendaryActionCount { get; set; }

  // ── Monster-only additions (no character parallel) ──
  [JsonProperty("challenge_rating")] public string ChallengeRating { get; set; } = null!;  // "1/4", "6"
  [JsonProperty("proficiency_bonus")] public int? ProficiencyBonus { get; set; }           // derivable from CR
  [JsonProperty("xp")] public int? Xp { get; set; }
}

}
