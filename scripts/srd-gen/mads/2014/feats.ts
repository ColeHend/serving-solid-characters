import type { MadMap } from "../spec.ts";

/**
 * Curated MADS commands for SRD 5.1 (2014) feats. Keys are the feat name (feats attach to the
 * feat's `details`, so the key has no "owner/" prefix).
 *
 * The 5.1 SRD contains exactly one feat: Grappler.
 */
export const map: MadMap = {
    // Grappler — "You have advantage on attack rolls against a creature you are grappling."
    // The second benefit (action to pin a grappled creature) is a situational action → no category, skipped.
    "Grappler": [
        { type: "Add", category: "Advantage", value: { rollType: "WeaponAttack", mode: "advantage", condition: "against a creature you are grappling" } },
    ],
};
