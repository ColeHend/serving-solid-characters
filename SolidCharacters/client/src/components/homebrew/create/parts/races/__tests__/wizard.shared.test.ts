import { describe, it, expect } from 'vitest';
import { FormGroup } from 'coles-solid-library';
import {
  RaceForm,
  RaceWizardStep,
  bonusLabel,
  buildReviewRows,
  emptyExtras,
  parseDraft,
  raceDraftKey,
  serializeDraft,
  stepStatus,
} from '../wizard/wizard.shared';
import { hydrateBonuses, hydrateTraits, mergeDescriptions, parseSizes, pickDescription, toRace, toStatIndex } from '../raceAdapter';
import type { Feat, FeatureDetail, Race } from '../../../../../../models/generated';

const makeForm = (overrides: Partial<RaceForm> = {}) => {
  const fg = new FormGroup<RaceForm>({
    name: ['', []],
    size: [[], []],
    speed: [30, []],
    languages: [[], []],
    langChoiceAmount: [0, []],
    langChoiceOptions: [[], []],
    abilityBonuses: [[], []],
    descAge: ['', []],
    descAlignment: ['', []],
    descSize: ['', []],
    descLanguage: ['', []],
    descAbilities: ['', []],
  });
  Object.entries(overrides).forEach(([key, value]) => fg.set(key as keyof RaceForm, value as never));
  return fg;
};

describe('stepStatus', () => {
  it('Identity requires name, a size and a positive speed', () => {
    const extras = emptyExtras();
    expect(stepStatus(RaceWizardStep.Identity, makeForm(), extras)).toBe('incomplete');
    expect(stepStatus(RaceWizardStep.Identity, makeForm({ name: 'Elf' }), extras)).toBe('incomplete');
    expect(stepStatus(RaceWizardStep.Identity, makeForm({ name: 'Elf', size: ['Medium'] }), extras)).toBe('complete');
    expect(stepStatus(RaceWizardStep.Identity, makeForm({ name: 'Elf', size: ['Medium'], speed: 0 }), extras)).toBe('incomplete');
  });

  it('Ability bonuses are lenient — complete only on a non-zero bonus', () => {
    const extras = emptyExtras();
    expect(stepStatus(RaceWizardStep.AbilityBonuses, makeForm(), extras)).toBe('incomplete');
    expect(stepStatus(RaceWizardStep.AbilityBonuses, makeForm({ abilityBonuses: [{ stat: 1, value: 0 }] }), extras)).toBe('incomplete');
    expect(stepStatus(RaceWizardStep.AbilityBonuses, makeForm({ abilityBonuses: [{ stat: 1, value: 2 }] }), extras)).toBe('complete');
  });

  it('Languages complete on a fixed language or a player choice', () => {
    const extras = emptyExtras();
    expect(stepStatus(RaceWizardStep.Languages, makeForm(), extras)).toBe('incomplete');
    expect(stepStatus(RaceWizardStep.Languages, makeForm({ languages: ['Common'] }), extras)).toBe('complete');
    expect(stepStatus(RaceWizardStep.Languages, makeForm({ langChoiceAmount: 1 }), extras)).toBe('complete');
  });

  it('Traits complete once any trait exists', () => {
    const fg = makeForm();
    expect(stepStatus(RaceWizardStep.Traits, fg, emptyExtras())).toBe('incomplete');
    expect(stepStatus(RaceWizardStep.Traits, fg, { traits: [{ id: 't', name: 'Darkvision', description: 'd' }] })).toBe('complete');
  });

  it('Flavor completes on any description field', () => {
    const extras = emptyExtras();
    expect(stepStatus(RaceWizardStep.Flavor, makeForm(), extras)).toBe('incomplete');
    expect(stepStatus(RaceWizardStep.Flavor, makeForm({ descAge: 'Long-lived' }), extras)).toBe('complete');
  });
});

describe('buildReviewRows', () => {
  it('summarizes each step with the identity line first', () => {
    const fg = makeForm({ name: 'Elf', size: ['Medium'], speed: 30, abilityBonuses: [{ stat: 1, value: 2 }] });
    const rows = buildReviewRows(fg, { traits: [{ id: 't', name: 'Darkvision', description: 'd' }] });
    expect(rows).toHaveLength(5);
    expect(rows[0].summary).toContain('Elf');
    expect(rows[0].summary).toContain('Medium');
    expect(rows[0].summary).toContain('30 ft');
    expect(rows[1].summary).toBe('DEX +2');
    expect(rows[3].summary).toBe('Darkvision');
  });
});

describe('stat + size codecs', () => {
  it('toStatIndex accepts numeric indices, numeric strings and legacy short codes', () => {
    expect(toStatIndex(3)).toBe(3);
    expect(toStatIndex('3')).toBe(3);
    expect(toStatIndex('STR')).toBe(0);
    expect(toStatIndex('CHA')).toBe(5);
  });

  it('bonusLabel renders signed short codes', () => {
    expect(bonusLabel({ stat: 0, value: 2 })).toBe('STR +2');
    expect(bonusLabel({ stat: 4, value: -1 })).toBe('WIS -1');
  });

  it('parseSizes splits separators, keeps custom sizes and drops descriptive text', () => {
    expect(parseSizes('Medium')).toEqual(['Medium']);
    expect(parseSizes('Small or Medium')).toEqual(['Small', 'Medium']);
    expect(parseSizes('Medium/Small')).toEqual(['Medium', 'Small']);
    expect(parseSizes('Wee')).toEqual(['Wee']);
    expect(parseSizes('Elves range from under 5 feet. (Slender)')).toEqual([]);
  });
});

describe('toRace / hydration round trip', () => {
  const mad = { command: 'AddSenses', value: { Darkvision: '60' } };
  const trait = (): FeatureDetail => ({
    id: 'fd-1',
    name: 'Darkvision',
    description: 'See in dim light.',
    metadata: { uses: 1, recharge: 'Long Rest', category: 'Race trait', mads: [mad] },
  } as unknown as FeatureDetail);

  it('assembles the persisted race from the form + extras', () => {
    const fg = makeForm({
      name: '  Elf ',
      size: ['Medium', 'Wee'],
      speed: 35,
      languages: ['Common', 'Elvish'],
      langChoiceAmount: 1,
      langChoiceOptions: ['Sylvan'],
      abilityBonuses: [{ stat: 1, value: 2 }, { stat: 0, value: 0 }],
      descAge: 'Long-lived',
    });
    const race = toRace(fg, { traits: [trait()] });
    expect(race.name).toBe('Elf');
    expect(race.size).toBe('Medium, Wee');
    expect(race.speed).toBe(35);
    expect(race.languages).toEqual(['Common', 'Elvish']);
    expect(race.languageChoice).toEqual({ amount: 1, options: ['Sylvan'] });
    expect(race.abilityBonuses).toEqual([{ stat: 1, value: 2 }]); // zero-value rows dropped
    expect(race.traits).toHaveLength(1);
    expect(race.traits[0].details).toEqual(trait()); // full FeatureDetail incl. metadata.mads
    expect(race.traits[0].prerequisites).toEqual([]);
    expect(race.descriptions).toMatchObject({ age: 'Long-lived' });
    expect(race.id).toBeTruthy();
  });

  it('omits languageChoice when the choice amount is 0 and keeps an existing id', () => {
    const fg = makeForm({ name: 'Elf', langChoiceOptions: ['Sylvan'] });
    const race = toRace(fg, emptyExtras(), 'race-1');
    expect(race.languageChoice).toBeUndefined();
    expect(race.id).toBe('race-1');
  });

  it('never emits fields the wizard has no UI for, so the update spread preserves them', () => {
    const existing = {
      ...toRace(makeForm({ name: 'Elf' }), emptyExtras(), 'race-1'),
      legacy: true,
      abilityBonusChoice: { amount: 1, options: [] },
      traitChoice: { amount: 2, options: [] },
    } as unknown as Race;
    const built = toRace(makeForm({ name: 'Elf', speed: 25 }), emptyExtras(), existing.id);
    expect(Object.keys(built)).not.toContain('abilityBonusChoice');
    expect(Object.keys(built)).not.toContain('traitChoice');
    expect(Object.keys(built)).not.toContain('legacy');
    const updated = { ...existing, ...built };
    expect(updated.abilityBonusChoice).toEqual({ amount: 1, options: [] });
    expect(updated.traitChoice).toEqual({ amount: 2, options: [] });
    expect(updated.legacy).toBe(true);
    expect(updated.speed).toBe(25);
  });

  it('hydrateTraits unwraps Feat.details losslessly and stamps missing ids', () => {
    const feats: Feat[] = [
      { id: 'feat-1', details: trait(), prerequisites: [] },
      { id: 'feat-2', details: { id: '', name: 'Trance', description: 'No sleep.' }, prerequisites: [] },
    ];
    const hydrated = hydrateTraits(feats);
    expect(hydrated[0]).toEqual({ ...trait() }); // metadata (incl. mads) survives
    expect(hydrated[1].id).toBe('feat-2'); // falls back to the Feat id
    expect(hydrateTraits(undefined)).toEqual([]);
  });

  it('hydrateBonuses normalizes legacy stat encodings', () => {
    expect(hydrateBonuses([{ stat: 1, value: 2 }, { stat: 'STR', value: 1 } as never])).toEqual([
      { stat: 1, value: 2 }, { stat: 0, value: 1 },
    ]);
  });

  it('mergeDescriptions drops the alternate keys the canonical output replaces, keeps unknown ones', () => {
    const merged = mergeDescriptions(
      { physical: 'Tall and slender', sizeDescription: 'Old size text', creatureType: 'Humanoid', age: 'Old age text' },
      { age: '', alignment: '', size: 'Tall and slender', language: '', abilities: '' },
    );
    // The stale sources of wizard-managed fields are gone (no resurrect / double-print)...
    expect(merged.physical).toBeUndefined();
    expect(merged.sizeDescription).toBeUndefined();
    // ...a cleared field stays cleared (canonical key wins over the old value)...
    expect(merged.age).toBe('');
    // ...and keys the wizard never reads survive the update.
    expect(merged.creatureType).toBe('Humanoid');
    expect(merged.size).toBe('Tall and slender');
  });

  it('pickDescription reads the descriptions map first, then legacy top-level fields', () => {
    const race = {
      id: 'r', name: 'Elf', size: 'Medium', speed: 30, languages: [], abilityBonuses: [], traits: [],
      descriptions: { Age: 'From the map' },
    } as unknown as Race;
    expect(pickDescription(race, 'age', 'ages')).toBe('From the map'); // case-insensitive map key
    const legacy = { ...race, descriptions: undefined, physical: 'Tall and slender' } as unknown as Race;
    expect(pickDescription(legacy, 'physical', 'size')).toBe('Tall and slender');
    expect(pickDescription(race, 'nope')).toBe('');
  });
});

describe('draft persistence', () => {
  it('keys drafts by the edit target, lowercased, with a :new fallback', () => {
    expect(raceDraftKey()).toBe('hb:raceDraft:new');
    expect(raceDraftKey('  Elf ')).toBe('hb:raceDraft:elf');
  });

  it('serialize → parse round-trips form, extras and step', () => {
    const fg = makeForm({ name: 'Drafty', size: ['Small'], abilityBonuses: [{ stat: 2, value: 1 }] });
    const raw = serializeDraft(fg, { traits: [{ id: 't', name: 'Sturdy', description: 'd' }] }, RaceWizardStep.Traits);
    const draft = parseDraft(raw);
    expect(draft?.form.name).toBe('Drafty');
    expect(draft?.form.size).toEqual(['Small']);
    expect(draft?.form.abilityBonuses).toEqual([{ stat: 2, value: 1 }]);
    expect(draft?.extras.traits).toHaveLength(1);
    expect(draft?.step).toBe(RaceWizardStep.Traits);
  });

  it('rejects malformed or version-mismatched drafts and clamps bad steps', () => {
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft('not json')).toBeNull();
    expect(parseDraft(JSON.stringify({ v: 99, form: {} }))).toBeNull();
    const badStep = parseDraft(JSON.stringify({ v: 1, form: {}, extras: { traits: [] }, step: 42 }));
    expect(badStep?.step).toBe(RaceWizardStep.Identity);
  });
});
