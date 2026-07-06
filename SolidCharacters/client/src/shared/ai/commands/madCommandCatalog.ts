import { MadFeature, MadType } from "../../../models/generated";

/**
 * Single source of truth for the "mads" character-change commands the homebrew command sub-agent can
 * attach to a generated feature. Mirrors what the manual editor authors in featuresPopup.tsx, but as
 * pure data + pure coercion so it can drive three things at once: the attach_commands tool schema, the
 * post-generation validator (commandAgent.ts), and the preview-card chip labels.
 *
 * LEAF MODULE: imports only the generated model types. No homebrewManager / Solid / hook imports, so the
 * tool schema and the orchestration store can both depend on it without an import cycle. Name→id
 * resolution for the ID-based categories is INJECTED (the `resolveRef` callback) rather than imported.
 *
 * SAFETY: several command handlers (shared/customHooks/mads/commands/*) index the character by the value
 * directly and throw / produce NaN on a missing or unknown key — e.g. useResistanceFeature does
 * `value['damageType'].trim()`, useACFeature iterates `value['stats']`, useProficienciesFeature reads
 * `skills[value['proficiency']].stat`. So coercion here is strict: a command whose required fields don't
 * resolve to KNOWN options is dropped entirely rather than attached as a sheet-corrupting no-op.
 */

/** The 23 command categories (each becomes Add<Category> / Remove<Category>). Mirrors MadCommands. */
export type MadCategory =
    | "Spells" | "Items" | "Proficiencies" | "Features" | "Currency" | "ArmorClass"
    | "Expertise" | "Feats" | "Languages" | "Resistances" | "Vulnerabilities"
    | "Immunities" | "SavingThrows" | "Stats" | "Speed" | "AllProficiencies"
    | "ClassFeature" | "Advantage" | "Attacks" | "Uses"
    | "Movement" | "Senses" | "HitPoints";

export const MAD_CATEGORIES: MadCategory[] = [
    "Spells", "Items", "Proficiencies", "Features", "Currency", "ArmorClass",
    "Expertise", "Feats", "Languages", "Resistances", "Vulnerabilities",
    "Immunities", "SavingThrows", "Stats", "Speed", "AllProficiencies",
    "ClassFeature", "Advantage", "Attacks", "Uses",
    "Movement", "Senses", "HitPoints",
];

/** Catalog entities a command can reference by name (resolved to the entity's `.id`). */
export type RefKind = "spell" | "item" | "feature" | "feat";

// ---- canonical option sets (match the character model + the manual pickers) ----

/** Ability keys exactly as stored on character.stats (see useCharacters.ts `Stats`). */
export const ABILITY_KEYS = ["str", "dex", "con", "int", "wis", "cha"] as const;

/** Full ability name → key, so "Constitution"/"CON" still map to "con". */
const ABILITY_ALIASES: Record<string, string> = {
    strength: "str", dexterity: "dex", constitution: "con",
    intelligence: "int", wisdom: "wis", charisma: "cha",
};

/** Canonical skill keys exactly as initialised on character.proficiencies.skills (characterMapper.ts). */
export const SKILL_KEYS = [
    "Acrobatics", "Animal Handling", "Arcana", "History", "Athletics", "Deception", "Insight",
    "Intimidation", "Investigation", "Medicine", "Nature", "Perception", "Performance",
    "Persuasion", "Religion", "Sleight Of Hand", "Stealth", "Survival",
] as const;

/** Damage types (resistance/vulnerability/immunity). Matches resistanceFeature.tsx. */
export const DAMAGE_TYPES = [
    "Acid", "Cold", "Fire", "Force", "Lightning", "Necrotic", "Poison", "Psychic",
    "Radiant", "Thunder", "Bludgeoning", "Piercing", "Slashing",
] as const;

/** Currency keys exactly as stored on character.items.currency (note the "sliver" spelling). */
export const CURRENCY_KEYS = [
    "platinumPieces", "goldPieces", "electrumPieces", "sliverPieces", "copperPieces",
] as const;

/** Common synonyms → currency key (the model often writes "gold"/"gp"). */
const CURRENCY_ALIASES: Record<string, string> = {
    pp: "platinumPieces", platinum: "platinumPieces",
    gp: "goldPieces", gold: "goldPieces",
    ep: "electrumPieces", electrum: "electrumPieces",
    sp: "sliverPieces", silver: "sliverPieces", sliver: "sliverPieces",
    cp: "copperPieces", copper: "copperPieces",
};

/** Proficiency-bonus fractions for AllProficiencies (matches useAllProficiencyFeature.ts switch). */
export const PB_CHOICES = ["Third PB", "Half PB", "Full PB"] as const;

/** Standard languages — a HINT for the model; any non-empty string is accepted. */
export const COMMON_LANGUAGES = [
    "Common", "Undercommon", "Abyssal", "Infernal", "Celestial", "Primordial", "Draconic",
    "Dwarvish", "Elvish", "Giant", "Gnomish", "Goblin", "Halfling", "Orc", "Sylvan", "Deep Speech",
] as const;

/** Roll types an Advantage command can target (matches AdvantageRollType on the character model). */
export const ROLL_TYPES = ["SavingThrow", "WeaponAttack", "SpellAttack", "Initiative", "AbilityCheck"] as const;

/** Advantage modes (disadvantage is still an ADD command; Remove revokes a previous grant). */
export const ADV_MODES = ["advantage", "disadvantage"] as const;

/** Recharge cadences for limited-use (Uses) commands. */
export const RECHARGE_TYPES = ["Short Rest", "Long Rest"] as const;

/** Movement modes a Movement command can grant (matches the MovementType enum on the character model). */
export const MOVEMENT_TYPES = ["walk", "fly", "swim", "climb", "burrow"] as const;

/** Loose movement phrasings → canonical MOVEMENT_TYPES entry (keys are lowercased, non-alpha stripped). */
const MOVEMENT_ALIASES: Record<string, string> = {
    walking: "walk", flying: "fly", flight: "fly", hover: "fly",
    swimming: "swim", climbing: "climb", burrowing: "burrow",
};

/** Special senses a Senses command can grant (stored lowercase in character.senses). */
export const SENSE_TYPES = ["darkvision", "blindsight", "tremorsense", "truesight"] as const;

/** Loose roll-type phrasings → canonical ROLL_TYPES entry (keys are lowercased, non-alpha stripped). */
const ROLL_TYPE_ALIASES: Record<string, string> = {
    save: "SavingThrow", saves: "SavingThrow", savingthrow: "SavingThrow", savingthrows: "SavingThrow",
    attack: "WeaponAttack", attacks: "WeaponAttack", attackroll: "WeaponAttack", attackrolls: "WeaponAttack",
    weaponattack: "WeaponAttack", weaponattacks: "WeaponAttack", meleeattack: "WeaponAttack", rangedattack: "WeaponAttack",
    spellattack: "SpellAttack", spellattacks: "SpellAttack", spellattackroll: "SpellAttack",
    initiative: "Initiative", initiativeroll: "Initiative", initiativerolls: "Initiative",
    check: "AbilityCheck", checks: "AbilityCheck", abilitycheck: "AbilityCheck", abilitychecks: "AbilityCheck",
    skillcheck: "AbilityCheck", skillchecks: "AbilityCheck",
};

// ---- field specs ----

type FieldType = "number" | "ability" | "abilityOrChoice" | "abilityCsv" | "skill" | "skillCsv" | "damageType" | "currency" | "pbChoice" | "text" | "ref" | "rollType" | "advMode" | "recharge" | "statMode" | "movementType" | "sense" | "flag";

interface FieldSpec {
    /** The value-object key this field writes (e.g. "bonus", "damageType", "ID"). */
    key: string;
    type: FieldType;
    /** Required fields that don't resolve cause the whole command to be dropped. */
    required: boolean;
}

interface CommandSpec {
    category: MadCategory;
    /** True when the command references a catalog entity by name (resolved to its `.id`). */
    idBased: boolean;
    refKind?: RefKind;
    addFields: FieldSpec[];
    /** Remove-variant fields (a few categories use a different key on remove, e.g. Items). */
    removeFields: FieldSpec[];
    /** One-line cheat-sheet hint shown to the sub-agent. */
    hint: string;
    /** MadType stamped by coerceCommand (defaults to Character; Uses is Info). */
    madType?: MadType;
    /** Value keys commandChipLabel shows (defaults to all — keeps long fields like descriptions off chips). */
    labelKeys?: string[];
}

const REF = (key: string): FieldSpec => ({ key, type: "ref", required: true });

export const COMMAND_CATALOG: Record<MadCategory, CommandSpec> = {
    Spells: { category: "Spells", idBased: true, refKind: "spell", addFields: [REF("ID")], removeFields: [REF("ID")], hint: "grants/removes a spell — target = exact spell name" },
    Items: { category: "Items", idBased: true, refKind: "item", addFields: [REF("ID")], removeFields: [REF("name")], hint: "grants/removes an item — target = exact item name" },
    Features: { category: "Features", idBased: true, refKind: "feature", addFields: [REF("ID")], removeFields: [REF("ID")], hint: "grants/removes another existing feature — target = exact feature name" },
    Feats: { category: "Feats", idBased: true, refKind: "feat", addFields: [REF("featID")], removeFields: [REF("featID")], hint: "grants/removes a feat — target = exact feat name" },
    ArmorClass: {
        category: "ArmorClass", idBased: false,
        addFields: [{ key: "bonus", type: "number", required: true }, { key: "stats", type: "abilityCsv", required: true }],
        removeFields: [{ key: "bonus", type: "number", required: true }, { key: "stats", type: "abilityCsv", required: true }],
        hint: "sets AC = bonus + listed ability modifier(s); bonus = number, stats = one or more of str,dex,con,int,wis,cha (use for 'AC equals 13 + Dex' style traits — an AC formula is NEVER Stats)",
    },
    Speed: {
        category: "Speed", idBased: false,
        labelKeys: ["speed", "mode"],
        addFields: [
            { key: "speed", type: "number", required: true },
            { key: "mode", type: "statMode", required: false },
        ],
        removeFields: [{ key: "speed", type: "number", required: true }],
        hint: "changes WALKING speed by a number of feet; speed = number. For 'your walking speed becomes N' effects use mode = set (default mode is increase). " +
            "A flying/swimming/climbing/burrowing speed is NEVER Speed — that is Movement.",
    },
    Movement: {
        category: "Movement", idBased: false,
        addFields: [
            { key: "movementType", type: "movementType", required: true },
            { key: "speed", type: "number", required: false },
        ],
        removeFields: [{ key: "movementType", type: "movementType", required: true }],
        hint: "grants a movement mode; movementType = fly/swim/climb/burrow, speed = its speed in feet — OMIT speed when the text says it equals your walking speed " +
            "(use for 'you have a flying speed of 60 feet' / 'a climbing speed equal to your walking speed'; a plain walking-speed change is Speed, not Movement)",
    },
    Senses: {
        category: "Senses", idBased: false,
        addFields: [
            { key: "sense", type: "sense", required: true },
            { key: "range", type: "number", required: true },
        ],
        removeFields: [{ key: "sense", type: "sense", required: true }],
        hint: "grants a special sense; sense = darkvision/blindsight/tremorsense/truesight, range = number of feet (use for 'you have darkvision out to a range of 60 feet' style traits)",
    },
    HitPoints: {
        category: "HitPoints", idBased: false,
        addFields: [
            { key: "amount", type: "number", required: true },
            { key: "perLevel", type: "flag", required: false },
        ],
        removeFields: [
            { key: "amount", type: "number", required: true },
            { key: "perLevel", type: "flag", required: false },
        ],
        hint: "raises the hit point MAXIMUM; amount = number, perLevel = true when it scales with level " +
            "('your hit point maximum increases by 1, and again every time you gain a level' → amount 1, perLevel true; healing and temporary hit points have NO command)",
    },
    Stats: {
        category: "Stats", idBased: false,
        labelKeys: ["stat", "statValue", "mode"],
        addFields: [
            { key: "stat", type: "abilityOrChoice", required: true },
            { key: "statValue", type: "number", required: true },
            { key: "options", type: "abilityCsv", required: false },
            { key: "mode", type: "statMode", required: false },
        ],
        removeFields: [
            { key: "stat", type: "abilityOrChoice", required: true },
            { key: "statValue", type: "number", required: true },
            { key: "options", type: "abilityCsv", required: false },
            { key: "mode", type: "statMode", required: false },
        ],
        hint: "changes an ability score; stat = str/dex/con/int/wis/cha, statValue = number (for '+1 Con' style increases — never for AC formulas or skill bonuses). " +
            "For 'increase an ability of your choice' use stat = choice with options = comma-separated allowed abilities (the player picks on the sheet). " +
            "For 'your score IS N' effects use mode = set (default mode is increase).",
    },
    SavingThrows: {
        category: "SavingThrows", idBased: false,
        addFields: [{ key: "stat", type: "ability", required: true }], removeFields: [{ key: "stat", type: "ability", required: true }],
        hint: "grants saving-throw proficiency; stat = str/dex/con/int/wis/cha (saving throws only — skill proficiency is Proficiencies)",
    },
    Proficiencies: {
        category: "Proficiencies", idBased: false,
        addFields: [{ key: "proficiency", type: "skill", required: true }], removeFields: [{ key: "proficiency", type: "skill", required: true }],
        hint: "grants proficiency in one skill; proficiency = a skill name (skills only — saving-throw proficiency is SavingThrows)",
    },
    Expertise: {
        category: "Expertise", idBased: false,
        addFields: [{ key: "proficiencies", type: "skillCsv", required: true }], removeFields: [{ key: "proficiencies", type: "skillCsv", required: true }],
        hint: "grants expertise in one or more skills; proficiencies = comma-separated skill names",
    },
    AllProficiencies: {
        category: "AllProficiencies", idBased: false,
        addFields: [{ key: "allProficiencies", type: "skillCsv", required: true }, { key: "proficiencyBonusChoice", type: "pbChoice", required: true }],
        removeFields: [{ key: "allProficiencies", type: "skillCsv", required: true }, { key: "proficiencyBonusChoice", type: "pbChoice", required: true }],
        hint: "adds a fraction of proficiency bonus to several skills; allProficiencies = comma-separated skills, proficiencyBonusChoice = 'Third PB'/'Half PB'/'Full PB'",
    },
    Resistances: {
        category: "Resistances", idBased: false,
        addFields: [{ key: "damageType", type: "damageType", required: true }], removeFields: [{ key: "damageType", type: "damageType", required: true }],
        hint: "grants resistance to a damage type; damageType = one of the standard damage types",
    },
    Vulnerabilities: {
        category: "Vulnerabilities", idBased: false,
        addFields: [{ key: "damageType", type: "damageType", required: true }], removeFields: [{ key: "damageType", type: "damageType", required: true }],
        hint: "grants vulnerability to a damage type; damageType = one of the standard damage types",
    },
    Immunities: {
        category: "Immunities", idBased: false,
        addFields: [{ key: "damageType", type: "damageType", required: true }], removeFields: [{ key: "damageType", type: "damageType", required: true }],
        hint: "grants immunity to a damage type; damageType = one of the standard damage types",
    },
    Languages: {
        category: "Languages", idBased: false,
        addFields: [{ key: "name", type: "text", required: true }], removeFields: [{ key: "name", type: "text", required: true }],
        hint: "grants/removes a language; name = the language",
    },
    Currency: {
        category: "Currency", idBased: false,
        addFields: [{ key: "type", type: "currency", required: true }, { key: "amount", type: "number", required: true }],
        removeFields: [{ key: "type", type: "currency", required: true }, { key: "amount", type: "number", required: true }],
        hint: "grants/removes currency; type = platinumPieces/goldPieces/electrumPieces/sliverPieces/copperPieces, amount = number",
    },
    ClassFeature: {
        category: "ClassFeature", idBased: false,
        labelKeys: ["name", "category"],
        addFields: [
            { key: "name", type: "text", required: true },
            { key: "description", type: "text", required: false },
            { key: "category", type: "text", required: false },
        ],
        removeFields: [{ key: "name", type: "text", required: true }],
        hint: "grants a named class-specific pick (Eldritch Invocation, Fighting Style, Weapon Mastery, Maneuver, Metamagic...) as a new feature on the sheet; name = the pick's name, description = its rules text, category = the pick type",
    },
    Advantage: {
        category: "Advantage", idBased: false,
        addFields: [
            { key: "rollType", type: "rollType", required: true },
            { key: "mode", type: "advMode", required: true },
            { key: "stat", type: "ability", required: false },
            { key: "condition", type: "text", required: false },
        ],
        removeFields: [
            { key: "rollType", type: "rollType", required: true },
            { key: "mode", type: "advMode", required: true },
            { key: "stat", type: "ability", required: false },
            { key: "condition", type: "text", required: false },
        ],
        hint: "grants advantage OR disadvantage on a roll — disadvantage is still an Add with mode=disadvantage (Remove only revokes a previous grant); rollType = SavingThrow/WeaponAttack/SpellAttack/Initiative/AbilityCheck, mode = advantage/disadvantage, stat (optional) = str/dex/con/int/wis/cha for saves/checks, condition (optional) = qualifier like 'against being frightened'",
    },
    Attacks: {
        category: "Attacks", idBased: false,
        addFields: [{ key: "amount", type: "number", required: true }],
        removeFields: [{ key: "amount", type: "number", required: true }],
        hint: "grants extra attacks per Attack action (Extra Attack = amount 1); amount = number of additional attacks",
    },
    Uses: {
        category: "Uses", idBased: false, madType: MadType.Info,
        addFields: [
            { key: "amount", type: "number", required: true },
            { key: "recharge", type: "recharge", required: false },
        ],
        removeFields: [{ key: "amount", type: "number", required: true }],
        hint: "marks THIS feature as limited-use (e.g. 'you can use this twice, regaining all uses on a long rest'); amount = number of uses, recharge = Short Rest or Long Rest",
    },
};

/**
 * Cross-category disambiguation appended to every command cheat sheet (whole-entity, per-feature, and
 * the mechanics translate stage). These are the observed wrong-placement failures on small local
 * models — value keys swapped between look-alike categories — stated as input → exact command so the
 * model pattern-matches the boundary instead of guessing it. Keep this the single canonical home for
 * mistake examples; the cheat-sheet builders import it rather than restating them.
 */
export const COMMAND_COMMON_MISTAKES =
    "Common mistakes — encode these exactly:\n" +
    "- \"your AC equals 13 + your Dexterity modifier\" → ArmorClass {\"bonus\":\"13\",\"stats\":\"dex\"} (an AC formula is NEVER Stats)\n" +
    "- \"unarmored defense: AC 10 + Dex + Con\" → ArmorClass {\"bonus\":\"10\",\"stats\":\"dex,con\"}\n" +
    "- \"your Constitution score increases by 1\" → Stats {\"stat\":\"con\",\"statValue\":\"1\"} (an ability increase is NEVER ArmorClass)\n" +
    "- \"proficiency in Dexterity saving throws\" → SavingThrows {\"stat\":\"dex\"} (Proficiencies is for SKILLS only)\n" +
    "- \"increase one ability score of your choice by 1\" → Stats {\"stat\":\"choice\",\"options\":\"str,dex,con,int,wis,cha\",\"statValue\":\"1\"}\n" +
    "- \"your Intelligence is 19 while wearing this\" → Stats {\"stat\":\"int\",\"statValue\":\"19\",\"mode\":\"set\"}\n" +
    "- \"you have a flying speed of 60 feet\" → Movement {\"movementType\":\"fly\",\"speed\":\"60\"} (a fly/swim/climb/burrow speed is NEVER Speed)\n" +
    "- \"a climbing speed equal to your walking speed\" → Movement {\"movementType\":\"climb\"} (omit speed when it equals walking speed)\n" +
    "- \"your speed increases by 10 feet\" → Speed {\"speed\":\"10\"} (a plain walking-speed change is NEVER Movement)\n" +
    "- \"your walking speed becomes 30 feet\" → Speed {\"speed\":\"30\",\"mode\":\"set\"}\n" +
    "- \"you have darkvision out to a range of 60 feet\" → Senses {\"sense\":\"darkvision\",\"range\":\"60\"}\n" +
    "- \"your hit point maximum increases by 1 every time you gain a level\" → HitPoints {\"amount\":\"1\",\"perLevel\":\"true\"}\n" +
    "- \"advantage on Stealth checks\" / \"once per long rest…\" → no command (advantage and temporary or situational effects have no category)";

// ---- pure coercion ----

const norm = (v: unknown): string => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "").trim();

/** Match a value against an option list case-insensitively, returning the canonical option or null. */
function matchOption(raw: string, options: readonly string[]): string | null {
    const lc = raw.toLowerCase();
    return options.find(o => o.toLowerCase() === lc) ?? null;
}

/**
 * Singular/loose aliases → canonical category, so a small model writing "Resistance"/"Saving Throw"/"AC"
 * still resolves instead of silently dropping the command. Only the CATEGORY lookup is loosened here; the
 * value-field coercion below stays strict (sheet safety — see the SAFETY note at the top).
 */
const CATEGORY_ALIASES: Record<string, MadCategory> = {
    resistance: "Resistances", vulnerability: "Vulnerabilities", immunity: "Immunities",
    stat: "Stats", ability: "Stats", abilityscore: "Stats", abilities: "Stats",
    proficiency: "Proficiencies", skill: "Proficiencies", skills: "Proficiencies",
    savingthrow: "SavingThrows", savingthrows: "SavingThrows", save: "SavingThrows", saves: "SavingThrows",
    language: "Languages", spell: "Spells", item: "Items", feat: "Feats",
    feature: "Features", speed: "Speed", ac: "ArmorClass", armorclass: "ArmorClass",
    expertise: "Expertise", currency: "Currency", allproficiency: "AllProficiencies",
    advantage: "Advantage", disadvantage: "Advantage", advantages: "Advantage",
    attack: "Attacks", extraattack: "Attacks", extraattacks: "Attacks",
    use: "Uses", limiteduse: "Uses", limiteduses: "Uses",
    movement: "Movement", movements: "Movement", movementtype: "Movement", movementtypes: "Movement",
    movementmode: "Movement", flyspeed: "Movement", flyingspeed: "Movement", swimspeed: "Movement",
    swimmingspeed: "Movement", climbspeed: "Movement", climbingspeed: "Movement", burrowspeed: "Movement",
    sense: "Senses", vision: "Senses", darkvision: "Senses", blindsight: "Senses",
    tremorsense: "Senses", truesight: "Senses",
    hitpoint: "HitPoints", hitpoints: "HitPoints", hp: "HitPoints", maxhp: "HitPoints",
    hitpointmaximum: "HitPoints", hitpointmax: "HitPoints", maxhitpoints: "HitPoints", health: "HitPoints",
    classfeature: "ClassFeature", classfeatures: "ClassFeature",
    invocation: "ClassFeature", invocations: "ClassFeature",
    eldritchinvocation: "ClassFeature", eldritchinvocations: "ClassFeature",
    fightingstyle: "ClassFeature", fightingstyles: "ClassFeature",
    weaponmastery: "ClassFeature", mastery: "ClassFeature", masteries: "ClassFeature",
    maneuver: "ClassFeature", maneuvers: "ClassFeature", metamagic: "ClassFeature",
};

/** Resolve a model-written category to its canonical form: exact match, then alias, then singular→plural. */
export function resolveCategory(raw: string): MadCategory | null {
    const exact = matchOption(norm(raw), MAD_CATEGORIES);
    if (exact) return exact as MadCategory;
    const key = norm(raw).toLowerCase().replace(/[^a-z]/g, "");
    if (CATEGORY_ALIASES[key]) return CATEGORY_ALIASES[key];
    const plural = matchOption(`${norm(raw)}s`, MAD_CATEGORIES);
    return plural ? (plural as MadCategory) : null;
}

function coerceAbility(raw: string): string | null {
    if (!raw) return null;
    const lc = raw.toLowerCase();
    if ((ABILITY_KEYS as readonly string[]).includes(lc)) return lc;
    return ABILITY_ALIASES[lc] ?? null;
}

function coerceCurrency(raw: string): string | null {
    if (!raw) return null;
    return matchOption(raw, CURRENCY_KEYS) ?? CURRENCY_ALIASES[raw.toLowerCase()] ?? null;
}

function coercePbChoice(raw: string): string | null {
    if (!raw) return null;
    const exact = matchOption(raw, PB_CHOICES);
    if (exact) return exact;
    const lc = raw.toLowerCase();
    if (lc.includes("third") || lc.includes("1/3")) return "Third PB";
    if (lc.includes("half") || lc.includes("1/2")) return "Half PB";
    if (lc.includes("full")) return "Full PB";
    return null;
}

function coerceRollType(raw: string): string | null {
    if (!raw) return null;
    const exact = matchOption(raw, ROLL_TYPES);
    if (exact) return exact;
    const key = raw.toLowerCase().replace(/[^a-z]/g, "");
    return ROLL_TYPE_ALIASES[key] ?? null;
}

function coerceAdvMode(raw: string): string | null {
    if (!raw) return null;
    const lc = raw.toLowerCase();
    if (lc.startsWith("dis")) return "disadvantage";
    if (lc.startsWith("adv")) return "advantage";
    return null;
}

function coerceRecharge(raw: string): string | null {
    if (!raw) return null;
    const lc = raw.toLowerCase();
    if (lc.includes("short")) return "Short Rest";
    if (lc.includes("long") || lc.includes("day") || lc.includes("dawn")) return "Long Rest";
    return null;
}

function coerceMovementType(raw: string): string | null {
    if (!raw) return null;
    const key = raw.toLowerCase().replace(/[^a-z]/g, "");
    if ((MOVEMENT_TYPES as readonly string[]).includes(key)) return key;
    return MOVEMENT_ALIASES[key] ?? null;
}

function coerceSense(raw: string): string | null {
    if (!raw) return null;
    const key = raw.toLowerCase().replace(/[^a-z]/g, "");
    if ((SENSE_TYPES as readonly string[]).includes(key)) return key;
    if (key === "trueseeing") return "truesight";
    return null;
}

/** Coerce CSV input against an option mapper; returns the canonical comma-joined list, or null if empty. */
function coerceCsv(raw: string, map: (s: string) => string | null): string | null {
    const parts = raw.split(",").map(s => s.trim()).filter(Boolean).map(map).filter((x): x is string => !!x);
    const unique = [...new Set(parts)];
    return unique.length ? unique.join(",") : null;
}

/** Coerce one field's raw value to its canonical stored string, or null if it doesn't resolve. */
function coerceField(spec: FieldSpec, raw: unknown, target: string, resolveRef: (refKind: RefKind, name: string) => string | null, refKind: RefKind | undefined): string | null {
    if (spec.type === "ref") {
        const name = norm(raw) || target;
        if (!name || !refKind) return null;
        return resolveRef(refKind, name);
    }
    const value = norm(raw);
    switch (spec.type) {
        case "number": {
            if (value === "" || isNaN(Number(value))) return null;
            return String(Number(value));
        }
        case "ability": return coerceAbility(value);
        case "abilityOrChoice": return value.toLowerCase() === "choice" ? "choice" : coerceAbility(value);
        case "abilityCsv": return coerceCsv(value, coerceAbility);
        case "statMode": {
            const lc = value.toLowerCase();
            if (lc.startsWith("set")) return "set";
            if (lc.startsWith("inc") || lc.startsWith("add")) return "increase";
            return null;
        }
        case "movementType": return coerceMovementType(value);
        case "sense": return coerceSense(value);
        case "flag": {
            const lc = value.toLowerCase();
            if (lc === "true" || lc === "yes" || lc === "1") return "true";
            return null; // absence means false — a falsy optional flag is simply dropped
        }
        case "skill": return matchOption(value, SKILL_KEYS);
        case "skillCsv": return coerceCsv(value, s => matchOption(s, SKILL_KEYS));
        case "damageType": return matchOption(value, DAMAGE_TYPES);
        case "currency": return coerceCurrency(value);
        case "pbChoice": return coercePbChoice(value);
        case "rollType": return coerceRollType(value);
        case "advMode": return coerceAdvMode(value);
        case "recharge": return coerceRecharge(value);
        case "text": return value || null;
        default: return null;
    }
}

/**
 * Coerce one model-proposed command into a valid MadFeature, or null to DROP it. `resolveRef` maps a
 * name to a catalog entity's `.id` (injected so this module stays leaf/pure). Any required field that
 * doesn't resolve to a known option drops the whole command — never attach a sheet-corrupting no-op.
 */
export function coerceCommand(
    type: "Add" | "Remove",
    rawCategory: string,
    rawValue: Record<string, unknown> | undefined,
    target: string | undefined,
    resolveRef: (refKind: RefKind, name: string) => string | null,
): MadFeature | null {
    const category = resolveCategory(rawCategory);
    if (!category) return null;
    const t = type === "Remove" ? "Remove" : "Add";
    const spec = COMMAND_CATALOG[category];
    const fields = t === "Remove" ? spec.removeFields : spec.addFields;
    const value: Record<string, string> = {};
    for (const field of fields) {
        const coerced = coerceField(field, rawValue?.[field.key], norm(target), resolveRef, spec.refKind);
        if (coerced === null) {
            if (field.required) return null;
            continue;
        }
        value[field.key] = coerced;
    }
    // choice-form Stats needs the allowed-options list or the sheet can never resolve the pick
    if (category === "Stats" && value["stat"] === "choice" && !value["options"]) return null;
    return { command: `${t}${category}`, value, type: spec.madType ?? MadType.Character, prerequisites: [], group: 0 };
}

// ---- display ----

/** "AddArmorClass" → "Add Armor Class". */
export function prettyCommand(command: string): string {
    return command.split(/(?=[A-Z])/).join(" ").trim();
}

/** The category part of a command string ("AddArmorClass" → "ArmorClass"), or null. */
export function categoryOf(command: string): MadCategory | null {
    const cat = command.replace(/^(Add|Remove)/, "");
    return (MAD_CATEGORIES as string[]).includes(cat) ? (cat as MadCategory) : null;
}

/**
 * Validate one ALREADY-STORED MadFeature against the catalog — used by the High-mode MADS validation step
 * (genPipeline/madsStep) to catch sheet-corrupting commands (the runtime sheet handlers throw / produce NaN
 * on an unknown key, see the SAFETY note at the top). Returns the reasons the command is illegal, or [] if
 * it is well-formed. Mirrors coerceCommand's strictness for value fields; ID-based ref fields hold an opaque
 * catalog id post-enrichment (the name is already resolved away), so we only require a non-empty string there.
 */
export function validateStoredCommand(mad: MadFeature): string[] {
    const command = typeof mad?.command === "string" ? mad.command : "";
    const isAdd = command.startsWith("Add");
    const isRemove = command.startsWith("Remove");
    const category = categoryOf(command);
    if (!category || (!isAdd && !isRemove)) {
        return [`"${command || "(empty)"}" is not a valid Add/Remove command`];
    }
    const errors: string[] = [];
    if (mad.type !== MadType.Character && mad.type !== MadType.Info) {
        errors.push(`${prettyCommand(command)} has an invalid type ("${String(mad.type)}")`);
    }
    const spec = COMMAND_CATALOG[category];
    const fields = isRemove ? spec.removeFields : spec.addFields;
    const value = (mad.value ?? {}) as Record<string, unknown>;
    for (const field of fields) {
        if (!field.required) continue;
        if (field.type === "ref") {
            // Opaque id post-enrichment — the resolved name is gone, so just require a non-empty string.
            const id = typeof value[field.key] === "string" ? (value[field.key] as string).trim() : "";
            if (!id) errors.push(`${prettyCommand(command)} is missing its ${field.key}`);
            continue;
        }
        // A value field must still resolve to a known option (refs are handled above, so resolveRef is unused).
        const coerced = coerceField(field, value[field.key], "", () => null, undefined);
        if (coerced === null) {
            errors.push(`${prettyCommand(command)} has an invalid ${field.key} ("${String(value[field.key] ?? "")}")`);
        }
    }
    if (category === "Stats" && String(value["stat"] ?? "") === "choice") {
        const opts = coerceField({ key: "options", type: "abilityCsv", required: true }, value["options"], "", () => null, undefined);
        if (!opts) errors.push(`${prettyCommand(command)} uses stat "choice" but has no valid options list`);
    }
    return errors;
}

/**
 * A compact chip label for a stored command. For ID-based commands the value holds an opaque id, so we
 * show only the action (e.g. "Add Spells"); for value-based commands we append the concrete values
 * (e.g. "Add Resistances: Fire", "Add Armor Class: 13, dex").
 */
export function commandChipLabel(mad: Pick<MadFeature, "command" | "value">): string {
    const pretty = prettyCommand(mad.command);
    const cat = categoryOf(mad.command);
    if (!cat || COMMAND_CATALOG[cat].idBased) return pretty;
    const value = mad.value ?? {};
    const keys = COMMAND_CATALOG[cat].labelKeys ?? Object.keys(value);
    const detail = keys.map(k => String(value[k] ?? "").trim()).filter(Boolean).join(", ");
    return detail ? `${pretty}: ${detail}` : pretty;
}
