/**
 * Self-test for parsers/2014/classes.ts. Not part of the pipeline.
 * Run: cd scripts/srd-gen && npx tsx selftest/classes2014.ts
 */
import fs from "node:fs";
import path from "node:path";
import { parseClasses2014 } from "../parsers/2014/classes.ts";
import type { ClassJson } from "../types.ts";

const CASTERS = ["Bard", "Cleric", "Druid", "Paladin", "Ranger", "Sorcerer", "Warlock", "Wizard"];
const OUT = "/tmp/claude-1000/-home-coleh-Projects-Real-serving-solid-characters/52ced0f6-5909-4ce0-b265-9a6e3206f765/scratchpad/classes2014-sample.json";

const { classes, subclasses } = parseClasses2014();

console.log(`classes: ${classes.length}   subclasses: ${subclasses.length}\n`);

let problems = 0;
const casterLevel = (c: ClassJson) => (c.spellcasting?.metadata.casterType);

console.log("=== per-class coverage ===");
for (const c of classes) {
    const levels = Object.keys(c.features).map(Number).sort((a, b) => a - b);
    const missing = [];
    for (let l = 1; l <= 20; l++) if (!levels.includes(l)) missing.push(l);
    const totalFeatures = Object.values(c.features).reduce((n, a) => n + a.length, 0);
    const emptyLevels = Object.values(c.features).filter(a => a.length === 0).length;

    let slotNote = "no-spellcasting";
    if (c.spellcasting) {
        const slots = c.spellcasting.metadata.slots;
        const slotLevels = Object.keys(slots);
        const casterStart = CASTERS.includes(c.name);
        // caster levels that actually grant slots (have any spell_slots_level_*)
        const withSlots = Object.values(slots).filter(s => Object.keys(s).some(k => k.startsWith("spell_slots_level_"))).length;
        slotNote = `spellcasting casterType=${casterLevel(c)} known=${c.spellcasting.known_type} slotKeys=${slotLevels.length} levelsWithSlots=${withSlots}`;
        void casterStart;
    }

    const flag = missing.length ? " <<< MISSING LEVELS" : "";
    console.log(`  ${c.name.padEnd(10)} levels=${levels.length}/20 feats=${totalFeatures} empty=${emptyLevels}  ${slotNote}${flag}`);
    if (missing.length) { problems++; console.log(`      missing: ${missing.join(",")}`); }
}

console.log("\n=== caster slot-level completeness ===");
for (const name of CASTERS) {
    const c = classes.find(x => x.name === name)!;
    const slots = c.spellcasting?.metadata.slots ?? {};
    // expected first caster level: level where slots first appear (non-empty)
    const nonEmpty = Object.entries(slots)
        .filter(([, s]) => Object.keys(s).some(k => k.startsWith("spell_slots_level_")))
        .map(([lvl]) => Number(lvl))
        .sort((a, b) => a - b);
    const first = nonEmpty[0], last = nonEmpty[nonEmpty.length - 1];
    let gap = "";
    for (let l = first; l <= last; l++) {
        const s = slots[String(l)] ?? {};
        if (!Object.keys(s).some(k => k.startsWith("spell_slots_level_"))) gap += ` ${l}`;
    }
    const ok = !!c.spellcasting && nonEmpty.length > 0 && !gap;
    if (!ok) problems++;
    console.log(`  ${name.padEnd(9)} casterType=${c.spellcasting?.metadata.casterType} slotsAt=${first}..${last} (${nonEmpty.length} lvls)${gap ? "  GAP:" + gap : "  OK"}`);
}

console.log("\n=== subclasses ===");
for (const s of subclasses) {
    const lvls = Object.keys(s.features).map(Number).sort((a, b) => a - b);
    const feats = Object.values(s.features).reduce((n, a) => n + a.length, 0);
    const spellFeat = Object.values(s.features).flat().find(f => f.metadata?.spells?.length);
    console.log(`  ${s.name.padEnd(12)} <- ${s.parent_class.padEnd(10)} lvls=[${lvls.join(",")}] feats=${feats}${spellFeat ? `  spells@"${spellFeat.name}"=${spellFeat.metadata!.spells!.length}` : ""}`);
}

// unmatched-feature audit: features whose description fell back to the placeholder
console.log("\n=== placeholder ('See your subclass.') feature audit ===");
for (const c of classes) {
    const ph = Object.entries(c.features).flatMap(([lvl, arr]) =>
        arr.filter(f => f.description === "See your subclass.").map(f => `${lvl}:${f.name}`));
    if (ph.length) console.log(`  ${c.name}: ${ph.join(", ")}`);
}

// spot-check dumps
const wanted = ["Barbarian", "Wizard", "Warlock"];
const sample = {
    classes: classes.filter(c => wanted.includes(c.name)),
    subclasses: subclasses.filter(s => wanted.includes(s.parent_class)),
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(sample, null, 2));
console.log(`\nsample written: ${OUT}`);

console.log(`\nGATES: classes=${classes.length}(want 12) subclasses=${subclasses.length}(want 12) problems=${problems}`);
if (classes.length !== 12 || subclasses.length !== 12 || problems > 0) {
    console.error("SELF-TEST FAILED");
    process.exit(1);
}
console.log("SELF-TEST PASSED");
