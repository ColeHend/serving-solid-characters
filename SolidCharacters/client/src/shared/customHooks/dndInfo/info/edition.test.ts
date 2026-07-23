import { describe, it, expect } from 'vitest';
import {
  editionToLegacy,
  legacyToEdition,
  editionKeyFromSetting,
  homebrewForEdition,
} from './edition';

describe('edition mapping', () => {
  it('editionToLegacy: 2014→true, 2024→false, both→undefined', () => {
    expect(editionToLegacy('2014')).toBe(true);
    expect(editionToLegacy('2024')).toBe(false);
    expect(editionToLegacy('both')).toBeUndefined();
  });

  it('legacyToEdition: true→2014, false→2024, undefined→both', () => {
    expect(legacyToEdition(true)).toBe('2014');
    expect(legacyToEdition(false)).toBe('2024');
    expect(legacyToEdition(undefined)).toBe('both');
  });

  it('round-trips every key through legacy and back', () => {
    (['2014', '2024', 'both'] as const).forEach(k => {
      expect(legacyToEdition(editionToLegacy(k))).toBe(k);
    });
  });

  it('editionKeyFromSetting: unset/both → both, else the matching year', () => {
    expect(editionKeyFromSetting('')).toBe('both');
    expect(editionKeyFromSetting('both')).toBe('both');
    expect(editionKeyFromSetting(undefined)).toBe('both');
    expect(editionKeyFromSetting('2014')).toBe('2014');
    expect(editionKeyFromSetting('2024')).toBe('2024');
  });
});

describe('homebrewForEdition', () => {
  const rows = [
    { name: 'Legacy Class', legacy: true },
    { name: 'New Class', legacy: false },
    { name: 'Neutral Class' }, // legacy undefined
  ];
  const names = (r: { name: string }[]) => r.map(x => x.name);

  it('2014: keeps 2014-tagged and neutral, drops 2024-tagged', () => {
    expect(names(homebrewForEdition(rows, '2014'))).toEqual(['Legacy Class', 'Neutral Class']);
  });

  it('2024: keeps 2024-tagged and neutral, drops 2014-tagged', () => {
    expect(names(homebrewForEdition(rows, '2024'))).toEqual(['New Class', 'Neutral Class']);
  });

  it('both: returns every row exactly once', () => {
    expect(names(homebrewForEdition(rows, 'both'))).toEqual(['Legacy Class', 'New Class', 'Neutral Class']);
  });

  it('a neutral (undefined) row is kept in every edition', () => {
    const neutral = [{ name: 'X' }];
    expect(homebrewForEdition(neutral, '2014')).toHaveLength(1);
    expect(homebrewForEdition(neutral, '2024')).toHaveLength(1);
    expect(homebrewForEdition(neutral, 'both')).toHaveLength(1);
  });

  it('unknown version falls through (pass-through, no filtering)', () => {
    expect(names(homebrewForEdition(rows, '' as string))).toEqual(names(rows));
  });
});
