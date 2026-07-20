import { Accessor, Setter, createSignal } from "solid-js";
import { Character, CharacterSpell } from "../../../models/character.model";
import httpClient$ from "../utility/tools/httpClientObs";
import CharacterDB from "../utility/localDB/new/charactersDB";
import {
  catchError,
  finalize,
  Observable,
  of,
  take,
  tap,
} from "rxjs";
import { addSnackbar } from "coles-solid-library";
import { Clone } from "../utility/tools/Tools";
import { createNewId } from "../utility/tools/idGen";

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

  /** Adds the character under a freshly minted id (every creation path gets one here). */
  public createCharacter(character: Character) {
    const copy = Clone(character);
    copy.id = createNewId();
    // Subscribe so the pipe actually runs — toObservable is cold, and without a subscriber
    // the finalize() that reconciles the in-memory signal never fires (the Dexie write is
    // eager, so the row would persist while the list stayed stale until a full reload —
    // making a second Save duplicate the character and Delete silently no-op).
    this.addCharacterToDB(copy).subscribe();
    return copy.id;
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
            // Grimoire brand beat for a new character (product copy, not the AI voice toggle).
            addSnackbar({
              message: "Your legend begins.",
              severity: "success",
            });
          }
        })
      );
  }

  // ------Read------

  public getCharacter(id: string) {
    return this._characters().find((character) => character.id === id);
  }

  // ------Update------

  public updateCharacter(character: Character, silent = false) {
    if (!character.id) return;
    // No in-memory presence guard: Dexie put() upserts by id, and the signal may lag a
    // just-created character (see createCharacter). Subscribe so the pipe runs.
    this.updateCharInDB(character, silent).subscribe();
  }

  public updateCharSpell(characterId: string, newSpell: CharacterSpell) {
    const character = this.getCharacter(characterId);

    if (character) {
      
      const spells = character.spells.filter(s => s.name !== newSpell.name);

      spells.push(newSpell);

      const updated = Clone(character);
      updated.spells = spells;
      this.updateCharacter(updated)
      addSnackbar({
        message: `Added ${newSpell.name} to ${character.name}`,
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

  private updateCharInDB(updated: Character, silent = false) {
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
          // Upsert: put() creates the row when missing, so mirror that in the signal.
          this._setCharacters(list => list.some(c => c.id === updated.id)
            ? list.map(c => c.id === updated.id ? updated : c)
            : [...list, updated]);
          if (!silent) {
            addSnackbar({
              message: "Character updated successfully",
              severity: "success"
            });
          }
        }
      })
    );
  }


  // ------Delete------

  public deleteCharacter(id: string) {
    if (!this.characters().some(c => c.id === id)) return;

    httpClient$.toObservable(CharacterDB.characters.delete(id)).pipe(
      take(1)
    ).subscribe({
      error: err => {
        console.error(err);
        addSnackbar({
          message: "Error removing character",
          severity: "error"
        })

      },
      complete: () => {
        this._setCharacters(list => list.filter(c => c.id !== id));
        addSnackbar({
          message: "Character Removed",
          severity: "success"
        });
      }
    })
  }

  public deleteCharSpell(characterId: string, spellName: string) {

    // eslint-disable-next-line prefer-const
    let character = this.getCharacter(characterId);


    if (character) {
      character.spells = character.spells.filter(s => s.name !== spellName);

      this.updateCharacter(character);

      addSnackbar({
        message: `deleted ${spellName} from ${character.name}`,
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