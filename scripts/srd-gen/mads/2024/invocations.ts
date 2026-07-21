import type { CommandSpecInput, OptionsMap } from "../spec.ts";

/**
 * Curated OPTION list for the SRD 5.2 (2024) Warlock's Eldritch Invocations. In 2024 the
 * pacts (Blade/Chain/Tome) are themselves invocations, so invocation prerequisites like
 * "Pact of the Blade Invocation" use requiredFeature against sibling option names.
 *
 * Mads follow the same literalism rules as mads/2024/classes.ts — at-will spells, senses,
 * movement, actions, and concentration advantage are encoded; damage riders, cantrip
 * tweaks (Agonizing Blast / Eldritch Spear / Repelling Blast), feat grants (Lessons of the
 * First Ones), and pact-weapon-only extra attacks stay description-only.
 */

const spell = (name: string): CommandSpecInput => ({ type: "Add", category: "Spells", value: {}, target: name });
const senses = (sense: string, range: string): CommandSpecInput => ({ type: "Add", category: "Senses", value: { sense, range } });
const movement = (movementType: string): CommandSpecInput => ({ type: "Add", category: "Movement", value: { movementType } });
const action = (name: string, actionType: string, description?: string): CommandSpecInput =>
    ({ type: "Add", category: "Actions", value: { name, actionType, source: name, ...(description ? { description } : {}) } });

export const optionsMap: OptionsMap = {
    "Warlock/Eldritch Invocations": {
        config: { label: "Invocation", countScaling: "1:1,2:3,5:5,7:6,9:7,12:8,15:9,18:10" },
        options: [
            {
                name: "Agonizing Blast",
                description: "Choose one of your known Warlock cantrips that deals damage. You can add your Charisma modifier to that spell's damage rolls. Repeatable: each time you take this invocation, choose a different eligible cantrip.",
                prerequisite: { minLevel: 2, text: "Level 2+ Warlock, a Warlock cantrip that deals damage" },
            },
            {
                name: "Armor of Shadows",
                description: "You can cast Mage Armor on yourself without expending a spell slot.",
                mads: [spell("Mage Armor")],
            },
            {
                name: "Ascendant Step",
                description: "You can cast Levitate on yourself without expending a spell slot.",
                prerequisite: { minLevel: 5, text: "Level 5+ Warlock" },
                mads: [spell("Levitate")],
            },
            {
                name: "Devil's Sight",
                description: "You can see normally in Dim Light and Darkness — both magical and nonmagical — within 120 feet of yourself.",
                prerequisite: { minLevel: 2, text: "Level 2+ Warlock" },
                mads: [senses("darkvision", "120")],
            },
            {
                name: "Devouring Blade",
                description: "The Extra Attack of your Thirsting Blade invocation confers two extra attacks rather than one.",
                prerequisite: { minLevel: 12, requiredFeature: "Thirsting Blade", text: "Level 12+ Warlock, Thirsting Blade invocation" },
            },
            {
                name: "Eldritch Mind",
                description: "You have Advantage on Constitution saving throws that you make to maintain Concentration.",
                mads: [{ type: "Add", category: "Advantage", value: { rollType: "SavingThrow", mode: "advantage", stat: "con", condition: "to maintain Concentration" } }],
            },
            {
                name: "Eldritch Smite",
                description: "Once per turn when you hit a creature with your pact weapon, you can expend a Pact Magic spell slot to deal an extra 1d8 Force damage to the target, plus another 1d8 per level of the spell slot, and you can give the target the Prone condition if it is Huge or smaller.",
                prerequisite: { minLevel: 5, requiredFeature: "Pact of the Blade", text: "Level 5+ Warlock, Pact of the Blade invocation" },
            },
            {
                name: "Eldritch Spear",
                description: "Choose one of your known Warlock cantrips that deals damage and has a range of 10+ feet. When you cast that spell, its range increases by a number of feet equal to 30 times your Warlock level. Repeatable: each time you take this invocation, choose a different eligible cantrip.",
                prerequisite: { minLevel: 2, text: "Level 2+ Warlock, a Warlock cantrip that deals damage" },
            },
            {
                name: "Fiendish Vigor",
                description: "You can cast False Life on yourself without expending a spell slot. When you cast the spell with this feature, you don't roll the die for the Temporary Hit Points; you automatically get the highest number on the die.",
                prerequisite: { minLevel: 2, text: "Level 2+ Warlock" },
                mads: [spell("False Life")],
            },
            {
                name: "Gaze of Two Minds",
                description: "You can use a Bonus Action to touch a willing creature and perceive through its senses until the end of your next turn, maintaining the connection on subsequent turns. While perceiving through the other creature's senses, you benefit from its special senses, and you can cast spells as if you were in your space or the other creature's space if you are within 60 feet of each other.",
                prerequisite: { minLevel: 5, text: "Level 5+ Warlock" },
                mads: [action("Gaze of Two Minds", "bonusAction", "Touch a willing creature and perceive through its senses until the end of your next turn.")],
            },
            {
                name: "Gift of the Depths",
                description: "You can breathe underwater, and you gain a Swim Speed equal to your Speed. You can also cast Water Breathing once without expending a spell slot, regaining that use on a Long Rest.",
                prerequisite: { minLevel: 5, text: "Level 5+ Warlock" },
                mads: [movement("swim"), spell("Water Breathing")],
            },
            {
                name: "Gift of the Protectors",
                description: "A new page appears in your Book of Shadows when you conjure it. A creature can write its name on that page (up to your Charisma modifier in names). When a named creature is reduced to 0 Hit Points but not killed outright, it drops to 1 Hit Point instead. Once triggered, no creature benefits until you finish a Long Rest.",
                prerequisite: { minLevel: 9, requiredFeature: "Pact of the Tome", text: "Level 9+ Warlock, Pact of the Tome invocation" },
            },
            {
                name: "Investment of the Chain Master",
                description: "When you cast Find Familiar, the familiar gains a Fly or Swim Speed of 40 feet; you can command it to take the Attack action as a Bonus Action; its attacks can deal Necrotic or Radiant damage; it uses your spell save DC; and you can take a Reaction to grant it Resistance against damage it takes.",
                prerequisite: { minLevel: 5, requiredFeature: "Pact of the Chain", text: "Level 5+ Warlock, Pact of the Chain invocation" },
            },
            {
                name: "Lessons of the First Ones",
                description: "You have received knowledge from an elder entity of the multiverse, allowing you to gain one Origin feat of your choice. Repeatable: each time you take this invocation, choose a different Origin feat.",
                prerequisite: { minLevel: 2, text: "Level 2+ Warlock" },
            },
            {
                name: "Lifedrinker",
                description: "Once per turn when you hit a creature with your pact weapon, you can deal an extra 1d6 Necrotic, Psychic, or Radiant damage (your choice), and you can expend one of your Hit Point Dice to roll it and regain Hit Points equal to the roll plus your Constitution modifier (minimum of 1).",
                prerequisite: { minLevel: 9, requiredFeature: "Pact of the Blade", text: "Level 9+ Warlock, Pact of the Blade invocation" },
            },
            {
                name: "Mask of Many Faces",
                description: "You can cast Disguise Self without expending a spell slot.",
                prerequisite: { minLevel: 2, text: "Level 2+ Warlock" },
                mads: [spell("Disguise Self")],
            },
            {
                name: "Master of Myriad Forms",
                description: "You can cast Alter Self without expending a spell slot.",
                prerequisite: { minLevel: 5, text: "Level 5+ Warlock" },
                mads: [spell("Alter Self")],
            },
            {
                name: "Misty Visions",
                description: "You can cast Silent Image without expending a spell slot.",
                prerequisite: { minLevel: 2, text: "Level 2+ Warlock" },
                mads: [spell("Silent Image")],
            },
            {
                name: "One with Shadows",
                description: "While you're in an area of Dim Light or Darkness, you can cast Invisibility on yourself without expending a spell slot.",
                prerequisite: { minLevel: 5, text: "Level 5+ Warlock" },
                mads: [spell("Invisibility")],
            },
            {
                name: "Otherworldly Leap",
                description: "You can cast Jump on yourself without expending a spell slot.",
                prerequisite: { minLevel: 2, text: "Level 2+ Warlock" },
                mads: [spell("Jump")],
            },
            {
                name: "Pact of the Blade",
                description: "As a Bonus Action, you can conjure a pact weapon in your hand — a Simple or Martial Melee weapon of your choice — or bond with a magic weapon you touch. Until the bond ends, you have proficiency with the weapon and can use it as a Spellcasting Focus. You can use your Charisma modifier for its attack and damage rolls, and it can deal Necrotic, Psychic, or Radiant damage or its normal type.",
                mads: [action("Conjure Pact Weapon", "bonusAction", "Conjure a pact weapon in your hand or bond with a magic weapon you touch.")],
            },
            {
                name: "Pact of the Chain",
                description: "You learn the Find Familiar spell and can cast it as a Magic action without expending a spell slot. Your familiar can take special forms (Imp, Pseudodragon, Quasit, Skeleton, Sphinx of Wonder, Sprite, Venomous Snake), and when you take the Attack action you can forgo one of your attacks to let your familiar make one with its Reaction.",
                mads: [spell("Find Familiar")],
            },
            {
                name: "Pact of the Tome",
                description: "You conjure a Book of Shadows at the end of a Short or Long Rest. When the book appears, choose three cantrips and two level 1 spells with the Ritual tag from any class's spell list. While the book is on your person, you have those spells prepared, and they function as Warlock spells for you. You can use the book as a Spellcasting Focus.",
                // Nested player choices: three cantrips + two level-1 ritual spells, any class list.
                mads: [
                    { type: "Add", category: "Spells", value: { ID: "choice", count: "3", spellLevel: "0", filterLevel: "0" } },
                    { type: "Add", category: "Spells", value: { ID: "choice", count: "2", spellLevel: "1", filterLevel: "1", filterRitual: "true" } },
                ],
            },
            {
                name: "Repelling Blast",
                description: "Choose one of your known Warlock cantrips that requires an attack roll. When you hit a Large or smaller creature with that cantrip, you can push the creature up to 10 feet straight away from you. Repeatable: each time you take this invocation, choose a different eligible cantrip.",
                prerequisite: { minLevel: 2, text: "Level 2+ Warlock, a Warlock cantrip that deals damage via an attack roll" },
            },
            {
                name: "Thirsting Blade",
                description: "You gain the Extra Attack feature for your pact weapon only. With that feature, you can attack twice with the weapon instead of once when you take the Attack action on your turn.",
                prerequisite: { minLevel: 5, requiredFeature: "Pact of the Blade", text: "Level 5+ Warlock, Pact of the Blade invocation" },
            },
            {
                name: "Visions of Distant Realms",
                description: "You can cast Arcane Eye without expending a spell slot.",
                prerequisite: { minLevel: 9, text: "Level 9+ Warlock" },
                mads: [spell("Arcane Eye")],
            },
            {
                name: "Whispers of the Grave",
                description: "You can cast Speak with Dead without expending a spell slot.",
                prerequisite: { minLevel: 7, text: "Level 7+ Warlock" },
                mads: [spell("Speak with Dead")],
            },
            {
                name: "Witch Sight",
                description: "You have Truesight with a range of 30 feet.",
                prerequisite: { minLevel: 15, text: "Level 15+ Warlock" },
                mads: [senses("truesight", "30")],
            },
        ],
    },
};
