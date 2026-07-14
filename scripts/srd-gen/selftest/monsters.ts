/**
 * Selftest (NOT part of the pipeline): parse monsters for both editions, print a couple of
 * samples, and verify the character-model derivation reproduces the printed statblock values —
 * to-hit = mod + PB, save DC = 8 + PB + mod — the same contract StatBlockTests.cs asserts.
 *   npx tsx selftest/monsters.ts
 */
import { parseMonsters2014 } from "../parsers/2014/monsters.ts";
import { parseMonsters2024 } from "../parsers/2024/monsters.ts";
import { abilityMod, statOf, type Ability } from "../parsers/monsterParse.shared.ts";
import type { MonsterJson, MonsterAttackJson } from "../types.ts";

let failures = 0;
const check = (cond: boolean, msg: string) => { if (!cond) { failures++; console.error("  ✗ " + msg); } else console.log("  ✓ " + msg); };

/** Printed "+N to hit" / "Attack Roll: +N" from an attack's kept description. */
function printedToHit(a: MonsterAttackJson): number | null {
    const m = a.description?.match(/Attack Roll:?\**\s*([+-]\d+)/i) ?? a.description?.match(/([+-]\d+)\s*to hit/i);
    return m ? Number(m[1]) : null;
}
function printedDc(a: MonsterAttackJson): number | null {
    const m = a.description?.match(/DC\s*(\d+)/i);
    return m ? Number(m[1]) : null;
}

function verify(mon: MonsterJson) {
    const pb = mon.proficiency_bonus ?? 0;
    console.log(`\n[${mon.legacy ? "2014" : "2024"}] ${mon.name} — CR ${mon.challenge_rating}, PB ${pb}, AC ${mon.armor_class}, HP ${mon.health.max}`);
    for (const a of mon.attacks) {
        if (a.ability) {
            const derived = abilityMod(statOf(mon.stats, a.ability as Ability)) + (a.proficient ? pb : 0);
            const printed = printedToHit(a);
            if (printed !== null) check(derived === printed, `${a.name}: derived to-hit ${derived >= 0 ? "+" : ""}${derived} == printed ${printed >= 0 ? "+" : ""}${printed} (ability ${a.ability})`);
        } else if (a.to_hit_override !== undefined) {
            console.log(`  · ${a.name}: to_hit_override ${a.to_hit_override} (no standard ability matched)`);
        }
        if (a.save?.dc_ability) {
            const derived = 8 + pb + abilityMod(statOf(mon.stats, a.save.dc_ability as Ability));
            const printed = printedDc(a);
            if (printed !== null) check(derived === printed, `${a.name}: derived save DC ${derived} == printed DC ${printed} (dc_ability ${a.save.dc_ability})`);
        } else if (a.save?.dc_override !== undefined) {
            console.log(`  · ${a.name}: dc_override ${a.save.dc_override} (no standard ability matched)`);
        }
        const primary = a.damage.find(d => d.add_ability_modifier);
        if (primary) console.log(`  · ${a.name}: primary damage ${primary.dice} ${primary.type} (+ability mod)${a.damage.length > 1 ? ` +${a.damage.length - 1} rider(s)` : ""}`);
    }
}

const m2014 = parseMonsters2014();
const m2024 = parseMonsters2024();
console.log(`parsed: 2014 ${m2014.length} monsters, 2024 ${m2024.length} monsters`);

const pick = (list: MonsterJson[], name: string) => list.find(m => m.name === name);
for (const [list, names] of [[m2024, ["Aboleth", "Adult Black Dragon"]], [m2014, ["Aboleth", "Adult Black Dragon"]]] as const) {
    for (const n of names) { const mon = pick(list as MonsterJson[], n); if (mon) verify(mon); else console.error(`  (missing ${n})`); }
}

// Full-corpus derivation coverage: how often a standard ability reproduced the printed number.
function coverage(list: MonsterJson[], label: string) {
    let attacks = 0, hitOk = 0, hitOverride = 0, dcOk = 0, dcOverride = 0;
    for (const mon of list) {
        const pb = mon.proficiency_bonus ?? 0;
        for (const a of [...mon.attacks, ...(mon.legendary_actions ?? [])]) {
            const ph = printedToHit(a);
            if (ph !== null) {
                attacks++;
                if (a.ability && abilityMod(statOf(mon.stats, a.ability as Ability)) + (a.proficient ? pb : 0) === ph) hitOk++;
                else if (a.to_hit_override !== undefined) hitOverride++;
            }
            const pd = printedDc(a);
            if (pd !== null && a.save) {
                if (a.save.dc_ability && 8 + pb + abilityMod(statOf(mon.stats, a.save.dc_ability as Ability)) === pd) dcOk++;
                else if (a.save.dc_override !== undefined) dcOverride++;
            }
        }
    }
    console.log(`\n${label} derivation coverage: to-hit ${hitOk}/${attacks} derived (${hitOverride} overrides); save-DC ${dcOk} derived (${dcOverride} overrides)`);
}
coverage(m2014, "2014");
coverage(m2024, "2024");

console.log(`\nJSON sample (2024 Aboleth Tentacle attack):`);
console.log(JSON.stringify(pick(m2024, "Aboleth")?.attacks[0], null, 1));

console.log(failures ? `\nFAILURES: ${failures}` : `\nall derivation checks passed`);
process.exit(failures ? 1 : 0);
