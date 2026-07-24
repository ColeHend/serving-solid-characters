import type { FormGroup } from 'coles-solid-library';
import { AbilityScores, Feat, FeatureDetail, Race } from '../../../../../models/generated';
import { ABILITY_SHORT, SIZE_TOKENS } from '../../../../../shared/constants/homebrew';
import { createNewId } from '../../../../../shared/customHooks/utility/tools/idGen';
import type { RaceExtras, RaceForm, RaceStatBonus } from './wizard/wizard.shared';

// Model mapping between the race wizard's form state and the persisted Race —
// the races analogue of classAdapter.ts. Pure functions only (no JSX, no Solid).

/** Normalize a stored stat (numeric index, "2", or legacy "STR" code) to the AbilityScores index. */
export function toStatIndex(stat: unknown): number {
  if (typeof stat === 'number') return stat;
  const asCode = (ABILITY_SHORT as readonly string[]).indexOf(String(stat));
  if (asCode >= 0) return asCode;
  const n = Number(stat);
  return Number.isInteger(n) ? n : 0;
}

/**
 * Robust size extraction (ported from the old racesStore): keeps canonical size
 * tokens plus short custom sizes, drops descriptive text accidentally saved into
 * the size field.
 */
export function parseSizes(raw: string | undefined): string[] {
  if (!raw) return [];
  const replaced = raw.replace(/\bor\b/gi, ',').replace(/\//g, ',');
  const parts = replaced.split(',').map(p => p.trim());
  const found: string[] = [];
  for (const part of parts) {
    if (!part) continue;
    const firstWord = (part.match(/^[A-Za-z]+/) || [''])[0];
    const canonical = (SIZE_TOKENS as readonly string[]).find(sz => sz.toLowerCase() === firstWord.toLowerCase());
    const value = canonical ?? (part.length <= 30 && !/[.()]/.test(part) ? part : undefined);
    if (value && !found.includes(value)) found.push(value);
  }
  return found;
}

/**
 * Resilient description lookup (ported from the old racesStore): tries the
 * descriptions map first (exact then case-insensitive keys), then legacy
 * top-level string fields on the entity itself.
 */
export function pickDescription(race: Race, ...candidates: string[]): string {
  const descs = race.descriptions || {};
  const bag = race as unknown as Record<string, unknown>;
  for (const c of candidates) {
    if (typeof descs[c] === 'string') return descs[c];
    const foundKey = Object.keys(descs).find(k => k.toLowerCase() === c.toLowerCase());
    if (foundKey && typeof descs[foundKey] === 'string') return descs[foundKey];
    if (typeof bag[c] === 'string') return bag[c] as string;
    const topFound = Object.keys(bag).find(k => k.toLowerCase() === c.toLowerCase());
    if (topFound && typeof bag[topFound] === 'string') return bag[topFound] as string;
  }
  return '';
}

/**
 * Alternate description keys the wizard's prefill reads (the pickDescription
 * candidate lists minus the canonical keys toRace emits). Publishing rewrites
 * their content under the canonical keys, so the stale sources must be dropped
 * from an update merge — otherwise a cleared field resurrects on reopen and
 * raceView prints the same paragraph twice (once per key).
 */
const REPLACED_DESCRIPTION_KEYS = [
  'ages', 'align',
  'physical', 'sizedescription', 'sizedesc',
  'languages', 'languagedesc', 'lang',
  'ability', 'abilitydescription', 'abilitiesdesc',
];

/**
 * Merge an existing row's descriptions with the wizard's canonical output:
 * unknown keys survive (the wizard has no UI for them), but the alternate
 * spellings of wizard-managed fields are replaced by their canonical keys.
 */
export function mergeDescriptions(
  existing: Record<string, string> | undefined,
  built: Record<string, string> | undefined,
): Record<string, string> {
  const kept = Object.fromEntries(
    Object.entries(existing ?? {}).filter(([key]) => !REPLACED_DESCRIPTION_KEYS.includes(key.toLowerCase())),
  );
  return { ...kept, ...(built ?? {}) };
}

/**
 * Persisted traits → editable FeatureDetails for the wizard store. Feat.details
 * IS a FeatureDetail (incl. metadata.mads/uses/spells), so unwrapping loses
 * nothing; ids are stamped so FeatureRow/FeaturesPopup edits have stable identity.
 */
export const hydrateTraits = (traits?: Feat[]): FeatureDetail[] =>
  (traits ?? []).map(t => ({ ...t.details, id: t.details?.id || t.id || createNewId() }));

/** Persisted ability bonuses → the wizard's plain rows. */
export const hydrateBonuses = (bonuses?: Race['abilityBonuses']): RaceStatBonus[] =>
  (bonuses ?? []).map(b => ({ stat: toStatIndex(b.stat), value: b.value }));

/**
 * Assemble the persisted Race from the wizard state. Emits ONLY editor-managed
 * keys — fields the wizard has no UI for (abilityBonusChoice, traitChoice,
 * the undeclared subRaces extension) are deliberately NOT emitted, so callers
 * updating an existing entity must spread over it ({...existing, ...built}) for
 * those to survive. (legacy IS emitted now — the Identity step's edition picker.)
 */
export function toRace(fg: FormGroup<RaceForm>, extras: RaceExtras, existingId?: string): Race {
  return {
    id: existingId || createNewId(),
    name: ((fg.get('name') as string) || '').trim(),
    // Always emitted (undefined when blank/Both) so clearing the field survives the
    // {...existing, ...built} update spread instead of resurrecting the old value.
    source: ((fg.get('source') as string) || '').trim() || undefined,
    legacy: fg.get('legacy') as boolean | undefined,
    size: ((fg.get('size') as string[]) ?? []).join(', '),
    speed: (fg.get('speed') as number) || 0,
    languages: [...((fg.get('languages') as string[]) ?? [])],
    languageChoice: ((fg.get('langChoiceAmount') as number) || 0) > 0
      ? {
        amount: fg.get('langChoiceAmount') as number,
        options: [...((fg.get('langChoiceOptions') as string[]) ?? [])],
      }
      : undefined,
    abilityBonuses: ((fg.get('abilityBonuses') as RaceStatBonus[]) ?? [])
      .filter(b => b.value !== 0)
      .map(b => ({ stat: b.stat as AbilityScores, value: b.value })),
    traits: extras.traits.map((fd): Feat => ({
      id: fd.id || createNewId(),
      details: fd,
      prerequisites: [],
    })),
    descriptions: {
      age: (fg.get('descAge') as string) || '',
      alignment: (fg.get('descAlignment') as string) || '',
      size: (fg.get('descSize') as string) || '',
      language: (fg.get('descLanguage') as string) || '',
      abilities: (fg.get('descAbilities') as string) || '',
    },
  };
}
