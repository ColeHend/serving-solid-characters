import { describe, it, expect, vi } from "vitest";
import type { HomebrewPreview } from "../tools/toolDispatcher";
import type { HomebrewKind } from "../refs/homebrewKind";
import type { AiSettings } from "../../../models/userSettings";

// mechanicsStep → commandAgent pulls the SRD/homebrew catalogs + provider factory. Mock them so importing
// the module is side-effect-free; the pure orchestration under test takes an injected MechanicsRunner.
vi.mock("../../customHooks/homebrewManager", () => ({
    homebrewManager: { spells: () => [], items: () => [], magicItems: () => [], feats: () => [] },
}));
vi.mock("../../customHooks/dndInfo/info/all/spells", () => ({ useDnDSpells: () => () => [] }));
vi.mock("../../customHooks/dndInfo/info/all/items", () => ({ useDnDItems: () => () => [] }));
vi.mock("../../customHooks/dndInfo/info/all/feats", () => ({ useDnDFeats: () => () => [] }));
vi.mock("../../customHooks/dndInfo/useDndFeatures", () => ({ useDndFeature: () => ({ allFeatures: () => [] }) }));
vi.mock("../providers/providerFactory", () => ({ buildProvider: () => ({ streamChat: async function* () { /* none */ } }) }));

import { describeMechanics, runMechanicsReview, type MechanicsRunner } from "./mechanicsStep";
import { featuresOf } from "../commands/commandAgent";

const ai = { model: "test-model" } as unknown as AiSettings;

function preview(kind: HomebrewKind, entity: unknown): HomebrewPreview {
    return {
        previewId: "p1", toolCallId: "t1", kind, title: (entity as { name?: string }).name ?? "X",
        entity: entity as HomebrewPreview["entity"], valid: true, errors: [],
    };
}

const emberkin = () => preview("race", {
    name: "Emberkin",
    traits: [{ details: { id: "t1", name: "Ember Body", description: "You have resistance to fire damage." } }],
});

type RunnerVal = Record<string, unknown> | null | ((user: string) => Record<string, unknown> | null);

/** A runner that answers each forced tool by name; a function value can branch on the user message. */
function scriptedRunner(map: Partial<Record<string, RunnerVal>>): MechanicsRunner {
    return async (_system, user, tool) => {
        const v = map[tool.name];
        return (typeof v === "function" ? v(user) : v) ?? null;
    };
}

const madsOf = (entity: HomebrewPreview["entity"], name: string) =>
    featuresOf("race", entity).find(f => f.name === name)?.metadata?.mads ?? [];

describe("describeMechanics", () => {
    it("splits effects into self vs other and drops blanks", async () => {
        const runner = scriptedRunner({
            describe_mechanics: { features: [{ name: "Ember Body", effects: [
                { change: "resistance to fire", affects: "self" },
                { change: "deal 1d6 fire to the attacker", affects: "other" },
                { change: "   ", affects: "self" },
            ] }] },
        });
        expect(await describeMechanics(emberkin(), ai, undefined, runner)).toEqual([
            { name: "Ember Body", selfEffects: ["resistance to fire"], otherEffects: ["deal 1d6 fire to the attacker"] },
        ]);
    });

    it("returns null when the model gives nothing usable", async () => {
        expect(await describeMechanics(emberkin(), ai, undefined, scriptedRunner({ describe_mechanics: null }))).toBeNull();
    });
});

describe("runMechanicsReview", () => {
    it("describes, encodes the self-effect into a command, and audits clean", async () => {
        const runner = scriptedRunner({
            describe_mechanics: { features: [{ name: "Ember Body", effects: [{ change: "resistance to fire damage", affects: "self" }] }] },
            attach_commands: { features: [{ name: "Ember Body", commands: [{ type: "Add", category: "Resistances", value: { damageType: "fire" } }] }] },
            report_missing_mechanics: { missing: [] },
        });
        const entity = await runMechanicsReview(emberkin(), ai, undefined, undefined, { runner });
        expect(entity).not.toBeNull();
        expect(madsOf(entity!, "Ember Body").map(m => m.command)).toEqual(["AddResistances"]);
    });

    it("encodes a gap the adversarial audit finds (fix pass)", async () => {
        const runner = scriptedRunner({
            describe_mechanics: { features: [{ name: "Ember Body", effects: [
                { change: "resistance to fire damage", affects: "self" },
                { change: "proficiency in Athletics", affects: "self" },
            ] }] },
            // The first encode only produces the resistance (model misses the proficiency); the audit catches
            // it; only the fix-pass message carries the "(category: …)" hint, so branch on that.
            attach_commands: (user) => user.includes("(category:")
                ? { features: [{ name: "Ember Body", commands: [{ type: "Add", category: "Proficiencies", value: { proficiency: "Athletics" } }] }] }
                : { features: [{ name: "Ember Body", commands: [{ type: "Add", category: "Resistances", value: { damageType: "fire" } }] }] },
            report_missing_mechanics: { missing: [{ feature: "Ember Body", effect: "proficiency in Athletics", category: "Proficiencies" }] },
        });
        const entity = await runMechanicsReview(emberkin(), ai, undefined, undefined, { runner });
        expect(madsOf(entity!, "Ember Body").map(m => m.command).sort()).toEqual(["AddProficiencies", "AddResistances"]);
    });

    it("de-dupes a command the entity already carried (re-encoding can't double-attach)", async () => {
        const seeded = preview("race", {
            name: "Emberkin",
            traits: [{ details: { id: "t1", name: "Ember Body", description: "You have resistance to fire damage.",
                metadata: { mads: [{ command: "AddResistances", value: { damageType: "Fire" }, type: 0, prerequisites: [], group: 0 }] } } }],
        });
        const runner = scriptedRunner({
            describe_mechanics: { features: [{ name: "Ember Body", effects: [{ change: "resistance to fire damage", affects: "self" }] }] },
            attach_commands: { features: [{ name: "Ember Body", commands: [{ type: "Add", category: "Resistances", value: { damageType: "fire" } }] }] },
            report_missing_mechanics: { missing: [] },
        });
        const entity = await runMechanicsReview(seeded, ai, undefined, undefined, { runner });
        expect(madsOf(entity!, "Ember Body")).toHaveLength(1);
    });

    it("reports each stage through the onNote callback", async () => {
        const notes: string[] = [];
        const runner = scriptedRunner({
            describe_mechanics: { features: [{ name: "Ember Body", effects: [{ change: "resistance to fire", affects: "self" }] }] },
            attach_commands: { features: [{ name: "Ember Body", commands: [{ type: "Add", category: "Resistances", value: { damageType: "fire" } }] }] },
            report_missing_mechanics: { missing: [{ feature: "Ember Body", effect: "resistance to cold", category: "Resistances" }] },
        });
        await runMechanicsReview(emberkin(), ai, undefined, n => notes.push(n), { runner });
        expect(notes).toEqual(["Describing effects…", "Attaching mechanics…", "Auditing mechanics…", "Fixing mechanics…"]);
    });
});
