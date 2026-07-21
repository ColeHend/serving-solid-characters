/**
 * srd-gen entrypoint.
 *   npx tsx index.ts [--ruleset 2014|2024|both] [--dry-run] [--no-mads] [--allow-gaps]
 *
 * Pipeline per ruleset: parse → id-stability → curated MADS pass → validate → write.
 * Any hard error (count gate, invalid mad, unmatched curated key, structural problem)
 * blocks the write. The machine-readable run report lands in last-report.json.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DATA_ROOT, OUT_2014, OUT_2024 } from "./config.ts";
import type { Ruleset, RulesetData } from "./types.ts";
import { IdStore, assignIds } from "./ids/idStore.ts";
import { buildResolver } from "./mads/resolver.ts";
import { applyMads, applyOptions } from "./mads/apply.ts";
import { expandMagicItemVariants } from "./mads/variants.ts";
import { coverageGaps, choiceWordingLint } from "./mads/coverage.ts";
import { filePlan, writeFiles, cleanupBackups } from "./emit/writers.ts";
import { stampLegacy } from "./emit/stampLegacy.ts";
import { stampSource } from "./emit/stampSource.ts";
import { rulesetHash, writeManifest, type RulesetManifestEntry } from "./emit/manifest.ts";
import { validateCounts, validateLegacy, validateMadsInData, validateSource, validateStructure } from "./validate/validate.ts";

import { parseClasses2014 } from "./parsers/2014/classes.ts";
import { parseRaces2014 } from "./parsers/2014/races.ts";
import { parseBackgrounds2014 } from "./parsers/2014/backgrounds.ts";
import { parseFeats2014 } from "./parsers/2014/feats.ts";
import { parseSpells2014 } from "./parsers/2014/spells.ts";
import { parseItems2014 } from "./parsers/2014/items.ts";
import { parseMagicItems2014 } from "./parsers/2014/magicItems.ts";
import { parseRules2014 } from "./parsers/2014/rules.ts";
import { parseMonsters2014 } from "./parsers/2014/monsters.ts";
import { parseClasses2024 } from "./parsers/2024/classes.ts";
import { parseOrigins2024 } from "./parsers/2024/origins.ts";
import { parseFeats2024 } from "./parsers/2024/feats.ts";
import { parseSpells2024 } from "./parsers/2024/spells.ts";
import { parseEquipment2024 } from "./parsers/2024/equipment.ts";
import { parseMagicItems2024 } from "./parsers/2024/magicItems.ts";
import { parseRules2024 } from "./parsers/2024/rules.ts";
import { parseMonsters2024 } from "./parsers/2024/monsters.ts";

import { featureMap as featureMap2014, magicItemMap as magicItemMap2014, optionsMap as optionsMap2014 } from "./mads/2014/index.ts";
import { featureMap as featureMap2024, magicItemMap as magicItemMap2024, optionsMap as optionsMap2024 } from "./mads/2024/index.ts";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const opt = (name: string, fallback: string) => {
    const i = args.indexOf(name);
    return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const rulesetArg = opt("--ruleset", "both");
const dryRun = flag("--dry-run");
const noMads = flag("--no-mads");
const rulesets: Ruleset[] = rulesetArg === "both" ? ["2014", "2024"] : [rulesetArg as Ruleset];

function collect(ruleset: Ruleset): RulesetData {
    if (ruleset === "2014") {
        const { classes, subclasses } = parseClasses2014();
        const { races, subraces } = parseRaces2014();
        const { items, weapons, armor } = parseItems2014();
        return {
            classes, subclasses, races, subraces,
            backgrounds: parseBackgrounds2014(),
            feats: parseFeats2014(),
            spells: parseSpells2014(),
            items, weapons, armor,
            magicItems: parseMagicItems2014(),
            rules: parseRules2014(),
            monsters: parseMonsters2014(),
        };
    }
    const { classes, subclasses } = parseClasses2024();
    const { races, backgrounds } = parseOrigins2024();
    const { items, weaponMasteries } = parseEquipment2024();
    return {
        classes, subclasses, races, subraces: [],
        backgrounds,
        feats: parseFeats2024(),
        spells: parseSpells2024(),
        items,
        magicItems: parseMagicItems2024(),
        weaponMasteries,
        rules: parseRules2024(),
        monsters: parseMonsters2024(),
    };
}

interface RunReport {
    ruleset: Ruleset;
    counts: Record<string, number>;
    ids: { preserved: number; minted: number };
    mads: { attached: number; featuresWithMads: number; errors: string[]; unmatchedKeys: string[] };
    coverageGaps: { owner: string; kind: string; feature: string; trigger: string }[];
    errors: string[];
    warnings: string[];
    written: string[];
}

const reports: RunReport[] = [];
const manifestEntries: Partial<Record<Ruleset, RulesetManifestEntry>> = {};
let failed = false;

for (const ruleset of rulesets) {
    const outDir = ruleset === "2014" ? OUT_2014 : OUT_2024;
    console.log(`\n=== ${ruleset} ===`);
    const data = collect(ruleset);
    const variantReport = expandMagicItemVariants(ruleset, data); // split combined items BEFORE ids/mads
    stampLegacy(ruleset, data); // filePlan shares these object references, so this reaches the written files
    stampSource(ruleset, data);

    const store = new IdStore(ruleset, outDir);
    assignIds(store, data);

    const resolveRef = buildResolver(data);
    const featureMap = ruleset === "2014" ? featureMap2014 : featureMap2024;
    const magicItemMap = ruleset === "2014" ? magicItemMap2014 : magicItemMap2024;
    const optionsMap = ruleset === "2014" ? optionsMap2014 : optionsMap2024;
    const emptyReport = () => ({ attached: 0, featuresWithMads: 0, errors: [], unmatchedKeys: [] });
    const madReport = noMads
        ? emptyReport()
        : applyMads(ruleset, data, featureMap, magicItemMap, resolveRef);
    const optionsReport = noMads
        ? emptyReport()
        : applyOptions(data, optionsMap, resolveRef);

    const plan = filePlan(ruleset, data);
    const errors: string[] = [];
    const warnings: string[] = [];
    for (const r of [validateCounts(ruleset, plan), validateStructure(ruleset, data), validateMadsInData(data), validateLegacy(ruleset, data), validateSource(ruleset, data)]) {
        errors.push(...r.errors);
        warnings.push(...r.warnings);
    }
    errors.push(...variantReport.errors);
    errors.push(...madReport.errors.map(e => `mads: ${e}`));
    errors.push(...madReport.unmatchedKeys.map(k => `mads: curated key matched nothing: ${k}`));
    errors.push(...optionsReport.errors.map(e => `options: ${e}`));
    errors.push(...optionsReport.unmatchedKeys.map(k => `options: curated key matched nothing: ${k}`));
    errors.push(...choiceWordingLint(data).map(e => `mads-lint: ${e}`));

    const gaps = noMads ? [] : coverageGaps(data);
    const counts = Object.fromEntries(Object.entries(plan).map(([k, v]) => [k, v.length]));
    console.log("counts:", JSON.stringify(counts));
    console.log(`ids: preserved ${store.preserved}, minted ${store.minted}`);
    console.log(`variants: ${variantReport.expanded} concrete items from split combined entries`);
    console.log(`mads: ${madReport.attached} commands on ${madReport.featuresWithMads} features/items; coverage gaps: ${gaps.length}`);
    console.log(`options: ${optionsReport.attached} options on ${optionsReport.featuresWithMads} features`);
    if (warnings.length) console.log(`warnings (${warnings.length}):\n  - ` + warnings.slice(0, 15).join("\n  - ") + (warnings.length > 15 ? `\n  ... +${warnings.length - 15} more` : ""));
    if (errors.length) {
        failed = true;
        console.error(`ERRORS (${errors.length}):\n  - ` + errors.slice(0, 40).join("\n  - ") + (errors.length > 40 ? `\n  ... +${errors.length - 40} more` : ""));
    }

    let written: string[] = [];
    if (!errors.length && !dryRun) {
        written = writeFiles(outDir, plan);
        const removed = cleanupBackups(outDir);
        console.log(`wrote ${written.length} files to ${outDir}${removed.length ? `; removed ${removed.length} backup artifacts` : ""}`);
        manifestEntries[ruleset] = { hash: rulesetHash(plan), counts, generatedAt: new Date().toISOString() };
    } else if (dryRun) {
        console.log("dry-run: nothing written");
    } else {
        console.error("errors present: nothing written");
    }

    reports.push({ ruleset, counts, ids: { preserved: store.preserved, minted: store.minted }, mads: madReport, coverageGaps: gaps, errors, warnings, written });
}

if (Object.keys(manifestEntries).length) {
    const manifestPath = writeManifest(DATA_ROOT, manifestEntries);
    console.log(`manifest: ${manifestPath}`);
}

const reportPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "last-report.json");
fs.writeFileSync(reportPath, JSON.stringify(reports, null, 1));
console.log(`\nreport: ${reportPath}`);
if (failed) process.exit(1);
