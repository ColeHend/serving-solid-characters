import type { RuleJson } from "../../types.ts";

/**
 * Curated 2014 (SRD 5.1) rules-dictionary entries.
 *
 * The 5.1 SRD has no glossary file — its rules are prose spread across
 * Docs/dnd.srd.5.1-main/06_Gameplay/{Adventuring,Order_of_Combat,Using_Ability_Scores}.md.
 * Rather than heading-slice that prose (which yields fuzzy names/categories), this is a
 * hand-picked set of the most commonly referenced rules, with descriptions lifted faithfully
 * from those docs. Emit `id: ""` and no `legacy` — the central passes own both (CONTRACT).
 */
export const RULES_2014: RuleJson[] = [
    {
        id: "",
        name: "Advantage and Disadvantage",
        category: "General",
        tags: ["d20", "advantage", "disadvantage", "roll"],
        description:
            "Sometimes a special ability or spell tells you that you have advantage or disadvantage on an ability check, a saving throw, or an attack roll. When that happens, you roll a second d20 when you make the roll. Use the higher of the two rolls if you have advantage, and use the lower roll if you have disadvantage.\nIf multiple situations affect a roll and each one grants advantage or imposes disadvantage on it, you don't roll more than one additional d20. If circumstances cause a roll to have both advantage and disadvantage, you are considered to have neither of them, and you roll one d20.",
    },
    {
        id: "",
        name: "Proficiency Bonus",
        category: "General",
        tags: ["proficiency", "bonus", "checks", "saving throws", "attack rolls"],
        description:
            "Characters have a proficiency bonus determined by level. Monsters also have this bonus, which is incorporated in their stat blocks. The bonus is used in the rules on ability checks, saving throws, and attack rolls.\nYour proficiency bonus can't be added to a single die roll or other number more than once. Occasionally, your proficiency bonus might be multiplied or divided (doubled or halved, for example) before you apply it; even then you still add it only once and multiply or divide it only once.",
    },
    {
        id: "",
        name: "Passive Checks",
        category: "Exploration",
        tags: ["passive", "perception", "checks", "score"],
        description:
            "A passive check is a special kind of ability check that doesn't involve any die rolls. Such a check can represent the average result for a task done repeatedly, or can be used when the GM wants to secretly determine whether the characters succeed at something without rolling dice.\nTo determine a character's total for a passive check: 10 + all modifiers that normally apply to the check. If the character has advantage on the check, add 5. For disadvantage, subtract 5. The game refers to a passive check total as a score.",
    },
    {
        id: "",
        name: "Saving Throws",
        category: "General",
        tags: ["saving throw", "save", "dc", "resist"],
        related: ["Proficiency Bonus"],
        description:
            "A saving throw — also called a save — represents an attempt to resist a spell, a trap, a poison, a disease, or a similar threat. You don't normally decide to make a saving throw; you are forced to make one because your character or monster is at risk of harm.\nTo make a saving throw, roll a d20 and add the appropriate ability modifier. Proficiency in a saving throw lets a character add their proficiency bonus to saves made using a particular ability. The Difficulty Class for a saving throw is determined by the effect that causes it.",
    },
    {
        id: "",
        name: "Difficult Terrain",
        category: "Movement",
        tags: ["movement", "terrain", "speed"],
        description:
            "Dense forests, deep swamps, rubble-filled ruins, steep mountains, and ice-covered ground are all considered difficult terrain. You move at half speed in difficult terrain — moving 1 foot in difficult terrain costs 2 feet of speed — so you can cover only half the normal distance in a minute, an hour, or a day.",
    },
    {
        id: "",
        name: "Jumping",
        category: "Movement",
        tags: ["movement", "jump", "athletics", "strength"],
        page: "PHB 182",
        related: ["Difficult Terrain"],
        description:
            "Your Strength determines how far you can jump.\nLong Jump. When you make a long jump, you cover a number of feet up to your Strength score if you move at least 10 feet on foot immediately before the jump. When you make a standing long jump, you can leap only half that distance. Either way, each foot you clear on the jump costs a foot of movement.\nHigh Jump. When you make a high jump, you leap into the air a number of feet equal to 3 + your Strength modifier if you move at least 10 feet on foot immediately before the jump. When you make a standing high jump, you can jump only half that distance.",
    },
    {
        id: "",
        name: "Climbing, Swimming, and Crawling",
        category: "Movement",
        tags: ["movement", "climb", "swim", "crawl", "athletics"],
        related: ["Difficult Terrain"],
        description:
            "While climbing or swimming, each foot of movement costs 1 extra foot (2 extra feet in difficult terrain), unless a creature has a climbing or swimming speed. At the GM's option, climbing a slippery vertical surface or one with few handholds requires a successful Strength (Athletics) check. Similarly, gaining any distance in rough water might require a successful Strength (Athletics) check.",
    },
    {
        id: "",
        name: "Falling",
        category: "Exploration",
        tags: ["falling", "damage", "prone", "hazard"],
        description:
            "A fall from a great height is one of the most common hazards facing an adventurer. At the end of a fall, a creature takes 1d6 bludgeoning damage for every 10 feet it fell, to a maximum of 20d6. The creature lands prone, unless it avoids taking damage from the fall.",
    },
    {
        id: "",
        name: "Suffocating",
        category: "Exploration",
        tags: ["suffocation", "breath", "constitution", "hazard"],
        description:
            "A creature can hold its breath for a number of minutes equal to 1 + its Constitution modifier (minimum of 30 seconds). When a creature runs out of breath or is choking, it can survive for a number of rounds equal to its Constitution modifier (minimum of 1 round). At the start of its next turn, it drops to 0 hit points and is dying, and it can't regain hit points or be stabilized until it can breathe again.",
    },
    {
        id: "",
        name: "Vision and Light",
        category: "Exploration",
        tags: ["vision", "light", "obscured", "perception", "darkness"],
        description:
            "A given area might be lightly or heavily obscured. In a lightly obscured area, such as dim light, patchy fog, or moderate foliage, creatures have disadvantage on Wisdom (Perception) checks that rely on sight. A heavily obscured area — such as darkness, opaque fog, or dense foliage — blocks vision entirely; a creature effectively suffers from the blinded condition when trying to see something in that area.\nThe presence or absence of light creates three categories of illumination: bright light lets most creatures see normally; dim light (also called shadows) creates a lightly obscured area; and darkness creates a heavily obscured area.",
    },
    {
        id: "",
        name: "Cover",
        category: "Combat",
        tags: ["cover", "ac", "defense", "dexterity save"],
        description:
            "Walls, trees, creatures, and other obstacles can provide cover during combat, making a target more difficult to harm. A target can benefit from cover only when an attack or other effect originates on the opposite side of the cover. If a target is behind multiple sources of cover, only the most protective degree applies.\nA target with half cover has a +2 bonus to AC and Dexterity saving throws. A target with three-quarters cover has a +5 bonus to AC and Dexterity saving throws. A target with total cover can't be targeted directly by an attack or a spell, although some spells can reach it by including it in an area of effect.",
    },
    {
        id: "",
        name: "Grappling",
        category: "Combat",
        tags: ["grapple", "attack", "athletics", "grappled"],
        related: ["Shoving a Creature"],
        description:
            "When you want to grab a creature or wrestle with it, you can use the Attack action to make a special melee attack, a grapple. If you're able to make multiple attacks with the Attack action, this attack replaces one of them. The target must be no more than one size larger than you and within your reach.\nUsing at least one free hand, you make a grapple check instead of an attack roll: a Strength (Athletics) check contested by the target's Strength (Athletics) or Dexterity (Acrobatics) check (the target chooses). If you succeed, you subject the target to the grappled condition. A grappled creature can use its action to escape with a contested check. When you move, you can drag or carry the grappled creature, but your speed is halved unless the creature is two or more sizes smaller than you.",
    },
    {
        id: "",
        name: "Shoving a Creature",
        category: "Combat",
        tags: ["shove", "attack", "athletics", "prone", "push"],
        related: ["Grappling"],
        description:
            "Using the Attack action, you can make a special melee attack to shove a creature, either to knock it prone or push it away from you. If you're able to make multiple attacks with the Attack action, this attack replaces one of them. The target must be no more than one size larger than you and within your reach.\nInstead of making an attack roll, you make a Strength (Athletics) check contested by the target's Strength (Athletics) or Dexterity (Acrobatics) check (the target chooses). If you succeed, you either knock the target prone or push it 5 feet away from you.",
    },
    {
        id: "",
        name: "Opportunity Attacks",
        category: "Combat",
        tags: ["opportunity attack", "reaction", "movement"],
        related: ["Disengage"],
        description:
            "You can make an opportunity attack when a hostile creature that you can see moves out of your reach. To make the opportunity attack, you use your reaction to make one melee attack against the provoking creature. The attack occurs right before the creature leaves your reach.\nYou can avoid provoking an opportunity attack by taking the Disengage action. You also don't provoke one when you teleport or when someone or something moves you without using your movement, action, or reaction.",
    },
    {
        id: "",
        name: "Two-Weapon Fighting",
        category: "Combat",
        tags: ["two-weapon", "bonus action", "light weapon", "attack"],
        description:
            "When you take the Attack action and attack with a light melee weapon that you're holding in one hand, you can use a bonus action to attack with a different light melee weapon that you're holding in the other hand. You don't add your ability modifier to the damage of the bonus attack, unless that modifier is negative. If either weapon has the thrown property, you can throw the weapon instead of making a melee attack with it.",
    },
    {
        id: "",
        name: "Critical Hits",
        category: "Combat",
        tags: ["critical", "crit", "damage", "attack"],
        description:
            "When you score a critical hit, you get to roll extra dice for the attack's damage against the target. Roll all of the attack's damage dice twice and add them together. Then add any relevant modifiers as normal. If the attack involves other damage dice, such as from the rogue's Sneak Attack feature, you roll those dice twice as well.",
    },
    {
        id: "",
        name: "Damage Resistance and Vulnerability",
        category: "Combat",
        tags: ["resistance", "vulnerability", "damage"],
        description:
            "If a creature or an object has resistance to a damage type, damage of that type is halved against it. If a creature or an object has vulnerability to a damage type, damage of that type is doubled against it. Resistance and then vulnerability are applied after all other modifiers to damage. Multiple instances of resistance or vulnerability that affect the same damage type count as only one instance.",
    },
    {
        id: "",
        name: "Dodge",
        category: "Combat",
        tags: ["dodge", "action", "defense"],
        description:
            "When you take the Dodge action, you focus entirely on avoiding attacks. Until the start of your next turn, any attack roll made against you has disadvantage if you can see the attacker, and you make Dexterity saving throws with advantage. You lose this benefit if you are incapacitated or if your speed drops to 0.",
    },
    {
        id: "",
        name: "Dash",
        category: "Combat",
        tags: ["dash", "action", "movement"],
        description:
            "When you take the Dash action, you gain extra movement for the current turn. The increase equals your speed, after applying any modifiers. Any increase or decrease to your speed changes this additional movement by the same amount.",
    },
    {
        id: "",
        name: "Disengage",
        category: "Combat",
        tags: ["disengage", "action", "movement"],
        related: ["Opportunity Attacks"],
        description:
            "If you take the Disengage action, your movement doesn't provoke opportunity attacks for the rest of the turn.",
    },
    {
        id: "",
        name: "Help",
        category: "Combat",
        tags: ["help", "action", "advantage"],
        description:
            "When you take the Help action, the creature you aid gains advantage on the next ability check it makes to perform the task you are helping with, provided that it makes the check before the start of your next turn. Alternatively, you can aid a friendly creature in attacking a creature within 5 feet of you; if your ally attacks that target before your next turn, the first attack roll is made with advantage.",
    },
    {
        id: "",
        name: "Hide",
        category: "Combat",
        tags: ["hide", "action", "stealth"],
        description:
            "When you take the Hide action, you make a Dexterity (Stealth) check in an attempt to hide, following the rules for hiding. If you succeed, you gain certain benefits, as described in the rules for unseen attackers and targets.",
    },
    {
        id: "",
        name: "Ready",
        category: "Combat",
        tags: ["ready", "action", "reaction", "trigger"],
        description:
            "You can take the Ready action on your turn to act using your reaction before the start of your next turn. First, you decide what perceivable circumstance will trigger your reaction. Then, you choose the action you will take in response to that trigger, or you choose to move up to your speed in response to it. When you ready a spell, you cast it as normal but hold its energy (requiring concentration), releasing it with your reaction when the trigger occurs.",
    },
    {
        id: "",
        name: "Search",
        category: "Combat",
        tags: ["search", "action", "perception", "investigation"],
        description:
            "When you take the Search action, you devote your attention to finding something. Depending on the nature of your search, the GM might have you make a Wisdom (Perception) check or an Intelligence (Investigation) check.",
    },
];
