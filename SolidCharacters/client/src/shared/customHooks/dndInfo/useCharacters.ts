import { Accessor, Setter, createSignal } from "solid-js";
import { Character, CharacterSpell } from "../../../models/character.model";
import httpClient$ from "../utility/tools/httpClientObs";
import CharacterDB from "../utility/localDB/new/charactersDB";
import {
  catchError,
  concatMap,
  finalize,
  Observable,
  of,
  take,
  tap,
} from "rxjs";
import { addSnackbar } from "coles-solid-library";
import { Clone } from "../utility/tools/Tools";

export interface Stats {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

class CharacterManager {
  private _characters: Accessor<Character[]>;
  private _setCharacters: Setter<Character[]>;

  public characters: Accessor<Character[]>;

  private localCharacters$: Observable<Character[]> = httpClient$.toObservable(
    CharacterDB.characters.toArray()
  );

  constructor(characters: Character[] = []) {
    [this._characters, this._setCharacters] = createSignal(characters);

    this.characters = () => this._characters().map((char) => char);

    this.localCharacters$
      .pipe(
        take(1),
        tap((c) => this._setCharacters((old) => [...old, ...c]))
      )
      .subscribe();
  }

  // ------create------

  public createCharacter(character: Character) {
    if (this._characters().some((c) => c.name === character.name)) return;
    this.addCharacterToDB(Clone(character));
  }

  private addCharacterToDB(newCharacter: Character) {
    let failed = false;
    return httpClient$
      .toObservable(CharacterDB.characters.add(newCharacter))
      .pipe(
        take(1),
        catchError((err) => {
          console.error(err);
          failed = true;
          addSnackbar({
            message: `Error adding character to database`,
            severity: "error",
          });
          return of(null);
        }),
        finalize(() => {
          if (!failed) {
            this._setCharacters((o) => [...o, newCharacter]);
            addSnackbar({
              message: "Character succsessfuly added",
              severity: "success",
            });
          }
        })
      );
  }

  // ------Read------

  public getCharacter(name: string) {
    return this._characters().find((character) => character.name === name);
  }

  // ------Update------

  public updateCharacter(character: Character) {
    if (!this.characters().some(c => c.name === character.name)) return;
    this.updateCharInDB(character);
  }

  public updateCharSpell(characterName: string,newSpell: CharacterSpell) {
    const character = this.getCharacter(characterName);

    if (character) {
      
      const spells = character.spells.filter(s => s.name !== newSpell.name);

      spells.push(newSpell);

      this.updateCharacter({
        name: character.name,
        ArmorClass: character.ArmorClass,
        Speed: character.Speed,
        level: character.level,
        levels: character.levels,
        race: character.race,
        className: character.className,
        subclass: character.subclass,
        background: character.background,
        alignment: character.alignment,
        proficiencies: character.proficiencies,
        savingThrows: character.savingThrows,
        resistances: character.resistances,
        vulnerabilities: character.vulnerabilities,
        immunities: character.immunities,
        languages: character.languages,
        health: character.health,
        stats: character.stats,
        items: character.items,
        spells: spells,
        features: character.features
      })
      addSnackbar({
        message: `Added ${newSpell.name} to ${characterName}`,
        severity: "success"
      })
      return;
      
    } else {
      addSnackbar({
        message: "Coundn't find character",
        severity: "error"
      })
    }

  }

  private updateCharInDB(updated: Character) {
    let failed = false;
    return httpClient$.toObservable(CharacterDB.characters.put(updated)).pipe(
      take(1),
      catchError(err => {
        console.error(err);
        failed = true;
        addSnackbar({
          message: "Error updating character in database",
          severity: "error"
        });

        return of(null);
      }),
      finalize(() => {
        if (!failed) {
          this._setCharacters(list => list.map(c => c.name === updated.name ? updated : c));
          addSnackbar({
            message: "Character updated successfully",
            severity: "success"
          });
        }
      })
    );
  }


  // ------Delete------

  public deleteCharacter(name: string) {
    if (!this.characters().some(c => c.name === name)) return;
    const rest = this._characters().filter(c => c.name !== name);
    
    httpClient$.toObservable(CharacterDB.characters.clear()).pipe(
      take(1),
      concatMap(() => 
        httpClient$.toObservable(CharacterDB.characters.bulkAdd(rest))
      )
    ).subscribe({
      error: err => {
        console.error(err);
        addSnackbar({
          message: "Error removing character",
          severity: "error"
        })
        
      },
      complete: () => {
        this._setCharacters(rest);
        addSnackbar({
          message: "Character Removed",
          severity: "success"
        });
      }
    })
  }

  public deleteCharSpell(characterName: string,spellName: string) {
    
    // eslint-disable-next-line prefer-const
    let character = this.getCharacter(characterName);

    
    if (character) {
      character.spells = character.spells.filter(s => s.name !== spellName);
      
      this.updateCharacter(character);

      addSnackbar({
        message: `deleted ${spellName} from ${characterName}`,
        severity: "success"
      })
      return;
      
    } else {
      addSnackbar({
        message: "Coundn't find character",
        severity: "error"
      })
      return;
    }
  }



}

const characterManager = new CharacterManager();
export { characterManager };
export default characterManager;