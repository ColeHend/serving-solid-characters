import { describe, it, expect } from 'vitest';
import { FormGroup } from 'coles-solid-library';
import { CasterType } from '../../../../../../models/data/spellcasting';
import { SpellsKnown } from '../SpellsKnown';
import {
  SubclassForm,
  SubclassWizardStep,
  buildReviewRows,
  buildSubclassFeatures,
  classSelectorKey,
  classVersionLabel,
  collectForm,
  emptySubclassLevels,
  hydrateSubclassFeatures,
  normalizeCastingAbility,
  parseDraft,
  serializeDraft,
  stepStatus,
  subclassDraftKey,
  toClassOption,
  toDataSubclass,
} from '../wizard/wizard.shared';

const makeForm = (overrides: Partial<SubclassForm> = {}) => {
  const fg = new FormGroup<SubclassForm>({
    parentClass: ['', []],
    parentClassId: ['', []],
    name: ['', []],
    description: ['', []],
    hasCasting: [false, []],
    casterType: ['', []],
    castingModifier: ['', []],
    spellsKnownCalc: [SpellsKnown.None, []],
    halfCasterRoundUp: [false, []],
    hasCantrips: [false, []],
    hasRitualCasting: [false, []],
    spellsKnownPerLevel: [[], []],
    spellcastingInfo: [[], []],
    subclassSpells: [[], []],
    selectedSpellName: ['', []],
  });
  Object.entries(overrides).forEach(([key, value]) => fg.set(key as keyof SubclassForm, value as never));
  return fg;
};

describe('stepStatus', () => {
  it('Identity requires both a parent class and a name', () => {
    const levels = emptySubclassLevels();
    expect(stepStatus(SubclassWizardStep.Identity, makeForm(), levels)).toBe('incomplete');
    expect(stepStatus(SubclassWizardStep.Identity, makeForm({ parentClass: 'Wizard' }), levels)).toBe('incomplete');
    expect(stepStatus(SubclassWizardStep.Identity, makeForm({ parentClass: 'Wizard', name: 'Echo' }), levels)).toBe('complete');
  });

  it('Features completes once any feature is placed (no empty-level warning tier)', () => {
    const fg = makeForm();
    expect(stepStatus(SubclassWizardStep.Features, fg, emptySubclassLevels())).toBe('incomplete');
    const levels = { features: { 3: [{ id: 'a', name: 'F', description: 'd' }] } };
    expect(stepStatus(SubclassWizardStep.Features, fg, levels)).toBe('complete');
  });

  it('Spellcasting is complete for non-casters and gated on type+ability for casters', () => {
    const levels = emptySubclassLevels();
    expect(stepStatus(SubclassWizardStep.Spellcasting, makeForm(), levels)).toBe('complete');
    expect(stepStatus(SubclassWizardStep.Spellcasting, makeForm({ hasCasting: true, casterType: 'half' }), levels)).toBe('incomplete');
    expect(stepStatus(SubclassWizardStep.Spellcasting, makeForm({
      hasCasting: true, casterType: 'half', castingModifier: 'Wisdom',
    }), levels)).toBe('complete');
  });
});

describe('feature build/hydrate round trip', () => {
  it('hydrate stamps ids for legacy id-less rows; build keeps them with metadata/choiceKey', () => {
    const persisted = {
      3: [{ name: 'Echo Step', description: 'Teleport', metadata: { category: 'Subclass feature' } }],
      7: [{ name: 'Echo Avatar', description: 'Project', choiceKey: 'echo' }],
    };
    const hydrated = hydrateSubclassFeatures(persisted as never);
    expect(hydrated[3][0].id).toBeTruthy();
    expect(hydrated[7][0].id).toBeTruthy();
    expect(hydrated[3][0].metadata?.category).toBe('Subclass feature');

    const rebuilt = buildSubclassFeatures(hydrated);
    expect(Object.keys(rebuilt)).toEqual(['3', '7']);
    // Persisted ids anchor choice-form mad picks (statChoiceKey) — they must survive the save.
    expect(rebuilt[3][0].id).toBe(hydrated[3][0].id);
    expect(rebuilt[3][0].metadata?.category).toBe('Subclass feature');
    expect(rebuilt[7][0].choiceKey).toBe('echo');
  });

  it('keeps feature ids stable across hydrate → build → hydrate', () => {
    const persisted = { 3: [{ name: 'Echo Step', description: 'Teleport' }] };
    const first = hydrateSubclassFeatures(persisted as never);
    const rehydrated = hydrateSubclassFeatures(buildSubclassFeatures(first));
    expect(rehydrated[3][0].id).toBe(first[3][0].id);
  });

  it('hydrate tolerates missing/empty input', () => {
    expect(hydrateSubclassFeatures(undefined)).toEqual({});
    expect(hydrateSubclassFeatures({} as never)).toEqual({});
  });
});

describe('toDataSubclass', () => {
  it('assembles a non-caster subclass with a derived storage_key', () => {
    const fg = makeForm({ parentClass: 'Wizard', name: 'Echo', description: 'd' });
    const data = toDataSubclass(collectForm(fg), { features: { 3: [{ id: 'x', name: 'F', description: 'd' }] } });
    expect(data.storage_key).toBe('wizard__echo');
    expect(data.parentClass).toBe('Wizard');
    expect(data.spellcasting).toBeUndefined();
    expect(data.features[3][0].name).toBe('F');
  });

  it('builds half-caster spellcasting through the adapter', () => {
    const fg = makeForm({
      parentClass: 'Fighter', name: 'Eldritch Knight',
      hasCasting: true, casterType: 'third', castingModifier: 'Intelligence',
      spellsKnownCalc: SpellsKnown.HalfLevel,
    });
    const data = toDataSubclass(collectForm(fg), emptySubclassLevels());
    expect(data.spellcasting).toBeTruthy();
    expect(data.spellcasting?.metadata.casterType).toBe(CasterType.Third);
    expect(data.spellcasting?.known_type).toBe('calc');
  });

  it('persists a real parent-class id but never the synthetic hb: selector key', () => {
    const withId = toDataSubclass(
      collectForm(makeForm({ parentClass: 'Wizard', parentClassId: 'w24', name: 'Echo' })),
      emptySubclassLevels());
    expect(withId.parentClassId).toBe('w24');

    const hbKey = toDataSubclass(
      collectForm(makeForm({ parentClass: 'Stormwarden', parentClassId: 'hb:Stormwarden', name: 'Echo' })),
      emptySubclassLevels());
    expect(hbKey.parentClassId).toBeUndefined();
    expect(hbKey.parentClass).toBe('Stormwarden');

    const unresolved = toDataSubclass(
      collectForm(makeForm({ parentClass: 'Wizard', parentClassId: '', name: 'Echo' })),
      emptySubclassLevels());
    expect(unresolved.parentClassId).toBeUndefined();
  });
});

describe('review rows', () => {
  it('summarizes feature levels and caster status', () => {
    const fg = makeForm({ parentClass: 'Wizard', name: 'Echo' });
    const rows = buildReviewRows(fg, { features: { 3: [{ id: 'a', name: 'F', description: 'd' }], 7: [{ id: 'b', name: 'G', description: 'd' }] } });
    expect(rows[0].ok).toBe(true);
    expect(rows[1].summary).toContain('3, 7');
    expect(rows[2].summary).toContain('Non-caster');
  });

  it('flags an empty features step as fix', () => {
    const rows = buildReviewRows(makeForm(), emptySubclassLevels());
    expect(rows[1].ok).toBe(false);
    expect(rows[1].action).toBe('fix');
  });

  it('notes out-of-range feature levels without blocking (row stays ok/edit)', () => {
    const fg = makeForm({ parentClass: 'Wizard', name: 'Echo' });
    const levels = { features: { 3: [{ id: 'a', name: 'F', description: 'd' }], 10: [{ id: 'b', name: 'G', description: 'd' }] } };
    const rows = buildReviewRows(fg, levels, [3, 6]);
    expect(rows[1].ok).toBe(true);
    expect(rows[1].action).toBe('edit');
    expect(rows[1].detail).toContain('10');
    expect(rows[1].detail).toContain('Wizard');
    // no restriction → no detail note
    expect(buildReviewRows(fg, levels, null)[1].detail).toBeUndefined();
    expect(buildReviewRows(fg, levels)[1].detail).toBeUndefined();
  });
});

describe('drafts', () => {
  it('keys drafts by edit target, defaulting to :new', () => {
    expect(subclassDraftKey()).toBe('hb:subclassDraft:new');
    expect(subclassDraftKey('', '')).toBe('hb:subclassDraft:new');
    expect(subclassDraftKey('Wizard', 'Echo')).toBe('hb:subclassDraft:wizard__echo');
  });

  it('serialize/parse round-trips form, levels and step', () => {
    const fg = makeForm({ parentClass: 'Wizard', name: 'Echo', hasCasting: true, casterType: 'half' });
    const levels = { features: { 3: [{ id: 'a', name: 'F', description: 'd' }] } };
    const parsed = parseDraft(serializeDraft(fg, levels, SubclassWizardStep.Spellcasting));
    expect(parsed?.form.name).toBe('Echo');
    expect(parsed?.form.casterType).toBe('half');
    expect(parsed?.levels.features[3][0].name).toBe('F');
    expect(parsed?.step).toBe(SubclassWizardStep.Spellcasting);
    // ephemeral picker state never drafts
    expect('selectedSpellName' in (parsed?.form ?? {})).toBe(false);
  });

  it('rejects malformed or wrong-version drafts', () => {
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft('not json')).toBeNull();
    expect(parseDraft(JSON.stringify({ v: 99, form: {} }))).toBeNull();
    const badStep = parseDraft(JSON.stringify({ v: 1, form: {}, levels: { features: {} }, step: 42 }));
    expect(badStep?.step).toBe(SubclassWizardStep.Identity);
  });
});

describe('parent-class selector helpers', () => {
  it('keys SRD classes by id and homebrew (id-less) classes by name', () => {
    expect(classSelectorKey({ id: '481ed09a-b505', name: 'Barbarian' })).toBe('481ed09a-b505');
    expect(classSelectorKey({ id: 0, name: 'Numeric' })).toBe('0');
    expect(classSelectorKey({ name: 'Stormwarden' })).toBe('hb:Stormwarden');
    expect(classSelectorKey({ id: '', name: 'Stormwarden' })).toBe('hb:Stormwarden');
  });

  it('labels the ruleset from the centrally-stamped legacy flag', () => {
    expect(classVersionLabel({ legacy: true })).toBe('2014');
    expect(classVersionLabel({ legacy: false })).toBe('2024');
    expect(classVersionLabel({})).toBe('Homebrew');
  });

  it('builds selector options with a version-tagged label', () => {
    expect(toClassOption({ id: 'w24', name: 'Wizard', legacy: false })).toEqual({
      key: 'w24', name: 'Wizard', version: '2024', label: 'Wizard (2024)',
    });
    expect(toClassOption({ name: 'Stormwarden' }).label).toBe('Stormwarden (Homebrew)');
  });

  it('round-trips parentClassId through drafts', () => {
    const fg = makeForm({ parentClass: 'Wizard', parentClassId: 'w24', name: 'Echo' });
    const parsed = parseDraft(serializeDraft(fg, emptySubclassLevels(), SubclassWizardStep.Identity));
    expect(parsed?.form.parentClassId).toBe('w24');
  });
});

describe('normalizeCastingAbility', () => {
  it('maps the adapter’s uppercased stat back to the UI word', () => {
    expect(normalizeCastingAbility('WISDOM')).toBe('Wisdom');
    expect(normalizeCastingAbility('intelligence')).toBe('Intelligence');
    expect(normalizeCastingAbility(undefined)).toBe('');
    expect(normalizeCastingAbility('STRENGTH')).toBe('');
  });
});
