import { Component, Accessor, Setter, createSignal, For, Switch, Match } from "solid-js";
import { Button, Select } from "../../shared/components";
import { Clone } from "../../shared/customHooks/utility/Tools";
import { UserSettings } from "../../models/userSettings";
import styles from "./settingsPopup.module.scss";
import { Style } from "../../shared/customHooks/utility/style/styleHook";
import { saveUserSettings } from "../../shared/customHooks/userSettings";
import { addSnackbar } from "../../shared/components/Snackbar/snackbar";
interface Props {
    defaultUserSettings: Accessor<UserSettings>,
    setDefaultUserSettings: Setter<UserSettings>,
    userStyle: Accessor<Style>
}
const SettingsPopup: Component<Props> = (props) => {
  const [settingTabs] = createSignal<string[]>(["General", "Theme", "Account"]);
  const [currentTab, setCurrentTab] = createSignal<string>("Theme");
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
            </div>
          </Match>
          <Match when={currentTab() === "Theme"}>
            <div>
              <h3>Theme</h3>
              <label for="themeChange">Change Theme </label>
              <Select name="themeChange" onChange={(e) => props.setDefaultUserSettings(old => {
                old.theme = e.target.value;
                return Clone(old)
              })} >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
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