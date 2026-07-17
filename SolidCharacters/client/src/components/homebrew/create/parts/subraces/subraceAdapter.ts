import type { FormGroup } from 'coles-solid-library';
import { Subrace } from '../../../../../models/generated';
import { toRace } from '../races/raceAdapter';
import type { RaceForm } from '../races/wizard/wizard.shared';
import type { RaceExtras, SubraceForm } from './wizard/wizard.shared';

// Model mapping between the subrace wizard's form state and the persisted
// Subrace — reuses the race adapter for every shared field (SubraceForm is a
// strict superset of RaceForm, so the read-only projection below is safe).

export { hydrateBonuses, hydrateTraits, mergeDescriptions, parseSizes, pickDescription, toStatIndex } from '../races/raceAdapter';

/**
 * Assemble the persisted Subrace from the wizard state. Emits ONLY editor-managed
 * keys (see toRace) — callers updating an existing row must spread over it
 * ({...existing, ...built}) so untouched fields survive.
 */
export function toSubrace(
  fg: FormGroup<SubraceForm>,
  extras: RaceExtras,
  /** The parent race's id — what the flat subraces table links rows by. */
  parentRaceId: string,
  existingId?: string,
): Subrace {
  const base = toRace(fg as unknown as FormGroup<RaceForm>, extras, existingId);
  return {
    ...base,
    parentRace: parentRaceId,
    descriptions: {
      ...base.descriptions,
      desc: (fg.get('desc') as string) || '',
    },
  };
}
