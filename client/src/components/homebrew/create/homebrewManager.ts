import { createSignal, type Accessor, type Setter } from "solid-js";
import { Feat, Item, Spell, DnDClass, Background, Race } from "../../../models/";
import { concatMap, take, of, tap, Observable, catchError } from "rxjs";
import homebrewDB from "../../../shared/customHooks/utility/localDB/homebrewDBFile";
import httpClient$ from "../../../shared/customHooks/utility/httpClientObs";

export default class HomebrewManager {
  public classes: Accessor<DnDClass[]>;
  private setClasses: Setter<DnDClass[]>;
  private homebrewClasses$: Observable<DnDClass[]> = httpClient$.toObservable(homebrewDB.classes.toArray());;

  public items: Accessor<Item[]>;
  private setItems: Setter<Item[]>;
  private homebrewItems$: Observable<Item[]> = httpClient$.toObservable(homebrewDB.items.toArray());

  public feats: Accessor<Feat[]>;
  private setFeats: Setter<Feat[]>;
  private homebrewFeats$: Observable<Feat[]> = httpClient$.toObservable(homebrewDB.feats.toArray());

  public spells: Accessor<Spell[]>;
  private setSpells: Setter<Spell[]>;
  private homebrewSpells$: Observable<Spell[]> = httpClient$.toObservable(homebrewDB.spells.toArray());

  public backgrounds: Accessor<Background[]>;
  private setBackgrounds: Setter<Background[]>;
  private homebrewBackgrounds$: Observable<Background[]> = httpClient$.toObservable(homebrewDB.backgrounds.toArray());

  public races: Accessor<Race[]>;
  private setRaces: Setter<Race[]>;
  private homebrewRaces$: Observable<Race[]> = httpClient$.toObservable(homebrewDB.races.toArray());

  constructor(classes: DnDClass[] = [], items: Item[] = [], feats: Feat[] = [], spells: Spell[] = [], backgrounds: Background[] = [], races: Race[] = []){
    [this.classes, this.setClasses] = createSignal(classes);
    [this.items, this.setItems] = createSignal(items);
    [this.feats, this.setFeats] = createSignal(feats);
    [this.spells, this.setSpells] = createSignal(spells);
    [this.backgrounds, this.setBackgrounds] = createSignal(backgrounds);
    [this.races, this.setRaces] = createSignal(races);

    // Add pre-existing homebrew data to the state
    this.homebrewClasses$.pipe(
      take(1),
      tap((classes) => this.setClasses(old => [...old, ...classes]))
    ).subscribe();
    this.homebrewItems$.pipe(
      take(1),
      tap((items) => this.setItems(old => [...old, ...items]))
    ).subscribe();
    this.homebrewFeats$.pipe(
      take(1),
      tap((feats) => this.setFeats(old => [...old, ...feats]))
    ).subscribe();
    this.homebrewSpells$.pipe(
      take(1),
      tap((spells) => this.setSpells(old => [...old, ...spells]))
    ).subscribe();
    this.homebrewBackgrounds$.pipe(
      take(1),
      tap((backgrounds) => this.setBackgrounds(old => [...old, ...backgrounds]))
    ).subscribe();
    this.homebrewRaces$.pipe(
      take(1),
      tap(races => this.setRaces(old => [...old, ...races]))
    ).subscribe();
  }

  public addClass = (newClass: DnDClass) => {
    if(this.classes().findIndex((c) => c.name === newClass.name) !== -1){
      return;
    }
    this.setClasses(old =>[...old, newClass]);
    this.addClassToDB(newClass).subscribe();
  }

  private addClassToDB = (newClass: DnDClass) => {
    return httpClient$.toObservable(homebrewDB.classes.add(newClass)).pipe(take(1),
      catchError((err) => {
        console.error("Failed to add class to LocalDb",err);
        return of(null);
      })
    );
  }

  public updateClass (updatedClass: DnDClass){
    const index = this.classes().findIndex((c) => c.name === updatedClass.name);
    if(index === -1){
      return;
    }
    const updatedClasses = this.classes();
    updatedClasses[index] = updatedClass;
    this.setClasses([...updatedClasses]);
  }

  public updateClassesInDB = () => {
    this.homebrewClasses$.pipe(
      take(1),
      concatMap((classes) => {
        return httpClient$.toObservable(homebrewDB.classes.bulkPut(this.classes()));
      })
    ).subscribe();
  }

  public removeClass = (className: string) => {
    const index = this.classes().findIndex((c) => c.name === className);
    if(index === -1){
      return;
    }
    const updatedClasses = this.classes();
    updatedClasses.splice(index, 1);
    this.setClasses([...updatedClasses]);
    httpClient$.toObservable(homebrewDB.classes.clear()).pipe(
      take(1),
      concatMap(() => {
        return httpClient$.toObservable(homebrewDB.classes.bulkAdd(this.classes()));
      })
    ).subscribe();
  }

  public addItem = (newItem: Item) => {
    if(this.items().findIndex((i) => i.name === newItem.name) !== -1){
      return;
    }
    this.setItems(old =>[...old, newItem]);
    this.addItemToDB(newItem).subscribe();
  }

  public addItemToDB = (newItem: Item) => {
    return httpClient$.toObservable(homebrewDB.items.add(newItem)).pipe(take(1),
      catchError((err) => {
        console.error("Failed to add item to LocalDb",err);
        return of(null);
      })
    );
  }

  public updateItem = (updatedItem: Item) => {
    const index = this.items().findIndex((i) => i.name === updatedItem.name);
    if(index === -1){
      return;
    }
    const updatedItems = this.items();
    updatedItems[index] = updatedItem;
    this.setItems([...updatedItems]);
  }

  public updateItemsInDB = () => {
    this.homebrewItems$.pipe(
      take(1),
      concatMap((items) => {
        return httpClient$.toObservable(homebrewDB.items.bulkPut(this.items()));
      })
    ).subscribe();
  }

  public removeItem = (itemName: string) => {
    const index = this.items().findIndex((i) => i.name === itemName);
    if(index === -1){
      return;
    }
    const updatedItems = this.items();
    updatedItems.splice(index, 1);
    this.setItems([...updatedItems]);
    httpClient$.toObservable(homebrewDB.items.clear()).pipe(
      take(1),
      concatMap(() => {
        return httpClient$.toObservable(homebrewDB.items.bulkAdd(this.items()));
      })
    ).subscribe();
  }

  public addFeat = (newFeat: Feat) => {
    if(this.feats().findIndex((f) => f.name === newFeat.name) !== -1){
      return;
    }
    this.setFeats(old =>[...old, newFeat]);
    this.addFeatToDB(newFeat).subscribe();
  }

  private addFeatToDB = (newFeat: Feat) => {
    return httpClient$.toObservable(homebrewDB.feats.add(newFeat)).pipe(take(1),
      catchError((err) => {
        console.error("Failed to add feat to LocalDb",err);
        return of(null);
      })
    );
  }

  public updateFeat = (updatedFeat: Feat) => {
    const index = this.feats().findIndex((f) => f.name === updatedFeat.name);
    if(index === -1){
      return;
    }
    const updatedFeats = this.feats();
    updatedFeats[index] = updatedFeat;
    this.setFeats([...updatedFeats]);
  }

  public updateFeatsInDB = () => {
    this.homebrewFeats$.pipe(
      take(1),
      concatMap((feats) => {
        return httpClient$.toObservable(homebrewDB.feats.bulkPut(this.feats()));
      })
    ).subscribe();
  }

  public removeFeat = (featName: string) => {
    const index = this.feats().findIndex((f) => f.name === featName);
    if(index === -1){
      return;
    }
    const updatedFeats = this.feats();
    updatedFeats.splice(index, 1);
    this.setFeats([...updatedFeats]);
    httpClient$.toObservable(homebrewDB.feats.clear()).pipe(
      take(1),
      concatMap(() => {
        return httpClient$.toObservable(homebrewDB.feats.bulkAdd(this.feats()));
      })
    ).subscribe();
  }

  public addSpell = (newSpell: Spell) => {
    if(this.spells().findIndex((s) => s.name === newSpell.name) !== -1){
      return;
    }
    this.setSpells(old =>[...old, newSpell]);
    this.addSpellToDB(newSpell).subscribe();
  }

  private addSpellToDB = (newSpell: Spell) => {
    return httpClient$.toObservable(homebrewDB.spells.add(newSpell)).pipe(take(1),
      catchError((err) => {
        console.error("Failed to add spell to LocalDb",err);
        return of(null);
      })
    );
  }

  public updateSpell = (updatedSpell: Spell) => {
    const index = this.spells().findIndex((s) => s.name === updatedSpell.name);
    if(index === -1){
      return;
    }
    const updatedSpells = this.spells();
    updatedSpells[index] = updatedSpell;
    this.setSpells([...updatedSpells]);
  }

  public updateSpellsInDB = () => {
    this.homebrewSpells$.pipe(
      take(1),
      concatMap((spells) => {
        return httpClient$.toObservable(homebrewDB.spells.bulkPut(this.spells()));
      })
    ).subscribe();
  }

  public removeSpell = (spellName: string) => {
    const index = this.spells().findIndex((s) => s.name === spellName);
    if(index === -1){
      return;
    }
    const updatedSpells = this.spells();
    updatedSpells.splice(index, 1);
    this.setSpells([...updatedSpells]);
    httpClient$.toObservable(homebrewDB.spells.clear()).pipe(
      take(1),
      concatMap(() => {
        return httpClient$.toObservable(homebrewDB.spells.bulkAdd(this.spells()));
      })
    ).subscribe();
  }

  public addBackground = (newBackground: Background) => {
    if(this.backgrounds().findIndex((b) => b.name === newBackground.name) !== -1){
      return;
    }
    this.setBackgrounds(old =>[...old, newBackground]);
    this.addBackgroundToDB(newBackground).subscribe();
  }

  private addBackgroundToDB = (newBackground: Background) => {
    return httpClient$.toObservable(homebrewDB.backgrounds.add(newBackground)).pipe(take(1),
      catchError((err) => {
        console.error("Failed to add background to LocalDb",err);
        return of(null);
      })
    );
  }

  public updateBackground = (updatedBackground: Background) => {
    const index = this.backgrounds().findIndex((b) => b.name === updatedBackground.name);
    if(index === -1){
      return;
    }
    const updatedBackgrounds = this.backgrounds();
    updatedBackgrounds[index] = updatedBackground;
    this.setBackgrounds([...updatedBackgrounds]);
    this.updateBackgroundsInDB();
  }

  private updateBackgroundsInDB = () => {
    this.homebrewBackgrounds$.pipe(
      take(1),
      concatMap((backgrounds) => {
        return httpClient$.toObservable(homebrewDB.backgrounds.bulkPut(this.backgrounds()));
      })
    ).subscribe();
  }

  public removeBackground = (backgroundName: string) => {
    const index = this.backgrounds().findIndex((b) => b.name === backgroundName);
    if(index === -1){
      return;
    }
    const updatedBackgrounds = this.backgrounds();
    updatedBackgrounds.splice(index, 1);
    this.setBackgrounds([...updatedBackgrounds]);
    httpClient$.toObservable(homebrewDB.backgrounds.clear()).pipe(
      take(1),
      concatMap(() => {
        return httpClient$.toObservable(homebrewDB.backgrounds.bulkAdd(this.backgrounds()));
      },
      )).subscribe();
  }

  public addRace = (newRace: Race) => {
    if (this.races().findIndex((r) => r.name === newRace.name) !== -1) {
      return;
    }
    this.setRaces(old => [...old, newRace]);
    this.addRaceToDB(newRace).subscribe();
  }

  private addRaceToDB = (newRace: Race) => {
    return httpClient$.toObservable(homebrewDB.races.add(newRace)).pipe(take(1),
      catchError((err) => {
        console.error("Failed to add race to db", err);
        return of(null);
      }))
  }

  public updateRace = (updatedRace: Race) => {
    const index = this.races().findIndex((r) => r.name === updatedRace.name);
    if (index === -1) {
      return;
    }
    const updatedRaces = this.races();
    updatedRaces[index] = updatedRace;
    this.setRaces([...updatedRaces]);
    this.updateRacesInDB().subscribe();
  }

  private updateRacesInDB = () => {
    return this.homebrewRaces$.pipe(
      take(1),
      concatMap((races)=>{
        return httpClient$.toObservable(homebrewDB.races.bulkPut(this.races()));
      })
    )
  }

  public removeRace = (raceName: string) => {
    const index = this.races().findIndex((r) => r.name === raceName);
    if(index === -1){
      return;
    }
    const updatedRaces = this.races().splice(index, 1);
    this.setRaces([...updatedRaces]);
    httpClient$.toObservable(homebrewDB.races.clear()).pipe(
      take(1),
      concatMap(() => {
        return httpClient$.toObservable(homebrewDB.races.bulkAdd(this.races()));
      })
    ).subscribe();
  }
}