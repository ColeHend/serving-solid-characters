import { Class5E, Subclass, Race, Background, Item, MagicItem, Feat, Spell, WeaponMastery, Subrace } from "../../../../../models/data";
import Dexie from "dexie";

export class LocalDB extends Dexie {
  classes!: Dexie.Table<Class5E, 'name'>;
  subclasses!: Dexie.Table<Subclass, 'name'>;
  races!: Dexie.Table<Race, 'name'>;
  subraces!: Dexie.Table<Subrace, 'name'>;
  backgrounds!: Dexie.Table<Background, 'name'>;
  items!: Dexie.Table<Item, 'name'>;
  magicItems!: Dexie.Table<MagicItem, 'name'>;
  feats!: Dexie.Table<Feat, 'name'>;
  spells!: Dexie.Table<Spell, 'name'>;
  weaponMasteries!: Dexie.Table<WeaponMastery, 'name'>;
  isReady: boolean = false;
  initPromise: Promise<void>;
  constructor(name: string) {
      super(name);
      
      console.log(`Initializing LocalDB: ${name}`);
      
      try {
        this.version(1).stores({
          spells: 'name',
          classes: 'name',
          races: 'name',
          backgrounds: 'name',
          items: 'name',
          feats: 'name',
          magicItems: 'name',
          subclasses: 'name',
          weaponMasteries: 'name'
        });
        
        // Initialize database with better error handling
        this.initPromise = this.open()
          .then(() => {
            console.log(`LocalDB ${name} opened successfully`);
            this.isReady = true;
          })
          .catch(err => {
            console.error(`Failed to open LocalDB ${name}:`, err);
            
            // If database is corrupted, attempt to delete and recreate it
            if (err.name === 'VersionError' || err.name === 'InvalidStateError') {
              console.warn(`Attempting to delete corrupted database: ${name}`);
              return Dexie.delete(name).then(() => {
                console.log(`Deleted corrupted database ${name}, reopening...`);
                return this.open();
              }).then(() => {
                console.log(`LocalDB ${name} reopened successfully after deletion`);
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