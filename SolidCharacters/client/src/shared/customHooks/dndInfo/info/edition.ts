/**
 * Edition (2014 / 2024 / Both) ⇄ `legacy` mapping and the homebrew edition filter.
 *
 * Homebrew entities declare their edition on the wizard Identity step; that choice is stored
 * in the existing `legacy?: boolean` field (2014 → true, 2024 → false, Both → undefined/neutral).
 *
 * Lives in its own leaf beside provenance.ts so BOTH the `all/*` aggregators and the wizard
 * components can import it without a customHooks → components cycle. Only depends on userSettings.
 */
import { getUserSettings } from "../../userSettings";

export type EditionKey = '2014' | '2024' | 'both';

/** 2014 → true, 2024 → false, Both → undefined (neutral / edition-agnostic). */
export const editionToLegacy = (k: EditionKey): boolean | undefined =>
  k === '2014' ? true : k === '2024' ? false : undefined;

export const legacyToEdition = (legacy: boolean | undefined): EditionKey =>
  legacy === true ? '2014' : legacy === false ? '2024' : 'both';

/**
 * New-entity default from the global dndSystem setting: '' / 'both' → Both (neutral),
 * '2014' → 2014, '2024' → 2024. Intentionally distinct from the aggregators' SRD-list
 * fallback (`|| '2014'`) — an unset preference should leave homebrew edition-agnostic.
 */
export const editionKeyFromSetting = (dndSystem: string | undefined): EditionKey =>
  dndSystem === '2014' ? '2014' : dndSystem === '2024' ? '2024' : 'both';

export const defaultEditionKey = (): EditionKey =>
  editionKeyFromSetting(getUserSettings()[0]().dndSystem);

/**
 * Aggregator-side homebrew edition filter. A neutral (undefined) row is kept in every
 * edition; a tagged row only appears in its edition. `version === 'both'` (or any
 * unexpected value) passes everything through so the merged both-mode list stays complete.
 */
export const homebrewForEdition = <T extends { legacy?: boolean }>(
  rows: readonly T[], version: string,
): T[] =>
  version === '2014' ? rows.filter(r => r.legacy !== false)
  : version === '2024' ? rows.filter(r => r.legacy !== true)
  : [...rows];
