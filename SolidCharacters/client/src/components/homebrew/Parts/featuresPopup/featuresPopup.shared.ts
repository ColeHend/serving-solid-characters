import { Accessor, Setter } from "solid-js";
import { FeatureDetail, MadPrerequisite, Spell } from "../../../../models/generated";
import { MadForm, MadPrereqForm } from "../../../../models/data/formModels";
import { srdItem } from "../../../../models/data/generated";
import { Feat } from "../../../../shared";
import { FormArray } from "coles-solid-library";
import { MAD_CATEGORIES } from "../../../../shared/ai/commands/madCommandCatalog";

export { MAD_CATEGORIES };

/** metadata.category values that are wizard machine tags, not user-facing categories. */
export const MACHINE_CATEGORIES = ["ASI", "Subclass"];

/** Where the feature being edited lives, for the header subtitle. All optional. */
export interface PopupContext {
    kind?: string;
    className?: string;
    subclassName?: string;
    level?: number;
}

export interface FeaturesPopupProps {
    Show: [Accessor<boolean>, Setter<boolean>];
    feature: [Accessor<FeatureDetail>, Setter<FeatureDetail>];
    onClose?: (data: FeatureDetail) => void;
    isEdit: Accessor<boolean>;
    context?: PopupContext;
}

/**
 * The mads FormArray stays owned by FeaturesPopup; tabs and cards mutate it
 * through this narrow API so there is a single writer per row field.
 */
export interface MadsApi {
    rows: Accessor<MadForm[]>;
    setMadFeature: <T extends keyof MadForm>(key: T, index: number, value: MadForm[T]) => void;
    addMadRow: (init?: Partial<MadForm>) => void;
    removeMad: (index: number) => void;
    isEditorOpen: (key: string) => boolean;
    setEditorOpen: (key: string, open: boolean) => void;
}

/** Data hooks the per-category value editors need, fetched once by the popup. */
export interface EffectCardData {
    allSpells: Accessor<Spell[]>;
    allItems: Accessor<srdItem[]>;
    allFeatures: Accessor<FeatureDetail[]>;
    allFeats: Accessor<Feat[]>;
}

export type PrereqState = [Accessor<Record<string, MadPrerequisite>>, Setter<Record<string, MadPrerequisite>>];
export type PrereqFormArray = FormArray<MadPrereqForm>;

export const isUsesMad = (mad: Pick<MadForm, "command">): boolean => mad.command === "AddUses";

/** An AddSpells mad granting one concrete spell (not the "choice" form). */
export const isConcreteSpellMad = (mad: Pick<MadForm, "command" | "value">): boolean =>
    mad.command === "AddSpells" && !!mad.value?.["ID"] && mad.value["ID"] !== "choice";

/**
 * Row indices the Usage & spells tab edits: the FIRST AddUses row plus every
 * concrete AddSpells row. The Effects tab hides exactly these — anything else
 * (duplicate AddUses, RemoveSpells, choice-form AddSpells) stays visible there
 * so no row is ever silently unreachable.
 */
export function usageOwnedIndices(mads: Pick<MadForm, "command" | "value">[]): Set<number> {
    const owned = new Set<number>();
    const firstUses = mads.findIndex(isUsesMad);
    if (firstUses >= 0) owned.add(firstUses);
    mads.forEach((mad, i) => {
        if (isConcreteSpellMad(mad)) owned.add(i);
    });
    return owned;
}

/**
 * Branch (choice-group) semantics: group 0 always applies; rows sharing a nonzero group form
 * one branch, and the player picks exactly ONE branch on the sheet. A branch's display name
 * lives in each row's value.groupLabel.
 */

/** Distinct nonzero branch numbers across rows, ascending. */
export function branchNumbers(mads: Pick<MadForm, "group">[]): number[] {
    return [...new Set(mads.map(m => Number(m.group) || 0).filter(g => g > 0))].sort((a, b) => a - b);
}

/** A branch's display label: the first non-empty value.groupLabel among its rows. */
export function branchLabel(mads: Pick<MadForm, "group" | "value">[], group: number): string {
    for (const m of mads) {
        if ((Number(m.group) || 0) !== group) continue;
        const label = (m.value?.["groupLabel"] ?? "").trim();
        if (label) return label;
    }
    return "";
}

/** Stored recharge values vary in case/shape ("short", "Short Rest"); UI shows the canonical pair. */
export function normalizeRecharge(raw: string | undefined): "Short Rest" | "Long Rest" {
    return (raw ?? "").toLowerCase().startsWith("short") ? "Short Rest" : "Long Rest";
}

/** "AddHitPoints" → { commandType: "Add", commandCategory: "HitPoints" }, for form hydration. */
export function splitCommand(command: string): { commandType: string; commandCategory: string } {
    if (command.startsWith("Add")) return { commandType: "Add", commandCategory: command.slice(3) };
    if (command.startsWith("Remove")) return { commandType: "Remove", commandCategory: command.slice(6) };
    return { commandType: "", commandCategory: "" };
}

/**
 * Header subtitle, e.g. "Subclass feature · Light Domain — Cleric 2".
 * Missing segments drop out cleanly; no context and no machine tag → "".
 */
export function buildSubtitle(ctx: PopupContext | undefined, category: string | undefined): string {
    const hasContext = !!ctx && (!!ctx.kind || !!ctx.className || !!ctx.subclassName || ctx.level !== undefined);
    const kind = ctx?.kind
        ?? (category === "ASI" ? "Ability Score Improvement"
            : category === "Subclass" ? "Subclass level"
                : hasContext ? "Class feature" : "");

    const classLevel = [ctx?.className, ctx?.level]
        .filter(part => part !== undefined && part !== "")
        .join(" ");

    let out = kind;
    if (ctx?.subclassName) out = out ? `${out} · ${ctx.subclassName}` : ctx.subclassName;
    if (classLevel) out = out ? `${out} — ${classLevel}` : classLevel;
    return out;
}
