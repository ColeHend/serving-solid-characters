import type { Accessor } from "solid-js";
import { createSignal } from "solid-js";
import { catchError, of, take, tap, concatMap, shareReplay, Observable } from "rxjs";
import HttpClient$ from "../../utility/tools/httpClientObs";
import { Background } from "../../../../models/old/background.model";
import LocalSrdDB from "../../utility/localDB/old/srdDBFile";

const [background, setBackgrounds] = createSignal<Background[]>([]);
let backgroundsFetch$: Observable<Background[] | null> | undefined;

export function useDnDBackgrounds(): Accessor<Background[]> {
  const LocalBackgrounds = HttpClient$.toObservable(LocalSrdDB.backgrounds.toArray());
  if (background().length === 0) {
    LocalBackgrounds.pipe(
      take(1),
      tap(localData => console.log(`Local backgrounds data found: ${localData.length} items`)),
      concatMap((backgrounds) => {
        if (backgrounds.length > 0) {
          return of(backgrounds);
        } else {
          return of([]);
        }
      }),
      concatMap((backgrounds) => {
        if (backgrounds.length === 0) {
          if (!backgroundsFetch$) {
            console.log("No local backgrounds found, creating shared fetch observable...");
            backgroundsFetch$ = HttpClient$.get<Background[]>("/api/DnDInfo/Backgrounds", {}).pipe(
              take(1),
              tap(response => console.log("API Response:", response)),
              catchError((err) => {
                console.error("Error fetching backgrounds:", err);
                console.error("Status:", err.status);
                console.error("Message:", err.message);
                console.error("URL:", "/api/DnDInfo/Backgrounds");
                // Single fallback attempt
                return HttpClient$.get<Background[]>("/api/DnDInfo/Backgrounds").pipe(
                  take(1),
                  tap(response => console.log("Fallback Response:", response)),
                  catchError(getErr => {
                    console.error("Fallback also failed:", getErr);
                    return of(null);
                  })
                );
              }),
              tap((b) => {
                if (b) {
                  console.log(`Storing ${b.length} backgrounds in local DB`);
                  LocalSrdDB.backgrounds.bulkAdd(b);
                }
              }),
              shareReplay(1)
            );
          }
          return backgroundsFetch$;
        } else {
          return of(backgrounds);
        }
      }),
      tap((classes) => {
        if (!!classes && classes.length > 0) {
          console.log(`Setting ${classes.length} backgrounds to state`);
          setBackgrounds(classes);
        } else {
          console.warn("No backgrounds data available to set to state");
        }
      }),
    ).subscribe({
      error: (err) => console.error("Observable pipeline error:", err)
    });
  }

  return background;
}
export default useDnDBackgrounds;