import { describe, it, expect } from 'vitest';
import { FormGroup } from 'coles-solid-library';
import {
  SubraceForm,
  SubraceWizardStep,
  buildReviewRows,
  emptyExtras,
  parseDraft,
  raceSelectorKey,
  raceVersionLabel,
  serializeDraft,
  stepStatus,
  subraceDraftKey,
  toRaceOption,
} from '../wizard/wizard.shared';
import { toSubrace } from '../subraceAdapter';

const makeForm = (overrides: Partial<SubraceForm> = {}) => {
  const fg = new FormGroup<SubraceForm>({
    parentRaceKey: ['', []],
    parentRaceName: ['', []],
    name: ['', []],
    desc: ['', []],
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
  Object.entries(overrides).forEach(([key, value]) => fg.set(key as keyof SubraceForm, value as never));
  return fg;
};

describe('parent-race selector helpers', () => {
  it('keys races by id with an hb:name fallback', () => {
    expect(raceSelectorKey({ id: 'race-1', name: 'Elf' })).toBe('race-1');
    expect(raceSelectorKey({ id: '', name: 'Elf' })).toBe('hb:Elf');
    expect(raceSelectorKey({ name: 'Elf' })).toBe('hb:Elf');
  });

  it('labels options by ruleset (legacy flag) with Homebrew as the unflagged default', () => {
    expect(raceVersionLabel({ legacy: true })).toBe('2014');
    expect(raceVersionLabel({ legacy: false })).toBe('2024');
    expect(raceVersionLabel({})).toBe('Homebrew');
    expect(toRaceOption({ id: 'race-1', name: 'Elf', legacy: false }).label).toBe('Elf (2024)');
  });
});

describe('stepStatus', () => {
  it('Identity requires both a parent race and a name', () => {
    const extras = emptyExtras();
    expect(stepStatus(SubraceWizardStep.Identity, makeForm(), extras)).toBe('incomplete');
    expect(stepStatus(SubraceWizardStep.Identity, makeForm({ name: 'High Elf' }), extras)).toBe('incomplete');
    expect(stepStatus(SubraceWizardStep.Identity, makeForm({ parentRaceKey: 'race-1' }), extras)).toBe('incomplete');
    expect(stepStatus(SubraceWizardStep.Identity, makeForm({ parentRaceKey: 'race-1', name: 'High Elf' }), extras)).toBe('complete');
  });

  it('Flavor completes on the main description too', () => {
    const extras = emptyExtras();
    expect(stepStatus(SubraceWizardStep.Flavor, makeForm(), extras)).toBe('incomplete');
    expect(stepStatus(SubraceWizardStep.Flavor, makeForm({ desc: 'Magic-touched.' }), extras)).toBe('complete');
  });
});

describe('buildReviewRows', () => {
  it('marks a parentless identity row as a fix action', () => {
    const rows = buildReviewRows(makeForm({ name: 'High Elf' }), emptyExtras());
    expect(rows[0].ok).toBe(false);
    expect(rows[0].action).toBe('fix');
    expect(rows[0].summary).toContain('no parent race');
    const okRows = buildReviewRows(makeForm({ name: 'High Elf', parentRaceKey: 'race-1', parentRaceName: 'Elf' }), emptyExtras());
    expect(okRows[0].ok).toBe(true);
    expect(okRows[0].summary).toContain('of Elf');
  });
});

describe('toSubrace', () => {
  it('stamps the parent race id and persists desc into the descriptions map', () => {
    const fg = makeForm({
      parentRaceKey: 'race-1',
      parentRaceName: 'Elf',
      name: 'High Elf',
      desc: 'Magic-touched.',
      size: ['Medium'],
      abilityBonuses: [{ stat: 3, value: 1 }],
    });
    const subrace = toSubrace(fg, { traits: [{ id: 't', name: 'Cantrip', description: 'One wizard cantrip.' }] }, 'race-1', 'sub-1');
    expect(subrace.parentRace).toBe('race-1');
    expect(subrace.id).toBe('sub-1');
    expect(subrace.name).toBe('High Elf');
    expect(subrace.size).toBe('Medium');
    expect(subrace.abilityBonuses).toEqual([{ stat: 3, value: 1 }]);
    expect(subrace.traits[0].details.name).toBe('Cantrip');
    expect(subrace.descriptions).toMatchObject({ desc: 'Magic-touched.' });
    // Never emits parent-selector form fields or fields the wizard has no UI for.
    expect(Object.keys(subrace)).not.toContain('parentRaceKey');
    expect(Object.keys(subrace)).not.toContain('parentRaceName');
    expect(Object.keys(subrace)).not.toContain('traitChoice');
  });
});

describe('draft persistence', () => {
  it('keys drafts by the edit target pair with placeholders', () => {
    expect(subraceDraftKey()).toBe('hb:subraceDraft:_:new');
    expect(subraceDraftKey('Elf', 'High Elf')).toBe('hb:subraceDraft:elf:high elf');
    expect(subraceDraftKey('Elf')).toBe('hb:subraceDraft:elf:new');
  });

  it('serialize → parse round-trips the parent selection and step', () => {
    const fg = makeForm({ parentRaceKey: 'race-1', parentRaceName: 'Elf', name: 'Drafty', desc: 'wip' });
    const raw = serializeDraft(fg, emptyExtras(), SubraceWizardStep.Flavor);
    const draft = parseDraft(raw);
    expect(draft?.form.parentRaceKey).toBe('race-1');
    expect(draft?.form.parentRaceName).toBe('Elf');
    expect(draft?.form.desc).toBe('wip');
    expect(draft?.step).toBe(SubraceWizardStep.Flavor);
  });

  it('rejects malformed drafts and clamps bad steps', () => {
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft('{}')).toBeNull();
    const badStep = parseDraft(JSON.stringify({ v: 1, form: {}, extras: { traits: [] }, step: -3 }));
    expect(badStep?.step).toBe(SubraceWizardStep.Identity);
  });
});
