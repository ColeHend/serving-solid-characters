/**
 * Self-test for the curated 2014 class + subclass MADS maps.
 *
 *   cd scripts/srd-gen && npx tsx selftest/mads2014classes.ts
 *
 * Primary check (per the authoring contract): feed EVERY spec through the client catalog's
 * coerceCommand with a stub resolver — any spec that coerces to null is a hard authoring error.
 * Must be ZERO. Also prints per-class command counts.
 *
 * Secondary checks (catch failures the stub can't see, which would break the real srd-gen run):
 *   - every map key resolves to a real parsed feature (mads/apply.ts reports unmatched keys as errors)
 *   - every AddSpells target resolves to a real 2014 spell name (a miss => coercion error at build time)
 */
import { coerceCommand } from "../../../SolidCharacters/client/src/shared/ai/commands/madCommandCatalog.ts";
import { map as classesMap } from "../mads/2014/classes.ts";
import { map as subclassesMap } from "../mads/2014/subclasses.ts";
import type { CommandSpecInput, MadMap } from "../mads/spec.ts";
import { nameKey } from "../lib/util.ts";
import { parseClasses2014 } from "../parsers/2014/classes.ts";
import { parseSpells2014 } from "../parsers/2014/spells.ts";

const STUB = () => "stub-id";

interface Tally {
    total: number;
    nulls: string[];
}

/** Run every spec through coerceCommand; collect nulls and per-class counts. */
function coerceAll(map: MadMap, label: string): { tally: Tally; perClass: Map<string, number> } {
    const tally: Tally = { total: 0, nulls: [] };
    const perClass = new Map<string, number>();
    for (const [key, specs] of Object.entries(map)) {
        const cls = key.includes("/") ? key.split("/")[0] : key;
        for (const spec of specs as CommandSpecInput[]) {
            tally.total++;
            const mad = coerceCommand(spec.type, spec.category, spec.value, spec.target, STUB);
            if (!mad) {
                tally.nulls.push(`[${label}] "${key}": ${spec.type}${spec.category} ${JSON.stringify(spec.value)}${spec.target ? ` target="${spec.target}"` : ""}`);
                continue;
            }
            perClass.set(cls, (perClass.get(cls) ?? 0) + 1);
        }
    }
    return { tally, perClass };
}

// ---- primary: coercion ----
const classesRes = coerceAll(classesMap, "classes");
const subclassesRes = coerceAll(subclassesMap, "subclasses");
const allNulls = [...classesRes.tally.nulls, ...subclassesRes.tally.nulls];

console.log("=== per-class command counts ===");
console.log("- classes.ts");
for (const [cls, n] of [...classesRes.perClass].sort((a, b) => a[0].localeCompare(b[0]))) console.log(`    ${cls}: ${n}`);
console.log(`    TOTAL: ${classesRes.tally.total}`);
console.log("- subclasses.ts");
for (const [cls, n] of [...subclassesRes.perClass].sort((a, b) => a[0].localeCompare(b[0]))) console.log(`    ${cls}: ${n}`);
console.log(`    TOTAL: ${subclassesRes.tally.total}`);

// ---- secondary: key + spell resolution against the real parser ----
const { classes, subclasses } = parseClasses2014();
const featureKeys = new Set<string>();
for (const c of classes) for (const feats of Object.values(c.features)) for (const f of feats) featureKeys.add(`${nameKey(c.name)}/${nameKey(f.name)}`);
for (const s of subclasses) for (const feats of Object.values(s.features)) for (const f of feats) featureKeys.add(`${nameKey(s.name)}/${nameKey(f.name)}`);

const spellKeys = new Set(parseSpells2014().map(sp => nameKey(sp.name)));

const unmatchedKeys: string[] = [];
const unresolvedSpells: string[] = [];
for (const [label, map] of [["classes", classesMap], ["subclasses", subclassesMap]] as const) {
    for (const [key, specs] of Object.entries(map)) {
        // split on the FIRST "/" only — feature names may themselves contain one
        // ("Channel Divinity (1/rest)"); mirrors mads/apply.ts key handling.
        const slash = key.indexOf("/");
        const nk = slash >= 0 ? `${nameKey(key.slice(0, slash))}/${nameKey(key.slice(slash + 1))}` : nameKey(key);
        if (!featureKeys.has(nk)) unmatchedKeys.push(`[${label}] "${key}"`);
        for (const spec of specs as CommandSpecInput[]) {
            if (spec.category === "Spells" && spec.target && !spellKeys.has(nameKey(spec.target))) {
                unresolvedSpells.push(`[${label}] "${key}" -> spell "${spec.target}"`);
            }
        }
    }
}

// ---- report ----
console.log("\n=== results ===");
console.log(`coercion nulls: ${allNulls.length}`);
for (const n of allNulls) console.log(`  NULL ${n}`);
console.log(`unmatched feature keys: ${unmatchedKeys.length}`);
for (const k of unmatchedKeys) console.log(`  UNMATCHED ${k}`);
console.log(`unresolved AddSpells targets: ${unresolvedSpells.length}`);
for (const s of unresolvedSpells) console.log(`  UNRESOLVED ${s}`);

const grandTotal = classesRes.tally.total + subclassesRes.tally.total;
const ok = allNulls.length === 0 && unmatchedKeys.length === 0 && unresolvedSpells.length === 0;
console.log(`\n${ok ? "PASS" : "FAIL"}: ${grandTotal} specs (${classesRes.tally.total} class + ${subclassesRes.tally.total} subclass); ` +
    `${allNulls.length} nulls, ${unmatchedKeys.length} unmatched keys, ${unresolvedSpells.length} unresolved spells.`);
process.exit(ok ? 0 : 1);
