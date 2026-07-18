import { Choices } from "./core";
import { FeatureDetail } from "./features";
import { Spellcasting } from "./spellcasting";
import { entitySelectorKey } from "../../shared/customHooks/utility/tools/entityKey";

export interface Subclass {
  /** Stable identity (entitySelectorKey); minted by homebrewManager at save for rows that
   *  lack one. Absent only on legacy homebrew rows persisted before subclass ids existed. */
  id?: string;
  name: string;
  /** Provenance label, e.g. "SRD 5.1", "SRD 5.2", or a user-supplied sourcebook; undefined means plain homebrew. */
  source?: string;
  parentClass: string;
  /** The parent class's id — the canonical match key (parentClass stays the display name).
   *  Absent on pre-migration homebrew rows; matchers fall back to the name. */
  parentClassId?: string;
  description: string;
  features: Record<number, FeatureDetail[]>;
  choices?: Choices;
  spellcasting?: Spellcasting;
  /**
   * Internal persistence key combining parent class + name (lowercased) to guarantee uniqueness.
   * Added in DB schema v2. Not part of exported payloads.
   */
  storage_key?: string;
 }

/**
 * Canonical persistence key for the subclasses store (its Dexie primary key since schema
 * v13): parent class + name, lowercased — same-named subclasses under different parents
 * must not collide.
 */
export const subclassStorageKey = (parentClass: string, name: string): string =>
  `${(parentClass ?? '').toLowerCase()}__${(name ?? '').toLowerCase()}`;

/**
 * Whether a subclass belongs to a class: by id when both sides carry one (exact — this is
 * what distinguishes the 2014 and 2024 editions of a same-named class), falling back to a
 * case-insensitive name match (pre-migration homebrew subclasses and id-less homebrew classes).
 */
export function subclassBelongsTo(
  sub: { parentClassId?: string; parentClass?: string },
  cls: { id?: string; name?: string } | undefined,
): boolean {
  if (!cls) return false;
  if (sub.parentClassId && cls.id) return sub.parentClassId === cls.id;
  return (sub.parentClass ?? '').toLowerCase() === (cls.name ?? '').toLowerCase();
}

/**
 * The subclasses eligible for a class card/draft entry: belongs-to when the class resolved,
 * else a parent-name match so an unresolved class (stale key, still-loading homebrew) doesn't
 * silently orphan its subclass.
 */
export function subclassCandidates<T extends { parentClass?: string; parentClassId?: string }>(
  subclasses: T[],
  cls: { id?: string; name?: string } | undefined,
  className: string,
): T[] {
  return subclasses.filter(sub => cls
    ? subclassBelongsTo(sub, cls)
    : (sub.parentClass ?? '').toLowerCase() === className.toLowerCase());
}

/**
 * Resolve a draft's chosen subclass among candidates: selector-key match first, then a
 * case-insensitive name fallback — a stale `hb:<name>` key must keep resolving after the
 * subclass is minted a real id (or renamed while the name field still matches).
 */
export function resolveSubclassSelection<T extends { id?: string; name?: string }>(
  candidates: T[],
  selection: { subclass?: string; subclassId?: string },
): T | undefined {
  if (selection.subclassId) {
    const byKey = candidates.find(sub =>
      entitySelectorKey({ id: sub.id, name: sub.name ?? '' }) === selection.subclassId);
    if (byKey) return byKey;
  }
  const wanted = (selection.subclass ?? '').toLowerCase();
  return wanted ? candidates.find(sub => sub.name?.toLowerCase() === wanted) : undefined;
}
 
 