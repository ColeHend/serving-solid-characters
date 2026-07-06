import type { MadMap } from "../spec.ts";

/**
 * Curated MADS commands for SRD 5.1 (2014) background features.
 *
 * The 5.1 SRD contains exactly ONE sample background — Acolyte — and its only feature,
 * "Acolyte/Shelter of the Faithful", is purely social/narrative (free healing and care at temples
 * of your faith, modest-lifestyle support from co-religionists). It grants NO mechanical bonus that
 * any command category can express, so no commands are emitted.
 *
 * Background skill/tool proficiencies and languages are handled by the background parser's structured
 * fields, not by feature commands — so this map is intentionally empty.
 */
export const map: MadMap = {};
