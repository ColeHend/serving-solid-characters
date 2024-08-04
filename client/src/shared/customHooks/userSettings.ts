import { Accessor, createSignal, Setter } from "solid-js";
import { UserSettings } from "../../models/userSettings";
import httpClient$ from "./utility/httpClientObs";
import userSettingDB from "./utility/localDB/userSettingDB";
import { take, tap } from "rxjs";
const [currentSettings, setCurrentSettings] = createSignal<UserSettings>({
  userId: 0,
  username: "",
  email: "",
  theme: "light"
});
const [loaded, setLoaded] = createSignal(false);

export default function getUserSettings(forceReload?: boolean): [Accessor<UserSettings>, Setter<UserSettings>] {
    if (!!forceReload) setLoaded(false);
    if (!loaded()) {
      setLoaded(true);
      getAllUsers().pipe(
        take(1),
        tap((settings)=>{
          if(settings.length > 0 && settings[0].userId === currentSettings().userId){
            setCurrentSettings(settings[0]);
          }
        })
      ).subscribe();
    }
    
    return [currentSettings, setCurrentSettings];
}

export function saveUserSettings(settings: UserSettings) {
    userSettingDB.userSettings.put(settings);
    setCurrentSettings(settings);
}

function getAllUsers() {
  return httpClient$.toObservable(userSettingDB.userSettings.toArray());
}