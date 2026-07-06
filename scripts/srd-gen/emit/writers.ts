import fs from "node:fs";
import path from "node:path";
import type { Ruleset, RulesetData } from "../types.ts";

/** file name (without .json) → data selector, per ruleset. */
export function filePlan(ruleset: Ruleset, data: RulesetData): Record<string, unknown[]> {
    const common: Record<string, unknown[]> = {
        classes: data.classes,
        subclasses: data.subclasses,
        races: data.races,
        subraces: data.subraces,
        spells: data.spells,
        backgrounds: data.backgrounds,
        feats: data.feats,
        magic_items: data.magicItems,
    };
    if (ruleset === "2014") {
        return { ...common, items: data.items, weapons: data.weapons ?? [], armor: data.armor ?? [] };
    }
    return { ...common, items: data.items, weapon_masteries: data.weaponMasteries ?? [] };
}

export function writeFiles(outDir: string, plan: Record<string, unknown[]>): string[] {
    fs.mkdirSync(outDir, { recursive: true });
    const written: string[] = [];
    for (const [name, rows] of Object.entries(plan)) {
        const p = path.join(outDir, `${name}.json`);
        fs.writeFileSync(p, JSON.stringify(rows, null, 1) + "\n", "utf8");
        written.push(p);
    }
    return written;
}

/** Remove the stale backup clutter from the 2024 folder. */
export function cleanupBackups(outDir: string): string[] {
    const removed: string[] = [];
    const backups = path.join(outDir, "backups");
    if (fs.existsSync(backups)) {
        fs.rmSync(backups, { recursive: true });
        removed.push(backups);
    }
    for (const f of fs.readdirSync(outDir)) {
        if (/\.(bak|backup(-.*)?)$/.test(f)) {
            fs.rmSync(path.join(outDir, f));
            removed.push(path.join(outDir, f));
        }
    }
    return removed;
}
