import type { DnDClass } from "../../../../models/class.model";
import type { Accessor } from "solid-js";
import { createSignal, onMount } from "solid-js";
import { catchError, concatMap, from, map, mergeMap, of, take, tap } from "rxjs";
import HttpClient$ from "../../utility/httpClientObs";
import LocalSrdDB from "../../utility/localDB/srdDBFile";
import HomebrewManager from "../../../../shared/customHooks/homebrewManager";
import { FixClasses } from "./fixClasses";

// Create a signal with a default empty array
const [classes, setClasses] = createSignal<DnDClass[]>([]);
const [isLoading, setIsLoading] = createSignal(false);
const [hasError, setHasError] = createSignal(false);
const [errorMessage, setErrorMessage] = createSignal("");

export function useDnDClasses(): Accessor<DnDClass[]> {
  // Only attempt to load classes if we haven't already started loading them
  if (classes().length === 0 && !isLoading() && !hasError()) {
    console.log("Starting to load DnD classes...");
    setIsLoading(true);
    
    // Wait for the database to be ready before attempting to query it
    from(LocalSrdDB.initPromise).pipe(
      catchError(err => {
        console.error("Database initialization error:", err);
        setErrorMessage("Failed to initialize database");
        return of(null);
      }),
      concatMap(() => {
        console.log("Database ready, loading classes from LocalDB");
        return HttpClient$.toObservable(LocalSrdDB.classes.toArray()).pipe(
          catchError(err => {
            console.error("Error loading classes from local DB:", err);
            // Return empty array if local DB fails
            return of([]);
          })
        );
      }),
      concatMap((localClasses) => {
        if (localClasses && localClasses.length > 0) {
          console.log(`Found ${localClasses.length} classes in local DB`);
          return of(localClasses);
        } else {
          console.log("No classes in local DB, fetching from API");
          return HttpClient$.get<DnDClass[]>("/api/DnDInfo/Classes", {}).pipe(
            take(1),
            map((apiClasses) => {
              if (!apiClasses || apiClasses.length === 0) {
                console.warn("API returned no classes");
                return [];
              }
              console.log(`API returned ${apiClasses.length} classes`);
              return FixClasses(apiClasses);
            }),
            catchError((err) => {
              console.error("API error loading classes:", err);
              setErrorMessage("Failed to load classes from server");
              return of([]);
            }),
            tap((apiClasses) => {
              if (apiClasses && apiClasses.length > 0) {
                console.log("Saving classes to local DB");
                LocalSrdDB.classes.bulkAdd(apiClasses).catch(err => {
                  console.error("Error saving classes to local DB:", err);
                });
              }
            })
          );
        }
      }),
      concatMap((classes: DnDClass[]) => {
        // Add homebrew classes if available
        try {
          const homebrewClasses = HomebrewManager.classes();
          if (homebrewClasses && homebrewClasses.length > 0) {
            console.log(`Adding ${homebrewClasses.length} homebrew classes`);
            return of(classes.concat(homebrewClasses as unknown as DnDClass[]));
          }
        } catch (error) {
          console.error("Error loading homebrew classes:", error);
        }
        return of(classes);
      }),
      tap({
        next: (mergedClasses) => {
          if (mergedClasses && mergedClasses.length > 0) {
            console.log(`Setting ${mergedClasses.length} classes in state`);
            setClasses(mergedClasses);
          } else {
            console.warn("No classes found in any source");
            // Set an empty array so we don't keep trying to load
            setClasses([]);
          }
          setIsLoading(false);
        },
        error: (err) => {
          console.error("Error in classes loading flow:", err);
          setErrorMessage("Failed to load classes");
          setHasError(true);
          setIsLoading(false);
          // Set empty array to prevent infinite loading attempts
          setClasses([]);
        },
        complete: () => {
          setIsLoading(false);
        }
      })
    ).subscribe();
  }

  return classes;
}

export default useDnDClasses;