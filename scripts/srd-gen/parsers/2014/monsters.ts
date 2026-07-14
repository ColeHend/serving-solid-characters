import fs from "node:fs";
import path from "node:path";
import { SRC_2014 } from "../../config.ts";
import { normalizeMarkdown, cleanTitle } from "../../md/normalize.ts";
import { sectionize, type Section } from "../../md/sections.ts";
import { parseBoldItalicRuns, parseBoldRuns, labeledFields, firstItalicLine } from "../../md/inline.ts";
import { parseTables } from "../../md/tables.ts";
import { cleanWhitespace } from "../../lib/util.ts";
import type {
    MonsterJson, StatsJson, FeatureDetailJson, GrantedActionJson, MonsterAttackJson,
} from "../../types.ts";
import {
    abbrevToAbility, crToPb, parseChallenge, parseHp, parseSpeeds, parseSenses, parseSkills,
    parseSaves, parseTypeLine, parseAffinities, multiattackCount, parseAttack, parseUsage, cleanActionName,
} from "../monsterParse.shared.ts";

const MONSTERS_DIR = path.join(SRC_2014, "10_Monsters", "Monsters_Each");

/** The 6-column `| STR | DEX | ... |` table (cells like "21 (+5)") → ability scores. */
function parseStatTable2014(header: string): StatsJson | null {
    const table = parseTables(header).find(t => t.headers.some(h => /^str$/i.test(h)) && t.headers.some(h => /^cha$/i.test(h)));
    if (!table || !table.rows.length) return null;
    const stats: StatsJson = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
    const row = table.rows[0];
    table.headers.forEach((h, i) => {
        const a = abbrevToAbility(h);
        if (a) stats[a] = parseInt(row[i], 10) || 10;
    });
    return stats;
}

function splitList(s?: string): string[] {
    return (s ?? "").split(/[,;]/).map(x => cleanWhitespace(x).trim()).filter(Boolean);
}

/** Type line = the italic "*Size type, alignment*", or (a few files omit the asterisks) the first
 *  content line when it precedes the bold header fields / stat table. */
function typeLineOf(body: string): string | null {
    const italic = firstItalicLine(body);
    if (italic) return italic;
    for (const raw of body.split("\n")) {
        const line = raw.trim();
        if (!line) continue;
        if (/^[#|]/.test(line) || /^\*\*/.test(line)) return null; // reached a field/table/heading first
        return line.replace(/^\*+|\*+$/g, "").trim();
    }
    return null;
}

function toFeature(rawName: string, text: string): FeatureDetailJson {
    const { uses } = parseUsage(rawName);
    const f: FeatureDetailJson = { id: "", name: cleanActionName(rawName), description: cleanWhitespace(text) };
    if (uses) { const n = Number(uses.split("/")[0]); if (n) f.metadata = { uses: n }; }
    return f;
}

function runToGranted(rawName: string, text: string, actionType = "action"): GrantedActionJson {
    return { name: cleanActionName(rawName), action_type: actionType, description: cleanWhitespace(text) };
}

/** The `***Trait***.` runs sit in the monster body after the header fields (before `###### Actions`). */
function buildMonster(rawName: string, body: string, children: Section[]): MonsterJson | null {
    const typeLine = typeLineOf(body);
    const stats = parseStatTable2014(body);
    if (!typeLine || !stats) return null;

    const fields = labeledFields(body);
    const { size, type, subtype, alignment } = parseTypeLine(typeLine);
    const { cr, xp } = parseChallenge(fields["Challenge"] ?? "");
    const pb = crToPb(cr);

    const acRaw = fields["Armor Class"] ?? "";
    const armorDesc = acRaw.match(/\(([^)]+)\)/)?.[1];
    const { max, hitDice } = parseHp(fields["Hit Points"] ?? "");
    const { speed, movement_speeds } = parseSpeeds(fields["Speed"] ?? "");

    const monster: MonsterJson = {
        id: "",
        name: rawName.replace(/\s*\([^)]*\)\s*$/, "").trim(),
        size,
        type,
        ...(subtype ? { subtype } : {}),
        ...(alignment ? { alignment } : {}),
        stats,
        armor_class: parseInt(acRaw, 10) || 0,
        ...(armorDesc ? { armor_desc: armorDesc } : {}),
        health: { max, current: max, temp: 0 },
        ...(hitDice ? { hit_dice: hitDice } : {}),
        speed,
        movement_speeds,
        senses: parseSenses(fields["Senses"] ?? ""),
        saving_throws: parseSaves(fields["Saving Throws"] ?? ""),
        proficiencies: { skills: parseSkills(fields["Skills"] ?? "", stats, pb), other: {} },
        resistances: parseAffinities(fields["Damage Resistances"] ?? ""),
        vulnerabilities: parseAffinities(fields["Damage Vulnerabilities"] ?? ""),
        immunities: parseAffinities(fields["Damage Immunities"] ?? ""),
        condition_immunities: splitList(fields["Condition Immunities"]),
        languages: splitList(fields["Languages"]),
        features: [],
        granted_actions: [],
        roll_advantages: [],
        roll_bonuses: [],
        attacks: [],
        attacks_per_action: 1,
        challenge_rating: cr,
        ...(pb ? { proficiency_bonus: pb } : {}),
        ...(xp !== undefined ? { xp } : {}),
    };

    // Traits: `***Name***.` runs in the body (labeledFields/stat-table lines are ** or plain, so ignored).
    for (const run of parseBoldItalicRuns(body)) monster.features.push(toFeature(run.label, run.text));

    for (const child of children) {
        const t = child.title.toLowerCase();
        if (/legendary/.test(t)) {
            const la: MonsterAttackJson[] = [];
            for (const run of parseBoldRuns(child.body)) { // 5.1 legendary actions use `**Name**.` (double star)
                la.push(parseAttack(run.label, run.text, { stats, pb })
                    ?? { name: cleanActionName(run.label), action_type: "action", description: cleanWhitespace(run.text), damage: [] });
            }
            if (la.length) {
                monster.legendary_actions = la;
                monster.legendary_action_count = Number(child.body.match(/take\s+(\d+)\s+legendary/i)?.[1]) || 3;
            }
        } else if (/reaction/.test(t)) {
            for (const run of parseBoldItalicRuns(child.body)) {
                const atk = parseAttack(run.label, run.text, { stats, pb, actionType: "reaction" });
                if (atk) monster.attacks.push(atk);
                else monster.granted_actions.push(runToGranted(run.label, run.text, "reaction"));
            }
        } else if (/action/.test(t)) {
            for (const run of parseBoldItalicRuns(child.body)) {
                if (/^multiattack$/i.test(cleanActionName(run.label))) {
                    monster.attacks_per_action = multiattackCount(run.text);
                    monster.granted_actions.push({ name: "Multiattack", action_type: "action", description: cleanWhitespace(run.text) });
                    continue;
                }
                const atk = parseAttack(run.label, run.text, { stats, pb });
                if (atk) monster.attacks.push(atk);
                else monster.granted_actions.push(runToGranted(run.label, run.text));
            }
        }
    }
    return monster;
}

/**
 * Parse the 2014 SRD monster statblocks — one per file in 10_Monsters/Monsters_Each/*.md. Each file's
 * first (top-level) heading is the monster; `###### Actions` / `Legendary Actions` / `Reactions` are its
 * children. Header fields are `**Label** value` lines; the stat table is the 6-column STR..CHA grid.
 */
export function parseMonsters2014(): MonsterJson[] {
    const out: MonsterJson[] = [];
    for (const file of fs.readdirSync(MONSTERS_DIR).filter(f => f.endsWith(".md")).sort()) {
        const md = normalizeMarkdown(fs.readFileSync(path.join(MONSTERS_DIR, file), "utf8"));
        const roots = sectionize(md);
        if (!roots.length) continue;
        const top = roots[0]; // one monster per file
        const m = buildMonster(cleanTitle(top.title), top.body, top.children);
        if (m) out.push(m);
    }
    return out;
}
