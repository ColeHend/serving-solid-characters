/**
 * 2024 (SRD 5.2) equipment parser — src/06_Equipment.md.
 *
 * Produces the merged items.json list (weapons=0, armor=1, tools=2, gear/ammo=3) and the
 * per-weapon weapon_masteries.json rows. See CONTRACT.md "Items / equipment" + "Weapon masteries".
 */
import fs from "node:fs";
import path from "node:path";
import { SRC_2024 } from "../../config.ts";
import { ITEM_TYPE, type ItemJson, type WeaponMasteryJson } from "../../types.ts";
import { normalizeMarkdown } from "../../md/normalize.ts";
import { sectionize, walk, type Section } from "../../md/sections.ts";
import { parseTables, findTable, type MdTable } from "../../md/tables.ts";
import { labeledFields } from "../../md/inline.ts";
import { cleanWhitespace } from "../../lib/util.ts";

// NOTE: no shared paren-aware splitter in md/*, so it lives here.
/** Split on `sep` only at parenthesis depth 0 ("Thrown (Range 20/60), Versatile" → two parts). */
function splitTopLevel(s: string, sep: string): string[] {
    const out: string[] = [];
    let depth = 0;
    let cur = "";
    for (const ch of s) {
        if (ch === "(") depth++;
        else if (ch === ")") depth = Math.max(0, depth - 1);
        if (ch === sep && depth === 0) {
            out.push(cur);
            cur = "";
        } else {
            cur += ch;
        }
    }
    out.push(cur);
    return out.map(x => x.trim()).filter(Boolean);
}

// NOTE: weight cells mix "2 lb.", "1/2 lb.", unicode "58½ lb.", "5 lb. (full)", "—", "Varies".
function parseWeight(raw: string): number {
    let t = (raw ?? "").trim();
    if (!t || t === "—" || /varies/i.test(t)) return 0;
    t = t.replace(/lb\.?.*/i, "").trim(); // drop unit and any trailing "(full)" etc.
    t = t.replace(/½/g, " 1/2").replace(/¼/g, " 1/4").replace(/¾/g, " 3/4");
    let total = 0;
    for (const part of t.split(/\s+/).filter(Boolean)) {
        if (part.includes("/")) {
            const [a, b] = part.split("/").map(Number);
            if (b) total += a / b;
        } else {
            const n = Number(part);
            if (!Number.isNaN(n)) total += n;
        }
    }
    return total;
}

/** Zip a table's headers to a row's cells. */
function rowRecord(t: MdTable, row: string[]): Record<string, string> {
    const rec: Record<string, string> = {};
    t.headers.forEach((h, i) => (rec[h] = (row[i] ?? "").trim()));
    return rec;
}

/** For weapon-mastery property arrays, match the existing weapon_masteries.json style. */
function normProp(p: string): string {
    // versatile die lives in the damage string there ("1d8 slashing (1d10 versatile)")
    p = p.replace(/^Versatile\s*\([^)]*\)/i, "Versatile");
    // "Thrown (Range 20/60)" -> "Thrown (20/60)"; "Ammunition (Range 80/320; Arrow)" -> "Ammunition (80/320)"
    p = p.replace(/\(Range\s*(\d+)\/(\d+)[^)]*\)/i, "($1/$2)");
    return p.trim();
}

interface ParsedWeapon {
    name: string;
    damageCell: string;
    propsCell: string;
    masteryCell: string;
    weightCell: string;
    costCell: string;
    category: string; // Simple | Martial
    range: string; // Melee | Ranged
}

const WEAPON_TABLES: Array<{ caption: string; category: string; range: string }> = [
    { caption: "Simple Melee Weapons", category: "Simple", range: "Melee" },
    { caption: "Simple Ranged Weapons", category: "Simple", range: "Ranged" },
    { caption: "Martial Melee Weapons", category: "Martial", range: "Melee" },
    { caption: "Martial Ranged Weapons", category: "Martial", range: "Ranged" },
];

const ARMOR_TABLES: Array<{ caption: string; category: string }> = [
    { caption: "Light Armor", category: "Light" },
    { caption: "Medium Armor", category: "Medium" },
    { caption: "Heavy Armor", category: "Heavy" },
    { caption: "Shield", category: "Shield" },
];

function collectWeapons(tables: MdTable[]): ParsedWeapon[] {
    const weapons: ParsedWeapon[] = [];
    for (const { caption, category, range } of WEAPON_TABLES) {
        const t = findTable(tables, caption);
        if (!t) continue;
        for (const row of t.rows) {
            const r = rowRecord(t, row);
            const name = r["Name"];
            if (!name) continue;
            weapons.push({
                name,
                damageCell: r["Damage"] ?? "",
                propsCell: r["Properties"] ?? "",
                masteryCell: r["Mastery"] ?? "",
                weightCell: r["Weight"] ?? "",
                costCell: r["Cost"] ?? "",
                category,
                range,
            });
        }
    }
    return weapons;
}

function weaponItem(w: ParsedWeapon): ItemJson {
    const props: Record<string, string | string[]> = {
        Damage: w.damageCell,
        Properties: w.propsCell === "—" ? "" : w.propsCell,
        Mastery: w.masteryCell === "—" ? "" : w.masteryCell,
        Category: w.category,
        WeaponRange: w.range,
    };
    const rm = w.propsCell.match(/Range\s*(\d+)\/(\d+)/i);
    if (rm) {
        props.RangeNormal = rm[1];
        props.RangeLong = rm[2];
    }
    return {
        id: "",
        name: w.name,
        desc: "",
        type: ITEM_TYPE.Weapon,
        weight: parseWeight(w.weightCell),
        cost: w.costCell === "—" ? "" : w.costCell,
        properties: props,
    };
}

function masteryRow(w: ParsedWeapon, defs: Record<string, string>): WeaponMasteryJson {
    let damage = w.damageCell.toLowerCase().trim();
    const vm = w.propsCell.match(/Versatile\s*\((\d+d\d+)\)/i);
    if (vm) damage += ` (${vm[1]} versatile)`;

    const properties = w.propsCell === "—" ? [] : splitTopLevel(w.propsCell, ",").map(normProp);

    const mName = w.masteryCell.trim();
    const def = defs[mName.toLowerCase()];
    const mastery = def ? `${mName} - ${def}` : mName;

    return { id: "", name: w.name, damage, properties, mastery };
}

/** Mastery definitions from the "### Mastery Properties" section's #### children (Cleave…Vex). */
function collectMasteryDefs(sections: Section[]): Record<string, string> {
    const defs: Record<string, string> = {};
    for (const s of walk(sections)) {
        if (s.title.toLowerCase() === "mastery properties") {
            for (const child of s.children) {
                defs[child.title.toLowerCase()] = cleanWhitespace(child.body);
            }
        }
    }
    return defs;
}

function collectArmor(tables: MdTable[]): ItemJson[] {
    const items: ItemJson[] = [];
    for (const { caption, category } of ARMOR_TABLES) {
        const t = findTable(tables, caption);
        if (!t) continue;
        const nameKeyH = t.headers[0]; // "Armor"
        const acKey = t.headers.find(h => /armor class/i.test(h)) ?? "Armor Class (AC)";
        const strKey = t.headers.find(h => /strength/i.test(h)) ?? "Strength";
        const stealthKey = t.headers.find(h => /stealth/i.test(h)) ?? "Stealth";
        for (const row of t.rows) {
            const r = rowRecord(t, row);
            const name = r[nameKeyH];
            if (!name) continue;
            items.push({
                id: "",
                name,
                desc: "",
                type: ITEM_TYPE.Armor,
                weight: parseWeight(r["Weight"] ?? ""),
                cost: (r["Cost"] ?? "") === "—" ? "" : r["Cost"] ?? "",
                properties: {
                    ArmorCategory: category,
                    AC: r[acKey] ?? "",
                    Stealth: r[stealthKey] ?? "",
                    StrengthReq: r[strKey] ?? "",
                },
            });
        }
    }
    return items;
}

/** Split a "#### Name (Cost)" heading into its name and the cost inside the parentheses. */
function splitTitleCost(title: string): { name: string; cost: string } {
    const m = title.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
    if (m) return { name: m[1].trim(), cost: m[2].trim() };
    return { name: title.trim(), cost: "" };
}

/** Artisan's + Other tools: #### children of those two H3 sections. */
function collectTools(sections: Section[]): ItemJson[] {
    const items: ItemJson[] = [];
    for (const s of walk(sections)) {
        const tl = s.title.toLowerCase();
        if (tl !== "artisan's tools" && tl !== "other tools") continue;
        for (const child of s.children) {
            const { name, cost } = splitTitleCost(child.title);
            const fields = labeledFields(child.body);
            const props: Record<string, string | string[]> = {};
            for (const key of ["Ability", "Utilize", "Craft", "Variants"]) {
                if (fields[key]) props[key] = fields[key];
            }
            items.push({
                id: "",
                name,
                // tools have no prose paragraph — the labeled Ability/Utilize/Craft lines ARE the
                // section body, so they double as a readable description
                desc: cleanWhitespace(child.body),
                type: ITEM_TYPE.Tool,
                weight: parseWeight(fields["Weight"] ?? ""),
                cost,
                properties: props,
            });
        }
    }
    return items;
}

/** Map of "name (before the cost paren)" → section prose, for enriching gear descriptions. */
function gearDescriptions(sections: Section[]): Record<string, string> {
    const map: Record<string, string> = {};
    for (const s of walk(sections)) {
        if (s.level !== 4) continue;
        const { name } = splitTitleCost(s.title);
        const key = name.toLowerCase();
        if (!(key in map) && s.body.trim()) map[key] = cleanWhitespace(s.body);
    }
    return map;
}

function collectGear(tables: MdTable[], descs: Record<string, string>): ItemJson[] {
    const items: ItemJson[] = [];
    const gear = findTable(tables, "Adventuring Gear");
    if (gear) {
        for (const row of gear.rows) {
            const r = rowRecord(gear, row);
            const name = r[gear.headers[0]]; // "Item"
            if (!name) continue;
            items.push({
                id: "",
                name,
                desc: descs[name.toLowerCase()] ?? "",
                type: ITEM_TYPE.Item,
                weight: parseWeight(r["Weight"] ?? ""),
                cost: (r["Cost"] ?? "") === "—" ? "" : r["Cost"] ?? "",
                properties: {},
            });
        }
    }
    const ammo = findTable(tables, "Ammunition");
    if (ammo) {
        for (const row of ammo.rows) {
            const r = rowRecord(ammo, row);
            const name = r[ammo.headers[0]]; // "Type"
            if (!name) continue;
            const props: Record<string, string | string[]> = {};
            if (r["Amount"]) props.Amount = r["Amount"];
            if (r["Storage"]) props.Storage = r["Storage"];
            items.push({
                id: "",
                name,
                desc: "",
                type: ITEM_TYPE.Item,
                weight: parseWeight(r["Weight"] ?? ""),
                cost: r["Cost"] ?? "",
                properties: props,
            });
        }
    }
    return items;
}

export function parseEquipment2024(): { items: ItemJson[]; weaponMasteries: WeaponMasteryJson[] } {
    const raw = fs.readFileSync(path.join(SRC_2024, "06_Equipment.md"), "utf8");
    const md = normalizeMarkdown(raw);
    const sections = sectionize(md);
    const tables = parseTables(md);

    const weapons = collectWeapons(tables);
    const masteryDefs = collectMasteryDefs(sections);
    const gearDescs = gearDescriptions(sections);

    const all: ItemJson[] = [
        ...weapons.map(weaponItem),
        ...collectArmor(tables),
        ...collectTools(sections),
        ...collectGear(tables, gearDescs),
    ];

    // dedupe by name (keep first — weapon/armor/tool over a stray gear duplicate)
    const seen = new Set<string>();
    const items = all.filter(it => {
        const k = it.name.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });

    const weaponMasteries = weapons.map(w => masteryRow(w, masteryDefs));

    return { items, weaponMasteries };
}
