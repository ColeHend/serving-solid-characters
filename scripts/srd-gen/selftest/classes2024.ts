/**
 * Self-test for parsers/2024/classes.ts. Run from scripts/srd-gen/:
 *   npx tsx selftest/classes2024.ts
 * Prints per-class feature-level coverage + spellcasting presence + subclass counts,
 * and dumps Barbarian + Wizard + Warlock to scratchpad/classes2024-sample.json.
 */
import fs from "node:fs";
import { parseClasses2024 } from "../parsers/2024/classes.ts";

const SAMPLE_PATH =
    "/tmp/claude-1000/-home-coleh-Projects-Real-serving-solid-characters/52ced0f6-5909-4ce0-b265-9a6e3206f765/scratchpad/classes2024-sample.json";

const { classes, subclasses } = parseClasses2024();

let allGood = true;
const fail = (msg: string) => {
    allGood = false;
    console.log("  ✗ " + msg);
};

console.log(`classes: ${classes.length}  subclasses: ${subclasses.length}`);
if (classes.length !== 12) fail(`expected 12 classes, got ${classes.length}`);
if (subclasses.length !== 12) fail(`expected 12 subclasses, got ${subclasses.length}`);

console.log("\n" + "Class".padEnd(11) + "levels feats  hitDie prim         spellcasting                          classSpecific");
for (const c of classes) {
    const levelKeys = Object.keys(c.features);
    const nLevels = levelKeys.length;
    const nonEmpty = Object.values(c.features).filter(a => a.length).length;
    const totalFeats = Object.values(c.features).reduce((n, a) => n + a.length, 0);

    if (nLevels !== 20) fail(`${c.name}: expected 20 feature levels, got ${nLevels}`);
    for (let L = 1; L <= 20; L++) if (!(String(L) in c.features)) fail(`${c.name}: missing feature level ${L}`);
    if (!c.hit_die) fail(`${c.name}: no hit_die`);
    if (!c.primary_ability) fail(`${c.name}: no primary_ability`);
    if (c.saving_throws.length < 2) fail(`${c.name}: <2 saving throws`);

    let scDesc = "-";
    if (c.spellcasting) {
        const slotLevels = Object.keys(c.spellcasting.metadata.slots).length;
        const kt = c.spellcasting.known_type;
        const ct = c.spellcasting.metadata.casterType;
        scDesc = `type=${ct} ${kt} slots@${slotLevels}L`;
        if (slotLevels !== 20) fail(`${c.name}: caster has ${slotLevels}/20 slot levels`);
        if (kt === "number" && !c.spellcasting.spells_known) fail(`${c.name}: number caster missing spells_known`);
        if (kt === "calc" && !c.spellcasting.spells_known_calc) fail(`${c.name}: calc caster missing spells_known_calc`);
    }

    console.log(
        c.name.padEnd(11) +
        String(nLevels).padEnd(7) +
        `${nonEmpty}/${totalFeats}`.padEnd(7) +
        c.hit_die.padEnd(7) +
        c.primary_ability.padEnd(13) +
        scDesc.padEnd(38) +
        Object.keys(c.classSpecific).join(","),
    );
}

console.log("\nSubclasses:");
for (const s of subclasses) {
    const levels = Object.keys(s.features).map(Number).sort((a, b) => a - b);
    const withSpells: string[] = [];
    for (const lvl of Object.keys(s.features))
        for (const f of s.features[lvl]) if (f.metadata?.spells) withSpells.push(`${f.name}[${f.metadata.spells.length}]`);
    if (!s.name) fail(`subclass of ${s.parent_class} has no name`);
    if (!s.description) fail(`subclass ${s.name} has no description`);
    if (!levels.length) fail(`subclass ${s.name} has no features`);
    console.log(
        `  ${s.parent_class.padEnd(10)} ${s.name.padEnd(30)} levels=[${levels.join(",")}]` +
        (withSpells.length ? `  spells: ${withSpells.join(" ")}` : ""),
    );
}

/* ---- Barbarian spot checks (task gate) ---- */
const barb = classes.find(c => c.name === "Barbarian")!;
const l1Names = barb.features["1"].map(f => f.name);
console.log("\nBarbarian L1 features:", l1Names.join(", "));
for (const need of ["Rage", "Unarmored Defense", "Weapon Mastery"]) {
    if (!l1Names.includes(need)) fail(`Barbarian L1 missing ${need}`);
}
const rageCol = barb.classSpecific.rage;
console.log("Barbarian classSpecific.rage:", `[${rageCol["1"]} … ${rageCol["20"]}]`, "(want 2 … 6)");
if (rageCol["1"] !== "2" || rageCol["20"] !== "6") fail("Barbarian rage column not 2..6");
const rageMeta = barb.features["1"].find(f => f.name === "Rage")?.metadata;
console.log("Barbarian Rage metadata:", JSON.stringify(rageMeta));

fs.writeFileSync(
    SAMPLE_PATH,
    JSON.stringify(
        {
            barbarian: classes.find(c => c.name === "Barbarian"),
            wizard: classes.find(c => c.name === "Wizard"),
            warlock: classes.find(c => c.name === "Warlock"),
            subclasses: subclasses.filter(s => ["Barbarian", "Wizard", "Warlock", "Cleric", "Druid"].includes(s.parent_class)),
        },
        null,
        2,
    ),
);
console.log("\nsample dumped →", SAMPLE_PATH);
console.log(allGood ? "\nALL CHECKS PASSED" : "\nSOME CHECKS FAILED");
process.exit(allGood ? 0 : 1);
