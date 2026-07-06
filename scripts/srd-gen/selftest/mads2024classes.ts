/**
 * Self-test for the curated 2024 class/subclass MADS maps. Not part of the pipeline.
 * Run: cd scripts/srd-gen && npx tsx selftest/mads2024classes.ts
 *
 *  1. Feeds EVERY curated spec through the client catalog's coerceCommand (resolveRef stubbed) —
 *     any null is a hard authoring error (must be ZERO).
 *  2. Cross-checks every map key against the feature names the 2024 parser actually emits, so a
 *     typo'd "<Class>/<Feature>" key (which applyMads would silently drop) is caught here.
 */
import { coerceCommand } from "../../../SolidCharacters/client/src/shared/ai/commands/madCommandCatalog.ts";
import { nameKey } from "../lib/util.ts";
import { parseClasses2024 } from "../parsers/2024/classes.ts";
import { map as classMap } from "../mads/2024/classes.ts";
import { map as subclassMap } from "../mads/2024/subclasses.ts";
import type { MadMap } from "../mads/spec.ts";

const resolveRef = () => "stub-id";
const keyFor = (raw: string): string => (raw.includes("/") ? raw.split("/").map(nameKey).join("/") : nameKey(raw));

// The exact "<owner>/<feature>" keys the parser produces (what applyMads matches against).
const { classes, subclasses } = parseClasses2024();
const featureKeys = new Set<string>();
for (const c of classes) for (const feats of Object.values(c.features ?? {})) for (const f of feats) featureKeys.add(`${nameKey(c.name)}/${nameKey(f.name)}`);
for (const s of subclasses) for (const feats of Object.values(s.features ?? {})) for (const f of feats) featureKeys.add(`${nameKey(s.name)}/${nameKey(f.name)}`);

let total = 0;
let nulls = 0;
const unmatched: string[] = [];

function run(label: string, m: MadMap): void {
    console.log(`\n=== ${label} ===`);
    const byOwner = new Map<string, { features: number; commands: number }>();
    for (const [rawKey, specs] of Object.entries(m)) {
        const owner = rawKey.split("/")[0];
        const agg = byOwner.get(owner) ?? { features: 0, commands: 0 };
        agg.features++;
        if (!featureKeys.has(keyFor(rawKey))) unmatched.push(rawKey);
        for (const spec of specs) {
            total++;
            agg.commands++;
            const mad = coerceCommand(spec.type, spec.category, spec.value, spec.target, resolveRef as any);
            if (!mad) {
                nulls++;
                console.log(`  NULL  "${rawKey}" ${spec.type}${spec.category} ${JSON.stringify(spec.value)}${spec.target ? ` target="${spec.target}"` : ""}`);
            }
        }
        byOwner.set(owner, agg);
    }
    for (const [owner, agg] of [...byOwner.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        console.log(`  ${owner.padEnd(32)} features=${String(agg.features).padStart(2)}  commands=${String(agg.commands).padStart(3)}`);
    }
}

run("classes", classMap);
run("subclasses", subclassMap);

console.log(`\ntotal commands=${total}  nulls=${nulls}  unmatchedKeys=${unmatched.length}`);
if (unmatched.length) console.log("UNMATCHED KEYS:\n  " + unmatched.join("\n  "));

if (nulls > 0 || unmatched.length > 0) {
    console.error("\nSELF-TEST FAILED");
    process.exit(1);
}
console.log("\nSELF-TEST PASSED");
