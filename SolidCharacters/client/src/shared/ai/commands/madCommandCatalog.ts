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

/** The 16 command categories (each becomes Add<Category> / Remove<Category>). Mirrors MadCommands. */
export type MadCategory =
    | "Spells" | "Items" | "Proficiencies" | "Features" | "Currency" | "ArmorClass"
    | "Expertise" | "Feats" | "Languages" | "Resistances" | "Vulnerabilities"
    | "Immunities" | "SavingThrows" | "Stats" | "Speed" | "AllProficiencies";

export const MAD_CATEGORIES: MadCategory[] = [
    "Spells", "Items", "Proficiencies", "Features", "Currency", "ArmorClass",
    "Expertise", "Feats", "Languages", "Resistances", "Vulnerabilities",
    "Immunities", "SavingThrows", "Stats", "Speed", "AllProficiencies",
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

// ---- field specs ----

type FieldType = "number" | "ability" | "abilityCsv" | "skill" | "skillCsv" | "damageType" | "currency" | "pbChoice" | "text" | "ref";

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
        hint: "sets AC = bonus + listed ability modifier(s); bonus = number, stats = one or more of str,dex,con,int,wis,cha (use for 'AC equals 13 + Dex' style traits)",
    },
    Speed: {
        category: "Speed", idBased: false,
        addFields: [{ key: "speed", type: "number", required: true }], removeFields: [{ key: "speed", type: "number", required: true }],
        hint: "changes walking speed by a number of feet; speed = number",
    },
    Stats: {
        category: "Stats", idBased: false,
        addFields: [{ key: "stat", type: "ability", required: true }, { key: "statValue", type: "number", required: true }],
        removeFields: [{ key: "stat", type: "ability", required: true }, { key: "statValue", type: "number", required: true }],
        hint: "changes an ability score; stat = str/dex/con/int/wis/cha, statValue = number",
    },
    SavingThrows: {
        category: "SavingThrows", idBased: false,
        addFields: [{ key: "stat", type: "ability", required: true }], removeFields: [{ key: "stat", type: "ability", required: true }],
        hint: "grants saving-throw proficiency; stat = str/dex/con/int/wis/cha",
    },
    Proficiencies: {
        category: "Proficiencies", idBased: false,
        addFields: [{ key: "proficiency", type: "skill", required: true }], removeFields: [{ key: "proficiency", type: "skill", required: true }],
        hint: "grants proficiency in one skill; proficiency = a skill name",
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
};

// ---- pure coercion ----

const norm = (v: unknown): string => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "").trim();

/** Match a value against an option list case-insensitively, returning the canonical option or null. */
function matchOption(raw: string, options: readonly string[]): string | null {
    const lc = raw.toLowerCase();
    return options.find(o => o.toLowerCase() === lc) ?? null;
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
        case "abilityCsv": return coerceCsv(value, coerceAbility);
        case "skill": return matchOption(value, SKILL_KEYS);
        case "skillCsv": return coerceCsv(value, s => matchOption(s, SKILL_KEYS));
        case "damageType": return matchOption(value, DAMAGE_TYPES);
        case "currency": return coerceCurrency(value);
        case "pbChoice": return coercePbChoice(value);
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
    const category = matchOption(norm(rawCategory), MAD_CATEGORIES) as MadCategory | null;
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
    return { command: `${t}${category}`, value, type: MadType.Character, prerequisites: [], group: 0 };
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
 * A compact chip label for a stored command. For ID-based commands the value holds an opaque id, so we
 * show only the action (e.g. "Add Spells"); for value-based commands we append the concrete values
 * (e.g. "Add Resistances: Fire", "Add Armor Class: 13, dex").
 */
export function commandChipLabel(mad: Pick<MadFeature, "command" | "value">): string {
    const pretty = prettyCommand(mad.command);
    const cat = categoryOf(mad.command);
    if (!cat || COMMAND_CATALOG[cat].idBased) return pretty;
    const detail = Object.values(mad.value ?? {}).map(v => String(v).trim()).filter(Boolean).join(", ");
    return detail ? `${pretty}: ${detail}` : pretty;
}
