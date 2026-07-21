import type { MadMap } from "../spec.ts";

/**
 * Curated MADS commands for SRD 5.1 (2014) feats. Keys are the feat name (feats attach to the
 * feat's `details`, so the key has no "owner/" prefix).
 *
 * The 5.1 SRD markdown contains exactly one feat (Grappler); Ability Score Improvement is a
 * curated injection (parsers/2014/featsData.ts).
 */
export const map: MadMap = {
    // Grappler — "You have advantage on attack rolls against a creature you are grappling."
    // The second benefit (action to pin a grappled creature) is a situational action → no category, skipped.
    "Grappler": [
        { type: "Add", category: "Advantage", value: { rollType: "WeaponAttack", mode: "advantage", condition: "against a creature you are grappling" } },
    ],
    // Ability Score Improvement — two +1 picks of the player's choice; the same ability may be
    // picked twice for a +2 (count picks, repeats allowed).
    "Ability Score Improvement": [
        { type: "Add", category: "Stats", value: { stat: "choice", options: "str,dex,con,int,wis,cha", statValue: "1", count: "2" } },
    ],
};
