import fs from "node:fs";
import { parseOrigins2024 } from "../parsers/2024/origins.ts";
import { parseFeats2024 } from "../parsers/2024/feats.ts";
import { parseSpells2024 } from "../parsers/2024/spells.ts";

const OUT = "/tmp/claude-1000/-home-coleh-Projects-Real-serving-solid-characters/52ced0f6-5909-4ce0-b265-9a6e3206f765/scratchpad/misc2024-sample.json";

const { races, backgrounds } = parseOrigins2024();
const feats = parseFeats2024();
const spells = parseSpells2024();

const spellsNoClass = spells.filter(s => s.classes.length === 0);

const counts = {
    species: races.length,
    backgrounds: backgrounds.length,
    feats: feats.length,
    spells: spells.length,
    spellsWithNoClass: spellsNoClass.length,
};

console.log("counts:", JSON.stringify(counts, null, 2));
console.log("species:", races.map(r => r.name).join(", "));
console.log("backgrounds:", backgrounds.map(b => b.name).join(", "));
console.log("feats:", feats.map(f => f.details.name).join(", "));
console.log("feat categories:", [...new Set(feats.map(f => f.details.metadata?.category))].join(", "));
if (spellsNoClass.length) console.log("!! spells missing classes:", spellsNoClass.map(s => s.name).join(", "));

const gateOk =
    races.length === 9 &&
    backgrounds.length === 4 &&
    feats.length >= 16 &&
    spells.length >= 320 &&
    spellsNoClass.length === 0;
console.log("\nGATES:", gateOk ? "PASS" : "FAIL",
    `(species=${races.length}/9, backgrounds=${backgrounds.length}/4, feats=${feats.length}/>=16, spells=${spells.length}/>=320, allSpellsHaveClass=${spellsNoClass.length === 0})`);

const pick = <T,>(arr: T[], f: (x: T) => boolean) => arr.find(f);

const samples = {
    counts,
    dragonborn: pick(races, r => r.name === "Dragonborn"),
    acolyteBackground: pick(backgrounds, b => b.name === "Acolyte"),
    soldierBackground: pick(backgrounds, b => b.name === "Soldier"),
    alertFeat: pick(feats, f => f.details.name === "Alert"),
    grapplerFeat: pick(feats, f => f.details.name === "Grappler"),
    acidArrowSpell: pick(spells, s => s.name === "Acid Arrow"),
    acidSplashSpell: pick(spells, s => s.name === "Acid Splash"),
    fireballSpell: pick(spells, s => s.name === "Fireball"),
    freezingSphereSpell: pick(spells, s => s.name === "Freezing Sphere"),
};

fs.writeFileSync(OUT, JSON.stringify(samples, null, 2));
console.log("\nsamples written to", OUT);
