import { Character } from "../../../../../models/character.model";
import { Class5E, Subclass, Race, Background, Item, MagicItem, Feat, Spell, WeaponMastery, Subrace } from "../../../../../models/generated";
import { srdItem,srdSubclass } from "../../../../../models/data/generated";
import Dexie from "dexie";

export class LocalDB extends Dexie {
  classes!: Dexie.Table<Class5E, 'name'>;
  subclasses!: Dexie.Table<srdSubclass, 'name'>; // unified store (v1 primary key 'name')
  races!: Dexie.Table<Race, 'name'>;
  subraces!: Dexie.Table<Subrace, 'name'>;
  backgrounds!: Dexie.Table<Background, 'name'>;
  items!: Dexie.Table<srdItem, 'name'>;
  magicItems!: Dexie.Table<MagicItem, 'name'>;
  feats!: Dexie.Table<Feat, 'name'>;
  spells!: Dexie.Table<Spell, 'name'>;
  weaponMasteries!: Dexie.Table<WeaponMastery, 'name'>;
  characters!: Dexie.Table<Character, 'name'>;
  isReady: boolean = false;
  initPromise: Promise<void>;
  
  constructor(name: string) {
      super(name);
      
      try {
        // v1 initial
        this.version(1).stores({
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
          characters: 'name'
        });
        // v2 (previously introduced subclasses_v2) is deprecated. Keep a no-op version to avoid downgrade conflicts.
        this.version(2).stores({
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
          characters: 'name'
        });
        // v3: migrate any data that might still live in deprecated subclasses_v2 back into subclasses then drop subclasses_v2.
        this.version(3).stores({
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
          characters: 'name'
        }).upgrade(tx => {
          // If coming from v2 schema, subclasses_v2 will exist; attempt migration.
          let migrated = 0;
          const legacyNewTable = tx.table('subclasses');
          // Guard: only attempt if subclasses_v2 exists in old schema
          const hasV2 = (tx as any).db?.tables?.some?.((t: any) => t.name === 'subclasses_v2');
          if (!hasV2) return Promise.resolve();
          const v2Table = tx.table('subclasses_v2');
          return v2Table.toArray().then(rows => Promise.all(rows.map(r => {
            // Ensure storage_key computed (keep for in-memory logic though DB key is still name)
            if (!r.storage_key && r.parent_class && r.name) {
              r.storage_key = `${r.parent_class.toLowerCase()}__${r.name.toLowerCase()}`;
            }
            return legacyNewTable.put(r).then(() => { migrated++; }).catch(()=>{});
          }))).then(() => {
          });
        });
        
        // Initialize database with better error handling
        this.initPromise = this.open()
          .then(() => {
            this.isReady = true;
          })
          .catch(err => {
            console.error(`Failed to open LocalDB ${name}:`, err);
            
            // If database is corrupted, attempt to delete and recreate it
            if (err.name === 'VersionError' || err.name === 'InvalidStateError') {
              console.warn(`Attempting to delete corrupted database: ${name}`);
              return Dexie.delete(name).then(() => {
                return this.open();
              }).then(() => {
                this.isReady = true;
              });
            }
            
            // Propagate the error if deletion/reopening failed
            throw err;
          });
      } catch (error) {
        console.error(`Critical error initializing database ${name}:`, error);
        this.initPromise = Promise.reject(error);
      }
    }
}