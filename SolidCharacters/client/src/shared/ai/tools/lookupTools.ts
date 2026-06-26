import { AiToolDef, AiToolCall } from "../types";
import { str } from "../coerce";
import { HOMEBREW_KINDS, HomebrewKind } from "../refs/homebrewKind";
import { homebrewManager } from "../../customHooks/homebrewManager";
import { loadSrdSpells } from "../../customHooks/dndInfo/info/srd/spells";
import { loadSrdClasses } from "../../customHooks/dndInfo/info/srd/classes";
import { loadSrdRaces } from "../../customHooks/dndInfo/info/srd/races";
import { loadSrdFeats } from "../../customHooks/dndInfo/info/srd/feats";
import { loadSrdBackgrounds } from "../../customHooks/dndInfo/info/srd/backgrounds";
import { loadSrdItems } from "../../customHooks/dndInfo/info/srd/items";
import { loadSrdMagicItems } from "../../customHooks/dndInfo/info/srd/magicItems";
import { loadSrdSubclasses } from "../../customHooks/dndInfo/info/srd/subclasses";

/**
 * Read-only reference lookup. lookup_srd searches official 5e content; lookup_homebrew searches the
 * user's own content. Both run in-browser (no model, no card) and feed a compact, token-bounded result
 * straight back as a tool_result — so the model can MATCH official numbers before inventing, and avoid
 * duplicating the user's existing homebrew. Routed as the "lookup" category in toolCategory.ts.
 *
 * Schemas are deliberately flat (kind enum + query string) so a small local model uses them reliably.
 *
 * ZERO-PERSONA SURFACE: procedural tool descriptions — keep them neutral, no Grimoire voice.
 */

const MAX_DETAILED = 3;       // show full summaries for up to this many matches
const MAX_NAMES = 25;         // otherwise list up to this many names
const DESC_CAP = 360;         // per-entity description cap
const TOTAL_CAP = 1400;       // hard cap on the whole tool_result

const cap = (s: string, n: number): string => (s.length > n ? `${s.slice(0, n)}…` : s);

type AnyEntity = Record<string, unknown> & { name?: string; details?: { name?: string; description?: string } };

function nameOf(kind: HomebrewKind, e: AnyEntity): string {
    return kind === "feat" ? str(e.details?.name) || str(e.name) : str(e.name);
}

function descOf(kind: HomebrewKind, e: AnyEntity): string {
    if (kind === "feat") return str(e.details?.description);
    return str((e as { description?: string }).description) || str((e as { desc?: string }).desc);
}

/** A compact, mechanically-relevant one-liner per entity, capped. */
function summarize(kind: HomebrewKind, e: AnyEntity): string {
    const name = nameOf(kind, e);
    const facts: string[] = [];
    const f = (label: string, v: unknown) => { const s = str(v).trim(); if (s) facts.push(`${label} ${s}`); };
    switch (kind) {
        case "spell": f("level", e.level); f("school", e.school); f("range", e.range); f("casting", e.castingTime); f("damage", e.damageType);
            { const cls = e.classes; if (Array.isArray(cls) && cls.length) facts.push(`classes ${cls.map(x => str(x)).join(", ")}`); } break;
        case "magic_item": f("rarity", e.rarity); f("category", e.category); break;
        case "item": f("type", e.type); f("cost", e.cost); break;
        case "race": f("size", e.size); f("speed", e.speed); break;
        case "subclass": f("parent", e.parentClass); break;
        case "class": f("hit die", e.hitDie); f("primary", e.primaryAbility); break;
    }
    const head = facts.length ? `${name} — ${facts.join(", ")}` : name;
    const desc = descOf(kind, e);
    return desc ? `${head}\n${cap(desc.replace(/\s+/g, " ").trim(), DESC_CAP)}` : head;
}

/** The domain row types don't structurally match AnyEntity; we only read name/desc fields, so cast loosely. */
const asEntities = (rows: readonly unknown[]): AnyEntity[] => rows as AnyEntity[];

function homebrewRows(kind: HomebrewKind): AnyEntity[] {
    switch (kind) {
        case "spell": return asEntities(homebrewManager.spells());
        case "item": return asEntities(homebrewManager.items());
        case "magic_item": return asEntities(homebrewManager.magicItems());
        case "feat": return asEntities(homebrewManager.feats());
        case "background": return asEntities(homebrewManager.backgrounds());
        case "race": return asEntities(homebrewManager.races());
        case "subclass": return asEntities(homebrewManager.subclasses());
        case "class": return asEntities(homebrewManager.classes());
    }
}

async function srdRows(kind: HomebrewKind, version: string): Promise<AnyEntity[]> {
    const editions: ("2014" | "2024")[] = version === "2024" ? ["2024"] : version === "2014" ? ["2014"] : ["2014", "2024"];
    const collect = async (load: (v: "2014" | "2024") => Promise<{ rows: readonly unknown[] }>): Promise<AnyEntity[]> => {
        const out: AnyEntity[] = [];
        for (const ed of editions) out.push(...asEntities((await load(ed)).rows));
        return out;
    };
    switch (kind) {
        case "spell": return collect(loadSrdSpells);
        case "item": return collect(loadSrdItems);
        case "magic_item": return asEntities((await loadSrdMagicItems()).rows);   // versionless
        case "feat": return collect(loadSrdFeats);
        case "background": return collect(loadSrdBackgrounds);
        case "race": return collect(loadSrdRaces);
        case "subclass": return collect(loadSrdSubclasses);
        case "class": return collect(loadSrdClasses);
    }
}

/** Filter rows by query: exact-name first, then name/description substring. Empty query → all rows. */
function matchRows(kind: HomebrewKind, rows: AnyEntity[], query: string): AnyEntity[] {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    const exact = rows.filter(e => nameOf(kind, e).toLowerCase() === q);
    if (exact.length) return exact;
    return rows.filter(e => nameOf(kind, e).toLowerCase().includes(q) || descOf(kind, e).toLowerCase().includes(q));
}

function formatResults(kind: HomebrewKind, label: string, query: string, rows: AnyEntity[]): string {
    const matches = matchRows(kind, rows, query);
    if (!matches.length) {
        return query
            ? `No ${label} ${kind.replace("_", " ")} matches "${query}".`
            : `No ${label} ${kind.replace("_", " ")} content is available.`;
    }
    if (matches.length > MAX_DETAILED) {
        const names = matches.slice(0, MAX_NAMES).map(e => nameOf(kind, e)).filter(Boolean);
        const more = matches.length > MAX_NAMES ? ` (+${matches.length - MAX_NAMES} more)` : "";
        return cap(`${matches.length} ${label} ${kind.replace("_", " ")} matches — call again with an exact name for details:\n${names.join(", ")}${more}`, TOTAL_CAP);
    }
    return cap(matches.map(e => summarize(kind, e)).join("\n\n"), TOTAL_CAP);
}

export const LOOKUP_TOOLS: AiToolDef[] = [
    {
        name: "lookup_srd",
        description: "Search official D&D 5e (SRD) content to match real numbers before you invent any. Example: {\"kind\":\"spell\",\"query\":\"fireball\"}. Returns the closest matches with their key stats.",
        inputSchema: {
            type: "object",
            additionalProperties: false,
            properties: {
                kind: { type: "string", enum: [...HOMEBREW_KINDS], description: "What to search: spell, item, magic_item, feat, background, race, subclass, or class." },
                query: { type: "string", description: "Name or keyword to search for. An exact name returns full detail; a keyword returns a short list." },
                version: { type: "string", enum: ["2014", "2024"], description: "Ruleset edition. Omit to search both." },
            },
            required: ["kind", "query"],
        },
    },
    {
        name: "lookup_homebrew",
        description: "Search the user's existing homebrew content — to reference it, avoid creating a near-duplicate, or find the exact name/fields before editing. Example: {\"kind\":\"class\",\"query\":\"warden\"}.",
        inputSchema: {
            type: "object",
            additionalProperties: false,
            properties: {
                kind: { type: "string", enum: [...HOMEBREW_KINDS], description: "What to search: spell, item, magic_item, feat, background, race, subclass, or class." },
                query: { type: "string", description: "Name or keyword. Leave empty to list everything of this kind." },
            },
            required: ["kind"],
        },
    },
];

/** Execute a lookup tool call. Async (SRD rows may need a load); fails open with a friendly note. */
export async function runLookupTool(tc: AiToolCall): Promise<{ content: string; isError: boolean }> {
    const i = (tc.input ?? {}) as Record<string, unknown>;
    const kind = str(i.kind) as HomebrewKind;
    const query = str(i.query);
    if (!HOMEBREW_KINDS.includes(kind)) {
        return { content: `Unknown kind "${str(i.kind)}". Use one of: ${HOMEBREW_KINDS.join(", ")}.`, isError: true };
    }
    const homebrew = tc.name === "lookup_homebrew";
    try {
        const rows = homebrew ? homebrewRows(kind) : await srdRows(kind, str(i.version));
        return { content: formatResults(kind, homebrew ? "homebrew" : "SRD", query, rows), isError: false };
    } catch {
        // Fail open — a lookup hiccup should never break the turn; the model can proceed without it.
        return { content: `Couldn't load ${homebrew ? "homebrew" : "SRD"} ${kind.replace("_", " ")} right now — proceed with your best estimate.`, isError: false };
    }
}
