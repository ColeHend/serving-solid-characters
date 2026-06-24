import {
    AbilityScores, Background, Class5E, Feat, FeatureDetail, ItemType, MagicItem,
    Prerequisite, PrerequisiteType, Proficiencies, Race, Spell, StatBonus, Subclass,
} from "../../models/generated";
import { srdItem, srdSubclass } from "../../models/data/generated";
import { createNewId } from "../customHooks/utility/tools/idGen";
import { homebrewManager } from "../customHooks/homebrewManager";
import { AiToolCall } from "./types";

export type HomebrewKind = "spell" | "item" | "magic_item" | "feat" | "background" | "race" | "subclass" | "class";

export interface HomebrewPreview {
    previewId: string;       // local UI id
    toolCallId: string;      // originating AiToolCall id, used for the follow-up tool_result
    kind: HomebrewKind;
    title: string;
    /** The fully-built model object that will be saved on confirm. */
    entity: Spell | srdItem | MagicItem | Feat | Background | Race | srdSubclass | Class5E;
    valid: boolean;
    errors: string[];
}

const TOOL_TO_KIND: Record<string, HomebrewKind> = {
    create_spell: "spell",
    create_item: "item",
    create_magic_item: "magic_item",
    create_feat: "feat",
    create_background: "background",
    create_race: "race",
    create_subclass: "subclass",
    create_class: "class",
};

// ----- small input coercers (model output is untrusted JSON) -----
const str = (v: unknown, d = ""): string => (typeof v === "string" ? v : v == null ? d : String(v));
const num = (v: unknown, d = 0): number => {
    if (typeof v === "number") return v;
    if (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v))) return Number(v);
    return d;
};
const boolean = (v: unknown): boolean => v === true;
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const strList = (v: unknown): string[] => list(v).map(x => str(x)).filter(s => s.length > 0);

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
        (out[level] ??= []).push({ name: str(f.name), description: str(f.description) });
    }
    return out;
}

// ----- typed mappers: returning the concrete model type makes any upstream required-field change a
//       compile error here (the cheapest schema-drift guard). `i` is the raw tool-call input. -----
function toSpell(i: Record<string, unknown>): Spell {
    const isVerbal = boolean(i.isVerbal), isSomatic = boolean(i.isSomatic), isMaterial = boolean(i.isMaterial);
    const components = [isVerbal && "V", isSomatic && "S", isMaterial && "M"].filter(Boolean).join(", ");
    console.log('toCreateSpell: ', i);
    
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
        classes: strList(i.classes),
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
        details: { name: str(i.name), description: str(i.description) },
        prerequisites,
    };
}

function toBackground(i: Record<string, unknown>): Background {
    const proficiencies: Proficiencies = { armor: [], weapons: [], tools: strList(i.tools), skills: strList(i.skills) };
    return {
        id: createNewId(),
        name: str(i.name),
        desc: str(i.desc),
        proficiencies,
        startEquipment: [],
        feat: str(i.feat) || undefined,
    };
}

function toRace(i: Record<string, unknown>): Race {
    const abilityBonuses: StatBonus[] = list(i.abilityBonuses).map(raw => {
        const b = raw as Record<string, unknown>;
        return { stat: ABILITY_MAP[str(b.ability)] ?? AbilityScores.STR, value: num(b.value, 1) };
    });
    const traits: Feat[] = list(i.traits).map(raw => {
        const t = raw as Record<string, unknown>;
        return { id: createNewId(), details: { name: str(t.name), description: str(t.description) }, prerequisites: [] };
    });
    return {
        id: createNewId(),
        name: str(i.name),
        size: str(i.size, "Medium"),
        speed: num(i.speed, 30),
        languages: strList(i.languages),
        abilityBonuses,
        traits,
    };
}

function toSubclass(i: Record<string, unknown>): srdSubclass {
    const sub: Subclass = {
        id: createNewId(),
        name: str(i.name),
        parentClass: str(i.parentClass),
        description: str(i.description),
        features: featuresByLevel(i.features),
    };
    return sub;
}

function toClass(i: Record<string, unknown>): Class5E {
    const proficiencies: Proficiencies = { armor: [], weapons: [], tools: [], skills: strList(i.skills) };
    return {
        id: createNewId(),
        name: str(i.name),
        hitDie: str(i.hitDie, "d8"),
        primaryAbility: str(i.primaryAbility),
        savingThrows: strList(i.savingThrows),
        startingEquipment: [],
        proficiencies,
        startChoices: {},
        features: featuresByLevel(i.features),
    };
}

/** Build a non-persisted preview from a tool call. Never writes to the DB. */
export function buildPreview(toolCall: AiToolCall): HomebrewPreview {
    const kind = TOOL_TO_KIND[toolCall.name];
    const input = (toolCall.input ?? {}) as Record<string, unknown>;
    const previewId = createNewId();
    const base = { previewId, toolCallId: toolCall.id };

    if (!kind) {
        return { ...base, kind: "item", title: toolCall.name, entity: toItem({}), valid: false, errors: [`Unknown tool "${toolCall.name}"`] };
    }

    let entity: HomebrewPreview["entity"];
    let title: string;
    switch (kind) {
        case "spell": entity = toSpell(input); title = (entity as Spell).name; break;
        case "item": entity = toItem(input); title = (entity as srdItem).name; break;
        case "magic_item": entity = toMagicItem(input); title = (entity as MagicItem).name; break;
        case "feat": entity = toFeat(input); title = (entity as Feat).details.name; break;
        case "background": entity = toBackground(input); title = (entity as Background).name; break;
        case "race": entity = toRace(input); title = (entity as Race).name; break;
        case "subclass": entity = toSubclass(input); title = (entity as srdSubclass).name; break;
        case "class": entity = toClass(input); title = (entity as Class5E).name; break;
    }

    const errors: string[] = [];
    if (!title?.trim()) errors.push("Missing name.");
    if (kind === "subclass" && !(entity as srdSubclass).parentClass.trim()) errors.push("Missing parent class.");

    return { ...base, kind, title: title || "(unnamed)", entity, valid: errors.length === 0, errors };
}

const isPromise = (v: unknown): v is Promise<unknown> => !!v && typeof (v as { then?: unknown }).then === "function";

/** True if an entity with this name (per the kind's identity rule) already exists in the homebrew store. */
function alreadyExists(p: HomebrewPreview): boolean {
    const name = p.title;
    switch (p.kind) {
        case "spell": return homebrewManager.spells().some(s => s.name === name);
        case "item": return homebrewManager.items().some(i => i.name === name);
        case "magic_item": return homebrewManager.magicItems().some(m => m.name === name);
        case "feat": return homebrewManager.feats().some(f => f.details?.name === name || f.name === name);
        case "background": return homebrewManager.backgrounds().some(b => b.name === name);
        case "race": return homebrewManager.races().some(r => r.name === name);
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
    if (alreadyExists(p)) return { ok: false, message: `A ${p.kind.replace("_", " ")} named "${p.title}" already exists.` };

    let result: unknown;
    switch (p.kind) {
        case "spell": result = homebrewManager.addSpell(p.entity as Spell); break;
        case "item": result = homebrewManager.addItem(p.entity as srdItem); break;
        case "magic_item": result = homebrewManager.addMagicItem(p.entity as MagicItem); break;
        case "feat": result = homebrewManager.addFeat(p.entity as Feat); break;
        case "background": result = homebrewManager.addBackground(p.entity as Background); break;
        case "race": result = homebrewManager.addRace(p.entity as Race); break;
        case "subclass": result = homebrewManager.addSubclass(p.entity as srdSubclass); break;
        case "class": result = homebrewManager.addClass(p.entity as Class5E); break;
    }
    if (isPromise(result)) await result;
    return { ok: true, message: `Saved ${p.kind.replace("_", " ")} "${p.title}".` };
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
        subclass: "/homebrew/create/subclasses",
        class: "/homebrew/create/classes",
    };
    return map[p.kind];
}
