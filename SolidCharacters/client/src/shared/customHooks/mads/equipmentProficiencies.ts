import { Character } from "../../../models/character.model";
import { MadFeature } from "./madModels";
import { statChoiceKey } from "./useMadCharacters";

/**
 * Armor/weapon/tool proficiency mads. Unlike the sheet-mutating commands these have no
 * character field — the character stores no equipment proficiencies. They resolve at
 * PDF-EXPORT time (useExportProficiencies unions them with the class/background lists),
 * so the applier's Add/Remove cases are deliberate no-ops. Choose-N picks reuse
 * character.proficiencyChoices under kind-discriminated keys (`<featureKey>::weapon`),
 * which keeps them off the skills machinery's bare feature keys.
 */
export type EquipProfKind = "armor" | "weapon" | "tool";

export const EQUIP_PROF_KINDS: EquipProfKind[] = ["armor", "weapon", "tool"];

const KIND_COMMANDS: Record<EquipProfKind, { add: string; remove: string; valueKey: string }> = {
    armor: { add: "AddArmorProficiencies", remove: "RemoveArmorProficiencies", valueKey: "armor" },
    weapon: { add: "AddWeaponProficiencies", remove: "RemoveWeaponProficiencies", valueKey: "weapon" },
    tool: { add: "AddToolProficiencies", remove: "RemoveToolProficiencies", valueKey: "tool" },
};

/** True for a choice-form equipment-proficiency command ("choose N weapons") that needs player picks. */
export function isChoiceEquipProfMad(kind: EquipProfKind, m: MadFeature): boolean {
    const cfg = KIND_COMMANDS[kind];
    return (m.command === cfg.add || m.command === cfg.remove) && m.value?.[cfg.valueKey] === "choice";
}

/** The options a choice-form command allows ("Longswords,Rapiers" → ["Longswords","Rapiers"]). */
export function equipProfChoiceOptions(m: MadFeature): string[] {
    return (m.value?.["options"] ?? "").split(",").map(s => s.trim()).filter(Boolean);
}

/** How many options the player picks (defaults to 1). */
export function equipProfChoiceCount(m: MadFeature): number {
    const n = Number(m.value?.["count"] ?? "1");
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

/**
 * The character.proficiencyChoices key for a kind's picks on a feature — the `::kind`
 * suffix keeps armor/weapon/tool picks from colliding with the skills machinery's bare
 * feature keys (and with each other when one feature grants several kinds).
 */
export function equipProfChoiceKey(kind: EquipProfKind, feature: { id?: string; name: string }): string {
    return `${statChoiceKey(feature)}::${kind}`;
}

/** All choice-form commands of a kind on a feature (for the chooser UI). */
export function choiceEquipProfMads(kind: EquipProfKind, feature: { name: string; metadata?: { mads?: unknown } }): MadFeature[] {
    return ((feature.metadata?.mads ?? []) as MadFeature[]).filter(m => isChoiceEquipProfMad(kind, m));
}

/**
 * The player's picks for one choice-form command — or null while the picks are
 * missing/incomplete/invalid, in which case the command must NOT contribute.
 */
export function resolveEquipProfChoice(
    kind: EquipProfKind,
    character: Character,
    feature: { id?: string; name: string },
    m: MadFeature,
): string[] | null {
    const picks = (character.proficiencyChoices?.[equipProfChoiceKey(kind, feature)] ?? "")
        .split(",").map(s => s.trim()).filter(Boolean);
    const options = equipProfChoiceOptions(m);
    if (picks.length !== equipProfChoiceCount(m) || !picks.every(p => options.includes(p))) return null;
    return picks;
}

/** Choice-form commands of a kind on a feature that still need picks (for the chooser UI). */
export function pendingEquipProfChoices(
    kind: EquipProfKind,
    character: Character,
    feature: { id?: string; name: string; metadata?: { mads?: unknown } },
): MadFeature[] {
    return choiceEquipProfMads(kind, feature).filter(m => !resolveEquipProfChoice(kind, character, feature, m));
}

interface EquipProficiencies {
    armor: string[];
    weapons: string[];
    tools: string[];
}

const KIND_RESULT: Record<EquipProfKind, keyof EquipProficiencies> = {
    armor: "armor", weapon: "weapons", tool: "tools",
};

/** Case-insensitive de-dupe that preserves first-seen casing. */
const uniq = (values: string[]): string[] => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const v of values) {
        const key = v.trim().toLowerCase();
        if (!v.trim() || seen.has(key)) continue;
        seen.add(key);
        out.push(v.trim());
    }
    return out;
};

/**
 * The base armor/weapon/tool lists with the character's equipment-proficiency mads
 * applied: flat grants and resolved choose-N picks are unioned in, Remove commands
 * are subtracted (case-insensitively). Pure — feeds useExportProficiencies.
 */
export function applyEquipProficiencyMads(character: Character, base: EquipProficiencies): EquipProficiencies {
    const adds: EquipProficiencies = { armor: [], weapons: [], tools: [] };
    const removes: EquipProficiencies = { armor: [], weapons: [], tools: [] };

    const features = [
        ...(character.levels ?? []).flatMap(l => l.features ?? []),
        ...(character.race?.features ?? []),
        ...(character.features ?? []),
    ];

    for (const feature of features) {
        for (const m of (feature.metadata?.mads ?? []) as MadFeature[]) {
            for (const kind of EQUIP_PROF_KINDS) {
                const cfg = KIND_COMMANDS[kind];
                const bucket = KIND_RESULT[kind];
                if (m.command !== cfg.add && m.command !== cfg.remove) continue;
                const value = m.value?.[cfg.valueKey] ?? "";
                const granted = value === "choice"
                    ? resolveEquipProfChoice(kind, character, feature, m) ?? []
                    : value ? [value] : [];
                (m.command === cfg.add ? adds : removes)[bucket].push(...granted);
            }
        }
    }

    const subtract = (values: string[], removed: string[]): string[] => {
        const gone = new Set(removed.map(r => r.trim().toLowerCase()));
        return values.filter(v => !gone.has(v.trim().toLowerCase()));
    };

    return {
        armor: subtract(uniq([...base.armor, ...adds.armor]), removes.armor),
        weapons: subtract(uniq([...base.weapons, ...adds.weapons]), removes.weapons),
        tools: subtract(uniq([...base.tools, ...adds.tools]), removes.tools),
    };
}
