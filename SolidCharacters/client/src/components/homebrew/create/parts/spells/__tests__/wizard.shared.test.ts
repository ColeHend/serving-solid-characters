import { describe, it, expect } from 'vitest';
import { FormGroup } from 'coles-solid-library';
import { Spell } from '../../../../../../models/generated';
import {
  DRAFT_VERSION,
  SpellForm,
  SpellWizardStep,
  buildReviewRows,
  collectForm,
  filterDurations,
  getCastingTimes,
  getDurations,
  getRanges,
  getSchools,
  hydrateDraft,
  parseDraft,
  serializeDraft,
  spellComponentString,
  spellDraftKey,
  spellLevelLabel,
  stepStatus,
  toDataSpell,
} from '../wizard/wizard.shared';

const makeForm = (overrides: Partial<SpellForm> = {}) => {
  const fg = new FormGroup<SpellForm>({
    name: ['', []],
    level: ['0', []],
    school: ['', []],
    description: ['', []],
    higherLevel: ['', []],
    castingTime: ['', []],
    range: ['', []],
    duration: ['', []],
    concentration: [false, []],
    ritual: [false, []],
    isVerbal: [false, []],
    isSomatic: [false, []],
    isMaterial: [false, []],
    materialsNeeded: ['', []],
    classes: [[], []],
    id: ['', []],
    components: ['', []],
    damageType: ['', []],
    page: ['', []],
    subClasses: [[], []],
    legacy: [undefined, []],
  });
  Object.entries(overrides).forEach(([key, value]) => fg.set(key as keyof SpellForm, value as never));
  return fg;
};

const catalogSpell = (overrides: Partial<Spell>): Spell => ({
  id: '', name: 'X', description: '', duration: '', concentration: false, components: '',
  level: '0', range: '', ritual: false, school: '', castingTime: '', damageType: '', page: '',
  isMaterial: false, isSomatic: false, isVerbal: false, classes: [], subClasses: [],
  ...overrides,
});

describe('stepStatus', () => {
  it('Identity requires a name', () => {
    expect(stepStatus(SpellWizardStep.Identity, makeForm())).toBe('incomplete');
    expect(stepStatus(SpellWizardStep.Identity, makeForm({ name: '  ' }))).toBe('incomplete');
    expect(stepStatus(SpellWizardStep.Identity, makeForm({ name: 'Fireball' }))).toBe('complete');
  });

  it('Casting requires casting time, range and duration together', () => {
    expect(stepStatus(SpellWizardStep.Casting, makeForm())).toBe('incomplete');
    expect(stepStatus(SpellWizardStep.Casting, makeForm({ castingTime: '1 action', range: '150 feet' }))).toBe('incomplete');
    expect(stepStatus(SpellWizardStep.Casting, makeForm({
      castingTime: '1 action', range: '150 feet', duration: 'Instantaneous',
    }))).toBe('complete');
  });

  it('Classes completes once any class is selected; Review never completes', () => {
    expect(stepStatus(SpellWizardStep.Classes, makeForm())).toBe('incomplete');
    expect(stepStatus(SpellWizardStep.Classes, makeForm({ classes: ['Wizard'] }))).toBe('complete');
    expect(stepStatus(SpellWizardStep.Review, makeForm({ name: 'Fireball' }))).toBe('incomplete');
  });
});

describe('spellDraftKey', () => {
  it('drafts new spells under :new and edits under the lowercased target', () => {
    expect(spellDraftKey()).toBe('hb:spellDraft:new');
    expect(spellDraftKey('')).toBe('hb:spellDraft:new');
    expect(spellDraftKey('  ')).toBe('hb:spellDraft:new');
    expect(spellDraftKey('Fireball')).toBe('hb:spellDraft:fireball');
  });
});

describe('draft serialize/parse/hydrate', () => {
  it('round-trips the form (including arrays and pass-through) and the step', () => {
    const fg = makeForm({
      name: 'Echo Bolt', level: '2', classes: ['Wizard', 'Sorcerer'],
      damageType: 'Thunder', page: 'HB 12', subClasses: ['Echo Knight'], legacy: true,
    });
    const draft = parseDraft(serializeDraft(fg, SpellWizardStep.Classes));
    expect(draft).not.toBeNull();
    expect(draft!.v).toBe(DRAFT_VERSION);
    expect(draft!.step).toBe(SpellWizardStep.Classes);

    const restored = makeForm();
    hydrateDraft(restored, draft!);
    expect(restored.get('name')).toBe('Echo Bolt');
    expect(restored.get('classes')).toEqual(['Wizard', 'Sorcerer']);
    expect(restored.get('damageType')).toBe('Thunder');
    expect(restored.get('page')).toBe('HB 12');
    expect(restored.get('subClasses')).toEqual(['Echo Knight']);
    expect(restored.get('legacy')).toBe(true);
  });

  it('rejects malformed payloads and coerces a bad step to Identity', () => {
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft('not json')).toBeNull();
    expect(parseDraft(JSON.stringify({ v: 99, form: {}, step: 0 }))).toBeNull();
    expect(parseDraft(JSON.stringify({ v: DRAFT_VERSION, form: null, step: 0 }))).toBeNull();
    const coerced = parseDraft(JSON.stringify({ v: DRAFT_VERSION, form: {}, step: 42 }));
    expect(coerced!.step).toBe(SpellWizardStep.Identity);
  });
});

describe('toDataSpell', () => {
  it('assembles the persisted spell and preserves pass-through fields', () => {
    const fg = makeForm({
      name: '  Echo Bolt  ', level: '2', school: 'Evocation', description: 'Boom.',
      castingTime: '1 action', range: '60 feet', duration: 'Instantaneous',
      isVerbal: true, isMaterial: true, materialsNeeded: 'a copper bell',
      classes: ['Wizard'],
      id: 'guid-1', components: 'V, M', damageType: 'Thunder', page: 'HB 12',
      subClasses: ['Echo Knight'], legacy: false,
    });
    const data = toDataSpell(collectForm(fg));
    expect(data.name).toBe('Echo Bolt');
    expect(data.level).toBe('2');
    expect(data.id).toBe('guid-1');
    expect(data.components).toBe('V, M');
    expect(data.damageType).toBe('Thunder');
    expect(data.page).toBe('HB 12');
    expect(data.subClasses).toEqual(['Echo Knight']);
    expect(data.legacy).toBe(false);
    expect(data.classes).toEqual(['Wizard']);
  });

  it('omits legacy when unknown instead of stamping a ruleset', () => {
    const data = toDataSpell(collectForm(makeForm({ name: 'Echo Bolt' })));
    expect('legacy' in data).toBe(false);
  });
});

describe('spellComponentString', () => {
  it('builds the statblock component line', () => {
    expect(spellComponentString(makeForm())).toBe('None');
    expect(spellComponentString(makeForm({ isVerbal: true, isSomatic: true }))).toBe('V, S');
    expect(spellComponentString(makeForm({ isMaterial: true }))).toBe('M');
    expect(spellComponentString(makeForm({
      isVerbal: true, isSomatic: true, isMaterial: true, materialsNeeded: 'a pinch of sulfur',
    }))).toBe('V, S, M (a pinch of sulfur)');
  });
});

describe('buildReviewRows', () => {
  it('flags a missing description on Identity as a fix', () => {
    const rows = buildReviewRows(makeForm({ name: 'Echo Bolt', level: '3', school: 'Evocation' }));
    expect(rows[0].ok).toBe(false);
    expect(rows[0].action).toBe('fix');
    expect(rows[0].summary).toBe('Echo Bolt · 3rd · Evocation');
    expect(rows[0].detail).toContain('No description');
  });

  it('summarizes casting with concentration/ritual tags and the component line', () => {
    const rows = buildReviewRows(makeForm({
      name: 'Echo Bolt', description: 'Boom.',
      castingTime: '1 action', range: '60 feet', duration: 'Concentration, up to 1 minute',
      concentration: true, ritual: true, isVerbal: true,
    }));
    expect(rows[1].ok).toBe(true);
    expect(rows[1].summary).toContain('· Concentration');
    expect(rows[1].summary).toContain('· Ritual');
    expect(rows[1].detail).toBe('Components: V');
  });

  it('treats an empty class list as valid but says so', () => {
    const rows = buildReviewRows(makeForm({ name: 'Echo Bolt' }));
    expect(rows[2].ok).toBe(true);
    expect(rows[2].summary).toContain('No classes');
    const withClasses = buildReviewRows(makeForm({ name: 'Echo Bolt', classes: ['Wizard', 'Bard'] }));
    expect(withClasses[2].summary).toBe('Wizard, Bard');
  });

  it('labels cantrips as Cantrip', () => {
    expect(spellLevelLabel('0')).toBe('Cantrip');
    const rows = buildReviewRows(makeForm({ name: 'Fire Bolt', level: '0' }));
    expect(rows[0].summary).toContain('Cantrip');
  });
});

describe('derived dropdown options', () => {
  const catalog = [
    catalogSpell({ school: 'Evocation', castingTime: '1 action', range: '60 feet', duration: 'Instantaneous' }),
    catalogSpell({ school: 'Abjuration', castingTime: '1 action', range: 'Self', duration: 'Concentration, up to 1 minute' }),
    catalogSpell({ school: 'Evocation', castingTime: '1 bonus action', range: '60 feet', duration: '1 hour' }),
    catalogSpell({ school: '', castingTime: '', range: '', duration: '' }),
  ];

  it('dedupes, drops empties and sorts', () => {
    expect(getSchools(catalog)).toEqual(['Abjuration', 'Evocation']);
    expect(getCastingTimes(catalog)).toEqual(['1 action', '1 bonus action']);
    expect(getRanges(catalog)).toEqual(['60 feet', 'Self']);
    expect(getDurations(catalog)).toEqual(['1 hour', 'Concentration, up to 1 minute', 'Instantaneous']);
  });

  it('filters durations by concentration', () => {
    const durations = getDurations(catalog);
    expect(filterDurations(durations, true)).toEqual(['Concentration, up to 1 minute']);
    expect(filterDurations(durations, false)).toEqual(['1 hour', 'Instantaneous']);
  });
});
