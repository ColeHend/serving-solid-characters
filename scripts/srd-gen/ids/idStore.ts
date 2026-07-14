import fs from "node:fs";
import path from "node:path";
import { uuid5, nameKey } from "../lib/util.ts";
import type { Ruleset, RulesetData, FeatureDetailJson, FeatJson, RaceJson, SubraceJson } from "../types.ts";

/**
 * Id stability: entities keep the id they have in the currently-served JSON
 * (matched by ruleset+kind+name, and for nested features by parent+name),
 * so client Dexie caches and cross-references don't churn. New entities get
 * deterministic UUIDv5 ids so re-runs are stable.
 */
export class IdStore {
    private existing = new Map<string, string>();
    preserved = 0;
    minted = 0;

    constructor(private ruleset: Ruleset, dataDir: string) {
        this.loadExisting(dataDir);
    }

    private remember(key: string, id: unknown) {
        if (typeof id === "string" && id && !this.existing.has(key)) this.existing.set(key, id);
    }

    private loadJson(dataDir: string, file: string): any[] {
        const p = path.join(dataDir, file);
        if (!fs.existsSync(p)) return [];
        try {
            const parsed = JSON.parse(fs.readFileSync(p, "utf8"));
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    private loadExisting(dataDir: string) {
        const kinds: [string, string][] = [
            ["classes", "class"], ["subclasses", "subclass"], ["races", "race"], ["subraces", "subrace"],
            ["backgrounds", "background"], ["feats", "feat"], ["spells", "spell"], ["items", "item"],
            ["weapons", "item"], ["armor", "item"], ["magic_items", "magic_item"], ["weapon_masteries", "mastery"],
            ["rules", "rule"], ["monsters", "monster"],
        ];
        for (const [file, kind] of kinds) {
            for (const e of this.loadJson(dataDir, `${file}.json`)) {
                const name = e?.name ?? e?.details?.name;
                if (!name) continue;
                this.remember(`${kind}|${nameKey(name)}`, e.id);
                // nested feature/trait ids
                if (e.features && !Array.isArray(e.features)) {
                    for (const [lvl, feats] of Object.entries(e.features as Record<string, any[]>)) {
                        for (const f of feats ?? []) this.remember(`feature|${kind}|${nameKey(name)}|${lvl}|${nameKey(f?.name ?? "")}`, f?.id);
                    }
                }
                if (Array.isArray(e.features)) {
                    for (const f of e.features) this.remember(`feature|${kind}|${nameKey(name)}||${nameKey(f?.name ?? "")}`, f?.id);
                }
                if (Array.isArray(e.traits)) {
                    for (const t of e.traits) {
                        const tn = t?.details?.name ?? "";
                        this.remember(`trait|${kind}|${nameKey(name)}|${nameKey(tn)}`, t?.id);
                        this.remember(`traitdetail|${kind}|${nameKey(name)}|${nameKey(tn)}`, t?.details?.id);
                    }
                }
                if (e.details) this.remember(`featdetail|${nameKey(name)}`, e.details.id);
            }
        }
    }

    id(key: string): string {
        const hit = this.existing.get(key);
        if (hit) {
            this.preserved++;
            return hit;
        }
        this.minted++;
        return uuid5(`${this.ruleset}|${key}`);
    }
}

function fillFeatureMap(store: IdStore, kind: string, parentName: string, features: Record<string, FeatureDetailJson[]>) {
    for (const [lvl, feats] of Object.entries(features ?? {})) {
        for (const f of feats ?? []) {
            if (!f.id) f.id = store.id(`feature|${kind}|${nameKey(parentName)}|${lvl}|${nameKey(f.name)}`);
        }
    }
}

function fillTraits(store: IdStore, kind: string, parentName: string, traits: FeatJson[]) {
    for (const t of traits ?? []) {
        const tn = t.details?.name ?? "";
        if (!t.id) t.id = store.id(`trait|${kind}|${nameKey(parentName)}|${nameKey(tn)}`);
        if (t.details && !t.details.id) t.details.id = store.id(`traitdetail|${kind}|${nameKey(parentName)}|${nameKey(tn)}`);
    }
}

/** Assigns ids in place, then resolves subrace.parentRace from name → id. */
export function assignIds(store: IdStore, data: RulesetData): void {
    for (const c of data.classes) {
        if (!c.id) c.id = store.id(`class|${nameKey(c.name)}`);
        fillFeatureMap(store, "class", c.name, c.features);
    }
    for (const s of data.subclasses) {
        if (!s.id) s.id = store.id(`subclass|${nameKey(s.name)}`);
        fillFeatureMap(store, "subclass", s.name, s.features);
    }
    for (const r of data.races) {
        if (!r.id) r.id = store.id(`race|${nameKey(r.name)}`);
        fillTraits(store, "race", r.name, r.traits);
    }
    for (const r of data.subraces) {
        if (!r.id) r.id = store.id(`subrace|${nameKey(r.name)}`);
        fillTraits(store, "subrace", r.name, r.traits);
    }
    for (const b of data.backgrounds) {
        if (!b.id) b.id = store.id(`background|${nameKey(b.name)}`);
        for (const f of b.features ?? []) {
            if (!f.id) f.id = store.id(`feature|background|${nameKey(b.name)}||${nameKey(f.name)}`);
        }
    }
    for (const f of data.feats) {
        const n = f.details?.name ?? "";
        if (!f.id) f.id = store.id(`feat|${nameKey(n)}`);
        if (f.details && !f.details.id) f.details.id = store.id(`featdetail|${nameKey(n)}`);
    }
    for (const s of data.spells) if (!s.id) s.id = store.id(`spell|${nameKey(s.name)}`);
    for (const list of [data.items, data.weapons ?? [], data.armor ?? []]) {
        for (const i of list) if (!i.id) i.id = store.id(`item|${nameKey(i.name)}`);
    }
    for (const m of data.magicItems) if (!m.id) m.id = store.id(`magic_item|${nameKey(m.name)}`);
    for (const w of data.weaponMasteries ?? []) if (!w.id) w.id = store.id(`mastery|${nameKey(w.name)}`);
    for (const r of data.rules) if (!r.id) r.id = store.id(`rule|${nameKey(r.name)}`);
    for (const m of data.monsters) {
        if (!m.id) m.id = store.id(`monster|${nameKey(m.name)}`);
        for (const f of m.features ?? []) {
            if (!f.id) f.id = store.id(`feature|monster|${nameKey(m.name)}||${nameKey(f.name)}`);
        }
    }

    // parentRace: parsers emit the parent race NAME; swap to the parent's id.
    const raceByName = new Map(data.races.map(r => [nameKey(r.name), r.id]));
    for (const sr of data.subraces) {
        const pid = raceByName.get(nameKey(sr.parentRace));
        if (pid) sr.parentRace = pid;
    }
}
