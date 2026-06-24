import { AiToolDef } from "./types";

/**
 * JSON-schema tool definitions for homebrew generation. These cover the authoring-relevant fields a
 * homebrew creator cares about; the dispatcher (toolDispatcher.ts) fills any remaining model fields
 * with sane defaults and flags empty recommended fields back to the user.
 *
 * IMPORTANT: every property a mapper in toolDispatcher.ts reads (`i.X`) MUST be declared here, or the
 * model can never be asked to fill it. Per-property `description`s are deliberately prescriptive ("never
 * leave empty", "2-4 sentences") and each tool carries a compact worked example — small local models
 * (e.g. gemma via Ollama) lean heavily on these to produce complete, rich content. Keep examples short:
 * Ollama silently truncates the prompt to its context window, so don't bloat the schemas.
 */

const SCHOOLS = ["Abjuration", "Conjuration", "Divination", "Enchantment", "Evocation", "Illusion", "Necromancy", "Transmutation"];
const SIZES = ["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"];
const RARITIES = ["Common", "Uncommon", "Rare", "Very Rare", "Legendary", "Artifact"];
const ITEM_TYPES = ["Weapon", "Armor", "Tool", "Item"];
const ABILITIES = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
const HIT_DICE = ["d6", "d8", "d10", "d12"];

/** A class/subclass feature, tagged with the level it is gained at. */
const featureSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
        level: { type: "integer", minimum: 1, maximum: 20, description: "Level the feature is gained at (1-20)." },
        name: { type: "string", description: "Feature name, e.g. \"Rage\", \"Sneak Attack\"." },
        description: { type: "string", description: "What the feature does — full rules text with concrete numbers (Markdown allowed). 1-3 sentences minimum; never leave empty." },
    },
    required: ["level", "name", "description"],
};

/** A background feature (not leveled), e.g. \"Shelter of the Faithful\". */
const namedFeatureSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
        name: { type: "string", description: "Feature name." },
        description: { type: "string", description: "What the feature grants — full rules text (Markdown allowed). Never leave empty." },
    },
    required: ["name", "description"],
};

export const HOMEBREW_TOOLS: AiToolDef[] = [
    {
        name: "create_spell",
        description: "Create a homebrew D&D 5e spell. Fill EVERY field — especially a full multi-sentence description. Example: {\"name\":\"Ember Dart\",\"description\":\"You hurl a mote of fire at a creature within range. Make a ranged spell attack. On a hit the target takes 1d6 fire damage and ignites, taking 1d4 fire damage at the start of its next turn unless it uses an action to douse the flames.\",\"level\":0,\"school\":\"Evocation\",\"castingTime\":\"1 action\",\"range\":\"60 feet\",\"duration\":\"Instantaneous\",\"concentration\":false,\"ritual\":false,\"isVerbal\":true,\"isSomatic\":true,\"isMaterial\":false,\"damageType\":\"fire\",\"classes\":[\"Sorcerer\",\"Wizard\"]}",
        inputSchema: {
            type: "object",
            additionalProperties: false,
            properties: {
                name: { type: "string", description: "Spell name." },
                description: { type: "string", description: "Full spell effect text including saves, attack rolls, damage dice and conditions (Markdown allowed). Write 2-4 sentences minimum; never leave empty." },
                level: { type: "integer", minimum: 0, maximum: 9, description: "Spell level, 0 for a cantrip." },
                school: { type: "string", enum: SCHOOLS, description: "School of magic." },
                castingTime: { type: "string", description: 'e.g. "1 action", "1 bonus action", "1 minute". Never leave empty.' },
                range: { type: "string", description: 'e.g. "60 feet", "Self", "Touch". Never leave empty.' },
                duration: { type: "string", description: 'e.g. "Instantaneous", "1 minute", "Concentration, up to 10 minutes". Never leave empty.' },
                concentration: { type: "boolean", description: "True if the spell requires concentration." },
                ritual: { type: "boolean", description: "True if the spell can be cast as a ritual." },
                isVerbal: { type: "boolean", description: "True if it has a Verbal (V) component." },
                isSomatic: { type: "boolean", description: "True if it has a Somatic (S) component." },
                isMaterial: { type: "boolean", description: "True if it has a Material (M) component." },
                materialsNeeded: { type: "string", description: "The material components, if isMaterial is true." },
                higherLevel: { type: "string", description: "Effect when cast using a higher-level slot, if any." },
                damageType: { type: "string", description: 'Damage type if the spell deals damage, e.g. "fire", "cold", "radiant". Empty for non-damaging spells.' },
                classes: { type: "array", items: { type: "string" }, description: "Classes that can learn this spell, e.g. [\"Wizard\",\"Cleric\"]." },
            },
            required: ["name", "description", "level", "school", "castingTime", "range", "duration", "concentration", "ritual", "isVerbal", "isSomatic", "isMaterial"],
        },
    },
    {
        name: "create_item",
        description: "Create a homebrew mundane item (weapon, armor, tool, or general gear). Use create_magic_item for magical items. Fill the description with concrete stats. Example: {\"name\":\"Reinforced Buckler\",\"desc\":\"A small steel shield bolted with extra plating. Grants +2 AC while wielded but imposes disadvantage on Stealth checks.\",\"type\":\"Armor\",\"weight\":4,\"cost\":\"15 gp\"}",
        inputSchema: {
            type: "object",
            additionalProperties: false,
            properties: {
                name: { type: "string", description: "Item name." },
                desc: { type: "string", description: "Item description with concrete mechanics (damage, AC, properties) and flavor (Markdown allowed). Never leave empty." },
                type: { type: "string", enum: ITEM_TYPES, description: "Item category." },
                weight: { type: "number", description: "Weight in pounds (0 if weightless)." },
                cost: { type: "string", description: 'Purchase cost, e.g. "15 gp", "2 sp".' },
            },
            required: ["name", "desc", "type", "weight", "cost"],
        },
    },
    {
        name: "create_magic_item",
        description: "Create a homebrew magic item. Spell out the mechanical effect in the description. Example: {\"name\":\"Cloak of the Ember Fox\",\"desc\":\"A russet cloak that smells faintly of woodsmoke. While wearing it you have resistance to cold damage and can cast Misty Step once per long rest without expending a spell slot.\",\"rarity\":\"Uncommon\",\"category\":\"Wondrous Item\",\"attunement\":\"Requires attunement\",\"effect\":\"Resistance to cold; Misty Step 1/long rest\"}",
        inputSchema: {
            type: "object",
            additionalProperties: false,
            properties: {
                name: { type: "string", description: "Magic item name." },
                desc: { type: "string", description: "Full description and magical effects with concrete numbers (Markdown allowed). Write 2-4 sentences minimum; never leave empty." },
                rarity: { type: "string", enum: RARITIES, description: "Item rarity." },
                category: { type: "string", description: 'e.g. "Wondrous Item", "Weapon", "Armor", "Potion", "Ring".' },
                cost: { type: "string", description: "Approximate value/cost, if relevant." },
                weight: { type: "string", description: 'Weight, e.g. "3 lb". Empty if negligible.' },
                attunement: { type: "string", description: 'Attunement requirement, e.g. "Requires attunement by a wizard". Empty if none.' },
                effect: { type: "string", description: "One-line summary of the mechanical effect." },
                charges: { type: "string", description: "Charges/recharge if applicable, e.g. \"3 charges, regains 1d3 at dawn\". Empty if none." },
            },
            required: ["name", "desc", "rarity", "category"],
        },
    },
    {
        name: "create_feat",
        description: "Create a homebrew feat. The description must list the concrete benefits as bullet points or sentences. Example: {\"name\":\"Cinderborn\",\"description\":\"You have been touched by elemental fire.\\n- You gain resistance to fire damage.\\n- Once per long rest you can deal an extra 2d6 fire damage on a melee hit.\",\"prerequisite\":\"Constitution 13 or higher\"}",
        inputSchema: {
            type: "object",
            additionalProperties: false,
            properties: {
                name: { type: "string", description: "Feat name." },
                description: { type: "string", description: "The feat's concrete benefits (Markdown/bullets allowed). Write at least 2 distinct benefits; never leave empty." },
                prerequisite: { type: "string", description: "Prerequisite, if any, e.g. \"Strength 13 or higher\". Empty if none." },
            },
            required: ["name", "description"],
        },
    },
    {
        name: "create_background",
        description: "Create a homebrew character background. Include a flavorful description, the granted skill proficiencies, and a background feature. Example: {\"name\":\"Ashfall Survivor\",\"desc\":\"You lived through the eruption that buried your home. You know how to find shelter and read the sky for danger.\",\"skills\":[\"Survival\",\"Perception\"],\"tools\":[\"Cartographer's tools\"],\"features\":[{\"name\":\"Reader of Omens\",\"description\":\"You can always find a safe place to rest in the wilderness for you and up to five companions.\"}]}",
        inputSchema: {
            type: "object",
            additionalProperties: false,
            properties: {
                name: { type: "string", description: "Background name." },
                desc: { type: "string", description: "Flavorful description of who has this background and what they did (Markdown allowed). Write 2-3 sentences minimum; never leave empty." },
                skills: { type: "array", items: { type: "string" }, description: "Skill proficiencies granted, usually two, e.g. [\"Insight\",\"Religion\"]." },
                tools: { type: "array", items: { type: "string" }, description: "Tool proficiencies granted, if any." },
                armor: { type: "array", items: { type: "string" }, description: "Armor proficiencies granted, if any (rare for backgrounds)." },
                weapons: { type: "array", items: { type: "string" }, description: "Weapon proficiencies granted, if any (rare for backgrounds)." },
                feat: { type: "string", description: "Granted feat name (2024 backgrounds), if any." },
                features: { type: "array", items: namedFeatureSchema, description: "Background feature(s) — at least one, e.g. \"Shelter of the Faithful\"." },
            },
            required: ["name", "desc"],
        },
    },
    {
        name: "create_race",
        description: "Create a homebrew race/species with at least two distinct racial traits. Example: {\"name\":\"Emberkin\",\"size\":\"Medium\",\"speed\":30,\"languages\":[\"Common\",\"Ignan\"],\"abilityBonuses\":[{\"ability\":\"CON\",\"value\":2},{\"ability\":\"CHA\",\"value\":1}],\"traits\":[{\"name\":\"Ember Resistance\",\"description\":\"You have resistance to fire damage.\"},{\"name\":\"Cinder Sight\",\"description\":\"You can see normally in dim light and through smoke within 60 feet.\"}],\"age\":\"Emberkin mature by 18 and live around 120 years.\",\"alignment\":\"Often chaotic, valuing freedom and passion.\"}",
        inputSchema: {
            type: "object",
            additionalProperties: false,
            properties: {
                name: { type: "string", description: "Race/species name." },
                size: { type: "string", enum: SIZES, description: "Creature size." },
                speed: { type: "integer", description: "Walking speed in feet, e.g. 30." },
                languages: { type: "array", items: { type: "string" }, description: "Languages known, e.g. [\"Common\",\"Elvish\"]." },
                abilityBonuses: {
                    type: "array",
                    description: "Ability score increases (2014-style species bonuses; for 2024 these usually come from the background instead).",
                    items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                            ability: { type: "string", enum: ABILITIES, description: "Which ability." },
                            value: { type: "integer", description: "Bonus amount, usually 1 or 2." },
                        },
                        required: ["ability", "value"],
                    },
                },
                traits: {
                    type: "array",
                    description: "Racial traits — provide at least two, each with a real rules effect.",
                    items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                            name: { type: "string", description: "Trait name." },
                            description: { type: "string", description: "What the trait does (Markdown allowed). Never leave empty." },
                        },
                        required: ["name", "description"],
                    },
                },
                age: { type: "string", description: "Flavor: how the species ages and how long it lives." },
                alignment: { type: "string", description: "Flavor: typical alignment tendencies." },
            },
            required: ["name", "size", "speed"],
        },
    },
    {
        name: "create_subclass",
        description: "Create a homebrew subclass for an existing class, with a description and features at the appropriate levels. Example: {\"name\":\"Path of the Ember\",\"parentClass\":\"Barbarian\",\"description\":\"Barbarians who channel inner fire, burning hotter the angrier they get.\",\"features\":[{\"level\":3,\"name\":\"Burning Rage\",\"description\":\"While raging, a creature that hits you with a melee attack takes 2 fire damage.\"},{\"level\":6,\"name\":\"Heat Shield\",\"description\":\"You gain resistance to fire damage.\"}]}",
        inputSchema: {
            type: "object",
            additionalProperties: false,
            properties: {
                name: { type: "string", description: "Subclass name." },
                parentClass: { type: "string", description: 'The base class this subclass belongs to, e.g. "Wizard", "Fighter".' },
                description: { type: "string", description: "Overview of the subclass's theme and playstyle (Markdown allowed). Write 2-3 sentences minimum; never leave empty." },
                features: { type: "array", items: featureSchema, description: "Features gained, each tagged with its level. Provide a feature at the subclass's normal levels (typically 3, 6, 10, 14)." },
            },
            required: ["name", "parentClass", "description"],
        },
    },
    {
        name: "create_class",
        description: "Create a homebrew base class with saving throws, proficiencies, and features across levels. If it is a spellcaster, note that in a feature and the user will finish the spell-slot setup in the editor. Example: {\"name\":\"Warden\",\"hitDie\":\"d10\",\"primaryAbility\":\"WIS\",\"savingThrows\":[\"CON\",\"WIS\"],\"skills\":[\"Nature\",\"Perception\",\"Survival\"],\"armor\":[\"Light armor\",\"Medium armor\",\"Shields\"],\"weapons\":[\"Simple weapons\",\"Martial weapons\"],\"features\":[{\"level\":1,\"name\":\"Guardian's Mark\",\"description\":\"As a bonus action, mark a creature you can see. You have advantage on attacks against it until the end of your next turn.\"},{\"level\":2,\"name\":\"Wild Stride\",\"description\":\"Difficult terrain costs you no extra movement.\"}],\"startingEquipment\":[\"A martial weapon\",\"Leather armor\",\"An explorer's pack\"]}",
        inputSchema: {
            type: "object",
            additionalProperties: false,
            properties: {
                name: { type: "string", description: "Class name." },
                hitDie: { type: "string", enum: HIT_DICE, description: "Hit die size." },
                primaryAbility: { type: "string", enum: ABILITIES, description: "Primary ability score." },
                savingThrows: { type: "array", items: { type: "string", enum: ABILITIES }, description: "Saving throw proficiencies (usually two)." },
                skills: { type: "array", items: { type: "string" }, description: "Skill proficiency options the class can choose from." },
                armor: { type: "array", items: { type: "string" }, description: "Armor proficiencies, e.g. [\"Light armor\",\"Shields\"]." },
                weapons: { type: "array", items: { type: "string" }, description: "Weapon proficiencies, e.g. [\"Simple weapons\"]." },
                tools: { type: "array", items: { type: "string" }, description: "Tool proficiencies, if any." },
                features: { type: "array", items: featureSchema, description: "Class features, each tagged with its level. Provide at least a level-1 and level-2 feature." },
                startingEquipment: { type: "array", items: { type: "string" }, description: "Starting equipment items, e.g. [\"A simple weapon\",\"Leather armor\"]." },
            },
            required: ["name", "hitDie", "primaryAbility", "savingThrows"],
        },
    },
];
