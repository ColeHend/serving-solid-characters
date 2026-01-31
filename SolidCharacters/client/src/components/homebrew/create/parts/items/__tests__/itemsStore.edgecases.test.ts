import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock shared BEFORE import
vi.mock('../../../../../../shared', async (orig) => {
  const actual: any = await orig();
  const hb: any[] = [];
  return { ...actual, homebrewManager: {
    items: () => hb,
    addItem: vi.fn((i: any) => { hb.push(i); return Promise.resolve(); }),
    updateItem: vi.fn((i: any) => { const idx = hb.findIndex(x=>x.name===i.name); if (idx>=0) hb[idx]=i; else hb.push(i); return Promise.resolve(); })
  }};
});

import { itemsStore } from '../itemsStore';

// Helper to quickly craft drafts
function makeWeaponDraft(name='Blade', dice='1d6', type='slashing') {
  itemsStore.selectNew();
  itemsStore.updateField('name', name);
  itemsStore.mutate(d => { d.kind='Weapon'; d.damage=[{ dice, type }]; d.cost.quantity=1; d.cost.unit='GP'; });
}

function makeArmorDraft(name='Shell', base=12) {
  itemsStore.selectNew();
  itemsStore.updateField('name', name);
  itemsStore.mutate(d => { d.kind='Armor'; d.armorClass={ base, dexBonus:false, maxBonus:0 }; d.cost.quantity=0; d.cost.unit='GP'; });
}

describe('itemsStore edge cases', () => {
  beforeEach(()=> {
    (itemsStore as any)._testReset();
  });

  it('renaming existing homebrew removes stale old key', () => {
    makeWeaponDraft('OldName');
    const r1 = itemsStore.persist();
    expect(r1.ok).toBe(true);
    expect(Object.keys(itemsStore.state.homebrew)).toContain('OldName');
    // edit & rename
    itemsStore.select('OldName');
    itemsStore.updateField('name', 'NewName');
    const r2 = itemsStore.persist();
    expect(r2.ok).toBe(true);
    expect(Object.keys(itemsStore.state.homebrew)).toContain('NewName');
    expect(Object.keys(itemsStore.state.homebrew)).not.toContain('OldName');
  });

  it('duplicate name blocked when selecting new draft', () => {
    makeWeaponDraft('DupName');
    expect(itemsStore.persist().ok).toBe(true);
    itemsStore.selectNew();
    itemsStore.updateField('name', 'DupName');
    itemsStore.mutate(d=>{ d.kind='Item'; });
    const res = itemsStore.persist();
    expect(res.ok).toBe(false);
    expect(res.errs?.some(e=>/unique/.test(e))).toBe(true);
  });

  it('weapon requires at least one damage entry', () => {
    itemsStore.selectNew();
    itemsStore.updateField('name','NoDamage');
    itemsStore.mutate(d => { d.kind='Weapon'; d.damage=[]; });
    const errs = itemsStore.validate();
    expect(errs.some(e=>/weapon.damage: at least one entry/.test(e))).toBe(true);
  });

  it('invalid dice format flagged & then cleared', () => {
    makeWeaponDraft('Bad', '2x6');
    const errs = itemsStore.validate();
    expect(errs.some(e=>/dice invalid/.test(e))).toBe(true);
    itemsStore.mutate(d => { if (d.damage) d.damage[0].dice='2d6'; });
    expect(itemsStore.validate().some(e=>/dice invalid/.test(e))).toBe(false);
  });

  it('armor missing base ac flagged; fix clears error', () => {
    makeArmorDraft('Cloth', 0);
    expect(itemsStore.validate().some(e=>/armor\.armorClass\.base required/.test(e))).toBe(true);
    itemsStore.mutate(d => { if (d.armorClass) d.armorClass.base = 11; });
    expect(itemsStore.validate().some(e=>/armor\.armorClass\.base required/.test(e))).toBe(false);
  });

  it('modified detection tracks changes vs template', () => {
    makeWeaponDraft('Track');
    itemsStore.persist();
    itemsStore.select('Track');
    expect(itemsStore.isModified()).toBe(false);
    itemsStore.mutate(d => { d.cost.quantity = 99; });
    expect(itemsStore.isModified()).toBe(true);
  });

  it('blank new draft considered unmodified until edited', () => {
    itemsStore.selectNew();
    expect(itemsStore.isModified()).toBe(false);
    itemsStore.updateField('name','Something');
    expect(itemsStore.isModified()).toBe(true);
  });

  it('cost negative prevented by validation', () => {
    itemsStore.selectNew();
    itemsStore.updateField('name','NegCost');
    itemsStore.mutate(d => { d.cost.quantity = -5; });
    const errs = itemsStore.validate();
    expect(errs.some(e=>/cost: cannot be negative/.test(e))).toBe(true);
  });

  it('persist stores serialized __draft with features & tags intact', () => {
    makeWeaponDraft('SerWeapon');
    itemsStore.mutate(d => { d.tags=['Finesse','Light']; d.features=[{ name:'Edge', value:'Sharp', info:{ className:'', subclassName:'', level:0, type:'Item', other:'item' }, metadata:{} } as any]; });
    const res = itemsStore.persist();
    expect(res.ok).toBe(true);
    const stored = itemsStore.state.homebrew['SerWeapon'];
    expect(stored.properties.__draft).toBeTruthy();
    expect(JSON.parse(stored.properties.__draft).tags).toContain('Light');
  // Damage display string should exist
  expect(stored.properties.Damage).toBeTruthy();
  expect(String(stored.properties.Damage)).toMatch(/\d+d\d+\s+slashing/);
  });

  it('duplicate feature names produce validation error', () => {
    makeWeaponDraft('FeatDup');
    itemsStore.mutate(d => { d.features=[
      { name:'Edge', value:'One', info:{ className:'', subclassName:'', level:0, type:'Item', other:'item' }, metadata:{} } as any,
      { name:'Edge', value:'Two', info:{ className:'', subclassName:'', level:0, type:'Item', other:'item' }, metadata:{} } as any
    ]; });
    const errs = itemsStore.validate();
    expect(errs.some(e=>/features: duplicate Edge/.test(e))).toBe(true);
  });

  it('blank cost unit triggers validation error', () => {
    itemsStore.selectNew();
    itemsStore.updateField('name','NoUnit');
    itemsStore.mutate(d => { d.cost.unit=''; });
    expect(itemsStore.validate().some(e=>/cost.unit: required/.test(e))).toBe(true);
  });

  it('legacy draft blob restores fields', () => {
    // simulate stored item with __draft
    const draft = { kind:'Item', name:'LegacyThing', desc:'Old', cost:{ quantity:3, unit:'GP' }, tags:['Legacy'], features:[] };
    const stored = { id:1, name:'LegacyThing', desc:'Old', type:0, weight:1, cost:'3 GP', properties:{ __draft: JSON.stringify(draft) } } as any;
    (itemsStore as any)._testSetHomebrew({ LegacyThing: stored });
    itemsStore.select('LegacyThing');
    expect(itemsStore.state.form?.tags).toContain('Legacy');
    expect(itemsStore.state.form?.cost.quantity).toBe(3);
  });

  it('renaming to same name leaves only one key and not considered modified after persist', () => {
    makeArmorDraft('Samey', 15);
    itemsStore.persist();
    itemsStore.select('Samey');
    itemsStore.updateField('name','Samey');
    const res = itemsStore.persist();
    expect(res.ok).toBe(true);
    const keys = Object.keys(itemsStore.state.homebrew).filter(k=>k==='Samey');
    expect(keys.length).toBe(1);
    expect(itemsStore.isModified()).toBe(false);
  });

  it('default weight falls back to 0 in persisted item', () => {
    itemsStore.selectNew();
    itemsStore.updateField('name','Weightless');
    itemsStore.mutate(d=>{ d.cost.quantity=1; d.cost.unit='GP'; });
    const r = itemsStore.persist();
    expect(r.ok).toBe(true);
    expect(itemsStore.state.homebrew['Weightless'].weight).toBe(0);
  });

  it('setKind to Weapon seeds default damage entry & range', () => {
    itemsStore.selectNew();
    itemsStore.updateField('name','BladeTest');
    itemsStore.setKind('Weapon');
    expect(itemsStore.state.form?.damage?.length).toBeGreaterThan(0);
    expect(itemsStore.state.form?.damage?.[0].dice).toMatch(/\d+d\d+/);
    expect(itemsStore.state.form?.range).toBeTruthy();
    // switch to Item removes weapon specifics
    itemsStore.setKind('Item');
    expect(itemsStore.state.form?.damage).toBeUndefined();
    expect(itemsStore.state.form?.range).toBeUndefined();
  });

  it('setKind to Armor seeds armorClass and removes weapon fields', () => {
    itemsStore.selectNew();
    itemsStore.updateField('name','ArmorTest');
    itemsStore.setKind('Weapon');
    expect(itemsStore.state.form?.damage).toBeTruthy();
    itemsStore.setKind('Armor');
    expect(itemsStore.state.form?.armorClass?.base).toBeGreaterThan(0);
    expect(itemsStore.state.form?.damage).toBeUndefined();
  });

  it('re-seeding weapon defaults with force resets damage array', () => {
    itemsStore.selectNew();
    itemsStore.setKind('Weapon');
    // mutate damage to custom
    itemsStore.mutate(d => { d.damage![0].dice = '2d8'; });
    expect(itemsStore.state.form!.damage![0].dice).toBe('2d8');
    // force reseed
    itemsStore.setKind('Weapon', { force: true });
    expect(itemsStore.state.form!.damage![0].dice).toBe('1d6');
  });

  it('multi-switching Item -> Weapon -> Armor -> Weapon yields fresh weapon defaults', () => {
    itemsStore.selectNew();
    itemsStore.setKind('Weapon');
    itemsStore.mutate(d => { d.damage![0].dice = '1d4'; d.range!.normal = 30; });
    itemsStore.setKind('Armor');
    expect(itemsStore.state.form!.damage).toBeUndefined();
    itemsStore.setKind('Weapon'); // switching back should seed if previous weapon data was removed
    expect(itemsStore.state.form!.damage?.length).toBe(1);
    expect(itemsStore.state.form!.damage![0].dice).toBe('1d6');
    expect(itemsStore.state.form!.range?.normal).toBe(0);
  });

  it('selecting two different parsed SRD items updates kind-specific fields correctly', () => {
    // Simulate SRD items: Longsword (weapon) and Leather Armor (armor)
    (itemsStore as any)._testSetSrd({
      Longsword: { id:1, name:'Longsword', desc:'', type:0, weight:3, cost:'15 gp', properties:{ Damage:'1d8 slashing (Versatile 1d10)', Properties:'Versatile' } },
      'Leather Armor': { id:3, name:'Leather Armor', desc:'', type:1, weight:10, cost:'10 gp', properties:{ AC:'11 + Dexterity modifier', Stealth:'No disadvantage', StrengthReq:'None' } }
    });
    itemsStore.select('Longsword');
    expect(itemsStore.state.form?.kind).toBe('Weapon');
    expect(itemsStore.state.form?.damage?.[0].dice).toBe('1d8');
    itemsStore.select('Leather Armor');
    expect(itemsStore.state.form?.kind).toBe('Armor');
    expect(itemsStore.state.form?.armorClass?.base).toBe(11);
  });

  it('repeated selection across enums with conflicting numeric ordering correctly re-infers kind', () => {
    // Here we intentionally use numeric types from BOTH enum orderings and also rely on heuristics.
    (itemsStore as any)._testSetSrd({
      Bow: { id:10, name:'Bow', desc:'', type:1, weight:2, cost:'25 gp', properties:{ Damage:'1d6 piercing', Properties:'Ammunition (range 80/320)' } }, // alt enum (1=Weapon)
      Shield: { id:11, name:'Shield', desc:'', type:2, weight:6, cost:'10 gp', properties:{ AC:'2', StrengthReq:'None' } }, // alt enum (2=Armor)
      Hammer: { id:12, name:'Hammer', desc:'', type:0, weight:3, cost:'10 gp', properties:{ Damage:'1d4 bludgeoning' } }, // alt enum 0 (AdventuringGear) but Damage heuristic => Weapon
      Padded: { id:13, name:'Padded', desc:'', type:3, weight:8, cost:'5 gp', properties:{ AC:'11 + Dexterity modifier' } } // primary enum 3=Item but AC heuristic -> Armor
    });
    itemsStore.select('Bow');
    expect(itemsStore.state.form?.kind).toBe('Weapon');
    itemsStore.select('Shield');
    expect(itemsStore.state.form?.kind).toBe('Armor');
    itemsStore.select('Hammer');
    expect(itemsStore.state.form?.kind).toBe('Weapon');
    itemsStore.select('Padded');
    expect(itemsStore.state.form?.kind).toBe('Armor');
  });

  it('parses weapon Properties into tags and seeds fallback damage when missing, without breaking subsequent armor selection', () => {
    (itemsStore as any)._testSetSrd({
      MysteryBow: { id:30, name:'MysteryBow', desc:'', type:3, weight:2, cost:'25 gp', properties:{ Properties:'Ammunition (range 90/360), Two-Handed', Damage:'1d8 piercing' } },
      PlainArmor: { id:31, name:'PlainArmor', desc:'', type:3, weight:15, cost:'20 gp', properties:{ AC:'12 + Dexterity modifier' } }
    });
    itemsStore.select('MysteryBow');
    expect(itemsStore.state.form?.kind).toBe('Weapon');
    expect(itemsStore.state.form?.tags).toEqual(expect.arrayContaining(['Ammunition','Two-Handed']));
    expect(itemsStore.state.form?.range?.normal).toBe(90);
    itemsStore.select('PlainArmor');
    expect(itemsStore.state.form?.kind).toBe('Armor');
    expect(itemsStore.state.form?.armorClass?.base).toBe(12);
  });

  it('selection cleaning removes stale weapon fields when switching to armor via select', () => {
    (itemsStore as any)._testSetSrd({
      Axe: { id:50, name:'Axe', desc:'', type:0, weight:3, cost:'8 gp', properties:{ Damage:'1d6 slashing' } },
      Plate: { id:51, name:'Plate', desc:'', type:1, weight:65, cost:'1500 gp', properties:{ AC:'18', StrengthReq:'Str 15', Stealth:'Disadvantage' } }
    });
    itemsStore.select('Axe');
    expect(itemsStore.state.form?.kind).toBe('Weapon');
    expect(itemsStore.state.form?.damage).toBeTruthy();
    itemsStore.select('Plate');
    expect(itemsStore.state.form?.kind).toBe('Armor');
    expect(itemsStore.state.form?.damage).toBeUndefined();
    expect(itemsStore.state.form?.armorClass?.base).toBe(18);
  });

  it('selection cleaning removes stale armor fields when switching to weapon via select', () => {
    (itemsStore as any)._testSetSrd({
      Leather: { id:60, name:'Leather', desc:'', type:1, weight:10, cost:'10 gp', properties:{ AC:'11 + Dexterity modifier' } },
      Dagger: { id:61, name:'Dagger', desc:'', type:0, weight:1, cost:'2 gp', properties:{ Damage:'1d4 piercing', Properties:'Finesse, Light, Thrown (range 20/60)' } }
    });
    itemsStore.select('Leather');
    expect(itemsStore.state.form?.kind).toBe('Armor');
    expect(itemsStore.state.form?.armorClass?.base).toBe(11);
    itemsStore.select('Dagger');
    expect(itemsStore.state.form?.kind).toBe('Weapon');
    expect(itemsStore.state.form?.armorClass).toBeUndefined();
    expect(itemsStore.state.form?.damage?.[0].dice).toBe('1d4');
  });
});
