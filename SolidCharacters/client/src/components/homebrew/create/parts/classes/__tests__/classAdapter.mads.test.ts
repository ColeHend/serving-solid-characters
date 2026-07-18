import { describe, it, expect } from 'vitest';
import { toClass5E } from '../classAdapter';
import { buildLevelEntities, WizardLevels } from '../wizard/wizard.shared';
import type { ClassForm } from '../wizard/wizard.shared';

const baseForm = (overrides: Partial<ClassForm> = {}): ClassForm => ({
  name: 'Runeblade',
  description: '',
  hitDie: 10,
  primaryStat: [],
  savingThrows: [],
  armorProficiencies: [],
  weaponProficiencies: [],
  toolProficiencies: [],
  armorStart: [],
  weaponStart: [],
  itemStart: [],
  armorProfChoices: [],
  weaponProfChoices: [],
  toolProfChoices: [],
  skills: [],
  skillChoiceNum: 0,
  skillChoices: [],
  startingEquipment: [],
  equipmentChoices: [],
  spellCasting: false,
  classLevels: [],
  spellcastName: '',
  spellsKnownCalc: 0 as never,
  spellsKnownMode: 'fixed',
  spellsInfo: '',
  spellsLevel: 0,
  hasCantrips: false,
  ...overrides,
});

describe('toClass5E feature mads', () => {
  const mads = [{ command: 'AddStats', value: { stat: 'choice', options: 'str,con', amount: '1' }, type: 0, group: 0 }];
  const wizardLevels: WizardLevels = {
    features: {
      1: [{ id: 'f-plain', name: 'Runic Strike', description: 'Hit with runes.' }],
      4: [{ id: 'f-asi', name: 'Ability Score Improvement', description: 'Improve.', metadata: { mads } as never }],
    },
    classSpecific: {},
    cantripsKnown: {},
  };

  it('keeps feature ids and metadata.mads through the publish path', () => {
    const payload = toClass5E(baseForm(), {}, buildLevelEntities('Runeblade', wizardLevels));
    const asi = payload.features?.[4]?.[0] as { id?: string; metadata?: { mads?: unknown } };
    expect(asi?.id).toBe('f-asi');
    expect(asi?.metadata?.mads).toEqual(mads);
  });

  it('omits empty metadata objects on plain features', () => {
    const payload = toClass5E(baseForm(), {}, buildLevelEntities('Runeblade', wizardLevels));
    const plain = payload.features?.[1]?.[0] as { id?: string; metadata?: unknown };
    expect(plain?.id).toBe('f-plain');
    expect(plain?.metadata).toBeUndefined();
  });
});
