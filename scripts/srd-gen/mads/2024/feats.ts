import type { MadMap } from "../spec.ts";

/**
 * Curated MADS commands for SRD 5.2 (2024) feats. Keys are the exact feat names (05_Feats.md).
 * Feats CAN carry AddStats (the race/subrace lint in mads/apply.ts does not apply to feats), so the
 * ability-score bumps are encoded here — in CHOICE form where the text says "of your choice".
 *
 * Deliberately SKIPPED (no catalog category can express them, or they are choices/situational):
 *  - Alert — adds Proficiency Bonus to Initiative + Initiative Swap. A flat bonus to a roll (not
 *    Advantage) has no category; the Advantage command would misstate the benefit.
 *  - Magic Initiate — two cantrips + one level-1 spell "of your choice" from a class list (a choice,
 *    not a fixed named spell); Skilled — three skills/tools "of your choice"; Savage Attacker — reroll
 *    weapon damage dice. No category / choice-only.
 *  - Fighting Style feats: Archery (+2 to ranged attack rolls) and Defense (+1 AC in armor) have no
 *    flat-bonus category; Great Weapon Fighting / Two-Weapon Fighting are situational damage tweaks.
 *  - Epic Boon situational riders (Peerless Aim, Blink Steps, Improve Fate, Overcome/Overwhelming,
 *    Free Casting, Merge with Shadows) and Boon of the Night Spirit's "Resistance to all
 *    damage except Psychic and Radiant" (no fixed damage-type list) — only the ability increase is kept.
 *    (Boon of Truesight's permanent Truesight IS encoded — see its entry.)
 *
 * NOTE: the "+2 max" / "+1 max" caps and the epic-boon max-30 caps are not representable; the Stats
 * command just adds. Ability Score Improvement is an approximation — see its comment.
 */
export const map: MadMap = {
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
