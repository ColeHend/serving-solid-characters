import {
    AbilityScores, Background, CasterType, Class5E, Feat, FeatureDetail, ItemType, MagicItem,
    Prerequisite, PrerequisiteType, Proficiencies, Race, Spell, StartingEquipment, StatBonus, Subclass, Subrace,
} from "../../../models/generated";
import { srdItem, srdSubclass } from "../../../models/data/generated";
import { createNewId } from "../../customHooks/utility/tools/idGen";
import { homebrewManager } from "../../customHooks/homebrewManager";
import { AiToolCall, TokenUsage } from "../types";
import { HOMEBREW_KINDS, TOOL_TO_KIND, type HomebrewKind } from "../refs/homebrewKind";
import type { ReviewState, ReviewVerdict } from "../readiness/types";
import { canonicalClassName, findParentClass } from "../refs/classRefs";
import { findParentRace, knownRaceNames, raceNameById } from "../refs/raceRefs";
import { buildSpellcasting, parseCasterType } from "../refs/spellSlots";
import { ensureAllClassLevels } from "../refs/classProgression";
import { entityText, findPlaceholder } from "../readiness/deterministicPasses";
import { applyPatch, PatchOp, RejectedOp } from "./patch";
import { boolean, list, num, str, strList } from "../coerce";

export type { HomebrewKind };

/** Standard 5e rarities (case-insensitive). Used to warn on a nonstandard magic-item rarity. */
const STANDARD_RARITIES = new Set(["common", "uncommon", "rare", "very rare", "legendary", "artifact"]);
/** Hit dice the character HP math accepts; anything else stores hit-die 0 → wrong/empty sheet field. */
const VALID_HIT_DICE = new Set(["d6", "d8", "d10", "d12"]);
/** Full ability name → abbreviation, so a model that writes "Strength" still maps to a known ability. */
const FULL_ABILITY_TO_CODE: Record<string, string> = {
    strength: "STR", dexterity: "DEX", constitution: "CON", intelligence: "INT", wisdom: "WIS", charisma: "CHA",
};
/** Normalize an ability token ("str"/"Strength"/"STR") to its STR/DEX/… code, or null if unrecognized. */
function toAbilityCode(raw: unknown): string | null {
    const t = (typeof raw === "string" ? raw : "").trim();
    if (!t) return null;
    const up = t.toUpperCase();
    if (up in ABILITY_MAP) return up;
    return FULL_ABILITY_TO_CODE[t.toLowerCase()] ?? null;
}

export interface HomebrewPreview {
    previewId: string;       // local UI id
    toolCallId: string;      // originating AiToolCall id, used for the follow-up tool_result
    kind: HomebrewKind;
    title: string;
    /** The fully-built model object that will be saved on confirm. */
    entity: Spell | srdItem | MagicItem | Feat | Background | Race | Subrace | srdSubclass | Class5E;
    /** Hard blockers (mirror the manual editors): if non-empty, Save is disabled. */
    valid: boolean;
    errors: string[];
    /** Recommended-but-empty fields, as human-readable notes. These DO NOT block Save (warn-only). */
    warnings?: string[];
    /** Raw input keys the model left empty/absent — fed to the "Complete with AI" repair turn. */
    missingFields?: string[];
    /** How many AI repair attempts have run on this preview (hard-capped at 1). */
    repairAttempts?: number;
    /** True when the model's tool call was cut off (stop_reason max_tokens) or its JSON failed to parse. */
    truncated?: boolean;
    /**
     * True while a "Complete with AI" repair turn is in flight for this card: it renders collapsed
     * ("Improving with AI…") and is removed once the regenerated replacement preview arrives.
     */
    repairing?: boolean;
    /**
     * True while the command sub-agent is attaching mechanical "mads" commands to this entity's features
     * (post-generation enrichment). Display-only: the card shows an "Adding mechanics…" note; cleared when
     * the enriched entity is patched back in.
     */
    enriching?: boolean;
    /**
     * Names of MECHANICAL-looking features that ended the command pass with no mads command — their effect
     * exists only as prose and won't touch the character sheet. Set by the enrichment pass (undefined until
     * it has run); drives the "no sheet effect" warning chip and the user-initiated "Generate commands"
     * repair (aiAssistant.regenerateCommands). Pure-flavor features are never listed here.
     */
    inertFeatures?: string[];
    /**
     * True while a pipeline-built card is HELD BACK from the tray: the build's initial command enrichment
     * (the MadsReview phase) is still running, so the progress card carries the status instead of showing
     * a savable card that's still mutating. Cleared at hand-off (including abort); STRIPPED on persist
     * (like `enriching`) so a restored card is never invisibly stuck hidden.
     */
    deferred?: boolean;
    /**
     * True once this entity has been successfully saved to the homebrew collection. The card then renders a
     * compact "Saved" confirmation (with View / Dismiss) instead of being removed outright — so a save is
     * visibly acknowledged rather than silently vanishing.
     */
    saved?: boolean;
    /**
     * The chat-message id this card is anchored under, set when it becomes a "Saved" confirmation so the
     * card renders inline beneath its "Saved …" announcement instead of floating at the bottom of the chat
     * as the conversation grows. Persisted with the card; the referenced message persists too, so the
     * anchor survives a reload.
     */
    anchorId?: string;
    /** Set when a Save attempt failed (the entity did NOT persist): shown on the card so the user can retry. */
    saveError?: string;
    /** High-mode readiness state. Undefined for Low/Medium (no pipeline runs). */
    reviewState?: ReviewState;
    /** Verdicts from the readiness pipeline (one per pass that ran), surfaced on the card. */
    verdicts?: ReviewVerdict[];
    /** True when a blocking-severity review issue was found → Save is disabled. */
    reviewBlocked?: boolean;
    // ----- edit (diff-patch) mode -----
    /** "create" (default) saves as a new entity; "edit" applies a diff patch to an existing one (updateX). */
    mode?: "create" | "edit";
    /** The pre-edit entity snapshot, for the diff card's before→after rendering. Only set for edits. */
    baseEntity?: HomebrewPreview["entity"];
    /** The patch ops that were applied to produce `entity` (edit mode), for the diff + decision log. */
    appliedOps?: PatchOp[];
    /** Patch ops that couldn't be applied (bad path, etc.), surfaced on the diff card as warnings. */
    rejectedOps?: RejectedOp[];
    /**
     * True for a card RESTORED from a persisted conversation (set on load, never persisted). Its
     * originating tool call was stripped from the saved history by balancedHistory(), so it's "detached":
     * Save still works (saveHomebrew + a no-op resolveToolCall, since `outstanding` is empty after a
     * load), but the AI-driven actions (Complete/Improve/Try again) — which need a live turn — are hidden.
     */
    detached?: boolean;
    /**
     * Set on an EDIT preview that couldn't be built because its target entity doesn't exist (wrong/unknown
     * name or kind). Such a preview carries no real card — the orchestrator resolves its tool call back to
     * the model (with the available names in `errors`) so it can retry, instead of surfacing a dead-end card.
     */
    targetMissing?: boolean;
    /**
     * Token cost that produced this homebrew (input + output). For a one-shot generation it's the create
     * turn's usage; for a pipeline build it's the whole run's total. Shown on the preview/"Saved" card and
     * carried into the decision log on save. Plain object → safe for structuredClone/persist.
     */
    usage?: TokenUsage;
}

const ABILITY_MAP: Record<string, AbilityScores> = {
    STR: AbilityScores.STR, DEX: AbilityScores.DEX, CON: AbilityScores.CON,
    INT: AbilityScores.INT, WIS: AbilityScores.WIS, CHA: AbilityScores.CHA,
};
const ITEM_TYPE_MAP: Record<string, ItemType> = {
    Weapon: ItemType.Weapon, Armor: ItemType.Armor, Tool: ItemType.Tool, Item: ItemType.Item,
};

function featuresByLevel(v: unknown): Record<number, FeatureDetail[]> {
    const out: Record<number, FeatureDetail[]> = {};
    for (const raw of list(v)) {
        const f = raw as Record<string, unknown>;
        const level = num(f.level, 1);
        (out[level] ??= []).push({ id: createNewId(), name: str(f.name), description: str(f.description) });
    }
    return out;
}

// ----- typed mappers: returning the concrete model type makes any upstream required-field change a
//       compile error here (the cheapest schema-drift guard). `i` is the raw tool-call input. -----
function toSpell(i: Record<string, unknown>): Spell {
    const isVerbal = boolean(i.isVerbal), isSomatic = boolean(i.isSomatic), isMaterial = boolean(i.isMaterial);
    const components = [isVerbal && "V", isSomatic && "S", isMaterial && "M"].filter(Boolean).join(", ");

    return {
        id: createNewId(),
        name: str(i.name),
        description: str(i.description),
        duration: str(i.duration),
        concentration: boolean(i.concentration),
        components,
        level: String(num(i.level, 0)),
        range: str(i.range),
        ritual: boolean(i.ritual),
        school: str(i.school),
        castingTime: str(i.castingTime),
        damageType: str(i.damageType),
        page: "",
        isMaterial, isSomatic, isVerbal,
        materialsNeeded: str(i.materialsNeeded) || undefined,
        higherLevel: str(i.higherLevel) || undefined,
        // Canonicalize to the class's real stored name so the exact-case consumer (spell picker filters
        // `spell.classes.includes(class.name)`) can actually offer the spell — "wizard" → "Wizard".
        classes: strList(i.classes).map(canonicalClassName),
        subClasses: [],
    };
}

function toItem(i: Record<string, unknown>): srdItem {
    return {
        id: createNewId(),
        name: str(i.name),
        desc: str(i.desc),
        type: ITEM_TYPE_MAP[str(i.type)] ?? ItemType.Item,
        weight: num(i.weight),
        cost: str(i.cost),
        properties: {},
    };
}

function toMagicItem(i: Record<string, unknown>): MagicItem {
    return {
        id: createNewId(),
        name: str(i.name),
        desc: str(i.desc),
        rarity: str(i.rarity),
        cost: str(i.cost),
        category: str(i.category),
        weight: str(i.weight),
        properties: {
            attunement: str(i.attunement) || undefined,
            effect: str(i.effect) || undefined,
            charges: str(i.charges) || undefined,
        },
    };
}

function toFeat(i: Record<string, unknown>): Feat {
    const prerequisites: Prerequisite[] = [];
    const prereq = str(i.prerequisite);
    if (prereq) prerequisites.push({ type: PrerequisiteType.String, value: prereq });
    return {
        id: createNewId(),
        details: { id: createNewId(), name: str(i.name), description: str(i.description) },
        prerequisites,
    };
}

function toBackground(i: Record<string, unknown>): Background {
    const proficiencies: Proficiencies = {
        armor: strList(i.armor), weapons: strList(i.weapons),
        tools: strList(i.tools), skills: strList(i.skills),
    };
    const features: FeatureDetail[] = list(i.features).map(raw => {
        const f = raw as Record<string, unknown>;
        return { id: createNewId(), name: str(f.name), description: str(f.description) };
    });
    // Each entry is one equipment package/choice (optionKeys = the choice label, items = its contents).
    // Drop empties so a model that sends a blank entry doesn't persist a meaningless group.
    const startEquipment: StartingEquipment[] = list(i.startEquipment).map(raw => {
        const e = raw as Record<string, unknown>;
        const optionKeys = strList(e.optionKeys);
        return { optionKeys: optionKeys.length ? optionKeys : undefined, items: strList(e.items) };
    }).filter(e => (e.items?.length ?? 0) > 0 || (e.optionKeys?.length ?? 0) > 0);
    return {
        id: createNewId(),
        name: str(i.name),
        desc: str(i.desc),
        proficiencies,
        startEquipment,
        // 2024 backgrounds are the sole source of ability score increases; the character build reads
        // abilityOptions to offer the +2/+1. Without it an AI 2024 background grants no ASI.
        abilityOptions: strList(i.abilityOptions).length ? strList(i.abilityOptions) : undefined,
        feat: str(i.feat) || undefined,
        features: features.length ? features : undefined,
    };
}

// Normalize the ability before lookup and DROP unrecognized ones rather than silently defaulting to
// STR (which would grant a wrong-stat bonus invisibly). Unmapped abilities are surfaced as a warning
// in assessCompleteness (which re-reads the raw input).
function raceAbilityBonuses(v: unknown): StatBonus[] {
    const out: StatBonus[] = [];
    for (const raw of list(v)) {
        const b = raw as Record<string, unknown>;
        const code = toAbilityCode(b.ability);
        if (code) out.push({ stat: ABILITY_MAP[code], value: num(b.value, 1) });
    }
    return out;
}

function raceTraits(v: unknown): Feat[] {
    return list(v).map(raw => {
        const t = raw as Record<string, unknown>;
        return { id: createNewId(), details: { id: createNewId(), name: str(t.name), description: str(t.description) }, prerequisites: [] };
    });
}

/** The descriptions map both race-like editors persist flavor text under. Undefined when all-empty. */
function raceDescriptions(i: Record<string, unknown>): Record<string, string> | undefined {
    const descriptions: Record<string, string> = {};
    const age = str(i.age), alignment = str(i.alignment), desc = str(i.desc);
    if (age) descriptions.age = age;
    if (alignment) descriptions.alignment = alignment;
    if (desc) descriptions.desc = desc;
    return Object.keys(descriptions).length ? descriptions : undefined;
}

function toRace(i: Record<string, unknown>): Race {
    return {
        id: createNewId(),
        name: str(i.name),
        size: str(i.size, "Medium"),
        speed: num(i.speed, 30),
        languages: strList(i.languages),
        abilityBonuses: raceAbilityBonuses(i.abilityBonuses),
        traits: raceTraits(i.traits),
        descriptions: raceDescriptions(i),
    };
}

function toSubrace(i: Record<string, unknown>): Subrace {
    // The model names the parent race, but every subrace consumer keys on the RACE'S ID
    // (`subrace.parentRace === race.id`) — resolve it here, homebrew first. An unresolvable name is
    // stored as-is so validateEntity can quote it in the hard error (Save stays blocked until fixed).
    const parentName = str(i.parentRace);
    const parent = findParentRace(parentName);
    return {
        id: createNewId(),
        name: str(i.name),
        parentRace: parent?.id ?? parentName,
        // Size/speed inherit from the parent unless the subrace explicitly overrides them (the editor
        // leaves them blank/default too).
        size: str(i.size) || (parent?.size ?? ""),
        speed: num(i.speed, parent?.speed ?? 30),
        languages: strList(i.languages),
        abilityBonuses: raceAbilityBonuses(i.abilityBonuses),
        traits: raceTraits(i.traits),
        descriptions: raceDescriptions(i),
    };
}

function toSubclass(i: Record<string, unknown>): srdSubclass {
    const casterType = parseCasterType(i.casterType);
    // Mirror toSubrace: consumers match by the parent's ID (parentClassId, name as fallback) —
    // resolve homebrew-first, then SRD. Unresolvable → id omitted, the name fallback covers it.
    const parentName = canonicalClassName(str(i.parentClass));
    const parent = findParentClass(parentName);
    const sub: Subclass = {
        id: createNewId(),
        name: str(i.name),
        // Canonicalize so name-based consumers' exact `subclass.parentClass === class.name` filter matches.
        parentClass: parentName,
        ...(parent?.id ? { parentClassId: parent.id } : {}),
        description: str(i.description),
        features: featuresByLevel(i.features),
        // Stamp a working slot table from casterType so a caster subclass isn't saved with zero slots.
        spellcasting: buildSpellcasting(casterType),
    };
    return sub;
}

function toClass(i: Record<string, unknown>): Class5E {
    const proficiencies: Proficiencies = {
        armor: strList(i.armor), weapons: strList(i.weapons),
        tools: strList(i.tools), skills: strList(i.skills),
    };
    const equipmentItems = strList(i.startingEquipment);
    const casterType = parseCasterType(i.casterType);
    return {
        id: createNewId(),
        name: str(i.name),
        hitDie: str(i.hitDie, "d8"),
        primaryAbility: str(i.primaryAbility),
        savingThrows: strList(i.savingThrows),
        startingEquipment: equipmentItems.length ? [{ items: equipmentItems }] : [],
        proficiencies,
        startChoices: {},
        // Densify to all 20 level keys (ASI/Epic Boon/backstop) so the class table shows a full 1–20 progression.
        features: ensureAllClassLevels(featuresByLevel(i.features)),
        // Stamp a working slot table from casterType so a caster class isn't saved with zero slots.
        spellcasting: buildSpellcasting(casterType),
    };
}

// ----- completeness: surface the fields the model left empty so the user can see them and the
//       "Complete with AI" repair turn can name them. Computed from the RAW tool input BEFORE coercion,
//       because the coercers above erase the difference between "model omitted" and "model sent empty". -----
interface FieldSpec { key: string; label: string; }

/** Per-kind fields that SHOULD be filled for the entity to feel complete. Keys are raw tool-input keys. */
// NOTE: the primary description/desc is intentionally NOT listed here — a missing description is a HARD
// failure (see buildPreview), not a soft recommendation, so it surfaces as an error rather than a warning.
const RECOMMENDED: Record<HomebrewKind, FieldSpec[]> = {
    spell: [
        { key: "school", label: "school" },
        { key: "castingTime", label: "casting time" },
        { key: "range", label: "range" },
        { key: "duration", label: "duration" },
        { key: "classes", label: "classes that can cast it" },
    ],
    item: [
        { key: "cost", label: "cost" },
    ],
    magic_item: [
        { key: "category", label: "category" },
    ],
    feat: [],
    background: [
        { key: "skills", label: "skill proficiencies" },
        { key: "features", label: "a background feature" },
    ],
    race: [
        { key: "traits", label: "racial traits" },
        { key: "languages", label: "languages" },
    ],
    subrace: [
        { key: "traits", label: "subrace traits" },
        { key: "desc", label: "description" },
    ],
    subclass: [
        { key: "description", label: "description" },
        { key: "features", label: "features" },
    ],
    class: [
        { key: "features", label: "class features" },
        { key: "skills", label: "skill proficiencies" },
        { key: "primaryAbility", label: "primary ability" },
        { key: "savingThrows", label: "saving throw proficiencies" },
    ],
};

/** True if a raw tool-input value is "empty": absent, blank string, or empty array. */
function isEmptyInput(v: unknown): boolean {
    if (v == null) return true;
    if (typeof v === "string") return v.trim() === "";
    if (Array.isArray(v)) return v.length === 0;
    return false;
}

/** True if at least one trait has BOTH a non-empty name and description (a usable racial feature). */
function hasUsableTrait(input: Record<string, unknown>): boolean {
    return list(input.traits).some(raw => {
        const t = raw as Record<string, unknown>;
        return str(t.name).trim().length > 0 && str(t.description).trim().length > 0;
    });
}

/** Recommended-but-empty fields → warnings + raw keys. Ruleset-aware; never blocks Save. */
function assessCompleteness(kind: HomebrewKind, input: Record<string, unknown>, dndSystem: string): { warnings: string[]; missingFields: string[] } {
    const specs = [...(RECOMMENDED[kind] ?? [])];
    // Subraces carry the same trait/ability-bonus shape as races — share every race warning below.
    const raceLike = kind === "race" || kind === "subrace";
    // Ruleset-aware: 2014 species carry ability bonuses; 2024 moves them to the background + adds the feat + ASIs.
    if (raceLike && dndSystem !== "2024") specs.push({ key: "abilityBonuses", label: "ability score bonuses" });
    if (kind === "background" && dndSystem === "2024") {
        specs.push({ key: "feat", label: "a granted feat" });
        specs.push({ key: "abilityOptions", label: "ability score options" });
    }

    const missingFields: string[] = [];
    const warnings: string[] = [];
    for (const s of specs) {
        // A race's "traits" array counts as present only when a trait actually has name+description, so
        // a [{name:"",description:""}] stub still surfaces as missing and drives the repair turn.
        const satisfied = raceLike && s.key === "traits" ? hasUsableTrait(input) : !isEmptyInput(input[s.key]);
        if (!satisfied) { missingFields.push(s.key); warnings.push(`No ${s.label}.`); }
    }

    // ---- Race/subrace: per-trait blanks, unmapped abilities, and 2024 double-dipped ASIs ----
    if (raceLike) {
        list(input.traits).forEach((raw, idx) => {
            const t = raw as Record<string, unknown>;
            const hasName = str(t.name).trim().length > 0, hasDesc = str(t.description).trim().length > 0;
            if ((hasName || hasDesc) && !(hasName && hasDesc)) warnings.push(`Trait ${idx + 1} is missing its name or description.`);
        });
        const unmapped = list(input.abilityBonuses)
            .map(raw => str((raw as Record<string, unknown>).ability))
            .filter(a => a.trim() && !toAbilityCode(a));
        if (unmapped.length) warnings.push(`Unknown ability score${unmapped.length > 1 ? "s" : ""} on this species: ${unmapped.join(", ")} — fix in the editor (it was dropped, not applied).`);
        if (dndSystem !== "2014" && list(input.abilityBonuses).length) {
            warnings.push("In 2024, ability score increases come from the background, not the species — these will stack on top of the background ASIs. Remove them unless this is a 2014 species.");
        }
    }

    // ---- Item / magic item: nonstandard rarity / unrecognized type (cosmetic; warn only) ----
    if (kind === "magic_item") {
        const rarity = str(input.rarity).trim();
        if (rarity && !STANDARD_RARITIES.has(rarity.toLowerCase())) warnings.push(`Rarity "${rarity}" isn't a standard 5e rarity; the UI may categorize it as unset.`);
    }
    if (kind === "item") {
        const type = str(input.type).trim();
        if (type && !(type in ITEM_TYPE_MAP)) warnings.push(`Item type "${type}" isn't recognized; it will display as a generic Item.`);
    }

    // ---- Caster class/subclass with no casterType: surface it as a named missing field so the repair
    //      turn asks for one (stamping a slot table needs casterType). Heuristic OR an explicit non-caster. ----
    if (kind === "class" || kind === "subclass") {
        const casterType = parseCasterType(input.casterType);
        const text = `${str(input.description)} ${JSON.stringify(input.features ?? "")}`.toLowerCase();
        const looksCaster = /spell|cast|magic/.test(text);
        if (looksCaster && casterType === CasterType.None) {
            missingFields.push("casterType");
            warnings.push("Looks like a spellcaster but no caster type is set — set casterType (third/half/full/pact) so spell slots are generated.");
        }
    }

    // ---- Numeric fields sent as unparseable strings silently default (spell level→0/cantrip, speed→30,
    //      weight→0) and slip past validation as a confidently-wrong value: warn so the user can correct. ----
    const numWarn = (key: string, label: string) => {
        const raw = input[key];
        if (raw == null || raw === "" || typeof raw === "number") return;
        if (typeof raw === "string" && raw.trim() !== "" && !isNaN(Number(raw))) return;
        warnings.push(`The ${label} "${String(raw)}" isn't a number and was ignored — set a numeric ${label}.`);
    };
    if (kind === "spell") numWarn("level", "spell level");
    if (raceLike) numWarn("speed", "speed");
    if (kind === "item" || kind === "magic_item") numWarn("weight", "weight");

    return { warnings, missingFields };
}

/** True if a leveled feature map (Record<level, Feat[]>) has no features at all. */
function hasNoFeatures(features: Record<number, FeatureDetail[]> | undefined): boolean {
    return !features || Object.values(features).every(arr => !arr?.length);
}

/**
 * Hard blockers (mirror the manual editors' refuse-to-save rules) on the COERCED entity. Shared by
 * create (buildPreview) and edit (buildEditPreview) so both gate identically. Returns the error list;
 * an empty list means valid. Placeholder text and structurally-dead content (a caster with no slots,
 * a class with no features / a bad hit die) are blocked here regardless of usageLevel.
 */
export function validateEntity(kind: HomebrewKind, entity: HomebrewPreview["entity"], title: string): string[] {
    const errors: string[] = [];
    if (!title?.trim()) errors.push("Missing name.");
    if (kind === "subclass" && !(entity as srdSubclass).parentClass.trim()) errors.push("Missing parent class.");
    if (kind === "subrace") {
        // parentRace must be a real race's ID or every consumer's `parentRace === race.id` filter drops
        // the subrace invisibly. toSubrace stores an unresolvable NAME as-is, so quote it back with the
        // available names — the repair/retry turn then corrects it (mirrors the failed-edit-lookup hint).
        const parent = (entity as Subrace).parentRace?.trim() ?? "";
        if (!parent) errors.push("Missing parent race.");
        else if (!raceNameById(parent)) {
            const names = knownRaceNames().slice(0, 15);
            errors.push(`No race named "${parent}" exists.${names.length ? ` Available races: ${names.map(n => `"${n}"`).join(", ")}.` : ""} Use the exact name of an existing race as parentRace.`);
        }
    }
    if (kind === "race") {
        const r = entity as Race;
        if (!r.size.trim()) errors.push("Missing size.");
        if (!(r.speed > 0)) errors.push("Speed must be greater than 0.");
    }
    if (kind === "class") {
        const c = entity as Class5E;
        // hitDie must be one the HP math accepts, else the character stores hit-die 0 (empty sheet field).
        if (c.hitDie?.trim() && !VALID_HIT_DICE.has(c.hitDie.trim())) errors.push("Hit die must be one of d6, d8, d10, d12.");
        // primaryAbility feeds the multiclass-requirement math; blank/garbage breaks it silently.
        if (!c.primaryAbility?.trim()) errors.push("Missing primary ability.");
        else if (!c.primaryAbility.split(/[\s,]+/).filter(Boolean).every(toAbilityCode)) errors.push("Primary ability must be an ability score (e.g. STR, DEX, CON, INT, WIS, CHA).");
    }
    // A class/subclass that grants no features does nothing on level-up — block it.
    if (kind === "class" && hasNoFeatures((entity as Class5E).features)) errors.push("Add at least one class feature.");
    if (kind === "subclass" && hasNoFeatures((entity as srdSubclass).features)) errors.push("Add at least one subclass feature.");

    // A missing primary description is a hard failure for kinds built around one (race/class are exempt).
    const description = primaryDescription(kind, entity);
    if (description !== null && !description.trim()) errors.push("Missing description.");

    // Placeholder/leftover text ("TODO", "[insert ...]") must never ship — block on it for every usage
    // level (the High linter pass also flags it, but Low/Medium run no pipeline).
    const placeholder = findPlaceholder(entityText({ title, entity } as HomebrewPreview));
    if (placeholder) errors.push(`Contains ${placeholder} — replace it with real content before saving.`);

    return errors;
}

/** The primary description text for a kind, or null for kinds with no single description field. */
function primaryDescription(kind: HomebrewKind, entity: HomebrewPreview["entity"]): string | null {
    switch (kind) {
        case "spell": return (entity as Spell).description ?? "";
        case "item": return (entity as srdItem).desc ?? "";
        case "magic_item": return (entity as MagicItem).desc ?? "";
        case "feat": return (entity as Feat).details.description ?? "";
        case "background": return (entity as Background).desc ?? "";
        case "subclass": return (entity as srdSubclass).description ?? "";
        // No single description field (race/subrace=traits, class=features); a subrace's flavor desc
        // lives in the optional descriptions map and is warn-only (RECOMMENDED), like the manual editor.
        case "race": case "subrace": case "class": return null;
    }
}

/** Display name for an entity (feat uses details.name, everything else uses name). */
function entityTitle(kind: HomebrewKind, entity: HomebrewPreview["entity"]): string {
    if (kind === "feat") return (entity as Feat).details?.name ?? "";
    return (entity as { name?: string }).name ?? "";
}

/** Build a non-persisted preview from a tool call. Never writes to the DB. */
export function buildPreview(toolCall: AiToolCall, dndSystem = "both"): HomebrewPreview {
    const kind = TOOL_TO_KIND[toolCall.name];
    const input = (toolCall.input ?? {}) as Record<string, unknown>;
    const previewId = createNewId();
    const base = { previewId, toolCallId: toolCall.id };

    if (!kind) {
        return { ...base, kind: "item", title: toolCall.name, entity: toItem({}), valid: false, errors: [`Unknown tool "${toolCall.name}"`] };
    }

    let entity: HomebrewPreview["entity"];
    switch (kind) {
        case "spell": entity = toSpell(input); break;
        case "item": entity = toItem(input); break;
        case "magic_item": entity = toMagicItem(input); break;
        case "feat": entity = toFeat(input); break;
        case "background": entity = toBackground(input); break;
        case "race": entity = toRace(input); break;
        case "subrace": entity = toSubrace(input); break;
        case "subclass": entity = toSubclass(input); break;
        case "class": entity = toClass(input); break;
    }

    // Central provenance stamp — every create path funnels through this switch (one-shot tools,
    // class-pipeline assemble), so no per-mapper handling. Empty/whitespace → undefined = plain
    // homebrew. The edit path (buildEditPreview) deliberately has no stamp: an unconditional
    // overwrite there would wipe an entity's existing source.
    const sourceInput = typeof input.source === "string" ? input.source.trim() : "";
    (entity as { source?: string }).source = sourceInput || undefined;

    const title = entityTitle(kind, entity);

    // Hard blockers — mirror exactly what the manual editors refuse to save (name + structural integrity).
    // Add AI Errors Here. searchKeywords: AIerrors, AIFieldErrors, AI Field Errors.
    const errors = validateEntity(kind, entity, title);

    // Recommended-but-empty fields are warn-only — the user can still save a deliberate stub.
    const { warnings, missingFields } = assessCompleteness(kind, input, dndSystem);

    return { ...base, kind, title: title || "(unnamed)", entity, valid: errors.length === 0, errors, warnings, missingFields, mode: "create" };
}

/** Path segments that would let untrusted model output reach the prototype chain. */
const UNSAFE_PATH_SEGMENT = /(^|[.[])(?:__proto__|constructor|prototype)([.\]]|$)/;

/** Coerce the untrusted `changes` array of an edit_homebrew call into typed PatchOps. */
function coerceOps(v: unknown): PatchOp[] {
    return list(v)
        .map(raw => {
            const o = (raw ?? {}) as Record<string, unknown>;
            // Pass the raw op through (don't silently coerce an unknown op like "replace"/"delete" to
            // "set" — that would apply a DIFFERENT change than asked). applyOne rejects anything that
            // isn't set/add/remove, surfacing it on the diff card's "Couldn't apply" line.
            const op = str(o.op).toLowerCase();
            return { path: str(o.path), op: op as PatchOp["op"], value: o.value };
        })
        .filter(o => o.path.length > 0 && !UNSAFE_PATH_SEGMENT.test(o.path));
}

/** The names of every homebrew entity of a kind (for "did you mean…" hints on a failed edit lookup). */
export function homebrewNames(kind: HomebrewKind): string[] {
    const named = <T extends { name?: string }>(arr: T[]): string[] => arr.map(e => (e.name ?? "").trim()).filter(Boolean);
    switch (kind) {
        case "spell": return named(homebrewManager.spells());
        case "item": return named(homebrewManager.items());
        case "magic_item": return named(homebrewManager.magicItems());
        case "feat": return homebrewManager.feats().map(f => (f.details?.name ?? f.name ?? "").trim()).filter(Boolean);
        case "background": return named(homebrewManager.backgrounds());
        case "race": return named(homebrewManager.races());
        case "subrace": return named(homebrewManager.subraces());
        case "subclass": return named(homebrewManager.subclasses());
        case "class": return named(homebrewManager.classes());
    }
}

/**
 * Find a live homebrew entity by kind + name. `parent` disambiguates the nested kinds: the subclass's
 * parent class name, or the subrace's parent race — as a NAME (edit tool input) or a race ID (an
 * entity's stored parentRace, from the save-time re-check).
 */
export function findHomebrewEntity(kind: HomebrewKind, name: string, parent?: string): HomebrewPreview["entity"] | undefined {
    const n = name.trim().toLowerCase();
    const byName = <T extends { name?: string }>(arr: T[]): T | undefined => arr.find(e => (e.name ?? "").trim().toLowerCase() === n);
    switch (kind) {
        case "spell": return byName(homebrewManager.spells());
        case "item": return byName(homebrewManager.items());
        case "magic_item": return byName(homebrewManager.magicItems());
        case "feat": return homebrewManager.feats().find(f => ((f.details?.name ?? f.name ?? "").trim().toLowerCase()) === n);
        case "background": return byName(homebrewManager.backgrounds());
        case "race": return byName(homebrewManager.races());
        case "subrace": {
            const parentId = parent ? (raceNameById(parent) ? parent : findParentRace(parent)?.id) : undefined;
            return homebrewManager.subraces().find(s =>
                (s.name ?? "").trim().toLowerCase() === n && (!parentId || s.parentRace === parentId));
        }
        case "subclass":
            return (parent ? homebrewManager.findSubclass(canonicalClassName(parent), name) : undefined)
                ?? homebrewManager.subclasses().find(s => (s.name ?? "").trim().toLowerCase() === n);
        case "class": return byName(homebrewManager.classes());
    }
}

/**
 * Build an EDIT preview: locate an existing homebrew entity, apply the model's diff patch to a clone,
 * re-validate, and return a preview in "edit" mode (carrying the pre-edit snapshot + applied/rejected
 * ops for the diff card). Never writes to the DB.
 */
export function buildEditPreview(toolCall: AiToolCall, _dndSystem = "both"): HomebrewPreview {
    const input = (toolCall.input ?? {}) as Record<string, unknown>;
    const kind = str(input.kind) as HomebrewKind;
    const name = str(input.name);
    const previewId = createNewId();
    const base = { previewId, toolCallId: toolCall.id, mode: "edit" as const };

    if (!HOMEBREW_KINDS.includes(kind)) {
        return { ...base, kind: "item", title: name || "(edit)", entity: toItem({}), valid: false, targetMissing: true, errors: [`Unknown kind "${str(input.kind)}" to edit. Valid kinds: ${HOMEBREW_KINDS.join(", ")}.`] };
    }
    const target = findHomebrewEntity(kind, name, str(input.parentRace) || str(input.parentClass));
    if (!target) {
        const label = kind.replace("_", " ");
        const names = homebrewNames(kind).slice(0, 15);
        const hint = names.length
            ? ` Your homebrew ${label}s: ${names.map(n => `"${n}"`).join(", ")}. Call edit_homebrew again with one of these exact names (or lookup_homebrew first).`
            : ` You have no homebrew ${label}s yet — create one before editing.`;
        return { ...base, kind, title: name || "(edit)", entity: toItem({}), valid: false, targetMissing: true, errors: [`No homebrew ${label} named "${name}".${hint}`] };
    }
    const { next, applied, rejected } = applyPatch(target, coerceOps(input.changes));
    const title = entityTitle(kind, next);
    const errors = validateEntity(kind, next, title);
    return {
        ...base, kind, title: title || name, entity: next,
        baseEntity: target, appliedOps: applied, rejectedOps: rejected,
        valid: errors.length === 0, errors,
    };
}

const isPromise = (v: unknown): v is Promise<unknown> => !!v && typeof (v as { then?: unknown }).then === "function";

/**
 * Interpret a homebrewManager add/update return so a save reports HONESTLY (it used to always claim success).
 * The manager methods variously return `false`/`null` for a dedup no-op or a swallowed DB error, a rejected
 * promise on a real failure, or `void`/`true` on success. Treat `false`/`null` and any rejection as "not
 * saved"; everything else as saved. (A dedup no-op is normally pre-empted by `alreadyExists`, so reaching it
 * here means the write genuinely didn't land.)
 */
async function resolveSaveOutcome(result: unknown): Promise<{ ok: boolean; error?: string }> {
    try {
        const v = isPromise(result) ? await result : result;
        if (v === false || v === null) return { ok: false };
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
}

/** True if an entity with this name (per the kind's identity rule) already exists in the homebrew store. */
export function alreadyExists(p: HomebrewPreview): boolean {
    const name = p.title;
    switch (p.kind) {
        case "spell": return homebrewManager.spells().some(s => s.name === name);
        case "item": return homebrewManager.items().some(i => i.name === name);
        case "magic_item": return homebrewManager.magicItems().some(m => m.name === name);
        case "feat": return homebrewManager.feats().some(f => f.details?.name === name || f.name === name);
        case "background": return homebrewManager.backgrounds().some(b => b.name === name);
        case "race": return homebrewManager.races().some(r => r.name === name);
        // The subraces table is keyed by name ALONE (a same-name row under another parent would be
        // silently overwritten by `.put`), so the identity check ignores parentRace on purpose.
        case "subrace": return homebrewManager.subraces().some(s => s.name === name);
        case "subclass": return !!homebrewManager.findSubclass((p.entity as srdSubclass).parentClass, name);
        case "class": return homebrewManager.classes().some(c => c.name === name);
    }
}

/**
 * Persist a confirmed preview via the existing homebrewManager (which fires its own snackbars and
 * dedupes). Returns a concise result so the caller can feed a tool_result back to the model.
 */
export async function saveHomebrew(p: HomebrewPreview): Promise<{ ok: boolean; message: string }> {
    if (!p.valid) return { ok: false, message: `Cannot save: ${p.errors.join(" ")}` };

    // ---- Edit: update the existing entity in place (it's expected to exist; skip the dedupe). ----
    if (p.mode === "edit") {
        // TOCTOU guard: the target may have been deleted between building this preview and Save. Re-find
        // it by its pre-edit identity; if it's gone, fail loudly rather than letting updateX no-op (or
        // resurrect) and reporting a success the decision log would then record. (Edit previews bypass the
        // Low/Medium/High readiness routing by design — only the hard validateEntity gates above apply.)
        const origName = p.baseEntity ? entityTitle(p.kind, p.baseEntity) : p.title;
        const parent = p.kind === "subclass" ? (p.entity as srdSubclass).parentClass
            : p.kind === "subrace" ? (p.entity as Subrace).parentRace
            : undefined;
        if (!findHomebrewEntity(p.kind, origName, parent)) {
            return { ok: false, message: `The ${p.kind.replace("_", " ")} "${origName}" no longer exists (it may have been deleted) — look it up again before editing.` };
        }
        let result: unknown;
        switch (p.kind) {
            case "spell": result = homebrewManager.updateSpell(p.entity as Spell); break;
            case "item": result = homebrewManager.updateItem(p.entity as srdItem); break;
            case "magic_item": result = homebrewManager.updateMagicItem(p.entity as MagicItem); break;
            case "feat": result = homebrewManager.updateFeat(p.entity as Feat); break;
            case "background": result = homebrewManager.updateBackground(p.entity as Background); break;
            case "race": result = homebrewManager.updateRace(p.entity as Race); break;
            // saveSubrace is an upsert matching by id or (parentRace, name) — it IS the update path.
            case "subrace": result = homebrewManager.saveSubrace(p.entity as Subrace); break;
            case "subclass": result = homebrewManager.updateSubclass(p.entity as srdSubclass); break;
            case "class": result = homebrewManager.updateClass(p.entity as Class5E); break;
        }
        const outcome = await resolveSaveOutcome(result);
        if (!outcome.ok) return { ok: false, message: outcome.error ?? `Couldn't update ${p.kind.replace("_", " ")} "${p.title}" — please try again.` };
        return { ok: true, message: `Updated ${p.kind.replace("_", " ")} "${p.title}".` };
    }

    if (alreadyExists(p)) return { ok: false, message: `A ${p.kind.replace("_", " ")} named "${p.title}" already exists.` };

    let result: unknown;
    switch (p.kind) {
        case "spell": result = homebrewManager.addSpell(p.entity as Spell); break;
        case "item": result = homebrewManager.addItem(p.entity as srdItem); break;
        case "magic_item": result = homebrewManager.addMagicItem(p.entity as MagicItem); break;
        case "feat": result = homebrewManager.addFeat(p.entity as Feat); break;
        case "background": result = homebrewManager.addBackground(p.entity as Background); break;
        case "race": result = homebrewManager.addRace(p.entity as Race); break;
        // No addSubrace exists; saveSubrace upserts (`alreadyExists` above pre-empts a same-name overwrite)
        // and returns an honest boolean, which resolveSaveOutcome interprets.
        case "subrace": result = homebrewManager.saveSubrace(p.entity as Subrace); break;
        case "subclass": result = homebrewManager.addSubclass(p.entity as srdSubclass); break;
        case "class": result = homebrewManager.addClass(p.entity as Class5E); break;
    }
    const outcome = await resolveSaveOutcome(result);
    if (!outcome.ok) return { ok: false, message: outcome.error ?? `Couldn't save ${p.kind.replace("_", " ")} "${p.title}" — please try again.` };
    // Append an explicit edit handle so the exact name survives in the model's history (resistant to
    // context windowing) and it knows precisely how to modify this entity on a later turn.
    return { ok: true, message: `Saved ${p.kind.replace("_", " ")} "${p.title}". To change it later, call edit_homebrew with kind "${p.kind}" and the exact name "${p.title}".` };
}

/** Route from a confirmed preview to the homebrew create page where the user can refine it. */
export function editorRouteFor(p: HomebrewPreview): string {
    const map: Record<HomebrewKind, string> = {
        spell: "/homebrew/create/spells",
        item: "/homebrew/create/items",
        magic_item: "/homebrew/create/items",
        feat: "/homebrew/create/feats",
        background: "/homebrew/create/backgrounds",
        race: "/homebrew/create/races",
        subrace: "/homebrew/create/subraces",
        subclass: "/homebrew/create/subclasses",
        class: "/homebrew/create/classes",
    };
    return map[p.kind];
}
