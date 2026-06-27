import { AiToolDef } from "../types";
import { HOMEBREW_KINDS, HomebrewKind, KIND_TO_TOOL } from "../refs/homebrewKind";
import {
    AiSettings, DEFAULT_AI_ASK_TOOLS, DEFAULT_AI_MATH_TOOLS, DEFAULT_AI_PLAN_TOOLS,
    DEFAULT_TOOL_PERMISSIONS, ToolPermissions,
} from "../../../models/userSettings";
import { COMPUTE_TOOLS } from "./computeTools";
import { ASK_USER_TOOL, PROPOSE_PLAN_TOOL } from "./interactions";

/**
 * JSON-schema tool definitions for homebrew generation. These cover the authoring-relevant fields a
 * homebrew creator cares about; the dispatcher (toolDispatcher.ts) fills any remaining model fields
 * with sane defaults and flags empty recommended fields back to the user.
 *
 * IMPORTANT: every property a mapper in toolDispatcher.ts reads (`i.X`) MUST be declared here, or the
 * model can never be asked to fill it. Per-property `description`s carry structural hints ("2-4
 * sentences", which enum) and each tool carries a compact worked example — small local models (e.g.
 * gemma via Ollama) lean heavily on these. The completeness rule ("never leave a supported field empty")
 * and "concrete numbers, never placeholders" live ONCE in the system prompt's quality bar
 * (systemPrompt.ts), not repeated per-field — keep it that way to protect the local model's token budget.
 * Keep examples short and thematically varied (only the spell example is fire); Ollama silently truncates
 * the prompt to its context window, so don't bloat the schemas.
 *
 * ZERO-PERSONA SURFACE: these descriptions are parsed for mechanics and must stay procedurally neutral —
 * never add the Grimoire voice here, or the model may bleed flavor into tool-call JSON values.
 */

const SCHOOLS = ["Abjuration", "Conjuration", "Divination", "Enchantment", "Evocation", "Illusion", "Necromancy", "Transmutation"];
const SIZES = ["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"];
const RARITIES = ["Common", "Uncommon", "Rare", "Very Rare", "Legendary", "Artifact"];
const ITEM_TYPES = ["Weapon", "Armor", "Tool", "Item"];
const ABILITIES = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
const HIT_DICE = ["d6", "d8", "d10", "d12"];
const CASTER_TYPES = ["none", "third", "half", "full", "pact"];

/** A class/subclass feature, tagged with the level it is gained at. */
const featureSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
        level: { type: "integer", minimum: 1, maximum: 20, description: "Level the feature is gained at (1-20)." },
        name: { type: "string", description: "Feature name, e.g. \"Rage\", \"Sneak Attack\"." },
        description: { type: "string", description: "What the feature does — full rules text with concrete numbers (Markdown allowed). 1-3 sentences minimum." },
    },
    required: ["level", "name", "description"],
};

/** A background feature (not leveled), e.g. \"Shelter of the Faithful\". */
const namedFeatureSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
        name: { type: "string", description: "Feature name." },
        description: { type: "string", description: "What the feature grants — full rules text (Markdown allowed)." },
    },
    required: ["name", "description"],
};

export const HOMEBREW_TOOLS: AiToolDef[] = [
    {
        name: "create_spell",
        description: "Create a homebrew D&D 5e spell. Fill all required fields plus any optional field that genuinely applies (leave inapplicable optionals empty, e.g. no damageType on a non-damaging spell); always write a full multi-sentence description. Example: {\"name\":\"Ember Dart\",\"description\":\"You hurl a mote of fire at a creature within range. Make a ranged spell attack. On a hit the target takes 1d6 fire damage and ignites, taking 1d4 fire damage at the start of its next turn unless it uses an action to douse the flames.\",\"level\":0,\"school\":\"Evocation\",\"castingTime\":\"1 action\",\"range\":\"60 feet\",\"duration\":\"Instantaneous\",\"concentration\":false,\"ritual\":false,\"isVerbal\":true,\"isSomatic\":true,\"isMaterial\":false,\"damageType\":\"fire\",\"classes\":[\"Sorcerer\",\"Wizard\"]}",
        inputSchema: {
            type: "object",
            additionalProperties: false,
            properties: {
                name: { type: "string", description: "Spell name." },
                description: { type: "string", description: "Full spell effect text including saves, attack rolls, damage dice and conditions (Markdown allowed). Write 2-4 sentences minimum." },
                level: { type: "integer", minimum: 0, maximum: 9, description: "Spell level, 0 for a cantrip." },
                school: { type: "string", enum: SCHOOLS, description: "School of magic." },
                castingTime: { type: "string", description: 'e.g. "1 action", "1 bonus action", "1 minute".' },
                range: { type: "string", description: 'e.g. "60 feet", "Self", "Touch".' },
                duration: { type: "string", description: 'e.g. "Instantaneous", "1 minute", "Concentration, up to 10 minutes".' },
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
                desc: { type: "string", description: "Item description with concrete mechanics (damage, AC, properties) and flavor (Markdown allowed)." },
                type: { type: "string", enum: ITEM_TYPES, description: "Item category." },
                weight: { type: "number", description: "Weight in pounds (0 if weightless)." },
                cost: { type: "string", description: 'Purchase cost, e.g. "15 gp", "2 sp".' },
            },
            required: ["name", "desc", "type", "weight", "cost"],
        },
    },
    {
        name: "create_magic_item",
        description: "Create a homebrew magic item. Spell out the mechanical effect in the description. Example: {\"name\":\"Mantle of the Drifting Frost\",\"desc\":\"A pale grey mantle that trails a faint chill. While wearing it you have resistance to cold damage and can cast Misty Step once per long rest without expending a spell slot.\",\"rarity\":\"Uncommon\",\"category\":\"Wondrous Item\",\"attunement\":\"Requires attunement\",\"effect\":\"Resistance to cold; Misty Step 1/long rest\"}",
        inputSchema: {
            type: "object",
            additionalProperties: false,
            properties: {
                name: { type: "string", description: "Magic item name." },
                desc: { type: "string", description: "Full description and magical effects with concrete numbers (Markdown allowed). Write 2-4 sentences minimum." },
                rarity: { type: "string", enum: RARITIES, description: "Item rarity." },
                category: { type: "string", description: 'e.g. "Wondrous Item", "Weapon", "Armor", "Potion", "Ring".' },
                cost: { type: "string", description: "Approximate value/cost, if relevant." },
                weight: { type: "string", description: 'Weight, e.g. "3 lb". Empty if negligible.' },
                attunement: { type: "string", description: 'Attunement requirement, e.g. "Requires attunement by a wizard". Empty if none.' },
                effect: { type: "string", description: "One-line summary of the mechanical effect for quick reference, e.g. \"Resistance to cold; Misty Step 1/long rest\". Empty if not applicable." },
                charges: { type: "string", description: "Charges/recharge if applicable, e.g. \"3 charges, regains 1d3 at dawn\". Empty if none." },
            },
            required: ["name", "desc", "rarity", "category"],
        },
    },
    {
        name: "create_feat",
        description: "Create a homebrew feat. The description must list the concrete benefits as bullet points or sentences. Example: {\"name\":\"Thornwoven\",\"description\":\"You have been claimed by the wild wood.\\n- You gain resistance to poison damage.\\n- Once per long rest, when you hit a creature with a melee attack you can cause grasping vines to restrain it until the end of its next turn (Strength save DC 8 + your proficiency bonus + your Constitution modifier ends it).\",\"prerequisite\":\"Constitution 13 or higher\"}",
        inputSchema: {
            type: "object",
            additionalProperties: false,
            properties: {
                name: { type: "string", description: "Feat name." },
                description: { type: "string", description: "The feat's concrete benefits (Markdown/bullets allowed). Write at least 2 distinct benefits." },
                prerequisite: { type: "string", description: "Prerequisite, if any, e.g. \"Strength 13 or higher\". Empty if none." },
            },
            required: ["name", "description"],
        },
    },
    {
        name: "create_background",
        description: "Create a homebrew character background. Include a flavorful description, the granted skill proficiencies, and a background feature. Example: {\"name\":\"Tidewatch Sailor\",\"desc\":\"You crewed a ship through storm and doldrum and learned to read the sky and water for danger. The rhythms of port towns are second nature to you.\",\"skills\":[\"Athletics\",\"Perception\"],\"tools\":[\"Navigator's tools\"],\"features\":[{\"name\":\"Safe Harbor\",\"description\":\"You can always find safe passage and lodging in a port town for you and up to five companions.\"}]}",
        inputSchema: {
            type: "object",
            additionalProperties: false,
            properties: {
                name: { type: "string", description: "Background name." },
                desc: { type: "string", description: "Flavorful description of who has this background and what they did (Markdown allowed). Write 2-3 sentences minimum." },
                skills: { type: "array", items: { type: "string" }, description: "Skill proficiencies granted, usually two, e.g. [\"Insight\",\"Religion\"]." },
                tools: { type: "array", items: { type: "string" }, description: "Tool proficiencies granted, if any." },
                armor: { type: "array", items: { type: "string" }, description: "Armor proficiencies granted, if any (rare for backgrounds)." },
                weapons: { type: "array", items: { type: "string" }, description: "Weapon proficiencies granted, if any (rare for backgrounds)." },
                feat: { type: "string", description: "Granted feat name (2024 backgrounds), if any. Must name a real feat — the character build resolves it by name." },
                abilityOptions: { type: "array", items: { type: "string", enum: ABILITIES }, description: "Ability scores this background can boost (2024 rules — the +2/+1 or +1×3 ASI). Usually three, e.g. [\"INT\",\"WIS\",\"CHA\"]. Leave empty for 2014 backgrounds." },
                features: { type: "array", items: namedFeatureSchema, description: "Background feature(s) — at least one, e.g. \"Shelter of the Faithful\"." },
            },
            required: ["name", "desc"],
        },
    },
    {
        name: "create_race",
        description: "Create a homebrew race/species with at least two distinct racial traits. Example: {\"name\":\"Cairnkin\",\"size\":\"Medium\",\"speed\":30,\"languages\":[\"Common\",\"Terran\"],\"abilityBonuses\":[{\"ability\":\"CON\",\"value\":2},{\"ability\":\"WIS\",\"value\":1}],\"traits\":[{\"name\":\"Stoneborn Resilience\",\"description\":\"You have resistance to poison damage and advantage on saving throws against being poisoned.\"},{\"name\":\"Stonecunning Sight\",\"description\":\"You can see normally in dim light within 60 feet and can sense the rough shape of stone tunnels you touch.\"}],\"age\":\"Cairnkin reach adulthood near 40 and live some 250 years.\",\"alignment\":\"Often lawful, valuing patience and permanence.\"}",
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
                            description: { type: "string", description: "What the trait does (Markdown allowed)." },
                        },
                        required: ["name", "description"],
                    },
                },
                age: { type: "string", description: "Flavor: how the species ages and how long it lives. Empty if not applicable." },
                alignment: { type: "string", description: "Flavor: typical alignment tendencies. Empty if not applicable." },
            },
            required: ["name", "size", "speed"],
        },
    },
    {
        name: "create_subclass",
        description: "Create a homebrew subclass for an existing class, with a description and features at the appropriate levels. Example: {\"name\":\"Path of the Tempest\",\"parentClass\":\"Barbarian\",\"description\":\"Barbarians who call the storm into their fury, crackling with lightning as their rage builds.\",\"features\":[{\"level\":3,\"name\":\"Storm's Wrath\",\"description\":\"While raging, a creature that hits you with a melee attack takes 2 lightning damage.\"},{\"level\":6,\"name\":\"Thunderhide\",\"description\":\"You gain resistance to lightning and thunder damage.\"}]}",
        inputSchema: {
            type: "object",
            additionalProperties: false,
            properties: {
                name: { type: "string", description: "Subclass name." },
                parentClass: { type: "string", description: 'The base class this subclass belongs to, e.g. "Wizard", "Fighter".' },
                description: { type: "string", description: "Overview of the subclass's theme and playstyle (Markdown allowed). Write 2-3 sentences minimum." },
                features: { type: "array", items: featureSchema, description: "Features gained, each tagged with its level. Provide a feature at the subclass's normal levels (typically 3, 6, 10, 14)." },
                casterType: { type: "string", enum: CASTER_TYPES, description: "Set ONLY if this subclass grants spellcasting its base class lacks (e.g. Eldritch Knight = \"third\"). \"third\"/\"half\"/\"full\"/\"pact\" fill the spell-slot table; omit or \"none\" otherwise." },
            },
            required: ["name", "parentClass", "description", "features"],
        },
    },
];

/**
 * The one-shot `create_class` schema. M4 (StagedGenPipeline.Plan.md §6, §13) removed it from the
 * model-facing `HOMEBREW_TOOLS`: the model can no longer author a whole class in a single call — class
 * creation now flows through the staged `generate_class` pipeline (genPipeline/). The schema lives on
 * because it is still used INTERNALLY: the pipeline's assemble step (genPipeline/assemble.ts) rebuilds
 * this exact tool input and runs it through `buildPreview`/`toClass`/`validateEntity`, reusing the typed
 * mapper and hard blockers instead of hand-mapping the generated DTO; and `requiredFieldsForKind("class")`
 * still resolves its required list for completeness checks. It is never advertised to the model.
 */
export const CREATE_CLASS_TOOL: AiToolDef = {
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
            casterType: { type: "string", enum: CASTER_TYPES, description: "Spellcasting progression: \"none\" (martial), \"third\" (e.g. Eldritch Knight), \"half\" (e.g. Paladin), \"full\" (e.g. Wizard), or \"pact\" (Warlock). Set this for any spellcaster — the app fills the spell-slot table from it. Omit or \"none\" for a non-caster." },
        },
        required: ["name", "hitDie", "primaryAbility", "savingThrows", "features"],
    },
};

/**
 * Every create_* schema, INCLUDING the internal-only `create_class`. Completeness lookups
 * (`requiredFieldsForKind`) must still resolve required fields for the "class" kind even though it is no
 * longer a model-facing tool, so they read this list rather than the trimmed `HOMEBREW_TOOLS`.
 */
const ALL_CREATE_TOOLS: AiToolDef[] = [...HOMEBREW_TOOLS, CREATE_CLASS_TOOL];

/**
 * Seed tool for the staged generation pipeline (plan §4). Unlike a `create_*` tool the model does NOT
 * fill the whole entity here — it hands a concept + any hard user picks to the code-owned orchestrator,
 * which then drives the model per step (design brief → ratified skeleton → chassis → …). Routed to the
 * "pipeline" category (toolCategory.ts), so finishTurn starts the orchestrator instead of building a
 * one-shot preview.
 *
 * ZERO-PERSONA SURFACE: keep procedurally neutral, like the other tool schemas.
 */
export const GENERATE_CLASS_TOOL: AiToolDef = {
    name: "generate_class",
    description:
        "Generate a complete homebrew D&D 5e class through a guided, staged process: it drafts a design brief, " +
        "proposes a skeleton for the user to approve, then builds the class around it. This is the ONLY way to " +
        "create a base class — use it for any \"make/create/build a class\" request. Pass the user's concept " +
        "verbatim plus any hard requirements they stated. Example: {\"concept\":\"a knight who borrows strength " +
        "from a bound storm\",\"requirements\":[\"no spellcasting\",\"d10 hit die\"]}.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            concept: { type: "string", description: "The class concept in the user's words — what it fundamentally is." },
            requirements: { type: "array", items: { type: "string" }, description: "Hard requirements the user stated (hit die, role, no spellcasting, power level, etc.). May be empty." },
        },
        required: ["concept"],
    },
};

/** The seed tools that trigger the staged generation pipeline. Only `generate_class` ships in M1–M4. */
export const PIPELINE_TOOLS: AiToolDef[] = [GENERATE_CLASS_TOOL];

/**
 * The homebrew kind each seed tool generates. A seed tool is gated by the SAME create permission as its
 * kind (denying "class" creation must deny both `create_class` — gone — and its replacement
 * `generate_class`), so this maps the seed back to its kind for `filterPipelineTools`.
 */
export const PIPELINE_TOOL_KIND: Record<string, HomebrewKind> = {
    generate_class: "class",
};

/**
 * The pipeline seed tools permitted under the given permissions. M4 routes class creation through
 * `generate_class`, so it must honor the same allow/deny grid as the old `create_class` did — a user who
 * denied "class" should not be offered the staged generator either.
 */
export function filterPipelineTools(perms: ToolPermissions | undefined): AiToolDef[] {
    const allowed = new Set(allowedKinds(perms));
    return PIPELINE_TOOLS.filter(t => allowed.has(PIPELINE_TOOL_KIND[t.name]));
}

/**
 * Resolve which homebrew kinds the model is permitted to create under the given permissions.
 * "all" → every kind; "allow" → only the listed kinds; "deny" → every kind except the listed ones.
 * Defensive against missing/garbage lists (treats them as empty).
 */
export function allowedKinds(perms: ToolPermissions | undefined): HomebrewKind[] {
    const p = perms ?? DEFAULT_TOOL_PERMISSIONS;
    switch (p.mode) {
        case "allow": {
            const allow = new Set(p.allowed ?? []);
            return HOMEBREW_KINDS.filter(k => allow.has(k));
        }
        case "deny": {
            const deny = new Set(p.denied ?? []);
            return HOMEBREW_KINDS.filter(k => !deny.has(k));
        }
        case "all":
        default:
            return [...HOMEBREW_KINDS];
    }
}

/** The required-field names the model must fill for a given kind (from that kind's create_* schema). */
export function requiredFieldsForKind(kind: HomebrewKind): string[] {
    const tool = ALL_CREATE_TOOLS.find(t => t.name === KIND_TO_TOOL[kind]);
    const req = (tool?.inputSchema as { required?: unknown })?.required;
    return Array.isArray(req) ? (req as string[]) : [];
}

/** The create_* tool definitions the model may use under the given permissions (preserves order). */
export function filterTools(tools: AiToolDef[], perms: ToolPermissions | undefined): AiToolDef[] {
    const allowed = new Set(allowedKinds(perms).map(k => KIND_TO_TOOL[k]));
    return tools.filter(t => allowed.has(t.name));
}

/**
 * The utility tools (compute + interactive) enabled by the user's settings. These are offered in BOTH
 * chat and homebrew modes, independent of toolPermissions/usageLevel (which gate only create_* tools).
 * Each group defaults ON.
 */
export function enabledUtilityTools(ai: AiSettings | undefined): AiToolDef[] {
    const out: AiToolDef[] = [];
    if (ai?.mathTools ?? DEFAULT_AI_MATH_TOOLS) out.push(...COMPUTE_TOOLS);
    if (ai?.askTools ?? DEFAULT_AI_ASK_TOOLS) out.push(ASK_USER_TOOL);
    if (ai?.planTools ?? DEFAULT_AI_PLAN_TOOLS) out.push(PROPOSE_PLAN_TOOL);
    return out;
}
