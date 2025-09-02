import { describe, it, expect, vi, beforeEach } from 'vitest';

// IMPORTANT: mock must come BEFORE importing itemsStore (which pulls in homebrewManager)
vi.mock('../../../../../../shared', async (orig) => {
  const actual: any = await orig();
  const hb: any[] = [];
  const mockMgr = {
    items: () => hb,
    addItem: vi.fn((item: any) => { hb.push(item); return Promise.resolve(); }),
    updateItem: vi.fn((item: any) => { const i = hb.findIndex(x => x.name === item.name); if (i>=0) hb[i]=item; else hb.push(item); return Promise.resolve(); })
  };
  return { ...actual, homebrewManager: mockMgr };
});

import { itemsStore } from '../itemsStore';

describe('itemsStore basic behavior', () => {
  beforeEach(() => {
  (itemsStore as any)._testReset();
  });

  it('blank new draft has validation errors (name required) until name set', () => {
    itemsStore.selectNew();
  expect(itemsStore.validate().some(e => /name: required/.test(e))).toBe(true);
    itemsStore.updateField('name', 'My Item');
  expect(itemsStore.validate().some(e => /name: required/.test(e))).toBe(false);
  });

  it('cost parsing & persistence round-trip embeds __draft blob', () => {
    itemsStore.selectNew();
    itemsStore.updateField('name', 'Copper Ring');
  itemsStore.mutate(d => { d.cost.quantity = 5; d.cost.unit = 'cp'; });
    const res = itemsStore.persist();
    expect(res.ok).toBe(true);
    const stored = itemsStore.state.homebrew['Copper Ring'];
    expect(stored).toBeTruthy();
    expect(stored.cost.toLowerCase()).toContain('5');
    expect(stored.properties.__draft).toBeTruthy();
    // ensure draft parse reconstructs cost structure
    itemsStore.select('Copper Ring');
    expect(itemsStore.state.form?.cost.quantity).toBe(5);
    expect(itemsStore.state.form?.cost.unit.toUpperCase()).toBe('CP');
  });

  it('weapon draft validation enforces damage dice format', () => {
    itemsStore.selectNew();
    itemsStore.updateField('name', 'Bad Sword');
    itemsStore.mutate(d => { d.kind = 'Weapon'; d.damage = [{ dice: '2x6', type: 'slashing' } as any]; });
  const errs = itemsStore.validate();
    expect(errs.some(e => /weapon\.damage\[0].dice/.test(e))).toBe(true);
    // fix dice
    itemsStore.mutate(d => { if (d.damage) d.damage[0].dice = '2d6'; });
  expect(itemsStore.validate().some(e => /weapon\.damage\[0].dice/.test(e))).toBe(false);
  });

  it('armor draft validation requires armorClass.base', () => {
    itemsStore.selectNew();
    itemsStore.updateField('name', 'Plate-ish');
    itemsStore.mutate(d => { d.kind = 'Armor'; d.armorClass = { base: 0, dexBonus: false, maxBonus: 0 }; });
  expect(itemsStore.validate().some(e => /armor\.armorClass.base required/.test(e))).toBe(true);
    itemsStore.mutate(d => { if (d.armorClass) d.armorClass.base = 18; });
  expect(itemsStore.validate().some(e => /armor\.armorClass.base required/.test(e))).toBe(false);
  });

  it('persist adds then update modifies existing', () => {
    itemsStore.selectNew();
    itemsStore.updateField('name', 'Updatable');
    const first = itemsStore.persist();
    expect(first.ok).toBe(true);
    itemsStore.mutate(d => { d.desc = 'A description'; });
    const second = itemsStore.persist();
    expect(second.ok).toBe(true);
    const stored = itemsStore.state.homebrew['Updatable'];
    expect(stored.desc).toBe('A description');
  });
});
