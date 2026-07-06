/**
 * Self-test for the 2014 spells + items parsers. Prints counts, spells-without-class,
 * and dumps Fireball + a weapon/armor/items sample to scratchpad for eyeballing.
 *   cd scripts/srd-gen && npx tsx selftest/spellsItems2014.ts
 */
import fs from "node:fs";
import { parseSpells2014 } from "../parsers/2014/spells.ts";
import { parseItems2014 } from "../parsers/2014/items.ts";

const OUT = "/tmp/claude-1000/-home-coleh-Projects-Real-serving-solid-characters/52ced0f6-5909-4ce0-b265-9a6e3206f765/scratchpad/spellsItems2014-sample.json";

const spells = parseSpells2014();
const { items, weapons, armor } = parseItems2014();

console.log("=== COUNTS ===");
console.log(`spells:  ${spells.length}  (gate eq 319)`);
console.log(`items:   ${items.length}   (existing 181, gate min 100)`);
console.log(`weapons: ${weapons.length}   (existing 37, gate min 35)`);
console.log(`armor:   ${armor.length}   (existing 13, gate min 12)`);

const noClass = spells.filter(s => !s.classes.length);
console.log(`\n=== SPELLS WITHOUT CLASSES (${noClass.length}) ===`);
for (const s of noClass) console.log(`  - ${s.name}`);

// class distribution sanity
const byClass: Record<string, number> = {};
for (const s of spells) for (const c of s.classes) byClass[c] = (byClass[c] ?? 0) + 1;
console.log("\n=== SPELLS PER CLASS ===");
console.log(byClass);

// damage_type coverage vs existing served file
try {
    const existing = JSON.parse(fs.readFileSync(
        "/home/coleh/Projects/Real/serving-solid-characters/SolidCharacters.Repository/data/srd/2014/spells.json", "utf8"));
    const exMap = new Map(existing.map((s: any) => [s.name, s.damage_type ?? ""]));
    let match = 0, mismatch = 0;
    const diffs: string[] = [];
    for (const s of spells) {
        if (!exMap.has(s.name)) continue;
        const ex = exMap.get(s.name) ?? "";
        if (ex === s.damage_type) match++;
        else { mismatch++; if (diffs.length < 25) diffs.push(`  ${s.name}: mine=${JSON.stringify(s.damage_type)} existing=${JSON.stringify(ex)}`); }
    }
    console.log(`\n=== damage_type vs existing: ${match} match, ${mismatch} differ ===`);
    diffs.forEach(d => console.log(d));

    // name reconciliation: which existing spell names did NOT appear in mine?
    const mineNames = new Set(spells.map(s => s.name));
    const missing = existing.map((s: any) => s.name).filter((n: string) => !mineNames.has(n));
    console.log(`\n=== existing spell names not produced (${missing.length}) ===`);
    missing.forEach((n: string) => console.log("  - " + n));
} catch (e) {
    console.log("(could not compare to existing spells.json)", e);
}

// item category distribution
const cats: Record<string, number> = {};
for (const it of items) cats[(it.properties as any).category] = (cats[(it.properties as any).category] ?? 0) + 1;
console.log("\n=== ITEM CATEGORIES ===");
console.log(cats);

const fireball = spells.find(s => s.name === "Fireball");
const sampleWeapon = weapons.find(w => w.name === "Longsword");
const club = weapons.find(w => w.name === "Club");
const sampleArmor = armor.find(a => a.name === "Studded Leather");
const shield = armor.find(a => a.name === "Shield");
const sampleItems = ["Abacus", "Arrows (20)", "Thieves' tools", "Camel", "Explorer's Pack", "Potion of healing"]
    .map(n => items.find(i => i.name === n)).filter(Boolean);

console.log("\n=== FIREBALL ===");
console.log(JSON.stringify(fireball, null, 2));

fs.writeFileSync(OUT, JSON.stringify({
    fireball,
    sampleWeapon,
    club,
    sampleArmor,
    shield,
    sampleItems,
    spellCount: spells.length,
    itemCount: items.length,
    weaponCount: weapons.length,
    armorCount: armor.length,
}, null, 2));
console.log(`\nsample written to ${OUT}`);
