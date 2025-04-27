import Dexie from 'dexie';
import { Spell } from "../../../../../models/old/spell.model";
import { DnDClass } from "../../../../../models/old/class.model";
import { Race } from "../../../../../models/old/race.model";
import { Background } from "../../../../../models/old/background.model";
import { Item } from "../../../../../models/old/items.model";
import { Feat } from "../../../../../models/old/feat.model";

class LocalDB extends Dexie {
  spells!: Dexie.Table<Spell, 'name'>;
  classes!: Dexie.Table<DnDClass, 'name'>;
  races!: Dexie.Table<Race, 'name'>;
  backgrounds!: Dexie.Table<Background, 'name'>;
  items!: Dexie.Table<Item, 'name'>;
  feats!: Dexie.Table<Feat, 'name'>;
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
        feats: 'name'
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
  
  // Override table methods to ensure database is ready before operations
  async safeOperation<T>(tableName: string, operation: () => Promise<T>): Promise<T> {
    try {
      await this.initPromise;
      return await operation();
    } catch (error) {
      console.error(`Error in ${tableName} operation:`, error);
      throw error;
    }
  }
}
    
export default LocalDB;