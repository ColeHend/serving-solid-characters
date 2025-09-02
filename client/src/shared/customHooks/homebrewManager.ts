// New implementation using 5E data model types while keeping legacy-compatible accessors.
import { Observable, take, tap, of, concatMap, catchError, finalize, endWith } from "rxjs";
import { Accessor, Setter, createSignal } from "solid-js";
import { Class5E, Item, Feat, Spell, Background, Race, Subclass } from "../../models/data";
import HombrewDB from "./utility/localDB/new/homebrewDB";
import httpClient$ from "./utility/tools/httpClientObs";
import { Clone } from "./utility/tools/Tools";
import addSnackbar from "../components/Snackbar/snackbar";

// Mapping helpers to expose legacy-ish shapes (hitDie, name, desc at root) if UI still expects them.
const mapClass = (c: Class5E) => ({ ...c, hitDie: c.hit_die?.startsWith('d') ? Number(c.hit_die.slice(1)) : undefined });
const mapFeat = (f: Feat) => ({ ...f, name: f.details.name, desc: f.details.description });
const mapItem = (i: Item) => ({ ...i });
const mapBackground = (b: Background) => ({ ...b, startingEquipment: b.startEquipment });
const mapRace = (r: Race) => ({ ...r });

class HomebrewManager {
  // Internal signals (new types)
  private _classes: Accessor<Class5E[]>; private _setClasses: Setter<Class5E[]>;
  private _items: Accessor<Item[]>; private _setItems: Setter<Item[]>;
  private _feats: Accessor<Feat[]>; private _setFeats: Setter<Feat[]>;
  private _spells: Accessor<Spell[]>; private _setSpells: Setter<Spell[]>;
  private _backgrounds: Accessor<Background[]>; private _setBackgrounds: Setter<Background[]>;
  private _races: Accessor<Race[]>; private _setRaces: Setter<Race[]>;
  private _subclasses: Accessor<Subclass[]>; private _setSubclasses: Setter<Subclass[]>;

  // Public accessors (legacy-compatible)
  public classes: Accessor<any[]>;
  public items: Accessor<any[]>;
  public feats: Accessor<any[]>;
  public spells: Accessor<Spell[]>;
  public backgrounds: Accessor<any[]>;
  public races: Accessor<any[]>;
  public subclasses: Accessor<Subclass[]>;

  private homebrewClasses$: Observable<Class5E[]> = httpClient$.toObservable(HombrewDB.classes.toArray());
  private homebrewItems$: Observable<Item[]> = httpClient$.toObservable(HombrewDB.items.toArray());
  private homebrewFeats$: Observable<Feat[]> = httpClient$.toObservable(HombrewDB.feats.toArray());
  private homebrewSpells$: Observable<Spell[]> = httpClient$.toObservable(HombrewDB.spells.toArray());
  private homebrewBackgrounds$: Observable<Background[]> = httpClient$.toObservable(HombrewDB.backgrounds.toArray());
  private homebrewRaces$: Observable<Race[]> = httpClient$.toObservable(HombrewDB.races.toArray());
  private homebrewSubclasses$: Observable<Subclass[]> = httpClient$.toObservable(
    (async () => {
      try {
        const rows = await HombrewDB.subclasses.toArray().catch(()=>[]);
        rows.forEach(r => {
          if (!r.storage_key && r.parent_class && r.name) {
            (r as any).storage_key = `${r.parent_class.toLowerCase()}__${r.name.toLowerCase()}`;
          }
        });
        return rows as Subclass[];
      } catch { return []; }
    })()
  );

  constructor(classes: Class5E[] = [], items: Item[] = [], feats: Feat[] = [], spells: Spell[] = [], backgrounds: Background[] = [], races: Race[] = [], subclasses: Subclass[] = []) {
    [this._classes, this._setClasses] = createSignal(classes);
    [this._items, this._setItems] = createSignal(items);
    [this._feats, this._setFeats] = createSignal(feats);
    [this._spells, this._setSpells] = createSignal(spells);
    [this._backgrounds, this._setBackgrounds] = createSignal(backgrounds);
    [this._races, this._setRaces] = createSignal(races);
  [this._subclasses, this._setSubclasses] = createSignal(subclasses);

    // Public mapped accessors
    this.classes = () => this._classes().map(mapClass);
    this.items = () => this._items().map(mapItem);
    this.feats = () => this._feats().map(mapFeat);
    this.spells = this._spells; // spells already similar
    this.backgrounds = () => this._backgrounds().map(mapBackground);
    this.races = () => this._races().map(mapRace);
  this.subclasses = this._subclasses; // already correct shape for new model

    // Load persisted
    this.homebrewClasses$.pipe(take(1), tap(c => this._setClasses(old => [...old, ...c]))).subscribe();
    this.homebrewItems$.pipe(take(1), tap(i => this._setItems(old => [...old, ...i]))).subscribe();
    this.homebrewFeats$.pipe(take(1), tap(f => this._setFeats(old => [...old, ...f]))).subscribe();
    this.homebrewSpells$.pipe(take(1), tap(s => this._setSpells(old => [...old, ...s]))).subscribe();
    this.homebrewBackgrounds$.pipe(take(1), tap(b => this._setBackgrounds(old => [...old, ...b]))).subscribe();
    this.homebrewRaces$.pipe(take(1), tap(r => this._setRaces(old => [...old, ...r]))).subscribe();
  this.homebrewSubclasses$.pipe(take(1), tap(sc => this._setSubclasses(old => [...old, ...sc]))).subscribe();
  }

  public async resetSystem() {
    try {
      await HombrewDB.initPromise; // ensure DB is ready
      await Promise.all([
        HombrewDB.classes.clear(),
        HombrewDB.items.clear(),
        HombrewDB.feats.clear(),
        HombrewDB.spells.clear(),
        HombrewDB.backgrounds.clear(),
  HombrewDB.races.clear(),
  HombrewDB.subclasses.clear(),
  // best-effort clear deprecated store if still present
	(HombrewDB as any).subclasses_v2 ? (HombrewDB as any).subclasses_v2.clear() : Promise.resolve()
  ].map(p => p.catch((e: unknown) => console.warn('clear table failed', e))));
    } catch (e) {
      // ignore
    }
  this._setClasses([]); this._setItems([]); this._setFeats([]); this._setSpells([]); this._setBackgrounds([]); this._setRaces([]); this._setSubclasses([]);
  }

  // Classes (Class5E)
  public addClass = (newClass: Class5E): Promise<void> => {
    if (this._classes().some(c => c.name === newClass.name)) return Promise.resolve();
    return new Promise(resolve => {
      this.addClassToDB(Clone(newClass)).subscribe({ complete: () => resolve(), error: () => resolve() });
    });
  }
  private addClassToDB = (newClass: Class5E) => {
    let failed = false;
    return httpClient$.toObservable(HombrewDB.classes.add(newClass)).pipe(
      take(1),
      catchError(err => { console.error(err); failed = true; addSnackbar({ message: "Error adding class to database", severity: "error" }); return of(null) }),
      finalize(() => { if (!failed) { this._setClasses(o => [...o, newClass]); addSnackbar({ message: "Class added successfully", severity: "success" }); } })
    );
  }
  public updateClass(updated: Class5E): Promise<void> | void {
    if (!this._classes().some(c => c.name === updated.name)) return Promise.resolve();
    return new Promise(resolve => {
      this.updateClassInDB(Clone(updated)).subscribe({ complete: () => resolve(), error: () => resolve() });
    });
  }
  private updateClassInDB = (updated: Class5E) => {
    let error = false;
    return httpClient$.toObservable(HombrewDB.classes.put(updated)).pipe(
      take(1),
      catchError(err => { console.error(err); error = true; addSnackbar({ message: "Error updating class in database", severity: "error" }); return of(null) }),
      finalize(() => { if (!error) { this._setClasses(list => list.map(c => c.name === updated.name ? updated : c)); addSnackbar({ message: "Class updated successfully", severity: "success" }); } })
    );
  }

  // Items
  public addItem = (item: Item): Promise<void> | null => { if (this._items().some(i => i.name === item.name)) return null; return new Promise(res => this.addItemToDB(Clone(item)).subscribe({ complete: () => res(), error: () => res() })); }
  private addItemToDB = (item: Item) => {
    let error = false; return httpClient$.toObservable(HombrewDB.items.add(item)).pipe(take(1), catchError(err => { console.error(err); error = true; addSnackbar({ message: "Error adding item", severity: "error" }); return of(null) }), finalize(() => { if (!error) { this._setItems(o => [...o, item]); addSnackbar({ message: "Item added", severity: "success" }); } }))
  }
  public updateItem = (item: Item): Promise<void> | void => { if (!this._items().some(i => i.name === item.name)) return; return new Promise(res => this.updateItemInDB(Clone(item)).subscribe({ complete: () => res(), error: () => res() })); }
  private updateItemInDB = (item: Item) => { let error = false; return httpClient$.toObservable(HombrewDB.items.put(item)).pipe(take(1), catchError(err => { console.error(err); error = true; addSnackbar({ message: "Error updating item", severity: "error" }); return of(null) }), finalize(() => { if (!error) { this._setItems(list => list.map(i => i.name === item.name ? item : i)); addSnackbar({ message: "Item updated", severity: "success" }); } })) }

  // Feats
  public addFeat = (feat: Feat): Promise<void> | null => { if (this._feats().some(f => f.details.name === feat.details.name)) return null; return new Promise(res => this.addFeatToDB(Clone(feat)).subscribe({ complete: () => res(), error: () => res() })); }
  private addFeatToDB = (feat: Feat) => { let error = false; return httpClient$.toObservable(HombrewDB.feats.add(feat)).pipe(take(1), catchError(err => { console.error(err); error = true; addSnackbar({ message: "Error adding feat", severity: "error" }); return of(null) }), finalize(() => { if (!error) { this._setFeats(o => [...o, feat]); addSnackbar({ message: "Feat added", severity: "success" }); } })) }
  public updateFeat = (feat: Feat): Promise<void> | void => { if (!this._feats().some(f => f.details.name === feat.details.name)) return; return new Promise(res => this.updateFeatInDB(Clone(feat)).subscribe({ complete: () => res(), error: () => res() })); }
  private updateFeatInDB = (feat: Feat) => { let error = false; return httpClient$.toObservable(HombrewDB.feats.put(feat)).pipe(take(1), catchError(err => { console.error(err); error = true; addSnackbar({ message: "Error updating feat", severity: "error" }); return of(null) }), finalize(() => { if (!error) { this._setFeats(list => list.map(f => f.details.name === feat.details.name ? feat : f)); addSnackbar({ message: "Feat updated", severity: "success" }); } })) }

  // Spells
  public addSpell = (spell: Spell): Promise<void> | null => { if (this._spells().some(s => s.name === spell.name)) return null; return new Promise(res => this.addSpellToDB(Clone(spell)).subscribe({ complete: () => res(), error: () => res() })); }
  private addSpellToDB = (spell: Spell) => { let error = false; return httpClient$.toObservable(HombrewDB.spells.add(spell)).pipe(take(1), catchError(err => { console.error(err); error = true; addSnackbar({ message: "Error adding spell", severity: "error" }); return of(null) }), finalize(() => { if (!error) { this._setSpells(o => [...o, spell]); addSnackbar({ message: "Spell added", severity: "success" }); } })) }
  public updateSpell = (spell: Spell): Promise<void> | void => { if (!this._spells().some(s => s.name === spell.name)) return; return new Promise(res => this.updateSpellInDb(Clone(spell)).subscribe({ complete: () => res(), error: () => res() })); }
  public updateSpellInDb = (spell: Spell) => { let error = false; return httpClient$.toObservable(HombrewDB.spells.put(spell)).pipe(take(1), catchError(err => { console.error(err); error = true; addSnackbar({ message: "Error updating spell", severity: "error" }); return of(null) }), finalize(() => { if (!error) { this._setSpells(list => list.map(s => s.name === spell.name ? spell : s)); addSnackbar({ message: "Spell updated", severity: "success" }); } })) }
  public removeSpell = (name: string): Promise<void> | void => {
    if (!this._spells().some(s => s.name === name)) return;
    const rest = this._spells().filter(s => s.name !== name);
    return new Promise(res => {
      httpClient$.toObservable(HombrewDB.spells.clear())
      .pipe(
        take(1),
        concatMap(() => httpClient$.toObservable(HombrewDB.spells.bulkAdd(rest)))
      )
      .subscribe({
        error: (err: unknown) => {
          console.error(err);
          addSnackbar({ message: "Error removing spell", severity: "error" });
          res();
        },
        complete: () => {
          this._setSpells(rest);
          addSnackbar({ message: "Spell removed", severity: "success" });
          res();
        }
      });
    });
  }

  // Backgrounds
  public addBackground = (bg: Background): Promise<void> | void => { if (this._backgrounds().some(b => b.name === bg.name)) return; return new Promise(res => this.addBackgroundToDB(Clone(bg)).subscribe({ complete: () => res(), error: () => res() })); }
  private addBackgroundToDB = (bg: Background) => {
    let failed = false;
    return httpClient$.toObservable(HombrewDB.backgrounds.add(bg)).pipe(
      take(1),
      catchError(err => { console.error(err); failed = true; addSnackbar({ message: "Error adding background", severity: "error" }); return of(null); }),
      finalize(() => { if (!failed) { this._setBackgrounds(o => [...o, bg]); addSnackbar({ message: "Background added", severity: "success" }); } })
    );
  };
  public updateBackground = (bg: Background): Promise<void> | void => { if (!this._backgrounds().some(b => b.name === bg.name)) return; return new Promise(res => this.updateBackgroundsInDB(Clone(bg)).subscribe({ complete: () => res(), error: () => res() })); }
  private updateBackgroundsInDB = (bg: Background) => {
    let failed = false;
    return httpClient$.toObservable(HombrewDB.backgrounds.put(bg)).pipe(
      take(1),
      catchError(err => { console.error(err); failed = true; addSnackbar({ message: "Error updating backgrounds", severity: "error" }); return of(null); }),
      finalize(() => { if (!failed) { this._setBackgrounds(list => list.map(b => b.name === bg.name ? bg : b)); addSnackbar({ message: "Background updated", severity: "success" }); } })
    );
  };
  public removeBackground = (name: string): Promise<void> | void => { if (!this._backgrounds().some(b => b.name === name)) return; const updated = this._backgrounds().filter(b => b.name !== name); return new Promise(res => { httpClient$.toObservable(HombrewDB.backgrounds.clear()).pipe(take(1), concatMap(() => httpClient$.toObservable(HombrewDB.backgrounds.bulkAdd(updated)))).subscribe({ error: err => { console.error(err); addSnackbar({ message: "Error removing background", severity: "error" }); res(); }, complete: () => { this._setBackgrounds(updated); addSnackbar({ message: "Background removed", severity: "success" }); res(); } }); }); }

  // Races
  public addRace = (race: Race): void => {
    if (this._races().some(r => r.name === race.name)) return;
    // optimistic update so UI/tests see it immediately
    this._setRaces(o => [...o, race]);
    this.addRaceToDB(Clone(race)).subscribe();
  }
  private addRaceToDB = (race: Race) => { let error = false; return httpClient$.toObservable(HombrewDB.races.add(race)).pipe(take(1), catchError(err => { console.error(err); error = true; addSnackbar({ message: "Error adding race", severity: "error" }); return of(null) }), finalize(() => { if (!error) { addSnackbar({ message: "Race added", severity: "success" }); } })) }
  public updateRace = (race: Race): Promise<void> | void => { if (!this._races().some(r => r.name === race.name)) return; return new Promise(res => this.updateRacesInDB(race).subscribe({ complete: () => res(), error: () => res() })); }
  private updateRacesInDB = (race: Race) => { const updated = this._races().map(r => r.name === race.name ? race : r); let error = false; return this.homebrewRaces$.pipe(take(1), concatMap(() => httpClient$.toObservable(HombrewDB.races.bulkPut(updated))), catchError(err => { console.error(err); error = true; addSnackbar({ message: "Error updating races", severity: "error" }); return of(null) }), finalize(() => { if (!error) { this._setRaces(updated); addSnackbar({ message: "Races updated", severity: "success" }); } })); }
  public removeRace = (name: string): Promise<void> | void => { if (!this._races().some(r => r.name === name)) return; const rest = this._races().filter(r => r.name !== name); return new Promise(res => { httpClient$.toObservable(HombrewDB.races.clear()).pipe(take(1), concatMap(() => httpClient$.toObservable(HombrewDB.races.bulkAdd(rest)))).subscribe({ error: err => { console.error(err); addSnackbar({ message: "Error removing race", severity: "error" }); res(); }, complete: () => { this._setRaces(rest); addSnackbar({ message: "Race removed", severity: "success" }); res(); } }); }); }

  // Subclasses (standalone persistence; projection into classes left to consumer if needed)
  public addSubclass = (subclass: Subclass): Promise<void> | null => {
    const storage_key = `${subclass.parent_class.toLowerCase()}__${subclass.name.toLowerCase()}`;
    (subclass as any).storage_key = storage_key;
    if (this._subclasses().some(s => (s as any).storage_key === storage_key)) return null;
    return new Promise(res => this.addSubclassToDB(Clone(subclass)).subscribe({ complete: () => res(), error: () => res() }));
  }
  private addSubclassToDB = (subclass: Subclass) => {
    let error = false;
    return httpClient$
      .toObservable(HombrewDB.subclasses.add(subclass as any))
      .pipe(
        take(1),
        catchError(err => {
          console.error(err);
          error = true;
          addSnackbar({ message: "Error adding subclass", severity: "error" });
          return of(null);
        }),
        finalize(() => {
          if (!error) {
            this._setSubclasses(o => [...o, subclass]);
            addSnackbar({ message: "Subclass added", severity: "success" });
          }
        })
      );
  }
  public updateSubclass = (subclass: Subclass): Promise<void> | void => {
  const storage_key = `${subclass.parent_class.toLowerCase()}__${subclass.name.toLowerCase()}`;
  if (!this._subclasses().some(s => (s as any).storage_key === storage_key)) return; 
    return new Promise(res => this.updateSubclassInDB(Clone(subclass)).subscribe({ complete: () => res(), error: () => res() }));
  }
  private updateSubclassInDB = (subclass: Subclass) => { 
    const storage_key = `${subclass.parent_class.toLowerCase()}__${subclass.name.toLowerCase()}`;
    (subclass as any).storage_key = storage_key;
  let error = false; return httpClient$.toObservable(HombrewDB.subclasses.put(subclass as any)).pipe(take(1), catchError(err => { console.error(err); error = true; addSnackbar({ message: "Error updating subclass", severity: "error" }); return of(null) }), finalize(() => { if (!error) { this._setSubclasses(list => list.map(s => ((s as any).storage_key === storage_key) ? subclass : s)); addSnackbar({ message: "Subclass updated", severity: "success" }); } })) }
  public removeSubclass = (parentClass: string, name: string): Promise<void> | void => {
    const storage_key = `${parentClass.toLowerCase()}__${name.toLowerCase()}`;
    if (!this._subclasses().some(s => (s as any).storage_key === storage_key)) return; 
    const rest = this._subclasses().filter(s => ((s as any).storage_key !== storage_key));
  return new Promise(res => { httpClient$.toObservable(HombrewDB.subclasses.clear()).pipe(take(1), concatMap(() => httpClient$.toObservable(HombrewDB.subclasses.bulkAdd(rest as any[])))).subscribe({ error: err => { console.error(err); addSnackbar({ message: "Error removing subclass", severity: "error" }); res(); }, complete: () => { this._setSubclasses(rest); addSnackbar({ message: "Subclass removed", severity: "success" }); res(); } }); });
  }
  public findSubclass = (parentClass: string, name: string): Subclass | undefined => {
    const storage_key = `${parentClass.toLowerCase()}__${name.toLowerCase()}`;
    return this._subclasses().find(s => (s as any).storage_key === storage_key);
  };
}

const homebrewManager = new HomebrewManager();
export { homebrewManager };
export default homebrewManager;