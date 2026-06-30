import { describe, it, expect, vi } from "vitest";
import type { AiSettings } from "../../../models/userSettings";
import type { HomebrewKind } from "../refs/homebrewKind";
import type { HomebrewPreview } from "../tools/toolDispatcher";
import type { SubAgentResult } from "../subAgent";
import type { StepModelRunner } from "./stepWorker";
import type { HomebrewPipelineHost } from "./orchestrator";
import type { PipelineRun } from "./types";

// buildPreview (via the creation step) imports homebrewManager, which boots IndexedDB — mock it so the
// orchestrator can be driven by a scripted runner with no DB/provider.
vi.mock("../../customHooks/homebrewManager", () => ({
    homebrewManager: {
        spells: () => [], items: () => [], magicItems: () => [], feats: () => [], backgrounds: () => [],
        races: () => [], classes: () => [], subclasses: () => [], findSubclass: () => undefined,
    },
}));

import { runHomebrewPipeline, supportsHomebrewPipeline } from "./homebrewPipeline";

/**
 * Mini-pipeline acceptance: a create_* kind at Generation depth ≥ Medium runs a concept step then a creation
 * step (the EXISTING create_* tool, gated by buildPreview), and hands back ONE savable preview. Every model
 * step is stubbed, so no provider/DB is involved. Covers the happy path, the gate-repair loop on an invalid
 * creation, and a clean abort.
 */

const AI = { provider: "local", model: "stub", localBaseUrl: "", enabled: true } as AiSettings;

const briefInput = {
    concept: "A mote of captured ember", tone: "warm, quick", power_tier: "on par with Fire Bolt",
    motifs: ["drifting ember", "scorched air"], themes: ["spark"], naming_style: "fire words",
    fits_concept: "A small dart of fire.",
};
const validSpell = {
    name: "Emberlet", description: "You hurl a mote of fire at a creature within range, dealing 1d6 fire damage on a hit.",
    level: 0, school: "Evocation", castingTime: "1 action", range: "60 feet", duration: "Instantaneous",
    concentration: false, ritual: false, isVerbal: true, isSomatic: true, isMaterial: false, fits_concept: "ember dart",
};
const invalidSpell = { name: "Emberlet", fits_concept: "no description → invalid" };   // missing description

/** A runner that replies to each forced step tool with the n-th scripted input for that tool. */
function scriptRunner(seq: Record<string, Record<string, unknown>[]>) {
    const counts: Record<string, number> = {};
    const runner: StepModelRunner = async (spec): Promise<SubAgentResult> => {
        const tool = spec.tools[0]?.name ?? "";
        const n = (counts[tool] = (counts[tool] ?? 0) + 1);
        const arr = seq[tool] ?? [{}];
        const input = arr[Math.min(n - 1, arr.length - 1)] ?? {};
        return { text: "", toolCalls: [{ id: tool, name: tool, input }], ok: true };
    };
    return { runner, counts };
}

function makeHost(runner: StepModelRunner, kind: HomebrewKind, extra: Partial<HomebrewPipelineHost> = {}) {
    const runs: PipelineRun[] = [];
    const completed: HomebrewPreview[] = [];
    const errors: string[] = [];
    const host: HomebrewPipelineHost = {
        ai: AI, dndSystem: "both", signal: new AbortController().signal, kind,
        usageLevel: "low", runner,
        onProgress: r => runs.push(r),
        onComplete: p => completed.push(...p),
        onError: m => errors.push(m),
        ...extra,
    };
    return { host, runs, completed, errors };
}

describe("runHomebrewPipeline", () => {
    it("runs concept → creation and hands back one valid preview", async () => {
        const { runner, counts } = scriptRunner({ concept_brief: [briefInput], create_spell: [validSpell] });
        const { host, runs, completed } = makeHost(runner, "spell");

        await runHomebrewPipeline("make a fire spell", host);

        expect(completed).toHaveLength(1);
        expect(completed[0].kind).toBe("spell");
        expect(completed[0].valid).toBe(true);
        expect((completed[0].entity as { name?: string }).name).toBe("Emberlet");
        expect(counts.concept_brief).toBe(1);
        expect(counts.create_spell).toBe(1);
        // The progress card is labelled as a homebrew run.
        expect(runs.every(r => r.pipelineType === "homebrew")).toBe(true);
    });

    it("repairs an invalid creation within the gate budget, then completes", async () => {
        const { runner, counts } = scriptRunner({ concept_brief: [briefInput], create_spell: [invalidSpell, validSpell] });
        const { host, completed, errors } = makeHost(runner, "spell");

        await runHomebrewPipeline("make a fire spell", host);

        expect(errors).toHaveLength(0);
        expect(completed).toHaveLength(1);
        expect(completed[0].valid).toBe(true);
        expect(counts.create_spell).toBe(2);   // first attempt failed its gate, second passed
    });

    it("does not complete when aborted before it starts", async () => {
        const aborted = new AbortController();
        aborted.abort();
        const { runner } = scriptRunner({ concept_brief: [briefInput], create_spell: [validSpell] });
        const { host, completed } = makeHost(runner, "spell", { signal: aborted.signal });

        await runHomebrewPipeline("make a fire spell", host);

        expect(completed).toHaveLength(0);
    });
});

describe("supportsHomebrewPipeline", () => {
    it("is true for the one-shot create_* kinds and false for class", () => {
        for (const kind of ["spell", "item", "magic_item", "feat", "background", "race", "subclass"] as HomebrewKind[]) {
            expect(supportsHomebrewPipeline(kind)).toBe(true);
        }
        expect(supportsHomebrewPipeline("class")).toBe(false);
    });
});
