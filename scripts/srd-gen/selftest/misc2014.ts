import fs from "node:fs";
import { parseRaces2014 } from "../parsers/2014/races.ts";
import { parseBackgrounds2014 } from "../parsers/2014/backgrounds.ts";
import { parseFeats2014 } from "../parsers/2014/feats.ts";
import { parseMagicItems2014 } from "../parsers/2014/magicItems.ts";
import { COUNT_GATES } from "../config.ts";

const SAMPLE_OUT = "/tmp/claude-1000/-home-coleh-Projects-Real-serving-solid-characters/52ced0f6-5909-4ce0-b265-9a6e3206f765/scratchpad/misc2014-sample.json";

function checkGate(label: string, actual: number, gate?: { eq?: number; min?: number }): string {
    if (!gate) return "no-gate";
    if (gate.eq !== undefined) return actual === gate.eq ? "PASS" : `FAIL (want eq ${gate.eq})`;
    if (gate.min !== undefined) return actual >= gate.min ? "PASS" : `FAIL (want min ${gate.min})`;
    return "no-gate";
}

const { races, subraces } = parseRaces2014();
const backgrounds = parseBackgrounds2014();
const feats = parseFeats2014();
const magicItems = parseMagicItems2014();

const g = COUNT_GATES["2014"];
console.log("=== 2014 misc counts ===");
console.log(`races:       ${races.length}\t${checkGate("races", races.length, g.races)}`);
console.log(`subraces:    ${subraces.length}\t${checkGate("subraces", subraces.length, g.subraces)}`);
console.log(`backgrounds: ${backgrounds.length}\t${checkGate("backgrounds", backgrounds.length, g.backgrounds)}`);
console.log(`feats:       ${feats.length}\t${checkGate("feats", feats.length, g.feats)}`);
console.log(`magic_items: ${magicItems.length}\t${checkGate("magic_items", magicItems.length, g.magic_items)}`);

console.log("\n=== subrace names ===");
console.log(subraces.map(s => `${s.name} (parent=${s.parentRace})`).join(", "));

console.log("\n=== category distribution (magic items) ===");
const catCount: Record<string, number> = {};
for (const mi of magicItems) catCount[mi.category] = (catCount[mi.category] ?? 0) + 1;
console.log(Object.entries(catCount).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c}:${n}`).join("  "));

console.log("\n=== rarity distribution (magic items) ===");
const rarCount: Record<string, number> = {};
for (const mi of magicItems) rarCount[mi.rarity] = (rarCount[mi.rarity] ?? 0) + 1;
console.log(Object.entries(rarCount).sort((a, b) => b[1] - a[1]).map(([r, n]) => `${JSON.stringify(r)}:${n}`).join("  "));

// Spot-check a few named samples the reviewer flagged.
const dwarf = races.find(r => r.name === "Dwarf");
const orb = magicItems.find(m => m.name.includes("Orb of Dragonkind"));
const wonderous = magicItems.find(m => m.properties.charges);

const samples = {
    race_Dwarf: dwarf,
    race_Human: races.find(r => r.name === "Human"),
    race_Dragonborn: races.find(r => r.name === "Dragonborn"),
    subrace_HillDwarf: subraces.find(s => s.name === "Hill Dwarf"),
    subrace_HighElf: subraces.find(s => s.name === "High Elf"),
    subrace_Lightfoot: subraces.find(s => s.name.startsWith("Lightfoot")),
    background_Acolyte: backgrounds[0],
    feat_Grappler: feats[0],
    magicItem_first: magicItems[0],
    magicItem_charges: wonderous,
    magicItem_OrbOfDragonkind: orb,
};

fs.writeFileSync(SAMPLE_OUT, JSON.stringify(samples, null, 2));
console.log(`\nSamples written to ${SAMPLE_OUT}`);

console.log("\n=== Dwarf trait names ===");
console.log(dwarf?.traits.map(t => (t as any).details.name).join(", "));
console.log("Dwarf abilityBonuses:", JSON.stringify(dwarf?.abilityBonuses));
console.log("Dwarf speed/size:", dwarf?.speed, dwarf?.size);

console.log("\n=== Grappler ===");
console.log(JSON.stringify(feats[0], null, 2));
