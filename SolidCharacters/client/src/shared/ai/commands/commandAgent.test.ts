import { describe, it, expect, vi } from "vitest";
import type { HomebrewPreview } from "../tools/toolDispatcher";
import type { HomebrewKind } from "../refs/homebrewKind";
import type { RefKind } from "./madCommandCatalog";
import type { AiSettings } from "../../../models/userSettings";

// commandAgent imports the SRD/homebrew catalogs (which boot IndexedDB) and the provider factory. Mock
// them so importing the module is side-effect-free; the pure logic under test takes an injected resolver.
vi.mock("../../customHooks/homebrewManager", () => ({
    homebrewManager: { spells: () => [], items: () => [], magicItems: () => [], feats: () => [] },
}));
vi.mock("../../customHooks/dndInfo/info/all/spells", () => ({ useDnDSpells: () => () => [] }));
vi.mock("../../customHooks/dndInfo/info/all/items", () => ({ useDnDItems: () => () => [] }));
vi.mock("../../customHooks/dndInfo/info/all/feats", () => ({ useDnDFeats: () => () => [] }));
vi.mock("../../customHooks/dndInfo/useDndFeatures", () => ({ useDndFeature: () => ({ allFeatures: () => [] }) }));
// Capturing provider stub: records the (tools, opts) each defaultCommandRunner turn sends, and replies
// with the attach_commands payload as plain text — the shape a structured-output (format-constrained)
// turn produces. Tests that inject their own runner never reach it.
const providerCapture = vi.hoisted(() => ({ calls: [] as { tools: unknown; opts: Record<string, unknown> }[] }));
vi.mock("../providers/providerFactory", () => ({
    buildProvider: () => ({
        streamChat: async function* (_messages: unknown, tools: unknown, opts: Record<string, unknown>) {
            providerCapture.calls.push({ tools, opts });
            yield { type: "text_delta", text: '{"features":[{"name":"Stoneborn","commands":[]}]}' };
            yield { type: "message_done", stopReason: "end_turn" };
        },
    }),
}));

import { coerceCommand, commandChipLabel } from "./madCommandCatalog";
import {
    applyCommandsToEntity, extractFeatures, featuresOf, gapFillCommands, generateCommands,
    hasFeatures, looksMechanical, normalizeName,
    type CommandTurn, type CommandTurnRunner,
} from "./commandAgent";

const noRef = (): string | null => null;
const fixedRef = (id: string) => (_k: RefKind, _n: string) => id;

function preview(kind: HomebrewKind, entity: unknown): HomebrewPreview {
    return {
        previewId: "p1", toolCallId: "t1", kind, title: (entity as { name?: string }).name ?? "X",
        entity: entity as HomebrewPreview["entity"], valid: true, errors: [],
    };
}

describe("coerceCommand — value-based categories", () => {
    it("canonicalizes a damage type and builds the command string", () => {
        const mad = coerceCommand("Add", "Resistances", { damageType: "fire" }, undefined, noRef);
        expect(mad).toEqual({ command: "AddResistances", value: { damageType: "Fire" }, type: 0, prerequisites: [], group: 0 });
    });

    it("maps full ability names to keys for Stats", () => {
        const mad = coerceCommand("Add", "Stats", { stat: "Constitution", statValue: "1" }, undefined, noRef);
        expect(mad?.value).toEqual({ stat: "con", statValue: "1" });
    });

    it("drops a command whose required enum doesn't resolve", () => {
        expect(coerceCommand("Add", "Resistances", { damageType: "holy" }, undefined, noRef)).toBeNull();
    });

    it("drops a command missing a required number", () => {
        expect(coerceCommand("Add", "Speed", {}, undefined, noRef)).toBeNull();
        expect(coerceCommand("Add", "Speed", { speed: "fast" }, undefined, noRef)).toBeNull();
        expect(coerceCommand("Add", "Speed", { speed: "10" }, undefined, noRef)?.value).toEqual({ speed: "10" });
    });

    it("requires at least one valid ability for ArmorClass (avoids a NaN sheet)", () => {
        expect(coerceCommand("Add", "ArmorClass", { bonus: "13" }, undefined, noRef)).toBeNull();
        expect(coerceCommand("Add", "ArmorClass", { bonus: "13", stats: "Dex, bogus" }, undefined, noRef)?.value)
            .toEqual({ bonus: "13", stats: "dex" });
    });

    it("canonicalizes skill names and drops unknown ones", () => {
        expect(coerceCommand("Add", "Proficiencies", { proficiency: "stealth" }, undefined, noRef)?.value)
            .toEqual({ proficiency: "Stealth" });
        expect(coerceCommand("Add", "Proficiencies", { proficiency: "Hacking" }, undefined, noRef)).toBeNull();
    });

    it("filters a skill CSV to known skills for Expertise", () => {
        expect(coerceCommand("Add", "Expertise", { proficiencies: "Stealth, Nonsense, Arcana" }, undefined, noRef)?.value)
            .toEqual({ proficiencies: "Stealth,Arcana" });
    });

    it("accepts currency synonyms and a PB-choice shorthand", () => {
        expect(coerceCommand("Add", "Currency", { type: "gold", amount: "5" }, undefined, noRef)?.value)
            .toEqual({ type: "goldPieces", amount: "5" });
        expect(coerceCommand("Add", "AllProficiencies", { allProficiencies: "Arcana,History", proficiencyBonusChoice: "half" }, undefined, noRef)?.value)
            .toEqual({ allProficiencies: "Arcana,History", proficiencyBonusChoice: "Half PB" });
    });

    it("matches the category case-insensitively and rejects unknown categories", () => {
        expect(coerceCommand("Add", "speed", { speed: "5" }, undefined, noRef)?.command).toBe("AddSpeed");
        expect(coerceCommand("Add", "Teleport", { x: "1" }, undefined, noRef)).toBeNull();
    });
});

describe("coerceCommand — id-based categories", () => {
    it("resolves a target name to a catalog id", () => {
        const mad = coerceCommand("Add", "Spells", undefined, "Fireball", fixedRef("spell-7"));
        expect(mad?.value).toEqual({ ID: "spell-7" });
    });

    it("uses the remove-variant key for Items", () => {
        expect(coerceCommand("Remove", "Items", undefined, "Torch", fixedRef("item-3"))?.value).toEqual({ name: "item-3" });
        expect(coerceCommand("Add", "Items", undefined, "Torch", fixedRef("item-3"))?.value).toEqual({ ID: "item-3" });
    });

    it("drops the command when the reference can't be resolved", () => {
        expect(coerceCommand("Add", "Feats", undefined, "Made Up Feat", noRef)).toBeNull();
    });
});

describe("commandChipLabel", () => {
    it("shows concrete values for value-based commands", () => {
        expect(commandChipLabel({ command: "AddResistances", value: { damageType: "Fire" } })).toBe("Add Resistances: Fire");
        expect(commandChipLabel({ command: "AddSpeed", value: { speed: "10" } })).toBe("Add Speed: 10");
    });
    it("shows only the action for id-based commands (the value is an opaque id)", () => {
        expect(commandChipLabel({ command: "AddSpells", value: { ID: "spell-7" } })).toBe("Add Spells");
    });
});

describe("featuresOf", () => {
    it("returns trait details for a race", () => {
        const race = { traits: [{ details: { id: "t1", name: "Stoneborn", description: "d" } }] };
        expect(featuresOf("race", race as HomebrewPreview["entity"]).map(f => f.name)).toEqual(["Stoneborn"]);
    });
    it("flattens leveled features for a class", () => {
        const cls = { features: { 1: [{ id: "f1", name: "Rage", description: "d" }], 2: [{ id: "f2", name: "Reckless", description: "d" }] } };
        expect(featuresOf("class", cls as unknown as HomebrewPreview["entity"]).map(f => f.name)).toEqual(["Rage", "Reckless"]);
    });
    it("returns the single details object for a feat", () => {
        const feat = { details: { id: "d1", name: "Alert", description: "d" } };
        expect(featuresOf("feat", feat as HomebrewPreview["entity"]).map(f => f.name)).toEqual(["Alert"]);
    });
    it("returns nothing for kinds without features", () => {
        expect(featuresOf("spell", { description: "x" } as HomebrewPreview["entity"])).toEqual([]);
        expect(hasFeatures("spell")).toBe(false);
        expect(hasFeatures("race")).toBe(true);
    });
});

describe("applyCommandsToEntity", () => {
    const racePreview = () => preview("race", {
        name: "Cairnkin",
        traits: [{ details: { id: "t1", name: "Stoneborn", description: "resistance to poison" } }],
    });

    it("attaches valid commands to the matching feature and clones (original untouched)", () => {
        const p = racePreview();
        const parsed = [{ name: "Stoneborn", commands: [{ type: "Add", category: "Resistances", value: { damageType: "poison" } }] }];
        const { entity, attached } = applyCommandsToEntity(p, parsed, noRef);
        expect(attached).toBe(1);
        const mads = featuresOf("race", entity)[0].metadata?.mads;
        expect(mads).toEqual([{ command: "AddResistances", value: { damageType: "Poison" }, type: 0, prerequisites: [], group: 0 }]);
        // original entity must be unchanged (we operate on a clone)
        expect(featuresOf("race", p.entity)[0].metadata).toBeUndefined();
    });

    it("drops invalid commands but keeps valid ones", () => {
        const p = racePreview();
        const parsed = [{ name: "Stoneborn", commands: [
            { type: "Add", category: "Resistances", value: { damageType: "holy" } },   // dropped
            { type: "Add", category: "Speed", value: { speed: "5" } },                 // kept
        ] }];
        const { entity, attached } = applyCommandsToEntity(p, parsed, noRef);
        expect(attached).toBe(1);
        expect(featuresOf("race", entity)[0].metadata?.mads?.map(m => m.command)).toEqual(["AddSpeed"]);
    });

    it("ignores feature names that don't match (multi-feature: no fuzzy fallback)", () => {
        const p = preview("race", { name: "Cairnkin", traits: [
            { details: { id: "t1", name: "Stoneborn", description: "d" } },
            { details: { id: "t2", name: "Earthsense", description: "d" } },
        ] });
        const parsed = [{ name: "Ghost Feature", commands: [{ type: "Add", category: "Speed", value: { speed: "5" } }] }];
        expect(applyCommandsToEntity(p, parsed, noRef).attached).toBe(0);
    });

    it("returns the clone unchanged when there's nothing to apply", () => {
        expect(applyCommandsToEntity(racePreview(), null, noRef).attached).toBe(0);
        expect(applyCommandsToEntity(racePreview(), [], noRef).attached).toBe(0);
    });
});

// ---- small-model reliability: salvage, retry, gap-fill, fuzzy matching ----

const ai = { model: "test-model" } as unknown as AiSettings;

const toolCallTurn = (features: unknown): CommandTurn =>
    ({ text: "", ok: true, toolCalls: [{ id: "c1", name: "attach_commands", input: { features } }] });
const proseTurn = (text: string): CommandTurn => ({ text, ok: true, toolCalls: [] });

/** A runner whose Nth call returns `fn(N)`, tracking how many times it ran. */
function countingRunner(fn: (n: number) => CommandTurn): { runner: CommandTurnRunner; count: () => number } {
    let n = 0;
    const runner: CommandTurnRunner = async () => fn(n++);
    return { runner, count: () => n };
}

describe("extractFeatures", () => {
    it("reads features from a fenced json block", () => {
        expect(extractFeatures("Sure!\n```json\n{\"features\":[{\"name\":\"X\",\"commands\":[]}]}\n```"))
            .toEqual([{ name: "X", commands: [] }]);
    });
    it("reads features from a bare balanced object", () => {
        expect(extractFeatures('prefix {"features":[{"name":"Y"}]} suffix')?.[0].name).toBe("Y");
    });
    it("returns null for prose with no JSON", () => {
        expect(extractFeatures("no json here")).toBeNull();
    });
});

describe("generateCommands — salvage & retry", () => {
    const racePreview = () => preview("race", {
        name: "Cairnkin", traits: [{ details: { id: "t1", name: "Stoneborn", description: "resistance to poison" } }],
    });

    it("returns parsed features straight from a tool call (one attempt)", async () => {
        const { runner, count } = countingRunner(() => toolCallTurn([{ name: "Stoneborn", commands: [] }]));
        expect(await generateCommands(racePreview(), ai, undefined, { runner })).toEqual([{ name: "Stoneborn", commands: [] }]);
        expect(count()).toBe(1);
    });

    it("retries on a prose-only turn, then succeeds on the tool call", async () => {
        const { runner, count } = countingRunner(n =>
            n === 0 ? proseTurn("I'll consider it...") : toolCallTurn([{ name: "Stoneborn", commands: [] }]));
        expect((await generateCommands(racePreview(), ai, undefined, { runner }))?.[0].name).toBe("Stoneborn");
        expect(count()).toBe(2);
    });

    it("salvages prose JSON without spending a retry", async () => {
        const { runner, count } = countingRunner(() =>
            proseTurn('```json\n{"features":[{"name":"Stoneborn","commands":[]}]}\n```'));
        expect((await generateCommands(racePreview(), ai, undefined, { runner }))?.[0].name).toBe("Stoneborn");
        expect(count()).toBe(1);
    });

    it("gives up (null) after 1 + toolCallRetries unusable turns", async () => {
        const { runner, count } = countingRunner(() => proseTurn("still no json"));
        expect(await generateCommands(racePreview(), ai, undefined, { runner, toolCallRetries: 2 })).toBeNull();
        expect(count()).toBe(3);
    });
});

describe("looksMechanical", () => {
    it("flags descriptions that grant a concrete effect", () => {
        for (const d of ["resistance to fire", "you gain proficiency in Stealth",
            "your speed increases by 10 feet", "+1 Constitution", "you learn one extra language"]) {
            expect(looksMechanical(d)).toBe(true);
        }
    });
    it("ignores pure flavor and empty descriptions", () => {
        expect(looksMechanical("You feel a deep kinship with the mountains.")).toBe(false);
        expect(looksMechanical(undefined)).toBe(false);
    });
});

describe("gapFillCommands", () => {
    const emberkin = () => preview("race", {
        name: "Emberkin",
        traits: [
            { details: { id: "t1", name: "Flavor Soul", description: "You feel a deep kinship with fire." } },
            { details: { id: "t2", name: "Ember Body", description: "You have resistance to fire damage." } },
        ],
    });

    it("fills a mechanical feature with no mads and leaves flavor features alone", async () => {
        const runner: CommandTurnRunner = async () =>
            toolCallTurn([{ name: "Ember Body", commands: [{ type: "Add", category: "Resistances", value: { damageType: "fire" } }] }]);
        const { entity, attached } = await gapFillCommands(emberkin(), ai, undefined, { maxPerFeaturePasses: 6, runner });
        expect(attached).toBe(1);
        const feats = featuresOf("race", entity);
        expect(feats.find(f => f.name === "Ember Body")?.metadata?.mads?.map(m => m.command)).toEqual(["AddResistances"]);
        expect(feats.find(f => f.name === "Flavor Soul")?.metadata).toBeUndefined();
    });

    it("runs at most maxPerFeaturePasses focused turns", async () => {
        const cls = preview("class", {
            name: "Pyromancer",
            features: { 1: Array.from({ length: 10 }, (_, i) => ({ id: `f${i}`, name: `Ward ${i}`, description: "you gain resistance to cold" })) },
        });
        let calls = 0;
        const runner: CommandTurnRunner = async () => {
            calls++;
            return toolCallTurn([{ name: "x", commands: [{ type: "Add", category: "Resistances", value: { damageType: "cold" } }] }]);
        };
        await gapFillCommands(cls, ai, undefined, { maxPerFeaturePasses: 3, runner });
        expect(calls).toBe(3);
    });

    it("is a no-op when the cap is 0 (never calls the model)", async () => {
        let calls = 0;
        const runner: CommandTurnRunner = async () => { calls++; return toolCallTurn([]); };
        expect((await gapFillCommands(emberkin(), ai, undefined, { maxPerFeaturePasses: 0, runner })).attached).toBe(0);
        expect(calls).toBe(0);
    });
});

describe("applyCommandsToEntity — fuzzy feature matching", () => {
    it("matches across punctuation and case", () => {
        const p = preview("race", { name: "R", traits: [{ details: { id: "t1", name: "Stoneborn", description: "d" } }] });
        const parsed = [{ name: "stone-born", commands: [{ type: "Add", category: "Speed", value: { speed: "5" } }] }];
        expect(applyCommandsToEntity(p, parsed, noRef).attached).toBe(1);
    });

    it("attaches to the only feature regardless of the reported name", () => {
        const p = preview("feat", { details: { id: "d1", name: "Alert", description: "d" } });
        const parsed = [{ name: "Totally Different", commands: [{ type: "Add", category: "Speed", value: { speed: "5" } }] }];
        expect(applyCommandsToEntity(p, parsed, noRef).attached).toBe(1);
    });

    it("matches on a normalized substring among several features", () => {
        const p = preview("race", { name: "R", traits: [
            { details: { id: "t1", name: "Keen Senses", description: "d" } },
            { details: { id: "t2", name: "Draconic Resistance", description: "d" } },
        ] });
        const parsed = [{ name: "Resistance", commands: [{ type: "Add", category: "Resistances", value: { damageType: "fire" } }] }];
        const { entity, attached } = applyCommandsToEntity(p, parsed, noRef);
        expect(attached).toBe(1);
        expect(featuresOf("race", entity).find(f => f.name === "Draconic Resistance")?.metadata?.mads?.length).toBe(1);
    });
});

describe("normalizeName", () => {
    it("folds case, punctuation and whitespace", () => {
        expect(normalizeName("  Stone-Born!! ")).toBe("stone born");
        expect(normalizeName(undefined)).toBe("");
    });
});

describe("coerceCommand — category aliases (small-model tolerance)", () => {
    it("accepts singular / loose category spellings", () => {
        expect(coerceCommand("Add", "Resistance", { damageType: "fire" }, undefined, noRef)?.command).toBe("AddResistances");
        expect(coerceCommand("Add", "Stat", { stat: "con", statValue: "1" }, undefined, noRef)?.command).toBe("AddStats");
        expect(coerceCommand("Add", "Saving Throw", { stat: "dex" }, undefined, noRef)?.command).toBe("AddSavingThrows");
        expect(coerceCommand("Add", "proficiency", { proficiency: "Stealth" }, undefined, noRef)?.command).toBe("AddProficiencies");
    });
    it("still rejects genuinely unknown categories", () => {
        expect(coerceCommand("Add", "Teleport", { x: "1" }, undefined, noRef)).toBeNull();
    });
    it("does not loosen value-field coercion — bad fields still drop (safety preserved)", () => {
        expect(coerceCommand("Add", "Resistance", { damageType: "holy" }, undefined, noRef)).toBeNull();
    });
});

describe("coerceCommand — value-key placement (the MADS wrong-placement table)", () => {
    // The category/value-key pairings the cheat sheet's "Common mistakes" block teaches. Right pairings
    // coerce; swapped keys (the observed small-model failure) DROP — becoming an inert-feature warning
    // rather than a corrupted sheet.
    it("encodes the canonical placements", () => {
        expect(coerceCommand("Add", "ArmorClass", { bonus: "13", stats: "dex" }, undefined, noRef)?.command).toBe("AddArmorClass");
        expect(coerceCommand("Add", "Stats", { stat: "con", statValue: "1" }, undefined, noRef)?.command).toBe("AddStats");
        expect(coerceCommand("Add", "Resistances", { damageType: "Fire" }, undefined, noRef)?.command).toBe("AddResistances");
        expect(coerceCommand("Add", "SavingThrows", { stat: "dex" }, undefined, noRef)?.command).toBe("AddSavingThrows");
        expect(coerceCommand("Add", "Speed", { speed: "35" }, undefined, noRef)?.command).toBe("AddSpeed");
    });
    it("drops an AC formula mis-filed under Stats (wrong value keys)", () => {
        expect(coerceCommand("Add", "Stats", { bonus: "13", stats: "dex" }, undefined, noRef)).toBeNull();
    });
    it("drops an ability increase mis-filed under ArmorClass (wrong value keys)", () => {
        expect(coerceCommand("Add", "ArmorClass", { stat: "con", statValue: "1" }, undefined, noRef)).toBeNull();
    });
    it("drops a skill mis-filed under SavingThrows (skills are not abilities)", () => {
        expect(coerceCommand("Add", "SavingThrows", { stat: "Stealth" }, undefined, noRef)).toBeNull();
    });
});

describe("defaultCommandRunner — structured outputs vs tool path", () => {
    const stoneborn = () => preview("race", {
        name: "Cairnkin", traits: [{ details: { id: "t1", name: "Stoneborn", description: "resistance to poison" } }],
    });

    it("local provider: constrains with responseSchema, withholds the tool, and parses the text reply", async () => {
        providerCapture.calls.length = 0;
        const localAi = { model: "m", provider: "local" } as unknown as AiSettings;
        const out = await generateCommands(stoneborn(), localAi);
        expect(out?.[0].name).toBe("Stoneborn");
        const call = providerCapture.calls[0];
        expect(call.tools).toBeUndefined();
        expect(call.opts.responseSchema).toBeDefined();
        expect(call.opts.forceTool).toBeUndefined();
        expect(call.opts.temperature).toBeCloseTo(0.2);
    });

    it("structuredOutputs=false: sends the tool with forceTool (and still salvages a text reply)", async () => {
        providerCapture.calls.length = 0;
        const optOutAi = { model: "m", provider: "local", structuredOutputs: false } as unknown as AiSettings;
        const out = await generateCommands(stoneborn(), optOutAi);
        expect(out?.[0].name).toBe("Stoneborn");
        const call = providerCapture.calls[0];
        expect(Array.isArray(call.tools) && (call.tools as unknown[]).length).toBe(1);
        expect(call.opts.responseSchema).toBeUndefined();
        expect(call.opts.forceTool).toBe(true);
    });
});
