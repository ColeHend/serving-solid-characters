import { Observable, take, tap, of, concatMap, OperatorFunction, catchError, finalize, endWith, retry } from "rxjs";
import { Accessor, Setter, createSignal } from "solid-js";
import { DnDClass, Item, Feat, Spell, Background, Race } from "../../models";
import homebrewDB from "./utility/localDB/homebrewDBFile";
import httpClient$ from "./utility/httpClientObs";
import { Clone } from "./utility/Tools";
import addSnackbar from "../components/Snackbar/snackbar";
class HomebrewManager {
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
            return null;
        }
        this.addClassToDB(newClass).subscribe();
    }

    private addClassToDB = (newClass: DnDClass) => {
			let failed = false;
        return httpClient$.toObservable(homebrewDB.classes.add(newClass)).pipe(
					take(1),
					catchError((err)=> {
						console.error(err);
						failed = true;
						addSnackbar({message: "Error adding class to database", severity: "error"});
						return of(null)
					}),
					finalize(()=>{
						if(!failed){
							this.setClasses(old =>[...old, newClass]);
							addSnackbar({message: "Class added successfully", severity: "success"});
						}
					})
			);
    }

    public updateClass (updatedClass: DnDClass){
        const index = this.classes().findIndex((c) => c.name === updatedClass.name);
        if(index === -1){
            return;
        }
				this.updateClassInDB(Clone(updatedClass)).subscribe();
    }

		private updateClassInDB = (updatedClass: DnDClass) => {
			let error = false;
			return httpClient$.toObservable(homebrewDB.classes.put(updatedClass)).pipe(
				take(1),
				catchError((err)=> {
					console.error(err);
					error = true;
					addSnackbar({message: "Error updating class in database", severity: "error"});
					return of(null)
				}),
				finalize(()=> {
					if(!error){
						const index = this.classes().findIndex((c) => c.name === updatedClass.name);
						const updatedClasses = this.classes();
						updatedClasses[index] = updatedClass;
						this.setClasses([...updatedClasses]);
						addSnackbar({message: "Class updated successfully", severity: "success"});
					}
				})
			);
		}

    public updateClassesInDB = () => {
			let error = false
			httpClient$.toObservable(homebrewDB.classes.bulkPut(this.classes())).pipe(
				take(1),
				catchError((err)=>{
					console.error(err);
					error = true;
					addSnackbar({message: "Error updating classes in database", severity: "error"});
					return of(null)
				}),
				finalize(()=>{
					if(!error){
						addSnackbar({message: "Classes updated successfully", severity: "success"});
					}
				})
			).subscribe();
    }

    public removeClass = (className: string) => {
        const index = this.classes().findIndex((c) => c.name === className);
        if(index === -1){
            return;
        }
				let error = false;
        
        httpClient$.toObservable(homebrewDB.classes.bulkAdd(this.classes())).pipe(
						take(1),
						catchError((err) => {
								console.error(err);
								error = true;
								addSnackbar({message: "Error removing class from database", severity: "error"});
								return of(null);
						}),
						finalize(() => {
							if (!error) {
								const updatedClasses = this.classes();
        				updatedClasses.splice(index, 1);
								this.setClasses([...updatedClasses]);
								addSnackbar({message: "Class removed successfully", severity: "success"});
							}
						})
				).subscribe();
    }

    public addItem = (newItem: Item) => {
        if(this.items().findIndex((i) => i.name === newItem.name) !== -1){
            return null;
        } else {
            // ask to update
        }
        this.addItemToDB(Clone(newItem)).subscribe();
    }

    public addItemToDB = (newItem: Item) => {
			let error = false;
        return httpClient$.toObservable(homebrewDB.items.add(newItem)).pipe(
					take(1),
					catchError((err)=>{
						console.error(err);
						error = true;
						addSnackbar({message: "Error adding item to database", severity: "error"});
						return of(null)
					}),
					finalize(()=>{
						if(!error){
							this.setItems(old =>[...old, newItem]);
							addSnackbar({message: "Item added successfully", severity: "success"});
						}
					})
        );
    }

    public updateItem = (updatedItem: Item) => {
			const index = this.items().findIndex((i) => i.name === updatedItem.name);
			if(index === -1){
					return;
			}
			this.updateItemInDB(Clone(updatedItem)).subscribe();
    }

		public updateItemInDB = (updatedItem: Item) => {
			let error = false;
			return httpClient$.toObservable(homebrewDB.items.put(updatedItem)).pipe(
				take(1),
				catchError((err)=> {
					console.error(err);
					error = true;
					addSnackbar({message: "Error updating item in database", severity: "error"});
					return of(null)
				}),
				finalize(()=> {
					if(!error){
						const index = this.items().findIndex((i) => i.name === updatedItem.name);
						const updatedItems = this.items();
						updatedItems[index] = updatedItem;
						this.setItems([...updatedItems]);
						addSnackbar({message: "Item updated successfully", severity: "success"});
					}
				})
			);
		}

    public updateItemsInDB = () => {
			let error = false;
			httpClient$.toObservable(homebrewDB.items.bulkPut(this.items())).pipe(
				take(1),
				catchError((err)=>{
					console.error(err);
					error = true;
					addSnackbar({message: "Error updating items in database", severity: "error"});
					return of(null)
				}),
				finalize(()=>{
					if(!error){
						addSnackbar({message: "Items updated successfully", severity: "success"});
					}
				})
			).subscribe();
    }

    public removeItem = (itemName: string) => {
        const index = this.items().findIndex((i) => i.name === itemName);
        if(index === -1){
            return;
        }
				let error = false;
        httpClient$.toObservable(homebrewDB.items.bulkAdd(this.items())).pipe(
						take(1),
						catchError((err) => {
								console.error(err);
								error = true;
								addSnackbar({message: "Error removing item from database", severity: "error"});
								return of(null);
						}),
						finalize(() => {
							if (!error) {
								const updatedItems = this.items();
								updatedItems.splice(index, 1);
								this.setItems([...updatedItems]);
								addSnackbar({message: "Item removed successfully", severity: "success"});
							}
						})
				).subscribe();
    }

    public addFeat = (newFeat: Feat) => {
        if(this.feats().findIndex((f) => f.name === newFeat.name) !== -1){
            return null;
        } else {
            // ask to update
        }
        this.addFeatToDB(newFeat).subscribe();
    }

    private addFeatToDB = (newFeat: Feat) => {
			let error = false;
      return httpClient$.toObservable(homebrewDB.feats.add(newFeat)).pipe(
				take(1),
				catchError((err)=>{
					console.error(err);
					error = true;
					addSnackbar({message: "Error adding feat to database", severity: "error"});
					return of(null)
				}),
				finalize(()=>{
					if(!error){
						this.setFeats(old =>[...old, newFeat]);
						addSnackbar({message: "Feat added successfully", severity: "success"});
					}
				})
			);
    }

    public updateFeat = (updatedFeat: Feat) => {
        const index = this.feats().findIndex((f) => f.name === updatedFeat.name);
        if(index === -1){
            return;
        }
        
				this.updateFeatInDB(Clone(updatedFeat));
    }

		private updateFeatInDB = (updatedFeat: Feat) => {
			let error = false;
			return httpClient$.toObservable(homebrewDB.feats.put(updatedFeat)).pipe(
				take(1),
				catchError((err)=> {
					console.error(err);
					error = true;
					addSnackbar({message: "Error updating feat in database", severity: "error"});
					return of(null)
				}),
				finalize(()=>{
					if(!error){
						const index = this.feats().findIndex((f) => f.name === updatedFeat.name);
						const updatedFeats = this.feats();
						updatedFeats[index] = updatedFeat;
						this.setFeats([...updatedFeats]);
						addSnackbar({message: "Feat updated successfully", severity: "success"});
					}
				})
			);
		}

    public updateFeatsInDB = () => {
			let error = false;
			httpClient$.toObservable(homebrewDB.feats.bulkPut(this.feats())).pipe(
				take(1),
				catchError((err)=>{
					console.error(err);
					error = true;
					addSnackbar({message: "Error updating feats in database", severity: "error"});
					return of(null)
				}),
				finalize(()=>{
					if(!error){
						addSnackbar({message: "Feats updated successfully", severity: "success"});
					}
				})
			).subscribe();
    }

    public removeFeat = (featName: string) => {
        const index = this.feats().findIndex((f) => f.name === featName);
        if(index === -1){
            return;
        }
        const updatedFeats = this.feats();
				let error = false;
        updatedFeats.splice(index, 1);
        httpClient$.toObservable(homebrewDB.feats.bulkAdd(updatedFeats)).pipe(
					take(1),
					catchError((err) => {
						console.error(err);
						error = true;
						addSnackbar({message: "Error removing feat from database", severity: "error"});
						return of(null);
					}),
					finalize(() => {
						if (!error) {
							this.setFeats([...updatedFeats]);
							addSnackbar({message: "Feat removed successfully", severity: "success"});
						}
					})
				).subscribe();
    }

    public addSpell = (newSpell: Spell) => {
        if(this.spells().findIndex((s) => s.name === newSpell.name) !== -1){
            return null;
        } else {
            // ask to update.
        }
        this.addSpellToDB(Clone(newSpell)).subscribe();
    }

    private addSpellToDB = (newSpell: Spell) => {
			let error = false;
        return httpClient$.toObservable(homebrewDB.spells.add(newSpell)).pipe(
					take(1),
					catchError((err)=>{
						console.error(err);
						error = true;
						addSnackbar({message: "Error adding spell to database", severity: "error"});
						return of(null)
					}),
					finalize(()=>{
						if(!error){
							this.setSpells(old =>[...old, newSpell]);
							addSnackbar({message: "Spell added successfully", severity: "success"});
						}
					})
			);
    }

    public updateSpell = (updatedSpell: Spell) => {
        const index = this.spells().findIndex((s) => s.name === updatedSpell.name);
        if(index === -1){
            return;
        }
				this.updateSpellInDb(Clone(updatedSpell)).subscribe();
    }

		public updateSpellInDb = (updatedSpell: Spell) => {
			let error = false;
			return httpClient$.toObservable(homebrewDB.spells.put(updatedSpell)).pipe(
				take(1),
				catchError((err)=>{
					console.error(err);
					error = true;
					addSnackbar({message: "Error updating spell in database", severity: "error"});
					return of(null)
				}),
				finalize(()=>{
					if(!error){
						const index = this.spells().findIndex((s) => s.name === updatedSpell.name);
						const updatedSpells = this.spells();
						updatedSpells[index] = updatedSpell;
						this.setSpells([...updatedSpells]);
						addSnackbar({message: "Spell updated successfully", severity: "success"});
					}
				})
		);
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
        httpClient$.toObservable(homebrewDB.spells.clear()).pipe(
            take(1),
            concatMap(() => {
                return httpClient$.toObservable(homebrewDB.spells.bulkAdd(updatedSpells)).pipe(
										take(1),
										catchError((err) => {
											console.error(err);
											addSnackbar({message: "Error removing spell from database", severity: "error"});
											return of(null);
										}),
										finalize(() => {
											this.setSpells([...updatedSpells]);
											addSnackbar({message: "Spell removed successfully", severity: "success"});
										})
								);
            })
        ).subscribe();
    }

    public addBackground = (newBackground: Background) => {
        if(this.backgrounds().findIndex((b) => b.name === newBackground.name) !== -1){
            return;
        } else {
            // ask to update
        }
        this.addBackgroundToDB(Clone(newBackground)).subscribe();
				return true
    }

    private addBackgroundToDB = (newBackground: Background) => {
        return httpClient$.toObservable(homebrewDB.backgrounds.add(newBackground)).pipe(
					take(1),
					catchError((err)=>{
						console.error(err);
						addSnackbar({message: "Error adding background to database", severity: "error"});
						return of(null)
					}),
					endWith(()=>{
						this.setBackgrounds(old =>[...old, newBackground]);
						addSnackbar({message: "Background added successfully", severity: "success"});
					})
			);
    }

    public updateBackground = (updatedBackground: Background) => {
        if(!!!this.backgrounds().find((b) => b.name === updatedBackground.name)){
            return;
        }
        this.updateBackgroundsInDB(Clone(updatedBackground));
				return true
    }

    private updateBackgroundsInDB = (updatedBackground: Background) => {
			httpClient$.toObservable(homebrewDB.backgrounds.bulkPut(this.backgrounds())).pipe(
				take(1),
				catchError((err)=>{
					console.error(err);
					addSnackbar({message: "Error updating backgrounds in database", severity: "error"});
					return of(null)
				}),
				endWith(()=>{
					const index = this.backgrounds().findIndex((b) => b.name === updatedBackground.name);
					const updatedBackgrounds = this.backgrounds();
					updatedBackgrounds[index] = updatedBackground;
					this.setBackgrounds([...updatedBackgrounds]);
					addSnackbar({message: "Backgrounds updated successfully", severity: "success"});
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
        httpClient$.toObservable(homebrewDB.backgrounds.clear()).pipe(
            take(1),
            concatMap(() => {
                return httpClient$.toObservable(homebrewDB.backgrounds.bulkAdd(updatedBackgrounds)).pipe(
									take(1),
									catchError((err) => {
										console.error(err);
										addSnackbar({message: "Error removing background from database", severity: "error"});
										return of(null);
									}),
									endWith(()=>{
										this.setBackgrounds([...updatedBackgrounds]);
										addSnackbar({message: "Background removed successfully", severity: "success"});
									})
								);
            },
        )).subscribe();
    }

    public addRace = (newRace: Race) => {
        if (this.races().findIndex((r) => r.name === newRace.name) !== -1) {
            return;
        }
        this.addRaceToDB(Clone(newRace)).subscribe();
    }

    private addRaceToDB = (newRace: Race) => {
			let error = false;
        return httpClient$.toObservable(homebrewDB.races.add(newRace)).pipe(
					take(1),
					catchError((err)=>{
						console.error(err);
						error = true;
						addSnackbar({message: "Error adding a Race to the database", severity: "error"});
						return of(null)
					}),
					finalize(()=>{
						if(!error){
							this.setRaces(old =>[...old, newRace]);
							addSnackbar({message: "Successfully added a new Race!", severity: "success"});
						}
					})
			)
    }

    public updateRace = (updatedRace: Race) => {
        const index = this.races().findIndex((r) => r.name === updatedRace.name);
        if (index === -1) {
            return;
        }
        
        this.updateRacesInDB(updatedRace).subscribe();
    }

    private updateRacesInDB = (updatedRace: Race) => {
			let error = false;
			const updatedRaces = this.races();
			const index = this.races().findIndex((r) => r.name === updatedRace.name);
			updatedRaces[index] = updatedRace;
			return this.homebrewRaces$.pipe(
					take(1),
					concatMap((races)=>{
							return httpClient$.toObservable(homebrewDB.races.bulkPut(updatedRaces)).pipe(
								take(1),
								catchError((err)=>{
									console.error(err);
									error = true;
									addSnackbar({message: "Error updating races in database", severity: "error"});
									return of(null)
								}),
								finalize(()=>{
									if(!error){
										this.setRaces([...updatedRaces]);
										addSnackbar({message: "Successfully updated Races", severity: "success"});
									}
								})
							);
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
							return httpClient$.toObservable(homebrewDB.races.bulkAdd(this.races())).pipe(
								take(1),
								catchError((err) => {
									console.error(err);
									addSnackbar({message: "Error removing race from database", severity: "error"});
									return of(null);
								}),
								finalize(() => {
									this.setRaces([...updatedRaces]);
									addSnackbar({message: "Succesfully removed race from database", severity: "success"});
								})
							);
            })
        ).subscribe();
    }
}
const homebrewManager = new HomebrewManager();
export { homebrewManager }
export default homebrewManager;