// New implementation using 5E data model types while keeping legacy-compatible accessors.
import {
  Observable,
  take,
  tap,
  of,
  concatMap,
  catchError,
  finalize,
} from "rxjs";
import { Accessor, Setter, createSignal } from "solid-js";
import {
  Class5E,
  Item,
  Feat,
  Spell,
  Background,
  Race,
  Subclass,
  Subrace,
  MagicItem,
} from "../../models/generated";
import { srdItem, srdSubclass } from "../../models/data/generated";
import HombrewDB from "./utility/localDB/new/homebrewDB";
import httpClient$ from "./utility/tools/httpClientObs";
import { Clone } from "./utility/tools/Tools";
import { createNewId } from "./utility/tools/idGen";
import { addSnackbar } from "coles-solid-library";

// Mapping helpers to expose legacy-ish shapes (hitDie, name, desc at root) if UI still expects them.
const mapClass = (c: Class5E) => ({
  ...c,
  hitDie: c.hitDie?.startsWith("d") ? Number(c.hitDie.slice(1)) : undefined,
});
// Feats may exist in legacy stored shape without a nested details object (e.g. { name, desc:[...] })
const mapFeat = (f: any) => {
  const details = f?.details
    ? f.details
    : {
        name: f?.name || "",
        description: Array.isArray(f?.desc)
          ? f.desc[0]
          : typeof f?.desc === "string"
            ? f.desc
            : "",
      };
  return {
    ...f,
    details,
    // Maintain legacy convenience fields
    name: details.name,
    desc: details.description,
  };
};
const mapItem = (i: srdItem) => ({ ...i });
const mapBackground = (b: Background) => ({
  ...b,
  startingEquipment: b.startEquipment,
});
const mapRace = (r: Race) => ({ ...r });

class HomebrewManager {
  // Internal signals (new types)
  private _classes: Accessor<Class5E[]>;
  private _setClasses: Setter<Class5E[]>;
  private _items: Accessor<srdItem[]>;
  private _setItems: Setter<srdItem[]>;
  private _magicItems: Accessor<MagicItem[]>;
  private _setMagicItems: Setter<MagicItem[]>;
  private _feats: Accessor<Feat[]>;
  private _setFeats: Setter<Feat[]>;
  private _spells: Accessor<Spell[]>;
  private _setSpells: Setter<Spell[]>;
  private _backgrounds: Accessor<Background[]>;
  private _setBackgrounds: Setter<Background[]>;
  private _races: Accessor<Race[]>;
  private _setRaces: Setter<Race[]>;
  private _subraces: Accessor<Subrace[]>;
  private _setSubraces: Setter<Subrace[]>;
  private _subclasses: Accessor<srdSubclass[]>;
  private _setSubclasses: Setter<srdSubclass[]>;

  // Public accessors (legacy-compatible)
  public classes: Accessor<any[]>;
  public items: Accessor<any[]>;
  public magicItems: Accessor<MagicItem[]>;
  public feats: Accessor<any[]>;
  public spells: Accessor<Spell[]>;
  public backgrounds: Accessor<any[]>;
  public races: Accessor<any[]>;
  public subraces: Accessor<Subrace[]>;
  public subclasses: Accessor<srdSubclass[]>;

  private homebrewClasses$: Observable<Class5E[]> = httpClient$.toObservable(
    HombrewDB.classes.toArray(),
  );
  private homebrewItems$: Observable<srdItem[]> = httpClient$.toObservable(
    HombrewDB.items.toArray(),
  );
  private homebrewMagicItems$: Observable<MagicItem[]> =
    httpClient$.toObservable(HombrewDB.magicItems.toArray());
  private homebrewFeats$: Observable<Feat[]> = httpClient$.toObservable(
    HombrewDB.feats.toArray(),
  );
  private homebrewSpells$: Observable<Spell[]> = httpClient$.toObservable(
    HombrewDB.spells.toArray(),
  );
  private homebrewBackgrounds$: Observable<Background[]> =
    httpClient$.toObservable(HombrewDB.backgrounds.toArray());
  private homebrewRaces$: Observable<Race[]> = httpClient$.toObservable(
    HombrewDB.races.toArray(),
  );
  private homebrewSubraces$: Observable<Subrace[]> = httpClient$.toObservable(
    HombrewDB.subraces.toArray(),
  );
  private homebrewSubclasses$: Observable<srdSubclass[]> =
    httpClient$.toObservable(
      (async () => {
        try {
          const rows = await HombrewDB.subclasses.toArray().catch(() => []);
          rows.forEach((r) => {
            if (!r.storage_key && r.parentClass && r.name) {
              (r as any).storage_key =
                `${r.parentClass.toLowerCase()}__${r.name.toLowerCase()}`;
            }
          });
          return rows as srdSubclass[];
        } catch {
          return [];
        }
      })(),
    );

  constructor(
    classes: Class5E[] = [],
    items: srdItem[] = [],
    feats: Feat[] = [],
    spells: Spell[] = [],
    backgrounds: Background[] = [],
    races: Race[] = [],
    subclasses: srdSubclass[] = [],
  ) {
    [this._classes, this._setClasses] = createSignal(classes);
    [this._items, this._setItems] = createSignal(items);
    [this._magicItems, this._setMagicItems] = createSignal<MagicItem[]>([]);
    [this._feats, this._setFeats] = createSignal(feats);
    [this._spells, this._setSpells] = createSignal(spells);
    [this._backgrounds, this._setBackgrounds] = createSignal(backgrounds);
    [this._races, this._setRaces] = createSignal(races);
    [this._subraces, this._setSubraces] = createSignal<Subrace[]>([]);
    [this._subclasses, this._setSubclasses] = createSignal(subclasses);

    // Public mapped accessors
    this.classes = () => this._classes().map(mapClass);
    this.items = () => this._items().map(mapItem);
    this.magicItems = this._magicItems;
    this.feats = () => this._feats().map(mapFeat);
    this.spells = this._spells; // spells already similar
    this.backgrounds = () => this._backgrounds().map(mapBackground);
    this.races = () => this._races().map(mapRace);
    this.subraces = this._subraces;
    this.subclasses = this._subclasses; // already correct shape for new model

    // Load persisted
    this.homebrewClasses$
      .pipe(
        take(1),
        tap((c) => this._setClasses((old) => [...old, ...c])),
      )
      .subscribe();
    this.homebrewItems$
      .pipe(
        take(1),
        tap((i) => this._setItems((old) => [...old, ...i])),
      )
      .subscribe();
    this.homebrewMagicItems$
      .pipe(
        take(1),
        tap((mi) => this._setMagicItems((old) => [...old, ...mi])),
      )
      .subscribe();
    this.homebrewFeats$
      .pipe(
        take(1),
        tap((f) => this._setFeats((old) => [...old, ...f])),
      )
      .subscribe();
    this.homebrewSpells$
      .pipe(
        take(1),
        tap((s) => this._setSpells((old) => [...old, ...s])),
      )
      .subscribe();
    this.homebrewBackgrounds$
      .pipe(
        take(1),
        tap((b) => this._setBackgrounds((old) => [...old, ...b])),
      )
      .subscribe();
    this.homebrewRaces$
      .pipe(
        take(1),
        tap((r) => this._setRaces((old) => [...old, ...r])),
      )
      .subscribe();
    this.homebrewSubraces$
      .pipe(
        take(1),
        tap((sr) => this._setSubraces((old) => [...old, ...sr])),
      )
      .subscribe();
    this.homebrewSubclasses$
      .pipe(
        take(1),
        tap((sc) => this._setSubclasses((old) => [...old, ...sc])),
      )
      .subscribe();
  }

  public async resetSystem() {
    try {
      await HombrewDB.initPromise; // ensure DB is ready
      await Promise.all(
        [
          HombrewDB.classes.clear(),
          HombrewDB.items.clear(),
          HombrewDB.magicItems.clear(),
          HombrewDB.feats.clear(),
          HombrewDB.spells.clear(),
          HombrewDB.backgrounds.clear(),
          HombrewDB.races.clear(),
          HombrewDB.subraces.clear(),
          HombrewDB.subclasses.clear(),
          // best-effort clear deprecated store if still present
          (HombrewDB as any).subclasses_v2
            ? (HombrewDB as any).subclasses_v2.clear()
            : Promise.resolve(),
        ].map((p) =>
          p.catch((e: unknown) => console.warn("clear table failed", e)),
        ),
      );
    } catch (e) {
      // ignore
    }
    this._setClasses([]);
    this._setItems([]);
    this._setMagicItems([]);
    this._setFeats([]);
    this._setSpells([]);
    this._setBackgrounds([]);
    this._setRaces([]);
    this._setSubraces([]);
    this._setSubclasses([]);
  }

  // Classes (Class5E)
  // Returns true only when the class was actually persisted; false on a dedup no-op or a DB error, so the
  // caller (saveHomebrew) can report honestly instead of showing a phantom success. Uses `.put` (upsert) so
  // an existing `name` primary key can't throw a ConstraintError, and updates the signal before resolving.
  public addClass = async (newClass: Class5E): Promise<boolean> => {
    if (this._classes().some((c) => c.name === newClass.name)) return false;
    const toStore = Clone(newClass);
    // Homebrew classes historically had no id (Dexie keys by name); subclasses now reference
    // their parent by id (parentClassId), so every stored class must carry one.
    if (!toStore.id) toStore.id = createNewId();
    try {
      await HombrewDB.classes.put(toStore);
    } catch (err) {
      console.error(err);
      addSnackbar({
        message: "Error adding class to database",
        severity: "error",
      });
      return false;
    }
    this._setClasses((o) => [...o, toStore]);
    addSnackbar({ message: "Class added successfully", severity: "success" });
    return true;
  };
  public updateClass = async (updated: Class5E): Promise<boolean> => {
    const existing = this._classes().find((c) => c.name === updated.name);
    if (!existing) return false;
    const toStore = Clone(updated);
    // Preserve the stored id (subclasses reference it via parentClassId); mint one for
    // rows that predate class ids.
    if (!toStore.id) toStore.id = existing.id || createNewId();
    try {
      await HombrewDB.classes.put(toStore);
    } catch (err) {
      console.error(err);
      addSnackbar({
        message: "Error updating class in database",
        severity: "error",
      });
      return false;
    }
    this._setClasses((list) =>
      list.map((c) => (c.name === toStore.name ? toStore : c)),
    );
    addSnackbar({ message: "Class updated successfully", severity: "success" });
    return true;
  };

  // Items
  public addItem = (item: srdItem): Promise<void> | null => {
    if (this._items().some((i) => i.name === item.name)) return null;
    return new Promise((res) =>
      this.addItemToDB(Clone(item)).subscribe({
        complete: () => res(),
        error: () => res(),
      }),
    );
  };
  private addItemToDB = (item: srdItem) => {
    let error = false;
    return httpClient$.toObservable(HombrewDB.items.add(item)).pipe(
      take(1),
      catchError((err) => {
        console.error(err);
        error = true;
        addSnackbar({ message: "Error adding item", severity: "error" });
        return of(null);
      }),
      finalize(() => {
        if (!error) {
          this._setItems((o) => [...o, item]);
          addSnackbar({ message: "Item added", severity: "success" });
        }
      }),
    );
  };
  public updateItem = (item: srdItem): Promise<void> | void => {
    if (!this._items().some((i) => i.name === item.name)) return;
    return new Promise((res) =>
      this.updateItemInDB(Clone(item)).subscribe({
        complete: () => res(),
        error: () => res(),
      }),
    );
  };
  private updateItemInDB = (item: srdItem) => {
    let error = false;
    return httpClient$.toObservable(HombrewDB.items.put(item)).pipe(
      take(1),
      catchError((err) => {
        console.error(err);
        error = true;
        addSnackbar({ message: "Error updating item", severity: "error" });
        return of(null);
      }),
      finalize(() => {
        if (!error) {
          this._setItems((list) =>
            list.map((i) => (i.name === item.name ? item : i)),
          );
          addSnackbar({ message: "Item updated", severity: "success" });
        }
      }),
    );
  };

  // Magic Items
  public addMagicItem = (magicItem: MagicItem): Promise<void> | null => {
    if (this._magicItems().some((m) => m.name === magicItem.name)) return null;
    return new Promise((res) =>
      this.addMagicItemToDB(Clone(magicItem)).subscribe({
        complete: () => res(),
        error: () => res(),
      }),
    );
  };
  private addMagicItemToDB = (magicItem: MagicItem) => {
    let error = false;
    return httpClient$.toObservable(HombrewDB.magicItems.add(magicItem)).pipe(
      take(1),
      catchError((err) => {
        console.error(err);
        error = true;
        addSnackbar({ message: "Error adding magic item", severity: "error" });
        return of(null);
      }),
      finalize(() => {
        if (!error) {
          this._setMagicItems((o) => [...o, magicItem]);
          addSnackbar({ message: "Magic item added", severity: "success" });
        }
      }),
    );
  };
  public updateMagicItem = (magicItem: MagicItem): Promise<void> | void => {
    if (!this._magicItems().some((m) => m.name === magicItem.name)) return;
    return new Promise((res) =>
      this.updateMagicItemInDB(Clone(magicItem)).subscribe({
        complete: () => res(),
        error: () => res(),
      }),
    );
  };
  private updateMagicItemInDB = (magicItem: MagicItem) => {
    let error = false;
    return httpClient$.toObservable(HombrewDB.magicItems.put(magicItem)).pipe(
      take(1),
      catchError((err) => {
        console.error(err);
        error = true;
        addSnackbar({
          message: "Error updating magic item",
          severity: "error",
        });
        return of(null);
      }),
      finalize(() => {
        if (!error) {
          this._setMagicItems((list) =>
            list.map((m) => (m.name === magicItem.name ? magicItem : m)),
          );
          addSnackbar({ message: "Magic item updated", severity: "success" });
        }
      }),
    );
  };

  // Feats
  public addFeat = (feat: Feat): Promise<void> | null => {
    // Normalize any legacy feats missing details before comparison
    this._setFeats((list) =>
      list.map((f) => {
        if (!(f as any).details) {
          const name = (f as any).name || "";
          const desc = Array.isArray((f as any).desc)
            ? (f as any).desc[0]
            : (f as any).desc || "";
          (f as any).details = { name, description: desc };
        }
        return f;
      }),
    );
    if (
      this._feats().some(
        (f) =>
          (f as any).details?.name === feat.details.name ||
          (f as any).name === feat.details.name,
      )
    )
      return null;
    // ensure root name + desc array for legacy consumers & Dexie PK
    const toStore: any = { ...Clone(feat) };
    if (!toStore.name) toStore.name = feat.details.name;
    if (!toStore.desc) toStore.desc = [feat.details.description];
    return new Promise((res) =>
      this.addFeatToDB(toStore).subscribe({
        complete: () => res(),
        error: () => res(),
      }),
    );
  };
  private addFeatToDB = (feat: any) => {
    let error = false;
    return httpClient$.toObservable(HombrewDB.feats.add(feat)).pipe(
      take(1),
      catchError((err) => {
        console.error(err);
        error = true;
        addSnackbar({ message: "Error adding feat", severity: "error" });
        return of(null);
      }),
      finalize(() => {
        if (!error) {
          this._setFeats((o) => [...o, feat]);
          addSnackbar({ message: "Feat added", severity: "success" });
        }
      }),
    );
  };
  public updateFeat = (feat: Feat): Promise<void> | void => {
    // Normalize legacy feats missing details
    this._setFeats((list) =>
      list.map((f) => {
        if (!(f as any).details) {
          const name = (f as any).name || "";
          const desc = Array.isArray((f as any).desc)
            ? (f as any).desc[0]
            : (f as any).desc || "";
          (f as any).details = { name, description: desc };
        }
        return f;
      }),
    );
    if (
      !this._feats().some(
        (f) =>
          (f as any).details?.name === feat.details.name ||
          (f as any).name === feat.details.name,
      )
    )
      return;
    const toStore: any = { ...Clone(feat) };
    if (!toStore.name) toStore.name = feat.details.name;
    if (!toStore.desc) toStore.desc = [feat.details.description];
    // Optimistic in‑memory update so UI/tests see new description immediately (Dexie 4 put may resolve on later microtask)
    this._setFeats((list) =>
      list.map((f) => {
        const fname = (f as any).details?.name || (f as any).name;
        return fname === feat.details.name ? toStore : f;
      }),
    );
    return new Promise((res) =>
      this.updateFeatInDB(toStore).subscribe({
        complete: () => res(),
        error: () => res(),
      }),
    );
  };
  private updateFeatInDB = (feat: any) => {
    let error = false;
    return httpClient$.toObservable(HombrewDB.feats.put(feat)).pipe(
      take(1),
      catchError((err) => {
        console.error(err);
        error = true;
        addSnackbar({ message: "Error updating feat", severity: "error" });
        return of(null);
      }),
      finalize(() => {
        if (!error) {
          this._setFeats((list) =>
            list.map((f) => (f.details.name === feat.details.name ? feat : f)),
          );
          addSnackbar({ message: "Feat updated", severity: "success" });
        }
      }),
    );
  };
  public removeFeat = (name: string): Promise<void> | void => {
    const featName = (f: any) => f?.details?.name ?? f?.name;
    if (!this._feats().some((f) => featName(f) === name)) return;
    const rest = this._feats().filter((f) => featName(f) !== name);
    return new Promise((res) => {
      httpClient$
        .toObservable(HombrewDB.feats.clear())
        .pipe(
          take(1),
          concatMap(() =>
            httpClient$.toObservable(HombrewDB.feats.bulkAdd(rest)),
          ),
        )
        .subscribe({
          error: (err: unknown) => {
            console.error(err);
            addSnackbar({ message: "Error removing feat", severity: "error" });
            res();
          },
          complete: () => {
            this._setFeats(rest);
            addSnackbar({ message: "Feat removed", severity: "success" });
            res();
          },
        });
    });
  };

  // Spells
  public addSpell = (spell: Spell): Promise<void> | null => {
    if (this._spells().some((s) => s.name === spell.name)) return null;
    return new Promise((res) =>
      this.addSpellToDB(Clone(spell)).subscribe({
        complete: () => res(),
        error: () => res(),
      }),
    );
  };
  private addSpellToDB = (spell: Spell) => {
    let error = false;
    return httpClient$.toObservable(HombrewDB.spells.add(spell)).pipe(
      take(1),
      catchError((err) => {
        console.error(err);
        error = true;
        addSnackbar({ message: "Error adding spell", severity: "error" });
        return of(null);
      }),
      finalize(() => {
        if (!error) {
          this._setSpells((o) => [...o, spell]);
          addSnackbar({ message: "Spell added", severity: "success" });
        }
      }),
    );
  };
  public updateSpell = (spell: Spell): Promise<void> | void => {
    if (!this._spells().some((s) => s.name === spell.name)) return;
    return new Promise((res) =>
      this.updateSpellInDb(Clone(spell)).subscribe({
        complete: () => res(),
        error: () => res(),
      }),
    );
  };
  public updateSpellInDb = (spell: Spell) => {
    let error = false;
    return httpClient$.toObservable(HombrewDB.spells.put(spell)).pipe(
      take(1),
      catchError((err) => {
        console.error(err);
        error = true;
        addSnackbar({ message: "Error updating spell", severity: "error" });
        return of(null);
      }),
      finalize(() => {
        if (!error) {
          this._setSpells((list) =>
            list.map((s) => (s.name === spell.name ? spell : s)),
          );
          addSnackbar({ message: "Spell updated", severity: "success" });
        }
      }),
    );
  };
  public removeSpell = (name: string): Promise<void> | void => {
    if (!this._spells().some((s) => s.name === name)) return;
    const rest = this._spells().filter((s) => s.name !== name);
    return new Promise((res) => {
      httpClient$
        .toObservable(HombrewDB.spells.clear())
        .pipe(
          take(1),
          concatMap(() =>
            httpClient$.toObservable(HombrewDB.spells.bulkAdd(rest)),
          ),
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
          },
        });
    });
  };

  // Backgrounds
  public addBackground = (bg: Background): Promise<void> | void => {
    if (this._backgrounds().some((b) => b.name === bg.name)) return;
    return new Promise((res) =>
      this.addBackgroundToDB(Clone(bg)).subscribe({
        complete: () => res(),
        error: () => res(),
      }),
    );
  };
  private addBackgroundToDB = (bg: Background) => {
    let failed = false;
    return httpClient$.toObservable(HombrewDB.backgrounds.add(bg)).pipe(
      take(1),
      catchError((err) => {
        console.error(err);
        failed = true;
        addSnackbar({ message: "Error adding background", severity: "error" });
        return of(null);
      }),
      finalize(() => {
        if (!failed) {
          this._setBackgrounds((o) => [...o, bg]);
          addSnackbar({ message: "Background added", severity: "success" });
        }
      }),
    );
  };
  public updateBackground = (bg: Background): Promise<void> | void => {
    if (!this._backgrounds().some((b) => b.id === bg.id)) return;
    return new Promise((res) =>
      this.updateBackgroundsInDB(Clone(bg)).subscribe({
        complete: () => res(),
        error: () => res(),
      }),
    );
  };
  private updateBackgroundsInDB = (bg: Background) => {
    let failed = false;
    return httpClient$.toObservable(HombrewDB.backgrounds.put(bg)).pipe(
      take(1),
      catchError((err) => {
        console.error(err);
        failed = true;
        addSnackbar({
          message: "Error updating backgrounds",
          severity: "error",
        });
        return of(null);
      }),
      finalize(() => {
        if (!failed) {
          this._setBackgrounds((list) =>
            list.map((b) => (b.id === bg.id ? bg : b)),
          );
          addSnackbar({ message: "Background updated", severity: "success" });
        }
      }),
    );
  };
  public removeBackground = (name: string): Promise<void> | void => {
    if (!this._backgrounds().some((b) => b.name === name)) return;
    const updated = this._backgrounds().filter((b) => b.name !== name);
    return new Promise((res) => {
      httpClient$
        .toObservable(HombrewDB.backgrounds.clear())
        .pipe(
          take(1),
          concatMap(() =>
            httpClient$.toObservable(HombrewDB.backgrounds.bulkAdd(updated)),
          ),
        )
        .subscribe({
          error: (err) => {
            console.error(err);
            addSnackbar({
              message: "Error removing background",
              severity: "error",
            });
            res();
          },
          complete: () => {
            this._setBackgrounds(updated);
            addSnackbar({ message: "Background removed", severity: "success" });
            res();
          },
        });
    });
  };

  // Races
  public addRace = (race: Race): void => {
    if (this._races().some((r) => r.name === race.name)) return;
    // optimistic update so UI/tests see it immediately
    this._setRaces((o) => [...o, race]);
    this.addRaceToDB(Clone(race)).subscribe();
  };
  private addRaceToDB = (race: Race) => {
    let error = false;
    return httpClient$.toObservable(HombrewDB.races.add(race)).pipe(
      take(1),
      catchError((err) => {
        console.error(err);
        error = true;
        addSnackbar({ message: "Error adding race", severity: "error" });
        return of(null);
      }),
      finalize(() => {
        if (!error) {
          addSnackbar({ message: "Race added", severity: "success" });
        }
      }),
    );
  };
  public updateRace = (race: Race): Promise<void> | void => {
    if (!this._races().some((r) => r.name === race.name)) return;
    return new Promise((res) =>
      this.updateRacesInDB(race).subscribe({
        complete: () => res(),
        error: () => res(),
      }),
    );
  };
  private updateRacesInDB = (race: Race) => {
    const updated = this._races().map((r) => (r.name === race.name ? race : r));
    let error = false;
    return this.homebrewRaces$.pipe(
      take(1),
      concatMap(() =>
        httpClient$.toObservable(HombrewDB.races.bulkPut(updated)),
      ),
      catchError((err) => {
        console.error(err);
        error = true;
        addSnackbar({ message: "Error updating races", severity: "error" });
        return of(null);
      }),
      finalize(() => {
        if (!error) {
          this._setRaces(updated);
          addSnackbar({ message: "Races updated", severity: "success" });
        }
      }),
    );
  };
  public removeRace = (name: string): Promise<void> | void => {
    if (!this._races().some((r) => r.name === name)) return;
    const rest = this._races().filter((r) => r.name !== name);
    return new Promise((res) => {
      httpClient$
        .toObservable(HombrewDB.races.clear())
        .pipe(
          take(1),
          concatMap(() =>
            httpClient$.toObservable(HombrewDB.races.bulkAdd(rest)),
          ),
        )
        .subscribe({
          error: (err) => {
            console.error(err);
            addSnackbar({ message: "Error removing race", severity: "error" });
            res();
          },
          complete: () => {
            this._setRaces(rest);
            addSnackbar({ message: "Race removed", severity: "success" });
            res();
          },
        });
    });
  };

  // Subraces (standalone persistence in the `subraces` table, keyed by `name`; the subrace editor also
  // nests a copy under the parent race's subRaces array). Success snackbars are left to the caller —
  // the editor already announces "Subrace created/updated" and updateRace fires its own toast.
  public saveSubrace = async (subrace: Subrace): Promise<boolean> => {
    const toStore = Clone(subrace);
    const existing = this._subraces().find(
      (s) =>
        (toStore.id && s.id === toStore.id) ||
        (s.parentRace === toStore.parentRace && s.name === toStore.name),
    );
    try {
      // The table is keyed by name, so a rename would otherwise strand the old row.
      if (existing && existing.name !== toStore.name)
        await HombrewDB.subraces.delete(existing.name);
      await HombrewDB.subraces.put(toStore);
    } catch (err) {
      console.error(err);
      addSnackbar({
        message: "Error saving subrace to database",
        severity: "error",
      });
      return false;
    }
    this._setSubraces((list) =>
      existing
        ? list.map((s) => (s === existing ? toStore : s))
        : [...list, toStore],
    );
    return true;
  };
  public removeSubrace = async (
    parentRace: string,
    name: string,
    id?: string,
  ): Promise<boolean> => {
    const existing = this._subraces().find(
      (s) =>
        (id && s.id === id) || (s.parentRace === parentRace && s.name === name),
    );
    if (!existing) return false;
    try {
      await HombrewDB.subraces.delete(existing.name);
    } catch (err) {
      console.error(err);
      addSnackbar({
        message: "Error removing subrace from database",
        severity: "error",
      });
      return false;
    }
    this._setSubraces((list) => list.filter((s) => s !== existing));
    return true;
  };

  // Subclasses (standalone persistence; projection into classes left to consumer if needed)
  // Like addClass: returns true only on a real persist (false on dedup/DB error), uses `.put` (the table is
  // keyed by `name`, so `.add` would throw on any existing name), and updates the signal before resolving.
  public addSubclass = async (subclass: srdSubclass): Promise<boolean> => {
    const storage_key = `${subclass.parentClass.toLowerCase()}__${subclass.name.toLowerCase()}`;
    if (this._subclasses().some((s) => (s as any).storage_key === storage_key))
      return false;
    const toStore = Clone(subclass);
    (toStore as any).storage_key = storage_key;
    // Like addClass: manual-wizard subclasses historically had no id (AI-generated ones do);
    // every stored subclass carries one so its selector key survives renames.
    if (!toStore.id) toStore.id = createNewId();
    try {
      await HombrewDB.subclasses.put(toStore as any);
    } catch (err) {
      console.error(err);
      addSnackbar({ message: "Error adding subclass", severity: "error" });
      return false;
    }
    this._setSubclasses((o) => [...o, toStore]);
    addSnackbar({ message: "Subclass added", severity: "success" });
    return true;
  };
  public updateSubclass = async (subclass: srdSubclass): Promise<boolean> => {
    const storage_key = `${subclass.parentClass.toLowerCase()}__${subclass.name.toLowerCase()}`;
    const existing = this._subclasses().find(
      (s) => (s as any).storage_key === storage_key,
    );
    if (!existing) return false;
    const toStore = Clone(subclass);
    (toStore as any).storage_key = storage_key;
    // Preserve the stored id (saved characters reference it via subclassId); mint one for
    // rows that predate subclass ids.
    if (!toStore.id) toStore.id = existing.id || createNewId();
    try {
      await HombrewDB.subclasses.put(toStore as any);
    } catch (err) {
      console.error(err);
      addSnackbar({ message: "Error updating subclass", severity: "error" });
      return false;
    }
    this._setSubclasses((list) =>
      list.map((s) => ((s as any).storage_key === storage_key ? toStore : s)),
    );
    addSnackbar({ message: "Subclass updated", severity: "success" });
    return true;
  };
  public removeSubclass = (
    parentClass: string,
    name: string,
  ): Promise<void> | void => {
    const storage_key = `${parentClass.toLowerCase()}__${name.toLowerCase()}`;
    if (!this._subclasses().some((s) => (s as any).storage_key === storage_key))
      return;
    const rest = this._subclasses().filter(
      (s) => (s as any).storage_key !== storage_key,
    );
    return new Promise((res) => {
      httpClient$
        .toObservable(HombrewDB.subclasses.clear())
        .pipe(
          take(1),
          concatMap(() =>
            httpClient$.toObservable(
              HombrewDB.subclasses.bulkPut(rest as any[]),
            ),
          ),
        )
        .subscribe({
          error: (err) => {
            console.error(err);
            addSnackbar({
              message: "Error removing subclass",
              severity: "error",
            });
            res();
          },
          complete: () => {
            this._setSubclasses(rest);
            addSnackbar({ message: "Subclass removed", severity: "success" });
            res();
          },
        });
    });
  };
  public findSubclass = (
    parentClass: string,
    name: string,
  ): srdSubclass | undefined => {
    const storage_key = `${parentClass.toLowerCase()}__${name.toLowerCase()}`;
    return this._subclasses().find(
      (s) => (s as any).storage_key === storage_key,
    );
  };
}

const homebrewManager = new HomebrewManager();
export { homebrewManager };
export default homebrewManager;
