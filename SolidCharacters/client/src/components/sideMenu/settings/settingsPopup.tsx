import { Component, Accessor, Setter, createSignal, For, Switch, Match } from "solid-js";
import { Clone } from "../../../shared/customHooks/utility/tools/Tools";
import { UserSettings } from "../../../models/userSettings";
import styles from "./settingsPopup.module.scss";
import getUserSettings, { saveUserSettings } from "../../../shared/customHooks/userSettings";
import { Select, Option, addSnackbar, Button, addTheme } from "coles-solid-library";
import { homebrewManager } from "../../../shared";
interface Props {
    defaultUserSettings: Accessor<UserSettings>,
    setDefaultUserSettings: Setter<UserSettings>,
}
const SettingsPopup: Component<Props> = (props) => {
  const [settingTabs] = createSignal<string[]>(["General", "Theme", "Account"]);
  const [currentTab, setCurrentTab] = createSignal<string>("Theme");
  const [userSettings, setUserSettings] = getUserSettings();
  return (
    <div class={styles.settingContainer}>
      <div class={styles.settingTabs}>
        <ul>
          <For each={settingTabs()}>{(tab) => (
            <li class={currentTab() === tab ? styles.active : ''} onClick={()=>setCurrentTab(tab)}>
              {tab}
            </li>
          )}</For>
        </ul>
      </div>
      <div class={styles.settingBody}>
        <Switch>
          <Match when={currentTab() === "General"}>
            <div>
              <h3>General</h3>
              <div>
                <label for="dndSystem">D&D System Version: {userSettings().dndSystem}</label>
                <Select<string> value={userSettings().dndSystem} onSelect={(e) => {
                  setUserSettings(old => {
                    old.dndSystem = e;
                    homebrewManager.resetSystem();
                    return Clone(old);
                  });
                }}>
                  <Option value="2014">2014</Option>
                  <Option value="2024">2024</Option>
                  <Option value="both">Both</Option>
                </Select>
              </div>  
            </div>
          </Match>
          <Match when={currentTab() === "Theme"}>
            <div>
              <h3>Theme</h3>
              <label for="themeChange">Change Theme : {userSettings().theme}</label>
              <Select<string> value={userSettings().theme} onSelect={(e) => {
                setUserSettings(old => {
                  console.log(`old.theme: ${old.theme} e: ${e}`);
                  
                  old.theme = e;
                  addTheme(e);
                  return Clone(old)
                });
              }} >
                <Option value="dark">Dark</Option>
                <Option value="light">Light</Option>
              </Select>

            </div>
          </Match>
          <Match when={currentTab() === "Account"}>
            <div>
              <h3>Account</h3>  
            </div>
          </Match>
        </Switch>
        <div>
          <Button onClick={()=>saveUserSettings(props.defaultUserSettings(), ()=>addSnackbar({
            message: 'Settings Saved Successfully!',
            severity: 'success',
            closeTimeout: 4000
          }))}>Save Settings</Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPopup;