import { AiToolDef } from "./types";

/**
 * JSON-schema tool definitions for homebrew generation. These are a deliberately CURATED SUBSET of
 * the fields a homebrew author cares about — the dispatcher fills the rest of each model with sane
 * defaults (see toolDispatcher.ts). Generating only the authoring-relevant fields keeps the schemas
 * small and reliable across providers, and lets new *optional* model fields be added upstream without
 * breaking generation.
 */

const SCHOOLS = ["Abjuration", "Conjuration", "Divination", "Enchantment", "Evocation", "Illusion", "Necromancy", "Transmutation"];
const SIZES = ["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"];
const RARITIES = ["Common", "Uncommon", "Rare", "Very Rare", "Legendary", "Artifact"];
const ITEM_TYPES = ["Weapon", "Armor", "Tool", "Item"];
const ABILITIES = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
const HIT_DICE = ["d6", "d8", "d10", "d12"];

const featureSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
        level: { type: "integer", minimum: 1, maximum: 20, description: "Class/subclass level the feature is gained at." },
        name: { type: "string", description: "Feature name." },
        description: { type: "string", description: "Feature description (Markdown allowed)." },
    },
    required: ["level", "name", "description"],
};

export const HOMEBREW_TOOLS: AiToolDef[] = [
    {
        name: "create_spell",
        description: "Create a homebrew D&D 5e spell. Call this when the user asks to create or generate a spell.",
        inputSchema: {
            type: "object",
            additionalProperties: false,
            properties: {
                name: { type: "string" },
                description: { type: "string", description: "Full spell effect text (Markdown allowed)." },
                level: { type: "integer", minimum: 0, maximum: 9, description: "Spell level, 0 for cantrip." },
                school: { type: "string", enum: SCHOOLS },
                castingTime: { type: "string", description: 'e.g. "1 action", "1 bonus action", "1 minute".' },
                range: { type: "string", description: 'e.g. "60 feet", "Self", "Touch".' },
                duration: { type: "string", description: 'e.g. "Instantaneous", "1 minute", "Concentration, up to 10 minutes".' },
                concentration: { type: "boolean" },
                ritual: { type: "boolean" },
                isVerbal: { type: "boolean" },
                isSomatic: { type: "boolean" },
                isMaterial: { type: "boolean" },
                materialsNeeded: { type: "string", description: "Material components, if any." },
                higherLevel: { type: "string", description: "Effect when cast at higher levels, if any." },
                classes: { type: "array", items: { type: "string" }, description: "Classes that can cast this spell." },
            },
            required: ["name", "description", "level", "school", "castingTime", "range", "duration", "concentration", "ritual"],
        },
    },
    {
        name: "create_item",
        description: "Create a homebrew mundane item (weapon, armor, tool, or general gear). Use create_magic_item for magical items.",
        inputSchema: {
            type: "object",
            additionalProperties: false,
            properties: {
                name: { type: "string" },
                desc: { type: "string", description: "Item description (Markdown allowed)." },
                type: { type: "string", enum: ITEM_TYPES },
                weight: { type: "number", description: "Weight in pounds." },
                cost: { type: "string", description: 'e.g. "15 gp", "2 sp".' },
            },
            required: ["name", "desc", "type", "weight", "cost"],
        },
    },
    {
        name: "create_magic_item",
        description: "Create a homebrew magic item.",
        inputSchema: {
            type: "object",
            additionalProperties: false,
            properties: {
                name: { type: "string" },
                desc: { type: "string", description: "Item description and effects (Markdown allowed)." },
                rarity: { type: "string", enum: RARITIES },
                category: { type: "string", description: 'e.g. "Wondrous Item", "Weapon", "Armor", "Potion".' },
                cost: { type: "string", description: "Optional value/cost." },
                weight: { type: "string", description: "Optional weight, e.g. \"3 lb\"." },
                attunement: { type: "string", description: 'Attunement requirement, e.g. "Requires attunement by a wizard". Empty if none.' },
                effect: { type: "string", description: "Mechanical effect summary." },
                charges: { type: "string", description: "Charges/recharge, if any." },
            },
            required: ["name", "desc", "rarity", "category"],
        },
    },
    {
        name: "create_feat",
        description: "Create a homebrew feat.",
        inputSchema: {
            type: "object",
            additionalProperties: false,
            properties: {
                name: { type: "string" },
                description: { type: "string", description: "Feat benefits (Markdown allowed)." },
                prerequisite: { type: "string", description: "Prerequisite text, if any (e.g. \"Strength 13 or higher\")." },
            },
            required: ["name", "description"],
        },
    },
    {
        name: "create_background",
        description: "Create a homebrew character background.",
        inputSchema: {
            type: "object",
            additionalProperties: false,
            properties: {
                name: { type: "string" },
                desc: { type: "string", description: "Background description (Markdown allowed)." },
                skills: { type: "array", items: { type: "string" }, description: "Skill proficiencies granted." },
                tools: { type: "array", items: { type: "string" }, description: "Tool proficiencies granted." },
                feat: { type: "string", description: "Granted feat (2024 backgrounds), if any." },
            },
            required: ["name", "desc"],
        },
    },
    {
        name: "create_race",
        description: "Create a homebrew race/species.",
        inputSchema: {
            type: "object",
            additionalProperties: false,
            properties: {
                name: { type: "string" },
                size: { type: "string", enum: SIZES },
                speed: { type: "integer", description: "Walking speed in feet, e.g. 30." },
                languages: { type: "array", items: { type: "string" } },
                abilityBonuses: {
                    type: "array",
                    description: "Ability score increases.",
                    items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                            ability: { type: "string", enum: ABILITIES },
                            value: { type: "integer" },
                        },
                        required: ["ability", "value"],
                    },
                },
                traits: {
                    type: "array",
                    description: "Racial traits.",
                    items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                            name: { type: "string" },
                            description: { type: "string" },
                        },
                        required: ["name", "description"],
                    },
                },
            },
            required: ["name", "size", "speed"],
        },
    },
    {
        name: "create_subclass",
        description: "Create a homebrew subclass for an existing class.",
        inputSchema: {
            type: "object",
            additionalProperties: false,
            properties: {
                name: { type: "string" },
                parentClass: { type: "string", description: 'The base class, e.g. "Wizard", "Fighter".' },
                description: { type: "string", description: "Subclass overview (Markdown allowed)." },
                features: { type: "array", items: featureSchema, description: "Features gained, each tagged with its level." },
            },
            required: ["name", "parentClass", "description"],
        },
    },
    {
        name: "create_class",
        description: "Create a homebrew base class.",
        inputSchema: {
            type: "object",
            additionalProperties: false,
            properties: {
                name: { type: "string" },
                hitDie: { type: "string", enum: HIT_DICE },
                primaryAbility: { type: "string", enum: ABILITIES },
                savingThrows: { type: "array", items: { type: "string", enum: ABILITIES }, description: "Saving throw proficiencies (usually two)." },
                skills: { type: "array", items: { type: "string" }, description: "Skill proficiency options." },
                features: { type: "array", items: featureSchema, description: "Class features, each tagged with its level." },
            },
            required: ["name", "hitDie", "primaryAbility", "savingThrows"],
        },
    },
];
