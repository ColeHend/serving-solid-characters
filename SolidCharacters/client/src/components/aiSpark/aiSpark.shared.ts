// Shared leaf types/helpers for the Grimoire sidebar components (kept here to avoid component<->component cycles).
import type { ChatMessage } from "../../shared/customHooks/aiAssistant";
import type { HomebrewPreview } from "../../shared/ai/tools/toolDispatcher";
import { Background, Class5E, Feat, MagicItem, Race, Spell, Subclass } from "../../models/generated";
import { srdItem } from "../../models/data/generated";
import { getAtPath, parsePath } from "../../shared/ai/tools/patch";

export type { ChatMessage, HomebrewPreview };

/** A short, human-readable one-liner describing a generated entity, shown on the preview card. */
export function previewSubtitle(p: HomebrewPreview): string {
    switch (p.kind) {
        case "spell": {
            const s = p.entity as Spell;
            const lvl = s.level === "0" ? "Cantrip" : `Level ${s.level}`;
            return [lvl, s.school].filter(Boolean).join(" · ");
        }
        case "item": return `Item · ${(p.entity as srdItem).cost || "—"}`;
        case "magic_item": return `Magic Item · ${(p.entity as MagicItem).rarity}`;
        case "feat": return "Feat";
        case "background": return "Background";
        case "race": return `Race · ${(p.entity as Race).size}`;
        case "subclass": return `Subclass of ${(p.entity as Subclass).parentClass}`;
        case "class": return `Class · Hit Die ${(p.entity as Class5E).hitDie}`;
    }
}

/** A compact "time ago" label for a saved-conversation timestamp (e.g. "just now", "5m", "3h", "2d"). */
export function relativeTime(ts: number): string {
    const diff = Date.now() - ts;
    const min = Math.floor(diff / 60000);
    if (min < 1) return "just now";
    if (min < 60) return `${min}m`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}d`;
    return new Date(ts).toLocaleDateString();
}

/** One changed field, before→after, for the edit diff card. */
export interface FieldDiff { label: string; before: string; after: string; }

const cap = (s: string, n = 140): string => (s.length > n ? `${s.slice(0, n)}…` : s);

/** Render any field value as short display text. */
function valueToText(v: unknown): string {
    if (v == null || v === "") return "—";
    if (typeof v === "string") return v.replace(/\s+/g, " ").trim();
    if (Array.isArray(v)) return v.length ? `${v.length} item${v.length === 1 ? "" : "s"}` : "—";
    if (typeof v === "object") return `${Object.keys(v).length} field${Object.keys(v).length === 1 ? "" : "s"}`;
    return String(v);
}

/** Turn a raw patch path into a friendly label (last meaningful segment, title-cased). */
function friendlyLabel(path: string): string {
    const segs = parsePath(path).filter(s => typeof s === "string") as string[];
    const last = segs[segs.length - 1] ?? path;
    return last.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^\w/, c => c.toUpperCase());
}

/**
 * The field-level before→after diff for an edit preview, computed from the applied patch ops against the
 * pre-edit snapshot. One row per distinct changed path.
 */
export function computeFieldDiff(p: HomebrewPreview): FieldDiff[] {
    const seen = new Set<string>();
    const diffs: FieldDiff[] = [];
    for (const op of p.appliedOps ?? []) {
        if (seen.has(op.path)) continue;
        seen.add(op.path);
        const segs = parsePath(op.path);
        diffs.push({
            label: friendlyLabel(op.path),
            before: cap(valueToText(getAtPath(p.baseEntity, segs))),
            after: cap(valueToText(getAtPath(p.entity, segs))),
        });
    }
    return diffs;
}

/** The main descriptive text of a generated entity (Markdown), shown on the preview card. */
export function previewBody(p: HomebrewPreview): string {
    switch (p.kind) {
        case "spell": return (p.entity as Spell).description;
        case "item": return (p.entity as srdItem).desc;
        case "magic_item": return (p.entity as MagicItem).desc;
        case "feat": return (p.entity as Feat).details.description;
        case "background": return (p.entity as Background).desc;
        case "race": return (p.entity as Race).traits.map(t => `**${t.details.name}.** ${t.details.description}`).join("\n\n");
        case "subclass": return (p.entity as Subclass).description;
        case "class": return `Primary ability: ${(p.entity as Class5E).primaryAbility}`;
    }
}
