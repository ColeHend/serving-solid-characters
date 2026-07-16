import { describe, it, expect } from 'vitest';
import { toClass5E } from '../classAdapter';
import type { ClassForm } from '../wizard/wizard.shared';

// Only the equipment-choice serialization is under test; everything else stays default.
const baseForm = (overrides: Partial<ClassForm>): ClassForm => ({
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

describe('toClass5E equipment choices', () => {
  it('serializes structured options to comma-joined strings under equipment_N keys', () => {
    const payload = toClass5E(baseForm({
      equipmentChoices: [{
        options: [
          {
            entries: [
              { kind: 'item', name: 'Chain Mail', qty: 1 },
              { kind: 'item', name: 'Javelin', qty: 8 },
            ],
          },
          { entries: [{ kind: 'custom', name: '155 GP' }] },
          { entries: [] }, // empty option is dropped from the saved row
        ],
      }],
    }), {}, []);

    expect(payload.choices?.equipment_0).toEqual({
      amount: 1,
      options: ['Chain Mail, Javelin x8', '155 GP'],
    });
  });

  it('omits rows whose options are all empty and the key entirely when no rows exist', () => {
    const emptyRows = toClass5E(baseForm({
      equipmentChoices: [{ options: [{ entries: [] }, { entries: [] }] }],
    }), {}, []);
    expect(emptyRows.choices?.equipment_0).toBeUndefined();

    const none = toClass5E(baseForm({}), {}, []);
    expect(none.choices?.equipment_0).toBeUndefined();
  });
});
