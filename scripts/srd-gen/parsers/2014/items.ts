/**
 * 2014 (SRD 5.1) equipment parser — three separate files (weapons / armor / items),
 * mirroring the served 2014/weapons.json, armor.json, items.json shapes and property keys.
 *
 *   weapons: properties { Damage, Category, WeaponRange, RangeNormal, RangeLong?, Properties[] }
 *   armor:   properties { ArmorCategory, AC, Stealth, StrengthReq }
 *   items:   properties { category }  (AdventuringGear | Tools | MountsAndVehicles)
 *
 * Sources: 04_Equipment/{Weapons,Armor,Adventuring_Gear,Tools,Transportation}.md. See CONTRACT.md
 * "Items / equipment". NOTE: a few served-file conventions deviate from a literal parse and are
 * matched here on purpose (see the per-field NOTE comments); a few served-file bugs are NOT
 * reproduced (heavy-crossbow "Light", Net/Blowgun dice, floored fractional weights).
 */
import fs from "node:fs";
import path from "node:path";
import { SRC_2014 } from "../../config.ts";
import { ITEM_TYPE, type ItemJson } from "../../types.ts";
import { normalizeMarkdown } from "../../md/normalize.ts";
import { parseTables, findTable, type MdTable } from "../../md/tables.ts";
import { parseBoldItalicRuns } from "../../md/inline.ts";
import { cleanWhitespace, nameKey } from "../../lib/util.ts";

const EQUIP = path.join(SRC_2014, "04_Equipment");

function readTables(file: string): MdTable[] {
    return parseTables(normalizeMarkdown(fs.readFileSync(path.join(EQUIP, file), "utf8")));
}

/**
 * Per-item description prose: the `***Item***. text` runs below the equipment tables
 * (Adventuring_Gear.md gear, Tools.md tool kits, Armor.md per-armor paragraphs).
 * Keyed by nameKey; table names are matched with their "(flask)"-style parentheticals
 * and ", common"-style suffixes stripped as fallbacks.
 */
function buildDescMap(): Map<string, string> {
    const map = new Map<string, string>();
    for (const file of ["Adventuring_Gear.md", "Tools.md", "Armor.md"]) {
        const md = normalizeMarkdown(fs.readFileSync(path.join(EQUIP, file), "utf8"));
        for (const run of parseBoldItalicRuns(md)) {
            const text = cleanWhitespace(run.text);
            const k = nameKey(run.label);
            if (!map.has(k)) map.set(k, text);
            // "***Burglar's Pack (16 gp)***." → also index without the price parenthetical
            const stripped = nameKey(run.label.replace(/\s*\([^)]*\)/g, ""));
            if (stripped && !map.has(stripped)) map.set(stripped, text);
        }
    }
    return map;
}

function descFor(map: Map<string, string>, name: string): string {
    return map.get(nameKey(name))
        ?? map.get(`${nameKey(name)}s`) // "Shield" ← "***Shields***." run
        ?? map.get(nameKey(name.replace(/\s*\([^)]*\)/g, "")))
        ?? map.get(nameKey(name.split(",")[0]))
        ?? "";
}

/** "2 lb." → 2, "1½ lb." → 1.5, "1/2 lb." → 0.5, "5 lb. (full)" → 5, "-"/"—"/"" → 0. */
function parseWeight(raw: string): number {
    let t = (raw ?? "").trim();
    if (!t || t === "-" || t === "—" || t === "*") return 0;
    t = t.replace(/lb\.?.*/i, "").trim();
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

/** Drop thousands separators from cost cells: "1,500 gp" → "1500 gp". */
function normalizeCostNumber(raw: string): string {
    return cleanWhitespace(raw).replace(/(\d),(\d)/g, "$1$2");
}

// NOTE: served weapons.json / armor.json Title-case the currency abbrev ("1 sp" → "1 Sp",
// "1,500 gp" → "1500 Gp"); items.json keeps it lowercase ("2 gp"). We mirror each file.
function costTitleCase(raw: string): string {
    return normalizeCostNumber(raw).replace(/\b(cp|sp|ep|gp|pp)\b/gi, u => u[0].toUpperCase() + u.slice(1).toLowerCase());
}

function titleCaseWords(s: string): string {
    return s.split(/(\s+|-)/).map(part => (/^[a-z]/i.test(part) ? part.charAt(0).toUpperCase() + part.slice(1) : part)).join("");
}

// ── Weapons ──────────────────────────────────────────────────────────────────
const KNOWN_DAMAGE = new Set([
    "acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic",
    "piercing", "poison", "psychic", "radiant", "slashing", "thunder",
]);

/** "1d4 bludgeoning" → "1d4 Bludgeoning"; "1 piercing" → "1 Piercing"; "-" → "". */
function formatDamage(cell: string): string {
    const t = cleanWhitespace(cell);
    if (!t || t === "-" || t === "—") return "";
    const parts = t.split(/\s+/);
    const last = parts[parts.length - 1].toLowerCase();
    if (KNOWN_DAMAGE.has(last)) parts[parts.length - 1] = last.charAt(0).toUpperCase() + last.slice(1);
    return parts.join(" ");
}

/** Monk weapon: any simple melee without two-handed/heavy, plus Shortsword (matches served data). */
function isMonkWeapon(name: string, category: string, range: string, props: string[]): boolean {
    if (name.toLowerCase() === "shortsword") return true;
    if (category !== "Simple" || range !== "Melee") return false;
    return !props.some(p => p === "Two-Handed" || p === "Heavy");
}

function weaponItem(name: string, cells: Record<string, string>, category: string, range: string): ItemJson {
    const propsCell = cleanWhitespace(cells["Properties"] ?? "");
    const rangeMatch = propsCell.match(/\(range\s*(\d+)\/(\d+)\)/i);

    const props: string[] = [];
    if (propsCell && propsCell !== "-" && propsCell !== "—") {
        for (const raw of propsCell.split(",")) {
            // keep the "(1d8)" / "(range 20/60)" annotations — the versatile die and thrown
            // range are real data (the served file dropped them)
            const paren = raw.match(/\(([^)]*)\)/);
            const nameOnly = raw.replace(/\([^)]*\)/g, "").trim();
            if (!nameOnly) continue;
            const label = titleCaseWords(nameOnly);
            props.push(paren ? `${label} (${paren[1].trim()})` : label);
        }
    }
    if (isMonkWeapon(name, category, range, props)) props.push("Monk");

    const properties: Record<string, string | string[]> = {
        Damage: formatDamage(cells["Damage"] ?? ""),
        Category: category,
        WeaponRange: range,
    };
    // Melee weapons keep reach 5; a thrown-melee weapon's throw range stays in its
    // "Thrown (range X/Y)" property token. Ranged weapons take normal/long from the annotation.
    if (range === "Ranged" && rangeMatch) {
        properties.RangeNormal = rangeMatch[1];
        properties.RangeLong = rangeMatch[2];
    } else {
        properties.RangeNormal = "5";
    }
    properties.Properties = props;

    return {
        id: "",
        name,
        desc: "",
        type: ITEM_TYPE.Weapon,
        weight: parseWeight(cells["Weight"] ?? ""),
        cost: costTitleCase(cells["Cost"] ?? ""),
        properties,
    };
}

function parseWeapons(): ItemJson[] {
    const t = findTable(readTables("Weapons.md"), "Weapons");
    if (!t) return [];
    const weapons: ItemJson[] = [];
    t.rows.forEach((row, i) => {
        const cells: Record<string, string> = {};
        t.headers.forEach((h, j) => (cells[h] = (row[j] ?? "").trim()));
        const name = cells["Name"];
        if (!name) return;
        // rowCategory like "Simple Melee Weapons" → category "Simple", range "Melee".
        const cat = t.rowCategories[i] ?? "";
        const category = /martial/i.test(cat) ? "Martial" : "Simple";
        const range = /ranged/i.test(cat) ? "Ranged" : "Melee";
        weapons.push(weaponItem(name, cells, category, range));
    });
    return weapons;
}

// ── Armor ────────────────────────────────────────────────────────────────────
function parseArmor(): ItemJson[] {
    const t = findTable(readTables("Armor.md"), "Armor");
    if (!t) return [];
    const armor: ItemJson[] = [];
    t.rows.forEach((row, i) => {
        const cells: Record<string, string> = {};
        t.headers.forEach((h, j) => (cells[h] = (row[j] ?? "").trim()));
        const rawName = cells["Armor"];
        const cost = cells["Cost"];
        // Skip the spurious empty "| Shield | | | ... |" heading row (no cost).
        if (!rawName || !cost || cost === "-") return;

        const cat = t.rowCategories[i] ?? "";
        // NOTE: served data tags Shield's ArmorCategory "Shield" (not the carried "Heavy").
        const category = rawName.toLowerCase() === "shield"
            ? "Shield"
            : /medium/i.test(cat) ? "Medium" : /heavy/i.test(cat) ? "Heavy" : "Light";
        const stealth = cells["Stealth"];
        const str = cells["Strength"];

        armor.push({
            id: "",
            // NOTE: served armor.json Title-cases names ("Studded leather" → "Studded Leather").
            name: titleCaseWords(rawName),
            desc: "",
            type: ITEM_TYPE.Armor,
            weight: parseWeight(cells["Weight"] ?? ""),
            cost: costTitleCase(cost),
            properties: {
                ArmorCategory: category,
                AC: cleanWhitespace(cells["Armor Class (AC)"] ?? ""),
                Stealth: stealth && stealth !== "-" && stealth !== "—" ? stealth : "Normal",
                // "Str 13" → "13"; "-" → "0".
                StrengthReq: (str.match(/(\d+)/)?.[1]) ?? "0",
            },
        });
    });
    return armor;
}

// ── Generic gear/tools/mounts (three-column "Item | Cost | Weight" style) ──────
/** A simple two/three-column equipment table → items of one category. Skips italic sub-headers. */
function parseGearTable(t: MdTable, category: string, itemType: number = ITEM_TYPE.Item): ItemJson[] {
    const items: ItemJson[] = [];
    for (const row of t.rows) {
        const cells: Record<string, string> = {};
        t.headers.forEach((h, j) => (cells[h] = (row[j] ?? "").trim()));
        let name = cells[t.headers[0]] ?? "";
        const cost = cells["Cost"] ?? "";
        // Skip italic sub-category rows (*Ammunition*, *Arcane focus*…) and "see elsewhere" rows.
        if (!name || name.startsWith("*") || !cost || cost === "*") continue;
        name = name.replace(/^~\s*/, "").trim(); // sub-item bullet prefix "~ Arrows (20)"
        // NOTE: OCR split "Potion of healing | 50 gp" into "Potion of healing 5" | "0 gp".
        let fixedCost = cost;
        if (/^Potion of healing 5$/i.test(name)) { name = "Potion of healing"; fixedCost = "50 gp"; }
        items.push({
            id: "",
            name,
            desc: "",
            type: itemType,
            weight: parseWeight(cells["Weight"] ?? ""),
            cost: normalizeCostNumber(fixedCost), // items.json keeps lowercase currency
            properties: { category },
        });
    }
    return items;
}

function parseAdventuringGear(): ItemJson[] {
    const t = findTable(readTables("Adventuring_Gear.md"), "Adventuring Gear");
    return t ? parseGearTable(t, "AdventuringGear") : [];
}

function parseTools(): ItemJson[] {
    const t = findTable(readTables("Tools.md"), "Tools");
    return t ? parseGearTable(t, "Tools", ITEM_TYPE.Tool) : [];
}

/** Mounts, tack/harness (weight column) and waterborne vehicles (speed column) → MountsAndVehicles. */
function parseTransportation(): ItemJson[] {
    const tables = readTables("Transportation.md");
    const out: ItemJson[] = [];
    for (const t of tables) {
        // Barding "×4/×2", "see the Mounts section" etc. carry no real cost; the gear parser skips them.
        for (const row of t.rows) {
            const cells: Record<string, string> = {};
            t.headers.forEach((h, j) => (cells[h] = (row[j] ?? "").trim()));
            let name = cells[t.headers[0]] ?? "";
            const cost = cells["Cost"] ?? "";
            if (!name || name.startsWith("*") || !cost || cost === "*" || /^[×x]\d/.test(cost)) continue;
            name = name.replace(/^~\s*/, "").trim();
            out.push({
                id: "",
                name,
                desc: "",
                type: ITEM_TYPE.Item,
                weight: parseWeight(cells["Weight"] ?? ""), // mounts/waterborne tables have no weight col → 0
                cost: normalizeCostNumber(cost),
                properties: { category: "MountsAndVehicles" },
            });
        }
    }
    return out;
}

/** Equipment packs from the "***Burglar's Pack (16 gp)***." runs in Adventuring_Gear.md. */
function parseEquipmentPacks(): ItemJson[] {
    const md = normalizeMarkdown(fs.readFileSync(path.join(EQUIP, "Adventuring_Gear.md"), "utf8"));
    const items: ItemJson[] = [];
    const re = /^\*\*\*([^*]+?Pack)\s*\(([^)]*)\)\*\*\*/gm;
    let m: RegExpExecArray | null;
    while ((m = re.exec(md)) !== null) {
        items.push({
            id: "",
            name: cleanWhitespace(m[1]),
            desc: "",
            type: ITEM_TYPE.Item,
            weight: 0,
            cost: normalizeCostNumber(m[2]),
            properties: { category: "AdventuringGear" },
        });
    }
    return items;
}

export function parseItems2014(): { items: ItemJson[]; weapons: ItemJson[]; armor: ItemJson[] } {
    const weapons = parseWeapons();
    const armor = parseArmor();

    const all: ItemJson[] = [
        ...parseAdventuringGear(),
        ...parseEquipmentPacks(),
        ...parseTools(),
        ...parseTransportation(),
    ];
    // dedupe by (name + category) — keep first occurrence.
    const seen = new Set<string>();
    const items = all.filter(it => {
        const k = `${it.name.toLowerCase()}|${(it.properties as Record<string, string>).category}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });

    // Descriptions from the `***Item***.` prose runs (gear, tool kits, per-armor paragraphs).
    // Weapons have no per-weapon prose in the SRD, so they keep desc "".
    const descs = buildDescMap();
    splitMergedDescs(descs, items.map(it => it.name));
    for (const it of [...items, ...armor]) {
        if (!it.desc) it.desc = descFor(descs, it.name);
    }

    return { items, weapons, armor };
}

/**
 * The 5.1 source concatenates a few sibling gear items into ONE `***Item***.` paragraph with
 * plain Title-Case labels ("…velvet lures, and narrow netting. Healer's Kit. This kit is…").
 * Split those runs apart using the known table item names, so each item gets its own text
 * (Fishing Tackle/Healer's Kit, Lamp/Lanterns, Pouch/Quiver/Portable Ram).
 */
function splitMergedDescs(map: Map<string, string>, itemNames: string[]): void {
    // Title-Case prose label for a table name ("Lantern, bullseye" → "Lantern, Bullseye").
    const proseLabel = (n: string) => n.replace(/\s*\([^)]*\)/g, "").split(/\s+/)
        .map(w => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");

    for (const [key, text] of [...map.entries()]) {
        // find embedded "<Sentence end> <Known Item Label>. " occurrences
        const cuts: { index: number; name: string; labelLen: number }[] = [];
        for (const name of itemNames) {
            const k = nameKey(name.replace(/\s*\([^)]*\)/g, ""));
            if (k === key || map.get(k)) continue; // only fill items that have no prose of their own
            const label = proseLabel(name);
            if (label.length < 4) continue;
            const idx = text.indexOf(`. ${label}. `);
            if (idx > 0) cuts.push({ index: idx + 2, name, labelLen: label.length });
        }
        if (!cuts.length) continue;
        cuts.sort((a, b) => a.index - b.index);
        // head stays with the original run; each cut owns text up to the next cut
        map.set(key, cleanWhitespace(text.slice(0, cuts[0].index)));
        cuts.forEach((cut, i) => {
            const end = i + 1 < cuts.length ? cuts[i + 1].index : text.length;
            const body = text.slice(cut.index + cut.labelLen + 2, end);
            const k = nameKey(cut.name.replace(/\s*\([^)]*\)/g, ""));
            map.set(k, cleanWhitespace(body));
        });
    }
}
