import { Character } from "../../../../../models/character.model";
import { Class5E, Subclass, Race, Background, Item, MagicItem, Feat, Spell, WeaponMastery, Subrace, Monster, Rule } from "../../../../../models/generated";
import { srdItem,srdSubclass } from "../../../../../models/data/generated";
import { createNewId } from "../../tools/idGen";
import Dexie from "dexie";

export class LocalDB extends Dexie {
  classes!: Dexie.Table<Class5E, 'name'>;
  // Keyed by storage_key (parentClass__name) since v13 — same-named subclasses under
  // different parent classes must coexist (v10-v13 migrate the old name-keyed store).
  subclasses!: Dexie.Table<srdSubclass, string>;
  races!: Dexie.Table<Race, 'name'>;
  // Second type param is the primary-key TYPE (the key is the `name` field, a string).
  subraces!: Dexie.Table<Subrace, string>;
  backgrounds!: Dexie.Table<Background, 'name'>;
  items!: Dexie.Table<srdItem, 'name'>;
  magicItems!: Dexie.Table<MagicItem, 'name'>;
  feats!: Dexie.Table<Feat, 'name'>;
  spells!: Dexie.Table<Spell, 'name'>;
  weaponMasteries!: Dexie.Table<WeaponMastery, 'name'>;
  monsters!: Dexie.Table<Monster, 'name'>;
  rules!: Dexie.Table<Rule, 'name'>;
  // Keyed by the character's own id since v9 (v6-v9 migrate the old name-keyed store).
  characters!: Dexie.Table<Character, string>;
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
        // v4: add monsters + rules SRD stores (additive; existing data preserved). Both are keyed by 'name'
        // like every other SRD table. Applies to SrdDB (dnd_srd) and SrdDB2024 (dnd_srd_2024) alike.
        this.version(4).stores({
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
          characters: 'name'
        });

        // v5: id-based subclass→class refs. Homebrew classes historically lacked ids (the table is
        // keyed by name); mint one for any id-less class, then stamp subclass.parentClassId from the
        // same DB's classes by name. SRD DBs pass through mostly untouched — their classes already
        // carry ids, and parent_class_id arrives with the next SRD re-fetch; this backfill just
        // repairs stale caches. Subclasses whose parent lives in ANOTHER DB (a homebrew subclass of
        // an SRD class) stay id-less here and match by name until re-saved.
        this.version(5).stores({
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
          characters: 'name'
        }).upgrade(async tx => {
          const classTable = tx.table('classes');
          const classes = await classTable.toArray();
          for (const c of classes) {
            if (!c.id) {
              c.id = createNewId();
              await classTable.put(c);
            }
          }
          const idByName = new Map<string, string>(
            classes.map((c: { name?: string; id?: string }) => [String(c.name ?? '').toLowerCase(), String(c.id ?? '')]));
          const subTable = tx.table('subclasses');
          const subs = await subTable.toArray();
          for (const s of subs) {
            if (s.parentClassId) continue;
            const pid = idByName.get(String(s.parentClass ?? '').toLowerCase());
            if (pid) {
              s.parentClassId = pid;
              await subTable.put(s);
            }
          }
        });

        // v6-v9: re-key the characters store by the character's own `id` (minted here for
        // existing saves). IndexedDB can't change a store's primary key in place, so this is
        // the canonical Dexie dance: copy into a temp id-keyed store, drop the old store,
        // recreate it id-keyed, copy back, drop the temp. Only dnd_characters holds rows —
        // the SRD DBs' empty characters stores migrate as no-ops. Upgrades never throw
        // (a throw would trip the corrupted-DB fallback below and wipe the database);
        // malformed rows are skipped instead.
        this.version(6).stores({
          characters_tmp: 'id'
        }).upgrade(async tx => {
          try {
            const rows = await tx.table('characters').toArray();
            const tmp = tx.table('characters_tmp');
            for (const row of rows) {
              try {
                if (!row || typeof row !== 'object') continue;
                if (!row.id) row.id = createNewId();
                await tmp.put(row);
              } catch (err) {
                console.error('characters id migration (v6): skipped a row', err);
              }
            }
          } catch (err) {
            console.error('characters id migration (v6) failed', err);
          }
        });
        this.version(7).stores({
          characters: null
        });
        this.version(8).stores({
          characters: 'id'
        }).upgrade(async tx => {
          try {
            const rows = await tx.table('characters_tmp').toArray();
            const chars = tx.table('characters');
            for (const row of rows) {
              try {
                await chars.put(row);
              } catch (err) {
                console.error('characters id migration (v8): skipped a row', err);
              }
            }
          } catch (err) {
            console.error('characters id migration (v8) failed', err);
          }
        });
        this.version(9).stores({
          characters_tmp: null
        });

        // v10-v13: re-key the subclasses store by storage_key (parentClass__name). The store
        // was name-keyed since v1, so two same-named subclasses under different parent classes
        // silently overwrote each other on `.put`. Same temp-store dance as characters v6-v9;
        // runs in all three DBs (SRD rows get storage_key computed here, and the SRD loader
        // stamps it on rows written after this). Upgrades never throw (a throw would trip the
        // corrupted-DB fallback below and wipe the database); malformed rows are skipped.
        this.version(10).stores({
          subclasses_tmp: 'storage_key'
        }).upgrade(async tx => {
          try {
            const rows = await tx.table('subclasses').toArray();
            const tmp = tx.table('subclasses_tmp');
            for (const row of rows) {
              try {
                if (!row || typeof row !== 'object') continue;
                if (!row.storage_key) {
                  // Legacy rows (deprecated subclasses_v2 era) may carry snake_case parent_class.
                  const parent = row.parentClass ?? row.parent_class ?? '';
                  if (!parent && !row.name) continue;
                  row.storage_key = `${String(parent).toLowerCase()}__${String(row.name ?? '').toLowerCase()}`;
                }
                await tmp.put(row);
              } catch (err) {
                console.error('subclasses re-key migration (v10): skipped a row', err);
              }
            }
          } catch (err) {
            console.error('subclasses re-key migration (v10) failed', err);
          }
        });
        this.version(11).stores({
          subclasses: null
        });
        this.version(12).stores({
          subclasses: 'storage_key'
        }).upgrade(async tx => {
          try {
            const rows = await tx.table('subclasses_tmp').toArray();
            const subs = tx.table('subclasses');
            for (const row of rows) {
              try {
                await subs.put(row);
              } catch (err) {
                console.error('subclasses re-key migration (v12): skipped a row', err);
              }
            }
          } catch (err) {
            console.error('subclasses re-key migration (v12) failed', err);
          }
        });
        this.version(13).stores({
          subclasses_tmp: null
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