import { Choices } from "./core";
import { FeatureDetail } from "./features";
import { Spellcasting } from "./spellcasting";

export interface Subclass {
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
 
 