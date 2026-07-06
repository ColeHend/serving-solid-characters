/**
 * Self-test for the 2024 equipment + magic-items parsers. Not part of the pipeline.
 *   cd scripts/srd-gen && npx tsx selftest/equip2024.ts
 */
import fs from "node:fs";
import { parseEquipment2024 } from "../parsers/2024/equipment.ts";
import { parseMagicItems2024 } from "../parsers/2024/magicItems.ts";
import { ITEM_TYPE } from "../types.ts";

const OUT = "/tmp/claude-1000/-home-coleh-Projects-Real-serving-solid-characters/52ced0f6-5909-4ce0-b265-9a6e3206f765/scratchpad/equip2024-sample.json";

const { items, weaponMasteries } = parseEquipment2024();
const magicItems = parseMagicItems2024();

const byType = (t: number) => items.filter(i => i.type === t);
const find = <T extends { name: string }>(arr: T[], name: string) =>
    arr.find(i => i.name.toLowerCase() === name.toLowerCase());
const findIncl = <T extends { name: string }>(arr: T[], sub: string) =>
    arr.find(i => i.name.toLowerCase().includes(sub.toLowerCase()));

const counts = {
    items: items.length,
    weapons: byType(ITEM_TYPE.Weapon).length,
    armor: byType(ITEM_TYPE.Armor).length,
    tools: byType(ITEM_TYPE.Tool).length,
    gear: byType(ITEM_TYPE.Item).length,
    weaponMasteries: weaponMasteries.length,
    magicItems: magicItems.length,
};

const compound = magicItems.find(m => /\(\+1\)/.test(m.rarity));
const attuned = magicItems.find(m => m.properties.attunement);
const charged = magicItems.find(m => m.properties.charges);

const samples = {
    counts,
    longsword_item: find(items, "Longsword"),
    longsword_mastery: find(weaponMasteries, "Longsword"),
    first_armor: byType(ITEM_TYPE.Armor)[0],
    padded_armor: find(items, "Padded Armor"),
    first_tool: byType(ITEM_TYPE.Tool)[0],
    quarterstaff_mastery: find(weaponMasteries, "Quarterstaff"),
    magicItem_adamantine: find(magicItems, "Adamantine Armor"),
    magicItem_potionOfHealing: findIncl(magicItems, "Potions of Healing") ?? findIncl(magicItems, "Potion of Healing"),
    magicItem_compoundPlus: compound,
    magicItem_attunedExample: attuned,
    magicItem_chargedExample: charged,
};

fs.writeFileSync(OUT, JSON.stringify(samples, null, 2));

console.log("=== COUNTS ===");
console.log(JSON.stringify(counts, null, 2));
console.log("\n=== GATES ===");
console.log("items >= 60      :", counts.items >= 60, `(${counts.items})`);
console.log("masteries ~36    :", counts.weaponMasteries >= 30, `(${counts.weaponMasteries})`);
console.log("magic items >=200:", counts.magicItems >= 200, `(${counts.magicItems})`);
console.log("\n=== SAMPLE SPOTCHECK ===");
console.log("Longsword item   :", JSON.stringify(samples.longsword_item?.properties));
console.log("Longsword mastery:", samples.longsword_mastery?.damage, "|", samples.longsword_mastery?.mastery?.slice(0, 60));
console.log("Adamantine       :", samples.magicItem_adamantine?.category, "|", samples.magicItem_adamantine?.rarity, "| cost", samples.magicItem_adamantine?.cost);
console.log("Compound +item   :", samples.magicItem_compoundPlus?.name, "|", samples.magicItem_compoundPlus?.rarity, "| cost", JSON.stringify(samples.magicItem_compoundPlus?.cost));
console.log("Potions of Healing:", samples.magicItem_potionOfHealing?.name, "|", samples.magicItem_potionOfHealing?.rarity);
console.log(`\nwrote ${OUT}`);
