/**
 * Self-test for the curated 2014 races / backgrounds / feats / magic-item MADS maps.
 * Runs every authored spec through the client catalog's coerceCommand with a stub resolver and
 * reports any spec that fails coercion (must be ZERO) plus per-file / per-command counts.
 *
 * Run: cd scripts/srd-gen && npx tsx selftest/mads2014misc.ts
 */
import { coerceCommand } from "../../../SolidCharacters/client/src/shared/ai/commands/madCommandCatalog.ts";
import { map as races } from "../mads/2014/races.ts";
import { map as backgrounds } from "../mads/2014/backgrounds.ts";
import { map as feats } from "../mads/2014/feats.ts";
import { map as magicItems } from "../mads/2014/magicItems.ts";
import type { MadMap } from "../mads/spec.ts";

// resolveRef is only exercised by id-based categories (Spells/Items/Features/Feats); none of these
// curated maps use them, but stub it so a stray ref still coerces rather than throwing.
const resolveRef = () => "stub-id";

interface Row {
    file: string;
    key: string;
    type: string;
    category: string;
    value: string;
    ok: boolean;
}

const rows: Row[] = [];

function run(file: string, m: MadMap): { keys: number; specs: number; ok: number; nulls: number } {
    let specs = 0;
    let ok = 0;
    let nulls = 0;
    for (const [key, list] of Object.entries(m)) {
        for (const spec of list) {
            specs++;
            const mad = coerceCommand(spec.type, spec.category, spec.value, spec.target, resolveRef);
            const good = mad !== null;
            if (good) ok++; else nulls++;
            rows.push({ file, key, type: spec.type, category: spec.category, value: JSON.stringify(spec.value), ok: good });
        }
    }
    return { keys: Object.keys(m).length, specs, ok, nulls };
}

const files: [string, MadMap][] = [
    ["races.ts", races],
    ["backgrounds.ts", backgrounds],
    ["feats.ts", feats],
    ["magicItems.ts", magicItems],
];

console.log("=== 2014 misc MADS coercion ===\n");
console.log("file".padEnd(16), "keys".padStart(5), "specs".padStart(6), "ok".padStart(4), "nulls".padStart(6));
let totalSpecs = 0;
let totalNulls = 0;
for (const [file, m] of files) {
    const r = run(file, m);
    totalSpecs += r.specs;
    totalNulls += r.nulls;
    console.log(file.padEnd(16), String(r.keys).padStart(5), String(r.specs).padStart(6), String(r.ok).padStart(4), String(r.nulls).padStart(6));
}
console.log("-".repeat(40));
console.log("TOTAL".padEnd(16), "".padStart(5), String(totalSpecs).padStart(6), String(totalSpecs - totalNulls).padStart(4), String(totalNulls).padStart(6));

// Per-category distribution across all four files.
const byCat: Record<string, number> = {};
for (const r of rows) byCat[r.category] = (byCat[r.category] ?? 0) + 1;
console.log("\n=== command category distribution ===");
console.log(Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c}:${n}`).join("  "));

// Every failing spec, printed loudly.
const failures = rows.filter(r => !r.ok);
console.log(`\n=== NULLS (must be 0): ${failures.length} ===`);
for (const f of failures) {
    console.log(`  ${f.file} "${f.key}" ${f.type}${f.category} ${f.value}`);
}

if (failures.length > 0) {
    console.error("\nFAIL: one or more curated specs failed coercion.");
    process.exit(1);
}
console.log("\nPASS: all curated specs coerce cleanly.");
