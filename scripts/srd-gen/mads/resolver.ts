import { nameKey } from "../lib/util.ts";
import type { RulesetData } from "../types.ts";

export type RefKind = "spell" | "item" | "feature" | "feat";

/**
 * name → id resolver over the assembled (post-id) entities, injected into coerceCommand
 * for the id-based categories. Features are indexed across classes, subclasses,
 * race traits, background features and feat details.
 */
export function buildResolver(data: RulesetData): (refKind: RefKind, name: string) => string | null {
    const maps: Record<RefKind, Map<string, string>> = {
        spell: new Map(),
        item: new Map(),
        feature: new Map(),
        feat: new Map(),
    };
    const put = (kind: RefKind, name: string | undefined, id: string | undefined) => {
        if (!name || !id) return;
        const k = nameKey(name);
        if (!maps[kind].has(k)) maps[kind].set(k, id);
    };

    for (const s of data.spells) put("spell", s.name, s.id);
    for (const list of [data.items, data.weapons ?? [], data.armor ?? []]) {
        for (const i of list) put("item", i.name, i.id);
    }
    for (const m of data.magicItems) put("item", m.name, m.id);
    for (const f of data.feats) {
        put("feat", f.details?.name, f.id);
        put("feature", f.details?.name, f.details?.id);
    }
    for (const c of data.classes) {
        for (const feats of Object.values(c.features ?? {})) for (const f of feats) put("feature", f.name, f.id);
    }
    for (const s of data.subclasses) {
        for (const feats of Object.values(s.features ?? {})) for (const f of feats) put("feature", f.name, f.id);
    }
    for (const r of [...data.races, ...data.subraces]) {
        for (const t of r.traits ?? []) put("feature", t.details?.name, t.details?.id);
    }
    for (const b of data.backgrounds) {
        for (const f of b.features ?? []) put("feature", f.name, f.id);
    }

    return (refKind, name) => maps[refKind]?.get(nameKey(name)) ?? null;
}
