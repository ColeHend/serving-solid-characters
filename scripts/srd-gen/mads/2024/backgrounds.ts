import type { MadMap } from "../spec.ts";

/**
 * Curated MADS commands for SRD 5.2 (2024) backgrounds.
 *
 * INTENTIONALLY EMPTY. A 2024 background grants everything through STRUCTURED fields — an Origin feat,
 * three ability-score increases, two skill proficiencies, a tool proficiency, and starting equipment
 * (see 04_CharacterOrigins.md "Parts of a Background"). It has no free-text "background feature" the way
 * 5.1 did (Acolyte's "Shelter of the Faithful", etc.), so the parser emits NO feature objects for these
 * backgrounds (features: []) and there is nothing for a command to attach to. The mechanical effects are
 * carried by the feat map (the granted Origin feat) and the character-builder's ability/skill fields.
 */
export const map: MadMap = {};
