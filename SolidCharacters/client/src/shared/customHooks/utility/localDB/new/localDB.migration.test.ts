import { describe, it, expect } from 'vitest';
import Dexie from 'dexie';
import { LocalDB } from './localDB';

// The pre-v10 cumulative schema: every catalog store name-keyed, characters id-keyed (v9).
const V9_STORES = {
  spells: 'name',
  classes: 'name',
  races: 'name',
  subraces: 'name',
  backgrounds: 'name',
  items: 'name',
  feats: 'name',
  magicItems: 'name',
  subclasses: 'name',
  weaponMasteries: 'name',
  monsters: 'name',
  rules: 'name',
  characters: 'id',
};

describe('LocalDB v10-v13 subclasses re-key migration', () => {
  it('re-keys name-keyed subclass rows to storage_key, computing missing keys', async () => {
    const dbName = 'migration-test-v9';
    const old = new Dexie(dbName);
    old.version(9).stores(V9_STORES);
    await old.open();
    await old.table('subclasses').bulkPut([
      { name: 'Champion', parentClass: 'Fighter', description: '', features: {} },
      { name: 'Berserker', parentClass: 'Barbarian', description: '', features: {}, storage_key: 'barbarian__berserker' },
      // Legacy subclasses_v2-era row with a snake_case parent link and no storage_key.
      { name: 'Old Guard', parent_class: 'Paladin', description: '', features: {} },
    ]);
    old.close();

    const db = new LocalDB(dbName);
    try {
      await db.initPromise;
      expect(db.verno).toBeGreaterThanOrEqual(13);
      const rows = await db.subclasses.toArray();
      expect(rows).toHaveLength(3);
      const byName = Object.fromEntries(rows.map(r => [r.name, r as { storage_key?: string }]));
      expect(byName['Champion'].storage_key).toBe('fighter__champion');
      expect(byName['Berserker'].storage_key).toBe('barbarian__berserker');
      expect(byName['Old Guard'].storage_key).toBe('paladin__old guard');

      // The re-keyed store accepts same-named rows under different parents (the original bug).
      await db.subclasses.put({ name: 'Champion', parentClass: 'Ranger', description: '', features: {}, storage_key: 'ranger__champion' } as never);
      expect((await db.subclasses.toArray()).filter(r => r.name === 'Champion')).toHaveLength(2);
    } finally {
      db.close();
      await Dexie.delete(dbName);
    }
  });

  it('creates a fresh DB directly at the cumulative v13 schema', async () => {
    const dbName = 'migration-test-fresh';
    const db = new LocalDB(dbName);
    try {
      await db.initPromise;
      await db.subclasses.put({ name: 'Twin', parentClass: 'Monk', description: '', features: {}, storage_key: 'monk__twin' } as never);
      await db.subclasses.put({ name: 'Twin', parentClass: 'Druid', description: '', features: {}, storage_key: 'druid__twin' } as never);
      expect(await db.subclasses.count()).toBe(2);
    } finally {
      db.close();
      await Dexie.delete(dbName);
    }
  });
});
