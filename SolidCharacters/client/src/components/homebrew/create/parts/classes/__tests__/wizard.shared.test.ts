import { describe, it, expect } from 'vitest';
import {
  WizardStep,
  buildLevelEntities,
  emptyLevels,
  emptyWizardLevels,
  featuresPlaced,
  hydrateDraft,
  parseDraft,
  serializeDraft,
  stepStatus,
  toggleInArray,
} from '../wizard/wizard.shared';
import type { ClassForm, WizardLevels } from '../wizard/wizard.shared';
import { Stat } from '../../../../../../shared/models/stats';

// Minimal FormGroup stand-in: the shared helpers only use get/set.
const fakeFormGroup = (values: Partial<ClassForm>) => {
  const store: Record<string, unknown> = { ...values };
  return {
    get: (key: string) => store[key],
    set: (key: string, value: unknown) => { store[key] = value; },
    values: store,
  } as any;
};

describe('toggleInArray', () => {
  it('adds, removes, and enforces max', () => {
    expect(toggleInArray<string>([], 'a')).toEqual(['a']);
    expect(toggleInArray(['a'], 'a')).toEqual([]);
    expect(toggleInArray(['a', 'b'], 'c', 2)).toEqual(['a', 'b']); // at max: unchanged
    expect(toggleInArray(['a', 'b'], 'a', 2)).toEqual(['b']);      // removal always allowed
  });
});

describe('level helpers', () => {
  const levels: WizardLevels['features'] = {
    1: [{ id: 'x', name: 'A', description: '' }],
    5: [{ id: 'y', name: 'B', description: '' }, { id: 'z', name: 'C', description: '' }],
  };

  it('emptyLevels lists all 1-20 levels without features', () => {
    const empty = emptyLevels(levels);
    expect(empty).toHaveLength(18);
    expect(empty).not.toContain(1);
    expect(empty).not.toContain(5);
    expect(empty).toContain(20);
  });

  it('featuresPlaced counts every feature across levels', () => {
    expect(featuresPlaced(levels)).toBe(3);
    expect(featuresPlaced({})).toBe(0);
  });
});

describe('buildLevelEntities', () => {
  it('bridges the wizard store back to LevelEntity[] for the adapter', () => {
    const wl: WizardLevels = {
      features: { 2: [{ id: 'f1', name: 'Smite', description: 'Hit harder.' }] },
      classSpecific: { rage_uses: { 1: '2', 2: '3' } },
      cantripsKnown: { 2: 4 },
    };
    const entities = buildLevelEntities('Runeblade', wl);
    expect(entities).toHaveLength(20);
    expect(entities[1].features).toEqual([
      expect.objectContaining({ name: 'Smite', value: 'Hit harder.' }),
    ]);
    // classSpecific keys are stamped on every level (adapter reads columns off level 1)
    expect(entities[0].classSpecific).toEqual({ rage_uses: '2' });
    expect(entities[19].classSpecific).toEqual({ rage_uses: '' });
    expect(entities[1].spellcasting).toEqual({ cantrips_known: 4 });
    expect(entities[0].spellcasting).toBeUndefined();
    expect(entities[0].profBonus).toBe(2);
    expect(entities[19].profBonus).toBe(6);
  });
});

describe('stepStatus', () => {
  it('marks Identity complete only with name + hit die + primary ability', () => {
    const incomplete = fakeFormGroup({ name: 'X', hitDie: undefined, primaryStat: [Stat.STR] });
    expect(stepStatus(WizardStep.Identity, incomplete, emptyWizardLevels())).toBe('incomplete');
    const complete = fakeFormGroup({ name: 'X', hitDie: 10, primaryStat: [Stat.STR] });
    expect(stepStatus(WizardStep.Identity, complete, emptyWizardLevels())).toBe('complete');
  });

  it('Features: incomplete when empty, warning when levels are missing, complete when dense', () => {
    const fg = fakeFormGroup({});
    const none = emptyWizardLevels();
    expect(stepStatus(WizardStep.Features, fg, none)).toBe('incomplete');
    const sparse: WizardLevels = { ...emptyWizardLevels(), features: { 1: [{ id: 'a', name: 'F', description: '' }] } };
    expect(stepStatus(WizardStep.Features, fg, sparse)).toBe('warning');
    const dense: WizardLevels = {
      ...emptyWizardLevels(),
      features: Object.fromEntries(Array.from({ length: 20 }, (_, i) => [i + 1, [{ id: `${i}`, name: 'F', description: '' }]])),
    };
    expect(stepStatus(WizardStep.Features, fg, dense)).toBe('complete');
  });

  it('Equipment: an empty choice row is not enough — it needs an entry or a kit item', () => {
    const emptyRow = fakeFormGroup({ equipmentChoices: [{ options: [{ entries: [] }, { entries: [] }] }] });
    expect(stepStatus(WizardStep.Equipment, emptyRow, emptyWizardLevels())).toBe('incomplete');
    const withEntry = fakeFormGroup({
      equipmentChoices: [{ options: [{ entries: [{ kind: 'item', name: 'Shield', qty: 1 }] }, { entries: [] }] }],
    });
    expect(stepStatus(WizardStep.Equipment, withEntry, emptyWizardLevels())).toBe('complete');
    const kitOnly = fakeFormGroup({ itemStart: ['Shield'] });
    expect(stepStatus(WizardStep.Equipment, kitOnly, emptyWizardLevels())).toBe('complete');
  });

  it('Spellcasting: complete once any caster card (including None) is picked', () => {
    const fg = fakeFormGroup({});
    expect(stepStatus(WizardStep.Spellcasting, fg, emptyWizardLevels())).toBe('incomplete');
    const picked = fakeFormGroup({ casterType: 0 });
    expect(stepStatus(WizardStep.Spellcasting, picked, emptyWizardLevels())).toBe('complete');
  });
});

describe('draft round-trip', () => {
  it('serialize → parse → hydrate restores form fields, levels and step', () => {
    const structuredChoice = {
      options: [
        { entries: [{ kind: 'item', name: 'Longsword', qty: 1 }, { kind: 'item', name: 'Shield', qty: 1 }] },
        { entries: [{ kind: 'item', name: 'Javelin', qty: 8 }, { kind: 'custom', name: '4 GP' }] },
      ],
    };
    const source = fakeFormGroup({
      name: 'Runeblade',
      hitDie: 10,
      primaryStat: [Stat.STR, Stat.CHA],
      equipmentChoices: [structuredChoice],
      spellsKnownMode: 'fixed',
    });
    const levels: WizardLevels = {
      ...emptyWizardLevels(),
      features: { 5: [{ id: 'f', name: 'Extra Attack', description: 'Attack twice.' }] },
    };
    const raw = serializeDraft(source, levels, WizardStep.Features);

    const draft = parseDraft(raw);
    expect(draft).not.toBeNull();
    expect(draft!.step).toBe(WizardStep.Features);
    expect(draft!.levels.features[5][0].name).toBe('Extra Attack');

    const target = fakeFormGroup({});
    hydrateDraft(target, draft!);
    expect(target.values.name).toBe('Runeblade');
    expect(target.values.hitDie).toBe(10);
    expect(target.values.primaryStat).toEqual([Stat.STR, Stat.CHA]);
    expect(target.values.equipmentChoices).toEqual([structuredChoice]);
  });

  it('migrates legacy {a,b} equipment rows in old drafts to structured custom entries', () => {
    const draft = parseDraft(JSON.stringify({
      v: 1,
      form: { equipmentChoices: [{ a: 'a martial weapon and a shield', b: 'two martial weapons' }] },
      levels: emptyWizardLevels(),
      step: WizardStep.Equipment,
    }));
    expect(draft).not.toBeNull();

    const target = fakeFormGroup({});
    hydrateDraft(target, draft!);
    expect(target.values.equipmentChoices).toEqual([{
      options: [
        { entries: [{ kind: 'custom', name: 'a martial weapon and a shield' }] },
        { entries: [{ kind: 'custom', name: 'two martial weapons' }] },
      ],
    }]);
  });

  it('rejects malformed or wrong-version payloads', () => {
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft('not json')).toBeNull();
    expect(parseDraft(JSON.stringify({ v: 99, form: {}, levels: emptyWizardLevels(), step: 0 }))).toBeNull();
  });
});
