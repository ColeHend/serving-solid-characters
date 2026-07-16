import { describe, it, expect } from 'vitest';
import { FormGroup } from 'coles-solid-library';
import {
  BackgroundForm,
  BackgroundWizardStep,
  backgroundDraftKey,
  buildReviewRows,
  emptyCurrency,
  emptyExtras,
  encodeCurrency,
  groupHasContent,
  hydrateFeatures,
  parseDraft,
  serializeDraft,
  splitItemsCurrency,
  stepStatus,
  toBackground,
  toEquipmentGroups,
} from '../wizard/wizard.shared';

const makeForm = (overrides: Partial<BackgroundForm> = {}) => {
  const fg = new FormGroup<BackgroundForm>({
    name: ['', []],
    desc: ['', []],
    feat: ['', []],
    abilityOptions: [[], []],
    languages: [[], []],
    langChoiceAmount: [0, []],
    armorProfs: [[], []],
    weaponProfs: [[], []],
    toolProfs: [[], []],
    skillProfs: [[], []],
  });
  Object.entries(overrides).forEach(([key, value]) => fg.set(key as keyof BackgroundForm, value as never));
  return fg;
};

const group = (key: string, items: string[] = [], coins: Partial<Record<'PP'|'GP'|'EP'|'SP'|'CP', number>> = {}) =>
  ({ key, items, currency: { ...emptyCurrency(), ...coins } });

describe('stepStatus', () => {
  it('Identity requires a non-blank name', () => {
    const extras = emptyExtras();
    expect(stepStatus(BackgroundWizardStep.Identity, makeForm(), extras)).toBe('incomplete');
    expect(stepStatus(BackgroundWizardStep.Identity, makeForm({ name: '   ' }), extras)).toBe('incomplete');
    expect(stepStatus(BackgroundWizardStep.Identity, makeForm({ name: 'Acolyte' }), extras)).toBe('complete');
  });

  it('Abilities & Feat completes on either grant (lenient for 2014-style backgrounds)', () => {
    const extras = emptyExtras();
    expect(stepStatus(BackgroundWizardStep.AbilitiesFeat, makeForm(), extras)).toBe('incomplete');
    expect(stepStatus(BackgroundWizardStep.AbilitiesFeat, makeForm({ abilityOptions: ['Wisdom'] }), extras)).toBe('complete');
    expect(stepStatus(BackgroundWizardStep.AbilitiesFeat, makeForm({ feat: 'feat-1' }), extras)).toBe('complete');
  });

  it('Proficiencies & Languages completes on any proficiency or language', () => {
    const extras = emptyExtras();
    expect(stepStatus(BackgroundWizardStep.ProficienciesLanguages, makeForm(), extras)).toBe('incomplete');
    expect(stepStatus(BackgroundWizardStep.ProficienciesLanguages, makeForm({ skillProfs: ['Insight'] }), extras)).toBe('complete');
    expect(stepStatus(BackgroundWizardStep.ProficienciesLanguages, makeForm({ languages: ['Celestial'] }), extras)).toBe('complete');
  });

  it('Equipment completes once any group holds an item or coin', () => {
    const fg = makeForm();
    expect(stepStatus(BackgroundWizardStep.Equipment, fg, emptyExtras())).toBe('incomplete');
    expect(stepStatus(BackgroundWizardStep.Equipment, fg, { ...emptyExtras(), equipment: [group('A')] })).toBe('incomplete');
    expect(stepStatus(BackgroundWizardStep.Equipment, fg, { ...emptyExtras(), equipment: [group('A', ['Rope'])] })).toBe('complete');
    expect(stepStatus(BackgroundWizardStep.Equipment, fg, { ...emptyExtras(), equipment: [group('A', [], { GP: 15 })] })).toBe('complete');
  });

  it('Features completes once any feature exists', () => {
    const fg = makeForm();
    expect(stepStatus(BackgroundWizardStep.Features, fg, emptyExtras())).toBe('incomplete');
    const extras = { ...emptyExtras(), features: [{ id: 'f', name: 'F', description: 'd' }] };
    expect(stepStatus(BackgroundWizardStep.Features, fg, extras)).toBe('complete');
  });
});

describe('currency encoding', () => {
  it('encodes non-zero coins as lowercase-suffixed item strings', () => {
    expect(encodeCurrency({ ...emptyCurrency(), GP: 15, SP: 3 })).toEqual(['15gp', '3sp']);
    expect(encodeCurrency(emptyCurrency())).toEqual([]);
  });

  it('splits persisted items into plain items and parsed coins (round trip)', () => {
    const { items, currency } = splitItemsCurrency(['Holy Symbol', '15gp', '3sp', 'Rope (50 feet)']);
    expect(items).toEqual(['Holy Symbol', 'Rope (50 feet)']);
    expect(currency.GP).toBe(15);
    expect(currency.SP).toBe(3);
    expect(encodeCurrency(currency)).toEqual(['15gp', '3sp']);
  });

  it('tolerates blanks, mixed case and missing input', () => {
    expect(splitItemsCurrency(undefined)).toEqual({ items: [], currency: emptyCurrency() });
    const { items, currency } = splitItemsCurrency(['', '  ', '10GP']);
    expect(items).toEqual([]);
    expect(currency.GP).toBe(10);
  });
});

describe('prefill helpers', () => {
  it('toEquipmentGroups splits coins out of each persisted group', () => {
    const groups = toEquipmentGroups([
      { optionKeys: ['A'], items: ['Holy Symbol', '15gp'] },
      { optionKeys: ['B'], items: ['Crowbar'] },
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({ key: 'A', items: ['Holy Symbol'] });
    expect(groups[0].currency.GP).toBe(15);
    expect(groups[1]).toMatchObject({ key: 'B', items: ['Crowbar'] });
    expect(toEquipmentGroups(undefined)).toEqual([]);
  });

  it('hydrateFeatures stamps missing ids and keeps existing ones', () => {
    const hydrated = hydrateFeatures([
      { id: '', name: 'A', description: 'd' },
      { id: 'keep', name: 'B', description: 'd' },
    ]);
    expect(hydrated[0].id).toBeTruthy();
    expect(hydrated[1].id).toBe('keep');
    expect(hydrateFeatures(undefined)).toEqual([]);
  });
});

describe('toBackground', () => {
  it('assembles the persisted shape with coins appended to each group\'s items', () => {
    const fg = makeForm({
      name: '  Acolyte  ',
      desc: 'Temple service',
      feat: 'feat-1',
      abilityOptions: ['Intelligence', 'Wisdom'],
      languages: ['Celestial'],
      langChoiceAmount: 1,
      skillProfs: ['Insight', 'Religion'],
    });
    const extras = {
      equipment: [group('A', ['Holy Symbol'], { GP: 15 }), group('B')],
      features: [{ id: 'f1', name: 'Shelter of the Faithful', description: 'd' }],
    };
    const bg = toBackground(fg, extras);
    expect(bg.name).toBe('Acolyte');
    expect(bg.id).toBeTruthy();
    // The exact format BackgroundView and character creation consume.
    expect(bg.startEquipment).toEqual([{ optionKeys: ['A'], items: ['Holy Symbol', '15gp'] }]);
    expect(bg.proficiencies).toEqual({ armor: [], weapons: [], tools: [], skills: ['Insight', 'Religion'] });
    expect(bg.abilityOptions).toEqual(['Intelligence', 'Wisdom']);
    expect(bg.feat).toBe('feat-1');
    expect(bg.languages).toEqual({ options: ['Celestial'], amount: 1 });
    expect(bg.features).toHaveLength(1);
  });

  it('preserves an existing id when editing and generates one otherwise', () => {
    const fg = makeForm({ name: 'Acolyte' });
    expect(toBackground(fg, emptyExtras(), 'bg-1').id).toBe('bg-1');
    expect(toBackground(fg, emptyExtras()).id).not.toBe('');
  });

  it('drops an empty feat to undefined and empty groups entirely', () => {
    const bg = toBackground(makeForm({ name: 'A' }), { ...emptyExtras(), equipment: [group('A')] });
    expect(bg.feat).toBeUndefined();
    expect(bg.startEquipment).toEqual([]);
  });
});

describe('review rows', () => {
  it('summarizes each step and resolves the feat display name', () => {
    const fg = makeForm({
      name: 'Acolyte',
      abilityOptions: ['Wisdom'],
      languages: ['Celestial', 'Sylvan'],
      langChoiceAmount: 1,
      skillProfs: ['Insight'],
    });
    const extras = {
      equipment: [group('A', ['Holy Symbol'], { GP: 15 })],
      features: [{ id: 'f1', name: 'Shelter of the Faithful', description: 'd' }],
    };
    const rows = buildReviewRows(fg, extras, 'Magic Initiate');
    expect(rows).toHaveLength(5);
    expect(rows.every(r => r.ok)).toBe(true);
    expect(rows[0].summary).toContain('Acolyte');
    expect(rows[1].summary).toContain('Wisdom');
    expect(rows[1].summary).toContain('Magic Initiate');
    expect(rows[2].summary).toContain('Insight');
    expect(rows[2].summary).toContain('(choose 1)');
    expect(rows[3].summary).toContain('A: Holy Symbol, 15gp');
    expect(rows[4].summary).toContain('Shelter of the Faithful');
  });

  it('marks empty steps incomplete but never blocking (all actions stay edit)', () => {
    const rows = buildReviewRows(makeForm(), emptyExtras());
    expect(rows.every(r => !r.ok)).toBe(true);
    expect(rows.every(r => r.action === 'edit')).toBe(true);
  });
});

describe('drafts', () => {
  it('keys drafts by edit target, defaulting to :new', () => {
    expect(backgroundDraftKey()).toBe('hb:backgroundDraft:new');
    expect(backgroundDraftKey('  ')).toBe('hb:backgroundDraft:new');
    expect(backgroundDraftKey('Acolyte')).toBe('hb:backgroundDraft:acolyte');
  });

  it('serialize/parse round-trips form, extras and step', () => {
    const fg = makeForm({ name: 'Acolyte', languages: ['Celestial'], skillProfs: ['Insight'] });
    const extras = {
      equipment: [group('A', ['Holy Symbol'], { GP: 15 })],
      features: [{ id: 'f1', name: 'F', description: 'd' }],
    };
    const parsed = parseDraft(serializeDraft(fg, extras, BackgroundWizardStep.Equipment));
    expect(parsed?.form.name).toBe('Acolyte');
    expect(parsed?.form.languages).toEqual(['Celestial']);
    expect(parsed?.extras.equipment[0].items).toEqual(['Holy Symbol']);
    expect(parsed?.extras.equipment[0].currency.GP).toBe(15);
    expect(parsed?.extras.features[0].name).toBe('F');
    expect(parsed?.step).toBe(BackgroundWizardStep.Equipment);
  });

  it('rejects malformed or wrong-version drafts and coerces a bad step', () => {
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft('not json')).toBeNull();
    expect(parseDraft(JSON.stringify({ v: 99, form: {} }))).toBeNull();
    const badStep = parseDraft(JSON.stringify({ v: 1, form: {}, extras: emptyExtras(), step: 42 }));
    expect(badStep?.step).toBe(BackgroundWizardStep.Identity);
    // extras missing from an old/partial draft degrade to empty, not undefined
    const noExtras = parseDraft(JSON.stringify({ v: 1, form: { name: 'X' }, step: 0 }));
    expect(noExtras?.extras).toEqual(emptyExtras());
  });
});

describe('groupHasContent', () => {
  it('is true for items or coins, false for an empty group', () => {
    expect(groupHasContent(group('A'))).toBe(false);
    expect(groupHasContent(group('A', ['Rope']))).toBe(true);
    expect(groupHasContent(group('A', [], { CP: 1 }))).toBe(true);
  });
});
