import { describe, it, expect } from 'vitest';
import {
  ItemsWizardStep,
  buildItemReviewRows,
  errorsForStep,
  itemStepStatus,
} from '../wizard/wizard.shared';
import type { DraftItem } from '../itemsStore';

const draft = (overrides: Partial<DraftItem> = {}): DraftItem => ({
  kind: 'Item',
  name: 'Rope',
  desc: '',
  cost: { quantity: 1, unit: 'GP' },
  weight: 0,
  tags: [],
  features: [],
  ...overrides,
});

const V = (...steps: ItemsWizardStep[]) => new Set<ItemsWizardStep>(steps);
const NONE: ReadonlySet<ItemsWizardStep> = new Set();

describe('errorsForStep', () => {
  it('buckets store validation messages onto their steps', () => {
    const errs = [
      'name: required',
      'cost: cannot be negative',
      'cost.unit: required',
      'weapon.damage: at least one entry',
      'weapon.damage[0].dice invalid',
      'armor.armorClass.base required',
      'features: duplicate Glow',
    ];
    expect(errorsForStep(ItemsWizardStep.Identity, errs)).toEqual([
      'name: required', 'cost: cannot be negative', 'cost.unit: required',
    ]);
    expect(errorsForStep(ItemsWizardStep.Details, errs)).toEqual([
      'weapon.damage: at least one entry', 'weapon.damage[0].dice invalid', 'armor.armorClass.base required',
    ]);
    expect(errorsForStep(ItemsWizardStep.Features, errs)).toEqual(['features: duplicate Glow']);
    expect(errorsForStep(ItemsWizardStep.Review, errs)).toEqual([]);
  });
});

describe('itemStepStatus', () => {
  it('is incomplete everywhere without a form', () => {
    expect(itemStepStatus(ItemsWizardStep.Identity, null, [], NONE)).toBe('incomplete');
    expect(itemStepStatus(ItemsWizardStep.Review, null, [], NONE)).toBe('incomplete');
  });

  it('Identity: incomplete until named, warns on identity errors, else complete', () => {
    expect(itemStepStatus(ItemsWizardStep.Identity, draft({ name: '' }), ['name: required'], NONE)).toBe('incomplete');
    expect(itemStepStatus(ItemsWizardStep.Identity, draft(), ['cost.unit: required'], NONE)).toBe('warning');
    expect(itemStepStatus(ItemsWizardStep.Identity, draft(), [], NONE)).toBe('complete');
  });

  it('Details: incomplete until visited, warns on weapon/armor errors', () => {
    expect(itemStepStatus(ItemsWizardStep.Details, draft(), [], NONE)).toBe('incomplete');
    expect(itemStepStatus(ItemsWizardStep.Details, draft(), [], V(ItemsWizardStep.Details))).toBe('complete');
    expect(itemStepStatus(ItemsWizardStep.Details, draft({ kind: 'Weapon' }), ['weapon.damage[0].dice invalid'], NONE)).toBe('warning');
    expect(itemStepStatus(ItemsWizardStep.Details, draft({ kind: 'Armor' }), ['armor.armorClass.base required'], V(ItemsWizardStep.Details))).toBe('warning');
  });

  it('Features: incomplete until visited or a feature exists; warns on duplicates', () => {
    expect(itemStepStatus(ItemsWizardStep.Features, draft(), [], NONE)).toBe('incomplete');
    expect(itemStepStatus(ItemsWizardStep.Features, draft(), [], V(ItemsWizardStep.Features))).toBe('complete');
    expect(itemStepStatus(ItemsWizardStep.Features, draft({ features: [{ name: 'Glow' } as never] }), [], NONE)).toBe('complete');
    expect(itemStepStatus(ItemsWizardStep.Features, draft(), ['features: duplicate Glow'], NONE)).toBe('warning');
  });

  it('Review: complete only when publishable', () => {
    expect(itemStepStatus(ItemsWizardStep.Review, draft(), [], NONE)).toBe('complete');
    expect(itemStepStatus(ItemsWizardStep.Review, draft(), ['name: required'], NONE)).toBe('incomplete');
  });
});

describe('buildItemReviewRows', () => {
  it('returns no rows without a form', () => {
    expect(buildItemReviewRows(null, [])).toEqual([]);
  });

  it('summarizes a weapon with damage, range and tags', () => {
    const form = draft({
      kind: 'Weapon',
      name: 'Sun Blade',
      weaponCategory: 'Martial',
      damage: [{ dice: '1d8', type: 'radiant', bonus: 2 }],
      range: { normal: 20, long: 60 },
      tags: ['Finesse', 'Light'],
    });
    const rows = buildItemReviewRows(form, []);
    expect(rows).toHaveLength(3);
    expect(rows[0].ok).toBe(true);
    expect(rows[0].summary).toContain('Sun Blade');
    expect(rows[0].summary).toContain('Weapon');
    expect(rows[1].summary).toContain('Martial · 1d8+2 radiant · range 20/60');
    expect(rows[1].summary).toContain('2 tags');
    expect(rows[2].summary).toContain('No features');
  });

  it('summarizes armor and flags steps that carry errors as fix rows', () => {
    const form = draft({
      kind: 'Armor',
      name: 'Plate',
      armorCategory: 'Heavy',
      armorClass: { base: 0, dexBonus: false, maxBonus: 0 },
      strMin: 15,
      stealthDisadvantage: true,
    });
    const rows = buildItemReviewRows(form, ['armor.armorClass.base required']);
    expect(rows[1].ok).toBe(false);
    expect(rows[1].action).toBe('fix');
    expect(rows[1].detail).toBe('armor.armorClass.base required');
    expect(rows[1].summary).toContain('Str 15');
    expect(rows[1].summary).toContain('stealth disadvantage');
  });

  it('omits tags from the Details summary for plain items', () => {
    const rows = buildItemReviewRows(draft({ tags: ['Consumable'] }), []);
    expect(rows[1].summary).toBe('Plain gear — no combat statistics');
  });

  it('marks an unnamed item as a fix row on Identity', () => {
    const rows = buildItemReviewRows(draft({ name: '' }), ['name: required']);
    expect(rows[0].ok).toBe(false);
    expect(rows[0].action).toBe('fix');
    expect(rows[0].summary).toContain('Unnamed item');
  });
});
