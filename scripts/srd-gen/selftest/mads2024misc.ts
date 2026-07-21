/**
 * Self-test for the curated SRD 5.2 (2024) MADS maps (races, backgrounds, feats, magic items).
 * Run from scripts/srd-gen/:
 *   npx tsx selftest/mads2024misc.ts
 *
 * Every authored spec is pushed through the client catalog's coerceCommand with a stub resolveRef
 * (id-based refs resolve to "stub-id"). A spec that coerces to null is a HARD authoring error — this
 * test prints every null and exits non-zero if the count is anything but ZERO.
 */
import { coerceCommand } from "../../../SolidCharacters/client/src/shared/ai/commands/madCommandCatalog.ts";
import { map as races } from "../mads/2024/races.ts";
import { map as backgrounds } from "../mads/2024/backgrounds.ts";
import { map as feats } from "../mads/2024/feats.ts";
import { map as magicItems } from "../mads/2024/magicItems.ts";
import type { MadMap } from "../mads/spec.ts";

const stubResolve = () => "stub-id";

const maps: { name: string; map: MadMap }[] = [
    { name: "races", map: races },
    { name: "backgrounds", map: backgrounds },
    { name: "feats", map: feats },
    { name: "magicItems", map: magicItems },
];

let nulls = 0;
let totalSpecs = 0;

console.log("file".padEnd(13) + "keys  specs  nulls");
for (const { name, map } of maps) {
    let keys = 0;
    let specs = 0;
    let fileNulls = 0;
    for (const [key, cmds] of Object.entries(map)) {
        keys++;
        for (const spec of cmds) {
            specs++;
            totalSpecs++;
            const mad = coerceCommand(spec.type, spec.category, spec.value, spec.target, stubResolve as any);
            if (!mad) {
                fileNulls++;
                nulls++;
                console.log(`  ✗ NULL  "${key}": ${spec.type}${spec.category} ${JSON.stringify(spec.value)}${spec.target ? ` target="${spec.target}"` : ""}`);
            }
        }
    }
    console.log(name.padEnd(13) + String(keys).padEnd(6) + String(specs).padEnd(7) + String(fileNulls));
}

console.log(`\ntotal specs: ${totalSpecs}   nulls: ${nulls}`);

/* ---- spot checks: the tricky value forms coerce to the exact expected stored value ---- */
let allGood = nulls === 0;
const fail = (msg: string) => { allGood = false; console.log("  ✗ " + msg); };

const check = (
    label: string,
    spec: { type: "Add" | "Remove"; category: string; value: Record<string, string>; target?: string },
    expectCmd: string,
    expectValue: Record<string, string>,
) => {
    const mad = coerceCommand(spec.type, spec.category, spec.value, spec.target, stubResolve as any);
    if (!mad) return fail(`${label}: coerced to null`);
    if (mad.command !== expectCmd) fail(`${label}: command ${mad.command} != ${expectCmd}`);
    for (const [k, v] of Object.entries(expectValue)) {
        if (String((mad.value as any)[k]) !== v) fail(`${label}: value.${k}="${(mad.value as any)[k]}" != "${v}"`);
    }
};

// choice-form Stats keeps the options list (else the sheet can't resolve the pick) and the
// count field (ASI = two +1 picks; the player may pick the same ability twice for a +2)
check("ASI choice +1/+1", feats["Ability Score Improvement"][0], "AddStats",
    { stat: "choice", statValue: "1", options: "str,dex,con,int,wis,cha", count: "2" });
// mode:"set" survives coercion (ability SETTER)
check("Headband set 19", magicItems["Headband of Intellect"][0], "AddStats",
    { stat: "int", statValue: "19", mode: "set" });
// plain increase (no mode key emitted)
check("Manual +2 con", magicItems["Manual of Bodily Health"][0], "AddStats",
    { stat: "con", statValue: "2" });
// resistance + advantage on a species trait
check("Dwarven Resilience resist", races["Dwarf/Dwarven Resilience"][0], "AddResistances", { damageType: "Poison" });
check("Dwarven Resilience adv", races["Dwarf/Dwarven Resilience"][1], "AddAdvantage",
    { rollType: "SavingThrow", mode: "advantage" });
// Robe of the Archmagi unarmored-defense AC formula
check("Robe AC formula", magicItems["Robe of the Archmagi"][0], "AddArmorClass", { bonus: "15", stats: "dex" });
// Movement with an explicit speed (Ring of Swimming: swim 40)
check("Ring of Swimming movement", magicItems["Ring of Swimming"][0], "AddMovement",
    { movementType: "swim", speed: "40" });
// Movement without a speed = "equal to your walking speed" (no speed key emitted)
const glovesClimb = coerceCommand(
    magicItems["Gloves of Swimming and Climbing"][0].type,
    magicItems["Gloves of Swimming and Climbing"][0].category,
    magicItems["Gloves of Swimming and Climbing"][0].value,
    undefined, stubResolve as any);
if (!glovesClimb || glovesClimb.command !== "AddMovement" || glovesClimb.value["movementType"] !== "climb") {
    fail("Gloves climb: expected AddMovement climb");
} else if ("speed" in glovesClimb.value) {
    fail(`Gloves climb: speed key should be absent, got "${glovesClimb.value["speed"]}"`);
}
// Senses (species darkvision — Dwarf sees 120 ft in 2024)
check("Dwarf darkvision 120", races["Dwarf/Darkvision"][0], "AddSenses", { sense: "darkvision", range: "120" });
// HitPoints per-level (Dwarven Toughness)
check("Dwarven Toughness HP", races["Dwarf/Dwarven Toughness"][0], "AddHitPoints",
    { amount: "1", perLevel: "true" });
// Speed mode:"set" survives coercion (walking-speed SETTER)
check("Boots speed set 30", magicItems["Boots of Striding and Springing"][0], "AddSpeed",
    { speed: "30", mode: "set" });
// RollBonus: Alert's PB-to-Initiative and Archery's flat +2 (conditions survive)
check("Alert PB initiative", feats["Alert"][0], "AddRollBonus",
    { rollType: "Initiative", proficiencyBonus: "Full PB" });
check("Archery +2 ranged", feats["Archery"][0], "AddRollBonus",
    { rollType: "WeaponAttack", bonus: "2", condition: "with Ranged weapons" });
// choice-form Proficiencies keeps the options list and count (Skilled: any 3 skills)
check("Skilled choice 3", feats["Skilled"][0], "AddProficiencies",
    { proficiency: "choice", count: "3" });
// flat AC bonus without a stats key (Defense feat / Ring of Protection / split "+1" armor)
check("Defense flat AC", feats["Defense"][0], "AddArmorClass", { bonus: "1" });
check("Ring of Protection AC", magicItems["Ring of Protection"][0], "AddArmorClass", { bonus: "1" });
check("Ring of Protection saves", magicItems["Ring of Protection"][1], "AddRollBonus",
    { rollType: "SavingThrow", bonus: "1" });
// split-variant entries: exact per-item values
check("Weapon +2 attack", magicItems["Weapon, +2"][0], "AddRollBonus",
    { rollType: "WeaponAttack", bonus: "2" });
check("Armor +3 flat AC", magicItems["Armor, +3"][0], "AddArmorClass", { bonus: "3" });
check("Belt (Storm) set 29", magicItems["Belt of Giant Strength (Storm)"][0], "AddStats",
    { stat: "str", statValue: "29", mode: "set" });
check("Ring of Resistance (Fire)", magicItems["Ring of Resistance (Fire)"][0], "AddResistances",
    { damageType: "Fire" });

console.log(allGood ? "\nALL CHECKS PASSED" : "\nSOME CHECKS FAILED");
process.exit(allGood ? 0 : 1);
