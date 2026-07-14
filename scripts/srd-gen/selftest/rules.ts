/**
 * Selftest (NOT part of the pipeline): parse rules for both editions and print counts + samples.
 *   npx tsx selftest/rules.ts
 */
import { parseRules2014 } from "../parsers/2014/rules.ts";
import { parseRules2024 } from "../parsers/2024/rules.ts";

const r2014 = parseRules2014();
const r2024 = parseRules2024();
console.log(`parsed: 2014 ${r2014.length} rules (curated), 2024 ${r2024.length} rules (glossary)`);

const show = (label: string, r: (typeof r2014)[number] | undefined) => {
    if (!r) { console.error(`  (missing ${label})`); return; }
    console.log(`\n[${label}] ${r.name}${r.category ? ` — ${r.category}` : ""}${r.page ? ` (${r.page})` : ""}`);
    console.log(`  tags: ${JSON.stringify(r.tags)}${r.related ? ` | related: ${JSON.stringify(r.related)}` : ""}`);
    console.log(`  ${r.description.slice(0, 160)}${r.description.length > 160 ? "…" : ""}`);
};

show("2014", r2014.find(r => r.name === "Jumping"));
show("2014", r2014.find(r => r.name === "Cover"));
show("2024", r2024.find(r => r.name === "Grappled"));
show("2024", r2024.find(r => r.name === "Cover"));

// Category histogram for the parsed 2024 set.
const cats: Record<string, number> = {};
for (const r of r2024) cats[r.category ?? "(none)"] = (cats[r.category ?? "(none)"] ?? 0) + 1;
console.log(`\n2024 category histogram:`, JSON.stringify(cats));
const withRelated = r2024.filter(r => r.related?.length).length;
console.log(`2024 entries with related cross-links: ${withRelated}`);
