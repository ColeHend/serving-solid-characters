import fs from "node:fs";
import path from "node:path";
import { SRC_2024 } from "../../config.ts";
import { normalizeMarkdown, cleanTitle } from "../../md/normalize.ts";
import { sectionize, walk, type Section } from "../../md/sections.ts";
import { parseBoldItalicRuns } from "../../md/inline.ts";
import { labeledFields, firstItalicLine } from "../../md/inline.ts";
import { parseTables } from "../../md/tables.ts";
import { cleanWhitespace } from "../../lib/util.ts";
import type {
    MonsterJson, StatsJson, SavingThrowJson, FeatureDetailJson, GrantedActionJson, MonsterAttackJson,
} from "../../types.ts";
import {
    ABILITIES, type Ability, abilityMod, abbrevToAbility, crToPb, parseChallenge, parseHp, parseSpeeds,
    parseSenses, parseSkills, parseTypeLine, parseAffinities, multiattackCount, parseAttack,
    parseUsage, cleanActionName,
} from "../monsterParse.shared.ts";

const FILES = ["12_MonstersA-Z.md", "13_Animals.md"];

/** The `|STAT|SCORE|MOD|SAVE|` table → ability scores + save proficiencies (proficient when SAVE ≠ MOD). */
function parseStatTable(header: string): { stats: StatsJson; saves: SavingThrowJson[] } | null {
    const table = parseTables(header).find(t => t.headers.some(h => /score/i.test(h)));
    if (!table) return null;
    const stats: StatsJson = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
    const saves: SavingThrowJson[] = [];
    for (const row of table.rows) {
        const ability = abbrevToAbility(row[0]);
        if (!ability) continue;
        stats[ability] = Number(row[1]);
        const mod = abilityMod(stats[ability]);
        const save = Number(String(row[3]).replace(/[^\d+-]/g, ""));
        if (!Number.isNaN(save) && save !== mod) saves.push({ stat: ability, proficient: true });
    }
    return { stats, saves };
}

function splitList(s?: string): string[] {
    return (s ?? "").split(/[,;]/).map(x => cleanWhitespace(x).trim()).filter(Boolean);
}

/** A trait/legendary run → FeatureDetail (uses/recharge into metadata). */
function toFeature(rawName: string, text: string): FeatureDetailJson {
    const { recharge, uses } = parseUsage(rawName);
    const f: FeatureDetailJson = { id: "", name: cleanActionName(rawName), description: cleanWhitespace(text) };
    const meta: { uses?: number; recharge?: string } = {};
    if (uses) { const n = Number(uses.split("/")[0]); if (n) meta.uses = n; }
    if (Object.keys(meta).length) f.metadata = meta;
    return f;
}

function buildMonster(name: string, header: string, children: Section[]): MonsterJson | null {
    const typeLine = firstItalicLine(header);
    const table = parseStatTable(header);
    if (!typeLine || !table) return null;

    const fields = labeledFields(header);
    const { size, type, subtype, alignment } = parseTypeLine(typeLine);
    const { cr, xp } = parseChallenge(fields["CR"] ?? "");
    const pbMatch = (fields["CR"] ?? "").match(/PB\s*\+?(\d+)/i);
    const pb = pbMatch ? Number(pbMatch[1]) : crToPb(cr);

    const acRaw = fields["Armor Class"] ?? "";
    const armorClass = parseInt(acRaw, 10) || 0;
    const armorDesc = acRaw.match(/\(([^)]+)\)/)?.[1];

    const { max, hitDice } = parseHp(fields["Hit Points"] ?? "");
    const { speed, movement_speeds } = parseSpeeds(fields["Speed"] ?? "");

    // Immunities bullet: "Poison, Thunder; Exhaustion, Grappled" → damage before ';', conditions after.
    const immRaw = fields["Immunities"] ?? "";
    const [immDamage, immConditions] = immRaw.includes(";") ? immRaw.split(";") : [immRaw, ""];

    const monster: MonsterJson = {
        id: "",
        name,
        size,
        type,
        ...(subtype ? { subtype } : {}),
        ...(alignment ? { alignment } : {}),
        stats: table.stats,
        armor_class: armorClass,
        ...(armorDesc ? { armor_desc: armorDesc } : {}),
        health: { max, current: max, temp: 0 },
        ...(hitDice ? { hit_dice: hitDice } : {}),
        speed,
        movement_speeds,
        senses: parseSenses(fields["Senses"] ?? ""),
        saving_throws: table.saves,
        proficiencies: { skills: parseSkills(fields["Skills"] ?? "", table.stats, pb), other: {} },
        resistances: parseAffinities(fields["Resistances"] ?? ""),
        vulnerabilities: parseAffinities(fields["Vulnerabilities"] ?? ""),
        immunities: parseAffinities(immDamage),
        condition_immunities: splitList(immConditions),
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

    for (const child of children) {
        const t = child.title.toLowerCase();
        // Order matters: "Legendary Actions" and "Reactions" both contain "action".
        if (/trait/.test(t)) {
            for (const run of parseBoldItalicRuns(child.body)) monster.features.push(toFeature(run.label, run.text));
        } else if (/legendary/.test(t)) {
            const la: MonsterAttackJson[] = [];
            for (const run of parseBoldItalicRuns(child.body)) {
                la.push(parseAttack(run.label, run.text, { stats: table.stats, pb })
                    ?? { name: cleanActionName(run.label), action_type: "action", description: cleanWhitespace(run.text), damage: [] });
            }
            if (la.length) { monster.legendary_actions = la; monster.legendary_action_count = 3; }
        } else if (/reaction/.test(t)) {
            for (const run of parseBoldItalicRuns(child.body)) {
                const atk = parseAttack(run.label, run.text, { stats: table.stats, pb, actionType: "reaction" });
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
                const atk = parseAttack(run.label, run.text, { stats: table.stats, pb });
                if (atk) monster.attacks.push(atk);
                else monster.granted_actions.push(runToGranted(run.label, run.text));
            }
        }
    }
    return monster;
}

function runToGranted(rawName: string, text: string, actionType = "action"): GrantedActionJson {
    return { name: cleanActionName(rawName), action_type: actionType, description: cleanWhitespace(text) };
}

/**
 * Parse the 2024 SRD monster statblocks (12_MonstersA-Z.md + 13_Animals.md). Each `## <Name>` is a
 * statblock; its body holds the italic type line, bullet fields, and the STAT/SCORE/MOD/SAVE table,
 * while `### Traits` / `### Actions` / `### Legendary Actions` are its child sections.
 */
export function parseMonsters2024(): MonsterJson[] {
    const out: MonsterJson[] = [];
    for (const file of FILES) {
        const md = normalizeMarkdown(fs.readFileSync(path.join(SRC_2024, file), "utf8"));
        for (const s of walk(sectionize(md))) {
            if (s.level !== 2) continue;
            const m = buildMonster(cleanTitle(s.title), s.body, s.children);
            if (m) out.push(m);
        }
    }
    return out;
}
