import { Accessor, Setter, createSignal } from "solid-js";
import { Class5E } from "../../models/data/classes";
import HombrewDB from "./utility/localDB/new/homebrewDB";
import httpClient$ from "./utility/tools/httpClientObs";
import { catchError, finalize, of, take, tap } from "rxjs";
import {addSnackbar} from "coles-solid-library";

class HomebrewManager5e {
  public classes: Accessor<Class5E[]>;
  private setClasses: Setter<Class5E[]>;

  constructor() {
    [this.classes, this.setClasses] = createSignal<Class5E[]>([]);
    httpClient$.toObservable(HombrewDB.classes.toArray()).pipe(
      take(1),
      tap(classes => this.setClasses(classes))
    ).subscribe();
  }

  public addClass = (cls: Class5E) => {
    if (this.classes().some(c => c.name === cls.name)) {
      addSnackbar({message: "Class already exists", severity: "warning"});
      return;
    }
    let failed = false;
    httpClient$.toObservable(HombrewDB.classes.add(cls)).pipe(
      take(1),
      catchError(err => { console.error(err); failed = true; addSnackbar({message: "Error saving class", severity: "error"}); return of(null); }),
      finalize(() => {
        if (!failed) {
          this.setClasses(old => [...old, cls]);
          addSnackbar({message: "Class saved", severity: "success"});
        }
      })
    ).subscribe();
  }
}

export const homebrewManager5e = new HomebrewManager5e();
export default homebrewManager5e;