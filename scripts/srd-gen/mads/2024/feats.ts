import type { MadMap } from "../spec.ts";

/**
 * Curated MADS commands for SRD 5.2 (2024) feats. Keys are the exact feat names (05_Feats.md).
 * Feats CAN carry AddStats (the race/subrace lint in mads/apply.ts does not apply to feats), so the
 * ability-score bumps are encoded here — in CHOICE form where the text says "of your choice".
 *
 * Deliberately SKIPPED (no catalog category can express them, or they are choices/situational):
 *  - Alert's Initiative Swap (turn-order trade with an ally) — only the PB-to-Initiative RollBonus
 *    is encoded; Skilled's TOOL proficiencies (the choice form is skill-list only) and its
 *    Repeatable rider.
 *  - Magic Initiate's Repeatable rider and its INT/WIS/CHA spellcasting-ability pick (no category);
 *    the spell grants themselves ARE encoded via choice-form Spells — see its entry.
 *    Savage Attacker — reroll weapon damage dice.
 *  - Great Weapon Fighting / Two-Weapon Fighting — damage-dice tweaks (damage is not a d20 roll or
 *    sheet stat).
 *  - Epic Boon situational riders (Peerless Aim, Blink Steps — a free teleport AFTER another action,
 *    not an action-economy slot — Improve Fate, Overcome/Overwhelming, Free Casting) and Boon of the
 *    Night Spirit's "Resistance to all damage except Psychic and Radiant" (no fixed damage-type
 *    list). Merge with Shadows IS encoded as a Bonus Action — see Boon of the Night Spirit's entry.
 *    (Boon of Truesight's permanent Truesight IS encoded — see its entry.)
 *
 * NOTE: the "+2 max" / "+1 max" caps and the epic-boon max-30 caps are not representable; the Stats
 * command just adds. Ability Score Improvement is an approximation — see its comment.
 * Defense's +1 AC applies only "while wearing Light, Medium, or Heavy armor" — the sheet applies it
 * unconditionally, with the qualifier carried in the command's condition text (documented approximation).
 */

const ALL_SKILLS = "Acrobatics,Animal Handling,Arcana,History,Athletics,Deception,Insight," +
    "Intimidation,Investigation,Medicine,Nature,Perception,Performance,Persuasion,Religion," +
    "Sleight Of Hand,Stealth,Survival";

// Magic Initiate option lists: EXACT spell names (resolved to ids at gen time) from the union of the
// Cleric, Druid, and Wizard lists in 2024 spells.json — regenerate if the spell data changes.
// "Thunderwavea" is a typo in the vendored source markdown (07_Spells.md "#### Thunderwavea") that
// the data carries verbatim; keep the stored spelling here so the name resolves to its id.
const CDW_CANTRIPS =
    "Acid Splash,Chill Touch,Dancing Lights,Druidcraft,Elementalism,Fire Bolt,Guidance,Light," +
    "Mage Hand,Mending,Message,Minor Illusion,Poison Spray,Prestidigitation,Produce Flame," +
    "Ray of Frost,Resistance,Sacred Flame,Shillelagh,Shocking Grasp,Spare the Dying,Starry Wisp," +
    "Thaumaturgy,True Strike";
const CDW_LEVEL1 =
    "Alarm,Animal Friendship,Bane,Bless,Burning Hands,Charm Person,Chromatic Orb,Color Spray," +
    "Command,Comprehend Languages,Create or Destroy Water,Cure Wounds,Detect Evil and Good," +
    "Detect Magic,Detect Poison and Disease,Disguise Self,Entangle,Expeditious Retreat,Faerie Fire," +
    "False Life,Feather Fall,Find Familiar,Floating Disk,Fog Cloud,Goodberry,Grease,Guiding Bolt," +
    "Healing Word,Hideous Laughter,Ice Knife,Identify,Illusory Script,Inflict Wounds,Jump," +
    "Longstrider,Mage Armor,Magic Missile,Protection from Evil and Good,Purify Food and Drink," +
    "Ray of Sickness,Sanctuary,Shield,Shield of Faith,Silent Image,Sleep,Speak with Animals," +
    "Thunderwave,Unseen Servant";

export const map: MadMap = {
    // Alert — "add your Proficiency Bonus to your Initiative rolls" (Initiative Swap → skip).
    "Alert": [
        { type: "Add", category: "RollBonus", value: { rollType: "Initiative", proficiencyBonus: "Full PB" } },
    ],

    // Archery — "+2 bonus to attack rolls you make with Ranged weapons."
    "Archery": [
        { type: "Add", category: "RollBonus", value: { rollType: "WeaponAttack", bonus: "2", condition: "with Ranged weapons" } },
    ],

    // Defense — "+1 bonus to Armor Class" while armored (see the header note).
    "Defense": [
        { type: "Add", category: "ArmorClass", value: { bonus: "1", condition: "while wearing Light, Medium, or Heavy armor" } },
    ],

    // Skilled — "proficiency in any combination of three skills or tools of your choice."
    // Tools aren't representable — the choice list offers the 18 skills (documented approximation).
    "Skilled": [
        { type: "Add", category: "Proficiencies", value: { proficiency: "choice", options: ALL_SKILLS, count: "3" } },
    ],

    // Ability Score Improvement — increase two DIFFERENT abilities of your choice by 1 each
    // (choice-form Stats with count: the player picks `count` distinct abilities on the sheet).
    "Ability Score Improvement": [
        { type: "Add", category: "Stats", value: { stat: "choice", options: "str,dex,con,int,wis,cha", statValue: "1", count: "2" } },
    ],

    // Grappler — "Increase your Strength or Dexterity score by 1." (Grapple riders are situational → skipped.)
    "Grappler": [
        { type: "Add", category: "Stats", value: { stat: "choice", options: "str,dex", statValue: "1" } },
    ],

    // Magic Initiate — "two cantrips of your choice from the Cleric, Druid, or Wizard spell list" +
    // "a level 1 spell from the same list", each a player pick (choice-form Spells; the sheet keys the
    // two picks apart by spellLevel). The Uses command is the once-per-Long-Rest free cast of the
    // level-1 spell. The spellcasting-ability pick and the Repeatable rider stay skipped (header note).
    // Approximation: the options offer the UNION of the three lists rather than locking all picks to
    // one class list.
    "Magic Initiate": [
        { type: "Add", category: "Spells", value: { ID: "choice", options: CDW_CANTRIPS, count: "2", spellLevel: "0" } },
        { type: "Add", category: "Spells", value: { ID: "choice", options: CDW_LEVEL1, count: "1", spellLevel: "1" } },
        { type: "Add", category: "Uses", value: { amount: "1", recharge: "Long Rest" } },
    ],

    // Epic Boons (level 19+): "Increase one ability score of your choice by 1, to a maximum of 30."
    "Boon of Combat Prowess": [
        { type: "Add", category: "Stats", value: { stat: "choice", options: "str,dex,con,int,wis,cha", statValue: "1" } },
    ],
    "Boon of Dimensional Travel": [
        { type: "Add", category: "Stats", value: { stat: "choice", options: "str,dex,con,int,wis,cha", statValue: "1" } },
    ],
    "Boon of Fate": [
        { type: "Add", category: "Stats", value: { stat: "choice", options: "str,dex,con,int,wis,cha", statValue: "1" } },
    ],
    // Merge with Shadows — "While within Dim Light or Darkness, you can give yourself the Invisible
    // condition as a Bonus Action." (The situational all-but-Psychic/Radiant resistance stays skipped.)
    "Boon of the Night Spirit": [
        { type: "Add", category: "Stats", value: { stat: "choice", options: "str,dex,con,int,wis,cha", statValue: "1" } },
        { type: "Add", category: "Actions", value: { name: "Merge with Shadows", actionType: "bonusAction", source: "Boon of the Night Spirit" } },
    ],
    // "Truesight. You have Truesight with a range of 60 feet."
    "Boon of Truesight": [
        { type: "Add", category: "Stats", value: { stat: "choice", options: "str,dex,con,int,wis,cha", statValue: "1" } },
        { type: "Add", category: "Senses", value: { sense: "truesight", range: "60" } },
    ],

    // Boon of Irresistible Offense — "Increase your Strength or Dexterity score by 1, to a maximum of 30."
    "Boon of Irresistible Offense": [
        { type: "Add", category: "Stats", value: { stat: "choice", options: "str,dex", statValue: "1" } },
    ],

    // Boon of Spell Recall — "Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 30."
    "Boon of Spell Recall": [
        { type: "Add", category: "Stats", value: { stat: "choice", options: "int,wis,cha", statValue: "1" } },
    ],
};

/*
 * Coverage-gap sweep (July 2026) — documented SKIPS (verified; no fitting category or
 * deliberately out of scope per the decision rules):
 *  - Two-Weapon Fighting: Text only lets you 'add your ability modifier to the damage of that attack' — a pure damage rider with no d20/AC/sheet-stat category to encode (rules 
 */
