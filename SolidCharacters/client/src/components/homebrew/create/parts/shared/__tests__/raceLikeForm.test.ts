import { describe, it, expect } from 'vitest';
import { createRaceLikeForm, decodeStat, encodeStat, makeAbilityRow, makeTraitRow } from '../raceLikeForm.shared';

describe('ability stat codec', () => {
  it('encodes short codes to their AbilityScores index', () => {
    expect(encodeStat('STR')).toBe(0);
    expect(encodeStat('CHA')).toBe(5);
  });
  it('decodes numeric indices, numeric strings, and short codes', () => {
    expect(decodeStat(1)).toBe('DEX');
    expect(decodeStat('2')).toBe('CON');
    expect(decodeStat('WIS')).toBe('WIS');
  });
  it('falls back to the raw value when out of range', () => {
    expect(decodeStat(42)).toBe('42');
    expect(decodeStat('Sneakiness')).toBe('Sneakiness');
  });
});

describe('createRaceLikeForm', () => {
  it('fill -> formToDraft round-trips a draft', () => {
    const api = createRaceLikeForm({ kind: 'race' });
    const draft = {
      name: 'TestFolk',
      speed: 35,
      sizes: ['Medium', 'Small'],
      abilityBonuses: [{ name: 'STR', value: 2 }, { name: 'WIS', value: 1 }],
      languages: { fixed: ['Common'], amount: 1, options: ['Elvish', 'Dwarvish'], desc: 'lang desc' },
      traits: [{ name: 'Darkvision', value: ['Line one', 'Line two'] }],
      text: { age: 'ages', alignment: 'align', sizeDesc: 'sized', abilitiesDesc: 'abil', desc: '' },
    };
    api.fill(draft);
    const out = api.formToDraft();
    expect(out.name).toBe('TestFolk');
    expect(out.speed).toBe(35);
    expect(out.sizes).toEqual(['Medium', 'Small']);
    expect(out.abilityBonuses).toEqual(draft.abilityBonuses);
    expect(out.languages).toEqual(draft.languages);
    expect(out.traits).toEqual([{ name: 'Darkvision', value: ['Line one', 'Line two'] }]);
    expect(out.text.age).toBe('ages');
    expect(out.text.abilitiesDesc).toBe('abil');
  });

  it('re-fill replaces array rows instead of appending', () => {
    const api = createRaceLikeForm({ kind: 'race' });
    api.fill({ abilityBonuses: [{ name: 'STR', value: 2 }], traits: [{ name: 'A', value: [] }, { name: 'B', value: [] }] });
    api.fill({ abilityBonuses: [{ name: 'DEX', value: 1 }], traits: [] });
    expect(api.abilityBonuses.get()).toEqual([{ name: 'DEX', value: 1 }]);
    expect(api.traits.length).toBe(0);
  });

  it('buildRace serializes with real stat indices (not NaN)', () => {
    const api = createRaceLikeForm({ kind: 'race' });
    api.fill({
      name: 'TestFolk',
      speed: 30,
      sizes: ['Medium'],
      abilityBonuses: [{ name: 'CON', value: 2 }],
      languages: { fixed: ['Common'], amount: 2, options: ['Elvish', 'Orc'], desc: 'ld' },
      traits: [{ name: 'Tough', value: ['HP +1 per level'] }],
      text: { age: 'a', alignment: 'al', sizeDesc: 's', abilitiesDesc: 'ab', desc: '' },
    });
    const race = api.buildRace('fixed-id');
    expect(race.id).toBe('fixed-id');
    expect(race.size).toBe('Medium');
    expect(race.abilityBonuses[0].stat).toBe(2);
    expect(Number.isNaN(race.abilityBonuses[0].stat)).toBe(false);
    expect(race.languageChoice).toEqual({ amount: 2, options: ['Elvish', 'Orc'] });
    expect(race.traits[0].details).toMatchObject({ name: 'Tough', description: 'HP +1 per level' });
    expect(race.descriptions).toMatchObject({ age: 'a', alignment: 'al', size: 's', language: 'ld', abilities: 'ab' });
  });

  it('buildRace omits languageChoice when amount is 0', () => {
    const api = createRaceLikeForm({ kind: 'race' });
    api.fill({ name: 'X', sizes: ['Small'], languages: { fixed: [], amount: 0, options: [], desc: '' } });
    expect(api.buildRace().languageChoice).toBeUndefined();
  });

  it('kind-specific validators: race requires sizes, subrace does not', () => {
    const race = createRaceLikeForm({ kind: 'race' });
    race.form.set('name', 'R');
    expect(race.form.validate()).toBe(false); // sizes empty
    race.form.set('sizes', ['Medium']);
    expect(race.form.validate()).toBe(true);

    const sub = createRaceLikeForm({ kind: 'subrace' });
    sub.form.set('name', 'S');
    expect(sub.form.validate()).toBe(true); // no sizes requirement
  });

  it('row factories validate row names', () => {
    const row = makeAbilityRow();
    expect(row.validate()).toBe(false);
    row.set('name', 'STR');
    expect(row.validate()).toBe(true);
    const trait = makeTraitRow('Keen Senses', 'body');
    expect(trait.validate()).toBe(true);
  });
});
