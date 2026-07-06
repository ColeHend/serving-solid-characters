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
 *  - Magic Initiate — two cantrips + one level-1 spell "of your choice" from a class list (a choice,
 *    not a fixed named spell); Savage Attacker — reroll weapon damage dice.
 *  - Great Weapon Fighting / Two-Weapon Fighting — damage-dice tweaks (damage is not a d20 roll or
 *    sheet stat).
 *  - Epic Boon situational riders (Peerless Aim, Blink Steps, Improve Fate, Overcome/Overwhelming,
 *    Free Casting, Merge with Shadows) and Boon of the Night Spirit's "Resistance to all
 *    damage except Psychic and Radiant" (no fixed damage-type list) — only the ability increase is kept.
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

    // Ability Score Improvement — "Increase one ability score of your choice by 2, or increase two
    // ability scores of your choice by 1." Only the +2-to-one form is representable; the +1/+1 split
    // can't be expressed by a single command, so this is an APPROXIMATION of the feat's stronger option.
    "Ability Score Improvement": [
        { type: "Add", category: "Stats", value: { stat: "choice", options: "str,dex,con,int,wis,cha", statValue: "2" } },
    ],

    // Grappler — "Increase your Strength or Dexterity score by 1." (Grapple riders are situational → skipped.)
    "Grappler": [
        { type: "Add", category: "Stats", value: { stat: "choice", options: "str,dex", statValue: "1" } },
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
    "Boon of the Night Spirit": [
        { type: "Add", category: "Stats", value: { stat: "choice", options: "str,dex,con,int,wis,cha", statValue: "1" } },
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
