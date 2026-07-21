/**
 * Self-test for the curated OPTION lists (Eldritch Invocations, Pact Boon).
 *
 *   cd scripts/srd-gen && npx tsx selftest/options.ts
 *
 * Hard gates (any failure exits 1):
 *   - every option mad coerces through the client catalog (stub resolver)
 *   - every map key resolves to a real parsed class feature
 *   - every AddSpells target resolves to a real spell name in its ruleset
 *   - configs are sane (count >= 1 or well-formed countScaling)
 *   - expected option counts: 2014 invocations = 32 + Pact Boon = 3; 2024 invocations = 28
 */
import { coerceCommand } from "../../../SolidCharacters/client/src/shared/ai/commands/madCommandCatalog.ts";
import { hasDerivedSpellPool } from "../../../SolidCharacters/client/src/shared/customHooks/mads/spellChoiceFilters.ts";
import { optionsMap as options2014 } from "../mads/2014/invocations.ts";
import { optionsMap as options2024 } from "../mads/2024/invocations.ts";
import type { OptionsMap } from "../mads/spec.ts";
import { nameKey } from "../lib/util.ts";
import { parseClasses2014 } from "../parsers/2014/classes.ts";
import { parseSpells2014 } from "../parsers/2014/spells.ts";
import { parseClasses2024 } from "../parsers/2024/classes.ts";
import { parseSpells2024 } from "../parsers/2024/spells.ts";

const STUB = () => "stub-id";
const SCALING_SHAPE = /^\d+:\d+(,\d+:\d+)*$/;

const failures: string[] = [];

function check(
    label: string,
    map: OptionsMap,
    featureKeys: Set<string>,
    spellNames: Set<string>,
    expectedCounts: Record<string, number>,
) {
    for (const [rawKey, entry] of Object.entries(map)) {
        const slash = rawKey.indexOf("/");
        const key = slash >= 0
            ? `${nameKey(rawKey.slice(0, slash))}/${nameKey(rawKey.slice(slash + 1))}`
            : nameKey(rawKey);
        if (!featureKeys.has(key)) failures.push(`[${label}] "${rawKey}": matches no parsed class feature`);

        const scaling = (entry.config.countScaling ?? "").trim();
        if (scaling && !SCALING_SHAPE.test(scaling)) failures.push(`[${label}] "${rawKey}": bad countScaling "${scaling}"`);
        if (!scaling && !(entry.config.count && entry.config.count >= 1)) failures.push(`[${label}] "${rawKey}": config needs count or countScaling`);

        const expected = expectedCounts[rawKey];
        if (expected !== undefined && entry.options.length !== expected) {
            failures.push(`[${label}] "${rawKey}": expected ${expected} options, got ${entry.options.length}`);
        }

        const seen = new Set<string>();
        for (const option of entry.options) {
            const optKey = `${rawKey}/${option.name}`;
            if (!option.name?.trim() || option.name.includes(",")) failures.push(`[${label}] "${optKey}": bad name`);
            if (seen.has(nameKey(option.name))) failures.push(`[${label}] "${optKey}": duplicate`);
            seen.add(nameKey(option.name));
            if (!option.description?.trim()) failures.push(`[${label}] "${optKey}": missing description`);
            for (const spec of option.mads ?? []) {
                const mad = coerceCommand(spec.type, spec.category, spec.value, spec.target, STUB);
                if (!mad) {
                    failures.push(`[${label}] "${optKey}": ${spec.type}${spec.category} ${JSON.stringify(spec.value)} failed coercion`);
                    continue;
                }
                if (mad.command === "AddSpells" && mad.value["ID"] === "choice" && !mad.value["options"] && !hasDerivedSpellPool(mad.value)) {
                    failures.push(`[${label}] "${optKey}": choice-form AddSpells has no pool`);
                }
                if (spec.category === "Spells" && spec.target && !spellNames.has(nameKey(spec.target))) {
                    failures.push(`[${label}] "${optKey}": spell target "${spec.target}" not in ${label} spell list`);
                }
            }
        }
    }
}

function classFeatureKeys(classes: { name: string; features?: Record<string | number, { name: string }[]> }[]): Set<string> {
    const keys = new Set<string>();
    for (const c of classes) {
        for (const feats of Object.values(c.features ?? {})) {
            for (const f of feats) keys.add(`${nameKey(c.name)}/${nameKey(f.name)}`);
        }
    }
    return keys;
}

check(
    "2014",
    options2014,
    classFeatureKeys(parseClasses2014().classes),
    new Set(parseSpells2014().map((s: { name: string }) => nameKey(s.name))),
    { "Warlock/Eldritch Invocations": 32, "Warlock/Pact Boon": 3 },
);
check(
    "2024",
    options2024,
    classFeatureKeys(parseClasses2024().classes),
    new Set(parseSpells2024().map((s: { name: string }) => nameKey(s.name))),
    { "Warlock/Eldritch Invocations": 28 },
);

if (failures.length) {
    console.error(`OPTIONS SELFTEST FAILED (${failures.length}):\n  - ` + failures.join("\n  - "));
    process.exit(1);
}
console.log("options selftest OK: 2014 invocations + Pact Boon, 2024 invocations all coerce and resolve");
