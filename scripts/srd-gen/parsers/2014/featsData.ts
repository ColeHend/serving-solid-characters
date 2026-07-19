import type { FeatJson } from "../../types.ts";

/**
 * Curated 2014 feats injected alongside the parsed SRD 5.1 markdown (which contains only
 * Grappler) — same precedent as the curated rules set in rulesData.ts. Shape matches what
 * parseFeats2014 emits: empty ids (idStore mints stable uuid5s), no legacy/source (the
 * central stamp passes own those), no mads here (they attach by name via mads/2014/feats.ts).
 */
export const CURATED_FEATS_2014: FeatJson[] = [
    {
        id: "",
        details: {
            id: "",
            name: "Ability Score Improvement",
            description:
                "Increase two different ability scores of your choice by 1 each. " +
                "As normal, you can't increase an ability score above 20 using this feat.",
        },
        prerequisites: [{ type: 1, value: "4" }], // PrerequisiteType.Level = 1 (mirrors the 2024 feat's level-4 gate)
    } as unknown as FeatJson,
];
