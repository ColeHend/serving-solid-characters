import type { CommandSpecInput, OptionsMap } from "../spec.ts";

/**
 * Curated OPTION lists for the SRD 5.1 (2014) Warlock: Eldritch Invocations and Pact Boon.
 * The player picks N options on the sheet (scaling with warlock level per the class table);
 * each chosen option shows as a named feature and applies its mads.
 *
 * Mads follow the same literalism rules as mads/2014/classes.ts — only effects the SRD text
 * states mechanically are encoded (at-will spells, senses, skill proficiencies, actions);
 * damage riders (Agonizing Blast, Lifedrinker), Eldritch Blast tweaks, and pact-weapon-only
 * extra attacks stay description-only. "Prerequisite: Eldritch Blast cantrip" is display-only
 * text (spells known aren't features); pact prerequisites use requiredFeature, which matches
 * the Pact Boon option the player chose.
 */

const spell = (name: string): CommandSpecInput => ({ type: "Add", category: "Spells", value: {}, target: name });
const senses = (sense: string, range: string): CommandSpecInput => ({ type: "Add", category: "Senses", value: { sense, range } });
const prof = (proficiency: string): CommandSpecInput => ({ type: "Add", category: "Proficiencies", value: { proficiency } });
const action = (name: string, actionType: string, description?: string): CommandSpecInput =>
    ({ type: "Add", category: "Actions", value: { name, actionType, source: name, ...(description ? { description } : {}) } });

export const optionsMap: OptionsMap = {
    "Warlock/Eldritch Invocations": {
        config: { label: "Invocation", countScaling: "2:2,5:3,7:4,9:5,12:6,15:7,18:8" },
        options: [
            {
                name: "Agonizing Blast",
                description: "When you cast eldritch blast, add your Charisma modifier to the damage it deals on a hit.",
                prerequisite: { text: "Eldritch Blast cantrip" },
            },
            {
                name: "Armor of Shadows",
                description: "You can cast mage armor on yourself at will, without expending a spell slot or material components.",
                mads: [spell("Mage Armor")],
            },
            {
                name: "Ascendant Step",
                description: "You can cast levitate on yourself at will, without expending a spell slot or material components.",
                prerequisite: { minLevel: 9, text: "9th level" },
                mads: [spell("Levitate")],
            },
            {
                name: "Beast Speech",
                description: "You can cast speak with animals at will, without expending a spell slot.",
                mads: [spell("Speak with Animals")],
            },
            {
                name: "Beguiling Influence",
                description: "You gain proficiency in the Deception and Persuasion skills.",
                mads: [prof("Deception"), prof("Persuasion")],
            },
            {
                name: "Bewitching Whispers",
                description: "You can cast compulsion once using a warlock spell slot. You can't do so again until you finish a long rest.",
                prerequisite: { minLevel: 7, text: "7th level" },
                mads: [spell("Compulsion")],
            },
            {
                name: "Book of Ancient Secrets",
                description: "You can now inscribe magical rituals in your Book of Shadows. Choose two 1st-level spells that have the ritual tag from any class's spell list. With your Book of Shadows in hand, you can cast the chosen spells as rituals, and you can add other ritual spells you find to the book.",
                prerequisite: { requiredFeature: "Pact of the Tome", text: "Pact of the Tome feature" },
            },
            {
                name: "Chains of Carceri",
                description: "You can cast hold monster at will — targeting a celestial, fiend, or elemental — without expending a spell slot or material components. You must finish a long rest before you can use this invocation on the same creature again.",
                prerequisite: { minLevel: 15, requiredFeature: "Pact of the Chain", text: "15th level, Pact of the Chain feature" },
                mads: [spell("Hold Monster")],
            },
            {
                name: "Devil's Sight",
                description: "You can see normally in darkness, both magical and nonmagical, to a distance of 120 feet.",
                mads: [senses("darkvision", "120")],
            },
            {
                name: "Dreadful Word",
                description: "You can cast confusion once using a warlock spell slot. You can't do so again until you finish a long rest.",
                prerequisite: { minLevel: 7, text: "7th level" },
                mads: [spell("Confusion")],
            },
            {
                name: "Eldritch Sight",
                description: "You can cast detect magic at will, without expending a spell slot.",
                mads: [spell("Detect Magic")],
            },
            {
                name: "Eldritch Spear",
                description: "When you cast eldritch blast, its range is 300 feet.",
                prerequisite: { text: "Eldritch Blast cantrip" },
            },
            {
                name: "Eyes of the Rune Keeper",
                description: "You can read all writing.",
            },
            {
                name: "Fiendish Vigor",
                description: "You can cast false life on yourself at will as a 1st-level spell, without expending a spell slot or material components.",
                mads: [spell("False Life")],
            },
            {
                name: "Gaze of Two Minds",
                description: "You can use your action to touch a willing humanoid and perceive through its senses until the end of your next turn. As long as the creature is on the same plane of existence as you, you can use your action on subsequent turns to maintain this connection. While perceiving through the other creature's senses, you benefit from any special senses possessed by that creature, and you are blinded and deafened to your own surroundings.",
                mads: [action("Gaze of Two Minds", "action", "Touch a willing humanoid and perceive through its senses until the end of your next turn.")],
            },
            {
                name: "Lifedrinker",
                description: "When you hit a creature with your pact weapon, the creature takes extra necrotic damage equal to your Charisma modifier (minimum 1).",
                prerequisite: { minLevel: 12, requiredFeature: "Pact of the Blade", text: "12th level, Pact of the Blade feature" },
            },
            {
                name: "Mask of Many Faces",
                description: "You can cast disguise self at will, without expending a spell slot.",
                mads: [spell("Disguise Self")],
            },
            {
                name: "Master of Myriad Forms",
                description: "You can cast alter self at will, without expending a spell slot.",
                prerequisite: { minLevel: 15, text: "15th level" },
                mads: [spell("Alter Self")],
            },
            {
                name: "Minions of Chaos",
                description: "You can cast conjure elemental once using a warlock spell slot. You can't do so again until you finish a long rest.",
                prerequisite: { minLevel: 9, text: "9th level" },
                mads: [spell("Conjure Elemental")],
            },
            {
                name: "Mire the Mind",
                description: "You can cast slow once using a warlock spell slot. You can't do so again until you finish a long rest.",
                prerequisite: { minLevel: 5, text: "5th level" },
                mads: [spell("Slow")],
            },
            {
                name: "Misty Visions",
                description: "You can cast silent image at will, without expending a spell slot or material components.",
                mads: [spell("Silent Image")],
            },
            {
                name: "One with Shadows",
                description: "When you are in an area of dim light or darkness, you can use your action to become invisible until you move or take an action or a reaction.",
                prerequisite: { minLevel: 5, text: "5th level" },
                mads: [action("One with Shadows", "action", "While in dim light or darkness, become invisible until you move or take an action or a reaction.")],
            },
            {
                name: "Otherworldly Leap",
                description: "You can cast jump on yourself at will, without expending a spell slot or material components.",
                prerequisite: { minLevel: 9, text: "9th level" },
                mads: [spell("Jump")],
            },
            {
                name: "Repelling Blast",
                description: "When you hit a creature with eldritch blast, you can push the creature up to 10 feet away from you in a straight line.",
                prerequisite: { text: "Eldritch Blast cantrip" },
            },
            {
                name: "Sculptor of Flesh",
                description: "You can cast polymorph once using a warlock spell slot. You can't do so again until you finish a long rest.",
                prerequisite: { minLevel: 7, text: "7th level" },
                mads: [spell("Polymorph")],
            },
            {
                name: "Sign of Ill Omen",
                description: "You can cast bestow curse once using a warlock spell slot. You can't do so again until you finish a long rest.",
                prerequisite: { minLevel: 5, text: "5th level" },
                mads: [spell("Bestow Curse")],
            },
            {
                name: "Thief of Five Fates",
                description: "You can cast bane once using a warlock spell slot. You can't do so again until you finish a long rest.",
                mads: [spell("Bane")],
            },
            {
                name: "Thirsting Blade",
                description: "You can attack with your pact weapon twice, instead of once, whenever you take the Attack action on your turn.",
                prerequisite: { minLevel: 5, requiredFeature: "Pact of the Blade", text: "5th level, Pact of the Blade feature" },
            },
            {
                name: "Visions of Distant Realms",
                description: "You can cast arcane eye at will, without expending a spell slot.",
                prerequisite: { minLevel: 15, text: "15th level" },
                mads: [spell("Arcane Eye")],
            },
            {
                name: "Voice of the Chain Master",
                description: "You can communicate telepathically with your familiar and perceive through your familiar's senses as long as you are on the same plane of existence. Additionally, while perceiving through your familiar's senses, you can also speak through your familiar in your own voice.",
                prerequisite: { requiredFeature: "Pact of the Chain", text: "Pact of the Chain feature" },
            },
            {
                name: "Whispers of the Grave",
                description: "You can cast speak with dead at will, without expending a spell slot.",
                prerequisite: { minLevel: 9, text: "9th level" },
                mads: [spell("Speak with Dead")],
            },
            {
                name: "Witch Sight",
                description: "You can see the true form of any shapechanger or creature concealed by illusion or transmutation magic while the creature is within 30 feet of you and within line of sight.",
                prerequisite: { minLevel: 15, text: "15th level" },
            },
        ],
    },

    // Pact Boon is a pick-ONE option list; modeling it here (count 1) also lets invocation
    // prerequisites like "Pact of the Blade feature" resolve against the chosen pact's name.
    "Warlock/Pact Boon": {
        config: { label: "Pact Boon", count: 1 },
        options: [
            {
                name: "Pact of the Chain",
                description: "You learn the find familiar spell and can cast it as a ritual. The spell doesn't count against your number of spells known. When you cast the spell, you can choose one of the normal forms for your familiar or one of the following special forms: imp, pseudodragon, quasit, or sprite. Additionally, when you take the Attack action, you can forgo one of your own attacks to allow your familiar to make one attack with its reaction.",
                mads: [spell("Find Familiar")],
            },
            {
                name: "Pact of the Blade",
                description: "You can use your action to create a pact weapon in your empty hand. You can choose the form that this melee weapon takes each time you create it. You are proficient with it while you wield it. This weapon counts as magical for the purpose of overcoming resistance and immunity to nonmagical attacks and damage.",
                mads: [action("Create Pact Weapon", "action", "Create a pact weapon in your empty hand, choosing its melee form. You are proficient with it while you wield it.")],
            },
            {
                name: "Pact of the Tome",
                description: "Your patron gives you a grimoire called a Book of Shadows. Choose three cantrips from any class's spell list. While the book is on your person, you can cast those cantrips at will. They don't count against your number of cantrips known.",
                // Nested player choice: three cantrips from ANY class list (filter-derived pool).
                mads: [{ type: "Add", category: "Spells", value: { ID: "choice", count: "3", spellLevel: "0", filterLevel: "0" } }],
            },
        ],
    },
};
