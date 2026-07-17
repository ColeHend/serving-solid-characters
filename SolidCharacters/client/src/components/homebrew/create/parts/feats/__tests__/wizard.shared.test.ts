import { describe, it, expect } from 'vitest';
import { FormGroup } from 'coles-solid-library';
import { MadFeature, MadType } from '../../../../../../models/generated';
import {
  DRAFT_VERSION,
  FeatForm,
  FeatWizardStep,
  PrerequisiteType,
  buildPrereqValue,
  buildReviewRows,
  collectForm,
  defaultsForType,
  describePrerequisite,
  featDraftKey,
  hydrateDraft,
  mapLegacyPreReqs,
  parseDraft,
  serializeDraft,
  stepStatus,
  toDataFeat,
} from '../wizard/wizard.shared';

const makeForm = (overrides: Partial<FeatForm> = {}) => {
  const fg = new FormGroup<FeatForm>({
    name: ['', []],
    description: ['', []],
    prerequisites: [[], []],
    metadata: [undefined, []],
    id: ['', []],
    legacy: [undefined, []],
  });
  Object.entries(overrides).forEach(([key, value]) => fg.set(key as keyof FeatForm, value as never));
  return fg;
};

const resistanceMad = (): MadFeature => ({
  command: 'AddResistances',
  value: { damageType: 'Fire' },
  type: MadType.Character,
  prerequisites: [],
  group: 0,
});

const brokenMad = (): MadFeature => ({
  command: 'Sparkle',
  value: {},
  type: MadType.Character,
  prerequisites: [],
  group: 0,
});

const emptyCatalogs = { classes: [], subclasses: [], feats: [], races: [], items: [] };

describe('stepStatus', () => {
  it('Identity requires a name', () => {
    expect(stepStatus(FeatWizardStep.Identity, makeForm())).toBe('incomplete');
    expect(stepStatus(FeatWizardStep.Identity, makeForm({ name: '  ' }))).toBe('incomplete');
    expect(stepStatus(FeatWizardStep.Identity, makeForm({ name: 'Alert' }))).toBe('complete');
  });

  it('Prerequisites and Effects complete once populated; Review never completes', () => {
    expect(stepStatus(FeatWizardStep.Prerequisites, makeForm())).toBe('incomplete');
    expect(stepStatus(FeatWizardStep.Prerequisites, makeForm({
      prerequisites: [{ type: PrerequisiteType.Stat, value: 'DEX 13' }],
    }))).toBe('complete');
    expect(stepStatus(FeatWizardStep.Effects, makeForm())).toBe('incomplete');
    expect(stepStatus(FeatWizardStep.Effects, makeForm({
      metadata: { mads: [resistanceMad()] },
    }))).toBe('complete');
    expect(stepStatus(FeatWizardStep.Review, makeForm({ name: 'Alert' }))).toBe('incomplete');
  });
});

describe('featDraftKey', () => {
  it('drafts new feats under :new and edits under the lowercased target', () => {
    expect(featDraftKey()).toBe('hb:featDraft:new');
    expect(featDraftKey('')).toBe('hb:featDraft:new');
    expect(featDraftKey('  ')).toBe('hb:featDraft:new');
    expect(featDraftKey('Alert')).toBe('hb:featDraft:alert');
  });
});

describe('draft serialize/parse/hydrate', () => {
  it('round-trips the form (including prerequisites, mads and pass-through) and the step', () => {
    const fg = makeForm({
      name: 'War Caster', description: 'Advantage on concentration.',
      prerequisites: [{ type: PrerequisiteType.Stat, value: 'INT 13' }],
      metadata: { uses: 0, recharge: '', spells: [], category: '', mads: [resistanceMad()] },
      id: 'guid-1', legacy: true,
    });
    const draft = parseDraft(serializeDraft(fg, FeatWizardStep.Effects));
    expect(draft).not.toBeNull();
    expect(draft!.v).toBe(DRAFT_VERSION);
    expect(draft!.step).toBe(FeatWizardStep.Effects);

    const restored = makeForm();
    hydrateDraft(restored, draft!);
    expect(restored.get('name')).toBe('War Caster');
    expect(restored.get('prerequisites')).toEqual([{ type: PrerequisiteType.Stat, value: 'INT 13' }]);
    expect((restored.get('metadata') as { mads: MadFeature[] }).mads).toEqual([resistanceMad()]);
    expect(restored.get('id')).toBe('guid-1');
    expect(restored.get('legacy')).toBe(true);
  });

  it('rejects malformed payloads and coerces a bad step to Identity', () => {
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft('not json')).toBeNull();
    expect(parseDraft(JSON.stringify({ v: 99, form: {}, step: 0 }))).toBeNull();
    expect(parseDraft(JSON.stringify({ v: DRAFT_VERSION, form: null, step: 0 }))).toBeNull();
    const coerced = parseDraft(JSON.stringify({ v: DRAFT_VERSION, form: {}, step: 42 }));
    expect(coerced!.step).toBe(FeatWizardStep.Identity);
  });

  it('never hydrates garbage into the structured fields', () => {
    const draft = parseDraft(JSON.stringify({
      v: DRAFT_VERSION,
      form: { name: 'Damaged', prerequisites: 'oops', metadata: 7 },
      step: 0,
    }));
    const restored = makeForm();
    hydrateDraft(restored, draft!);
    expect(restored.get('name')).toBe('Damaged');
    expect(restored.get('prerequisites')).toEqual([]);
    expect(restored.get('metadata')).toBeUndefined();
  });
});

describe('toDataFeat', () => {
  it('assembles the persisted feat with details, root name/desc and pass-through', () => {
    const fg = makeForm({
      name: '  War Caster  ', description: 'Advantage on concentration.',
      prerequisites: [{ type: PrerequisiteType.Class, value: 'Wizard 3' }],
      metadata: { uses: 0, recharge: '', spells: [], category: '', mads: [resistanceMad()] },
      id: 'guid-1', legacy: false,
    });
    const data = toDataFeat(collectForm(fg));
    expect(data.name).toBe('War Caster');
    expect(data.details.name).toBe('War Caster');
    expect(data.details.description).toBe('Advantage on concentration.');
    expect(data.details.metadata?.mads).toEqual([resistanceMad()]);
    expect(data.desc).toEqual(['Advantage on concentration.']);
    expect(data.prerequisites).toEqual([{ type: PrerequisiteType.Class, value: 'Wizard 3' }]);
    expect(data.id).toBe('guid-1');
    expect(data.legacy).toBe(false);
  });

  it('omits legacy when unknown and metadata when absent', () => {
    const data = toDataFeat(collectForm(makeForm({ name: 'Alert' })));
    expect('legacy' in data).toBe(false);
    expect('metadata' in data.details).toBe(false);
  });
});

describe('buildPrereqValue', () => {
  it('builds each requirement shape the old selector produced', () => {
    expect(buildPrereqValue(PrerequisiteType.Stat, { keyName: 'str', keyValue: '13', classLevel: '' })).toBe('STR 13');
    expect(buildPrereqValue(PrerequisiteType.Class, { keyName: 'Class', keyValue: 'Barbarian', classLevel: '3' })).toBe('Barbarian 3');
    expect(buildPrereqValue(PrerequisiteType.Class, { keyName: 'Class', keyValue: 'Barbarian', classLevel: '' })).toBe('Barbarian');
    expect(buildPrereqValue(PrerequisiteType.Class, { keyName: 'Class', keyValue: 'Barbarian', classLevel: 'x' })).toBe('Barbarian');
    expect(buildPrereqValue(PrerequisiteType.String, { keyName: 'Text', keyValue: '   ', classLevel: '' })).toBeNull();
    expect(buildPrereqValue(PrerequisiteType.String, { keyName: 'Text', keyValue: ' darkvision ', classLevel: '' })).toBe('darkvision');
    expect(buildPrereqValue(PrerequisiteType.Race, { keyName: 'Race', keyValue: 'Elf', classLevel: '' })).toBe('Elf');
  });
});

describe('defaultsForType', () => {
  it('resets the builder input per type, preferring the first catalog entry', () => {
    expect(defaultsForType(PrerequisiteType.Stat, emptyCatalogs)).toEqual({ keyName: 'STR', keyValue: '10', classLevel: '' });
    expect(defaultsForType(PrerequisiteType.Class, { ...emptyCatalogs, classes: ['Wizard'] }).keyValue).toBe('Wizard');
    expect(defaultsForType(PrerequisiteType.Class, emptyCatalogs).keyValue).toBe('Barbarian');
    expect(defaultsForType(PrerequisiteType.Subclass, { ...emptyCatalogs, subclasses: ['Wizard:Evocation'] }).keyValue).toBe('Wizard:Evocation');
    expect(defaultsForType(PrerequisiteType.String, emptyCatalogs)).toEqual({ keyName: 'Text', keyValue: '', classLevel: '' });
  });
});

describe('mapLegacyPreReqs', () => {
  it('maps stat lines, bare levels and everything else like the old form', () => {
    expect(mapLegacyPreReqs([{ name: 'str 12' }, { name: '4' }, { name: 'Wizard' }, { value: 'DEX 13' }])).toEqual([
      { type: PrerequisiteType.Stat, value: 'STR 12' },
      { type: PrerequisiteType.Level, value: '4' },
      { type: PrerequisiteType.Class, value: 'Wizard' },
      { type: PrerequisiteType.Stat, value: 'DEX 13' },
    ]);
  });
});

describe('describePrerequisite', () => {
  it('labels each type readably', () => {
    expect(describePrerequisite({ type: PrerequisiteType.Level, value: '5' })).toBe('Level 5');
    expect(describePrerequisite({ type: PrerequisiteType.Subclass, value: 'Wizard:Evocation' })).toBe('Wizard / Evocation');
    expect(describePrerequisite({ type: PrerequisiteType.Feat, value: 'Alert' })).toBe('Feat: Alert');
    expect(describePrerequisite({ type: PrerequisiteType.Stat, value: 'STR 13' })).toBe('STR 13');
    expect(describePrerequisite({ type: PrerequisiteType.String, value: 'darkvision' })).toBe('darkvision');
  });
});

describe('buildReviewRows', () => {
  it('flags a missing description on Identity as a fix', () => {
    const rows = buildReviewRows(makeForm({ name: 'Alert' }));
    expect(rows[0].ok).toBe(false);
    expect(rows[0].action).toBe('fix');
    expect(rows[0].summary).toBe('Alert');
    expect(rows[0].detail).toContain('No description');
  });

  it('treats empty prerequisites as valid but says so', () => {
    const rows = buildReviewRows(makeForm({ name: 'Alert', description: 'Ready.' }));
    expect(rows[1].ok).toBe(true);
    expect(rows[1].summary).toContain('No prerequisites');
    const populated = buildReviewRows(makeForm({
      name: 'Alert', description: 'Ready.',
      prerequisites: [
        { type: PrerequisiteType.Stat, value: 'DEX 13' },
        { type: PrerequisiteType.Level, value: '4' },
      ],
    }));
    expect(populated[1].summary).toBe('DEX 13, Level 4');
  });

  it('summarizes valid effects and flags invalid commands as a fix', () => {
    const empty = buildReviewRows(makeForm({ name: 'Alert', description: 'Ready.' }));
    expect(empty[2].ok).toBe(true);
    expect(empty[2].summary).toContain('No effects');

    const valid = buildReviewRows(makeForm({
      name: 'Alert', description: 'Ready.',
      metadata: { mads: [resistanceMad()] },
    }));
    expect(valid[2].ok).toBe(true);
    expect(valid[2].summary).toBe('Add Resistances: Fire');

    const invalid = buildReviewRows(makeForm({
      name: 'Alert', description: 'Ready.',
      metadata: { mads: [brokenMad()] },
    }));
    expect(invalid[2].ok).toBe(false);
    expect(invalid[2].action).toBe('fix');
    expect(invalid[2].detail).toBeTruthy();
  });
});
