import { coerceCommand } from "../../../SolidCharacters/client/src/shared/ai/commands/madCommandCatalog.ts";
import { nameKey } from "../lib/util.ts";
import type { FeatureDetailJson, MadFeatureJson, RulesetData, Ruleset } from "../types.ts";
import type { CommandSpecInput, MadMap } from "./spec.ts";
import type { RefKind } from "./resolver.ts";

export interface MadApplyReport {
    attached: number;
    featuresWithMads: number;
    /** Curated specs that failed coercion — hard authoring errors. */
    errors: string[];
    /** Curated map keys that matched no parsed feature — hard authoring errors. */
    unmatchedKeys: string[];
}

interface FeatureRef {
    /** map key, e.g. "barbarian/rage" (nameKey'd on both sides) */
    key: string;
    detail: FeatureDetailJson;
    /** "race" | "subrace" — used by the AddStats-on-race lint. */
    ownerKind: string;
}

function collectFeatureRefs(data: RulesetData): FeatureRef[] {
    const refs: FeatureRef[] = [];
    const add = (owner: string, feature: FeatureDetailJson, ownerKind: string) =>
        refs.push({ key: `${nameKey(owner)}/${nameKey(feature.name)}`, detail: feature, ownerKind });

    for (const c of data.classes) {
        for (const feats of Object.values(c.features ?? {})) for (const f of feats) add(c.name, f, "class");
    }
    for (const s of data.subclasses) {
        for (const feats of Object.values(s.features ?? {})) for (const f of feats) add(s.name, f, "subclass");
    }
    for (const r of data.races) for (const t of r.traits ?? []) if (t.details) add(r.name, t.details, "race");
    for (const r of data.subraces) for (const t of r.traits ?? []) if (t.details) add(r.name, t.details, "subrace");
    for (const b of data.backgrounds) for (const f of b.features ?? []) add(b.name, f, "background");
    for (const f of data.feats) if (f.details) refs.push({ key: nameKey(f.details.name), detail: f.details, ownerKind: "feat" });
    return refs;
}

function coerceSpecs(
    specs: CommandSpecInput[],
    key: string,
    resolveRef: (refKind: RefKind, name: string) => string | null,
    errors: string[],
): MadFeatureJson[] {
    const out: MadFeatureJson[] = [];
    for (const spec of specs) {
        const mad = coerceCommand(spec.type, spec.category, spec.value, spec.target, resolveRef as any);
        if (!mad) {
            errors.push(`"${key}": ${spec.type}${spec.category} ${JSON.stringify(spec.value)}${spec.target ? ` target="${spec.target}"` : ""} failed coercion`);
            continue;
        }
        // conditional the catalog can't express per-category: a choice-form AddStats needs options
        if (spec.category.toLowerCase().startsWith("stat") && mad.value["stat"] === "choice" && !mad.value["options"]) {
            errors.push(`"${key}": choice-form ${mad.command} is missing its options list`);
            continue;
        }
        out.push(mad as unknown as MadFeatureJson);
    }
    return out;
}

/**
 * Second pass: attach curated commands to features (metadata.mads) and magic items.
 * Duplicate feature names (e.g. "Ability Score Improvement" at levels 4/8/12...) all
 * receive the same commands — the map key is level-agnostic by design.
 */
export function applyMads(
    ruleset: Ruleset,
    data: RulesetData,
    featureMap: MadMap,
    magicItemMap: MadMap,
    resolveRef: (refKind: RefKind, name: string) => string | null,
): MadApplyReport {
    const report: MadApplyReport = { attached: 0, featuresWithMads: 0, errors: [], unmatchedKeys: [] };

    const refs = collectFeatureRefs(data);
    const byKey = new Map<string, FeatureRef[]>();
    for (const r of refs) {
        const list = byKey.get(r.key) ?? [];
        list.push(r);
        byKey.set(r.key, list);
    }

    for (const [rawKey, specs] of Object.entries(featureMap)) {
        // split on the FIRST "/" only — feature names may themselves contain one ("Channel Divinity (1/rest)")
        const slash = rawKey.indexOf("/");
        const key = slash >= 0
            ? `${nameKey(rawKey.slice(0, slash))}/${nameKey(rawKey.slice(slash + 1))}`
            : nameKey(rawKey);
        const targets = byKey.get(key);
        if (!targets?.length) {
            report.unmatchedKeys.push(rawKey);
            continue;
        }
        const mads = coerceSpecs(specs, rawKey, resolveRef, report.errors);
        if (!mads.length) continue;
        for (const t of targets) {
            // lint: racial ability bonuses live in abilityBonuses — never as stat mads
            if ((t.ownerKind === "race" || t.ownerKind === "subrace") && mads.some(m => m.command.endsWith("Stats"))) {
                report.errors.push(`"${rawKey}": AddStats/RemoveStats on a ${t.ownerKind} trait is forbidden (use abilityBonuses)`);
                continue;
            }
            t.detail.metadata = t.detail.metadata ?? {};
            t.detail.metadata.mads = [...(t.detail.metadata.mads ?? []), ...mads.map(m => ({ ...m, value: { ...m.value } }))];
            report.featuresWithMads++;
            report.attached += mads.length;
        }
    }

    const itemsByKey = new Map(data.magicItems.map(m => [nameKey(m.name), m]));
    for (const [rawKey, specs] of Object.entries(magicItemMap)) {
        const item = itemsByKey.get(nameKey(rawKey));
        if (!item) {
            report.unmatchedKeys.push(`magic item: ${rawKey}`);
            continue;
        }
        const mads = coerceSpecs(specs, rawKey, resolveRef, report.errors);
        if (!mads.length) continue;
        item.metadata = item.metadata ?? {};
        item.metadata.mads = [...(item.metadata.mads ?? []), ...mads];
        report.featuresWithMads++;
        report.attached += mads.length;
    }

    return report;
}
