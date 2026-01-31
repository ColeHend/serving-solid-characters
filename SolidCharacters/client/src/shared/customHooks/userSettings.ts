import { Accessor, createSignal, Setter } from "solid-js";
import { UserSettings } from "../../models/userSettings";
import httpClient$ from "./utility/tools/httpClientObs";
import userSettingDB from "./utility/localDB/userSettingDB";
import { catchError, of, take, tap } from "rxjs";

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  userId: 0,
  username: "",
  email: "",
  dndSystem: ''
}
// Initialize with default settings
const [currentSettings, setCurrentSettings] = createSignal<UserSettings>({...DEFAULT_SETTINGS});
const [loaded, setLoaded] = createSignal(false);
const [isLoading, setIsLoading] = createSignal(false);

export function getUserSettings(forceReload?: boolean): [Accessor<UserSettings>, Setter<UserSettings>] {
  if ((forceReload || !loaded()) && !isLoading()) {
    console.log("Loading user settings...");
    setIsLoading(true);
    
    // Attempt to load settings from IndexedDB
    getAllUsers().pipe(
      take(1),
      catchError(err => {
        console.error("Error loading user settings:", err);
        return of([] as UserSettings[]);
      }),
      tap((settings) => {
        console.log("User settings retrieved:", settings);
        
        if (settings && settings.length > 0) {
          // We found saved settings, use them
          setCurrentSettings(settings[0]);
          console.log("Loaded user settings:", settings[0]);
        } else {
          // No settings found, create default settings entry
          console.log("No settings found, using defaults");
          saveUserSettings({...DEFAULT_SETTINGS});
        }
        
        setLoaded(true);
        setIsLoading(false);
      })
    ).subscribe({
      error: (err) => {
        console.error("Critical error in user settings subscription:", err);
        setLoaded(true);
        setIsLoading(false);
      }
    });
  }
    
  return [currentSettings, setCurrentSettings];
}
export default getUserSettings;

export function saveUserSettings(settings: UserSettings, callback?: ()=>void) {
  console.log("Saving user settings:", settings);
  
  userSettingDB.userSettings.put(settings).then(() => {
    console.log("User settings saved successfully");
    if(callback) callback();
  }).catch((err) => {
    console.error("Failed to save user settings:", err);
  });
  
  setCurrentSettings(settings);
}

function getAllUsers() {
  return httpClient$.toObservable(
    userSettingDB.userSettings.toArray()
  ).pipe(
    catchError(err => {
      console.error("Error in getAllUsers:", err);
      return of([]);
    })
  );
}