// Shared leaf types/helpers for the Spark sidebar components (kept here to avoid component<->component cycles).
import type { ChatMessage } from "../../shared/customHooks/aiAssistant";
import type { HomebrewPreview } from "../../shared/ai/toolDispatcher";
import { Background, Class5E, Feat, MagicItem, Race, Spell, Subclass } from "../../models/generated";
import { srdItem } from "../../models/data/generated";

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
