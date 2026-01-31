import { describe, it, expect, beforeEach, vi } from 'vitest';
import homebrewManager from '../homebrewManager';
import { Class5E, Item, Feat, Spell, Background, Race } from '../../../models/data';
import { ItemType } from '../../../models/data/items';

// Mock snackbar to avoid DOM side-effects
vi.mock('../../components/Snackbar/snackbar', () => ({
  default: (args: any) => args // noop
}));

// Helper to wait for async Dexie + observable finalize cycles
const tick = () => new Promise(res => setTimeout(res, 0));

describe('homebrewManager (5E internal types)', () => {
  beforeEach(async () => {
    await homebrewManager.resetSystem();
  });

  function sampleClass(name = 'TestClass'): Class5E {
    return {
      id: 0,
      name,
      hit_die: 'd8',
      primary_ability: 'STR',
      saving_throws: ['STR','CON'],
      starting_equipment: [],
      proficiencies: { armor: [], weapons: [], tools: [], skills: [] },
    };
  }

  function sampleItem(id = 1, name = 'Sword'): Item {
    return { id, name, desc: 'Sharp blade', type: ItemType.Weapon, weight: 3, cost: '10 gp', properties: {} };
  }
  function sampleFeat(name = 'Alert'): Feat {
    return { name, details: { name, description: 'Always ready' }, prerequisites: [] } as any;
  }
  function sampleSpell(name = 'Zap'): Spell {
    return { id: name, name, description: 'Zaps a foe', duration: 'Instant', is_concentration: false, level: 1, range: '60 ft', is_ritual: false, school: 'Evocation', castingTime: '1 action', damageType: 'Lightning', page: 'HB p.1', components: 'V,S', isMaterial: false, isSomatic: true, isVerbal: true, higherLevel: '', classes: [], subClasses: [] };
  }
  function sampleBackground(name = 'Sailor'): Background {
    return { name, desc: 'Sea life', proficiencies: { armor: [], weapons: [], tools: [], skills: [] }, startEquipment: [], features: [] };
  }
  function sampleRace(id = 'elf-id', name = 'Elf'): Race {
    return { id, name, size: 'Medium', speed: 30, languages: [], abilityBonuses: [], traits: [], abilityBonusChoice: undefined, languageChoice: undefined, traitChoice: undefined } as Race;
  }

  it('adds a new class', async () => {
    await homebrewManager.addClass(sampleClass());
    expect(homebrewManager.classes().some(c => c.name === 'TestClass')).toBe(true);
  });

  it('prevents duplicate class add by name', async () => {
    await homebrewManager.addClass(sampleClass());
    await homebrewManager.addClass(sampleClass());
    const count = homebrewManager.classes().filter(c => c.name === 'TestClass').length;
    expect(count).toBe(1);
  });

  it('updates an existing class', async () => {
    await homebrewManager.addClass(sampleClass());
    await homebrewManager.updateClass({ ...sampleClass(), primary_ability: 'INT' });
    const updated = homebrewManager.classes().find(c => c.name === 'TestClass');
    expect(updated?.primary_ability).toBe('INT');
  });

  it('adds & updates an item', async () => {
    await homebrewManager.addItem(sampleItem());
    expect(homebrewManager.items().some(i => i.name === 'Sword')).toBe(true);
    await homebrewManager.updateItem({ ...sampleItem(), weight: 4 });
    expect(homebrewManager.items().find(i => i.name === 'Sword')?.weight).toBe(4);
  });

  it('prevents duplicate item add', async () => {
    await homebrewManager.addItem(sampleItem());
    await homebrewManager.addItem(sampleItem());
    expect(homebrewManager.items().filter(i => i.name === 'Sword').length).toBe(1);
  });

  it('adds & updates a feat (mapped via details)', async () => {
    await homebrewManager.addFeat(sampleFeat());
    expect(homebrewManager.feats().some(f => f.details?.name === 'Alert')).toBe(true);
    await homebrewManager.updateFeat({ ...sampleFeat(), details: { name: 'Alert', description: 'Always really ready' } } as any);
    expect(homebrewManager.feats().find(f => f.details.name === 'Alert')?.details.description).toContain('really');
  });

  it('handles legacy feat shape without details', async () => {
    await homebrewManager.resetSystem();
    // Simulate directly inserting a legacy feat object (as older code might have stored)
    const legacyFeat: any = { name: 'Legacy Feat', desc: ['Legacy description'], prerequisites: [] };
    // Bypass addFeat (which expects details) by pushing into internal signal via addFeat then manual replace
    await homebrewManager.addFeat({ details: { name: 'Temp', description: 'x'}, prerequisites: [] } as any);
    // Replace stored feat with legacy shape
    (homebrewManager as any)._setFeats([legacyFeat]);
    const found = homebrewManager.feats().find(f => f.details?.name === 'Legacy Feat');
    expect(found?.details.description).toContain('Legacy');
  });

  it('adds, updates & removes a spell', async () => {
    await homebrewManager.addSpell(sampleSpell());
    expect(homebrewManager.spells().some(s => s.name === 'Zap')).toBe(true);
    await homebrewManager.updateSpell({ ...sampleSpell(), description: 'Big zap' });
    expect(homebrewManager.spells().find(s => s.name === 'Zap')?.description).toBe('Big zap');
    await homebrewManager.removeSpell('Zap');
    expect(homebrewManager.spells().some(s => s.name === 'Zap')).toBe(false);
  });

  it('adds, updates & removes a background', async () => {
    await homebrewManager.addBackground(sampleBackground());
    expect(homebrewManager.backgrounds().some(b => b.name === 'Sailor')).toBe(true);
    await homebrewManager.updateBackground({ ...sampleBackground(), desc: 'Sea life veteran' } as any);
    expect(homebrewManager.backgrounds().find(b => b.name === 'Sailor')?.desc).toContain('veteran');
    await homebrewManager.removeBackground('Sailor');
    expect(homebrewManager.backgrounds().some(b => b.name === 'Sailor')).toBe(false);
  });

  it('adds, updates & removes a race', async () => {
    await homebrewManager.addRace(sampleRace());
    expect(homebrewManager.races().some(r => r.name === 'Elf')).toBe(true);
    await homebrewManager.updateRace({ ...sampleRace(), speed: 35 } as any);
    expect(homebrewManager.races().find(r => r.name === 'Elf')?.speed).toBe(35);
    await homebrewManager.removeRace('Elf');
    expect(homebrewManager.races().some(r => r.name === 'Elf')).toBe(false);
  });
});
