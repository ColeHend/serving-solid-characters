import { describe, it, expect } from 'vitest';
import { FormGroup } from 'coles-solid-library';
import { CasterType } from '../../../../../../models/data/spellcasting';
import { SpellsKnown } from '../SpellsKnown';
import {
  SubclassForm,
  SubclassWizardStep,
  buildReviewRows,
  buildSubclassFeatures,
  collectForm,
  emptySubclassLevels,
  hydrateSubclassFeatures,
  normalizeCastingAbility,
  parseDraft,
  serializeDraft,
  stepStatus,
  subclassDraftKey,
  toDataSubclass,
} from '../wizard/wizard.shared';

const makeForm = (overrides: Partial<SubclassForm> = {}) => {
  const fg = new FormGroup<SubclassForm>({
    parentClass: ['', []],
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
  it('hydrate stamps ids; build strips them but keeps metadata/choiceKey', () => {
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
    expect((rebuilt[3][0] as { id?: string }).id).toBeUndefined();
    expect(rebuilt[3][0].metadata?.category).toBe('Subclass feature');
    expect(rebuilt[7][0].choiceKey).toBe('echo');
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

describe('normalizeCastingAbility', () => {
  it('maps the adapter’s uppercased stat back to the UI word', () => {
    expect(normalizeCastingAbility('WISDOM')).toBe('Wisdom');
    expect(normalizeCastingAbility('intelligence')).toBe('Intelligence');
    expect(normalizeCastingAbility(undefined)).toBe('');
    expect(normalizeCastingAbility('STRENGTH')).toBe('');
  });
});
