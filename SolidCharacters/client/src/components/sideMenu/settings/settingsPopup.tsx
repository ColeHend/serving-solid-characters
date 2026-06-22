import { Component, Accessor, Setter, createSignal, Switch, Match, Show } from "solid-js";
import { Clone } from "../../../shared/customHooks/utility/tools/Tools";
import { UserSettings } from "../../../models/userSettings";
import styles from "./settingsPopup.module.scss";
import getUserSettings, { saveUserSettings } from "../../../shared/customHooks/userSettings";
import { Select, Option, addSnackbar, Button, addTheme } from "coles-solid-library";
import { homebrewManager } from "../../../shared";
import FolderTabStrip from "./folderTabStrip";
import { SettingsTab, SETTINGS_TABS } from "./folderTabs.shared";
interface Props {
    defaultUserSettings: Accessor<UserSettings>,
    setDefaultUserSettings: Setter<UserSettings>,
}
const SettingsPopup: Component<Props> = (props) => {
  const [currentTab, setCurrentTab] = createSignal<SettingsTab>("Theme");
  const [userSettings, setUserSettings] = getUserSettings();
  return (
    <div class={styles.folder}>
      <FolderTabStrip tabs={SETTINGS_TABS} active={currentTab()} onChange={setCurrentTab} />
      <div class={styles.folderPage}>
        {/* Keyed Show re-mounts the page on each tab switch so the flip animation re-fires. */}
        <Show when={currentTab()} keyed>
          {(tab) => (
            <div
              class={styles.page}
              role="tabpanel"
              id={`settings-panel-${tab}`}
              aria-labelledby={`settings-tab-${tab}`}
            >
              <Switch>
                <Match when={tab === "General"}>
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
                <Match when={tab === "Theme"}>
                  <div>
                    <h3>Theme</h3>
                    <label for="themeChange">Change Theme : {userSettings().theme}</label>
                    <Select<string> value={userSettings().theme} onSelect={(e) => {
                      setUserSettings(old => {
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
                <Match when={tab === "Account"}>
                  <div>
                    <h3>Account</h3>
                  </div>
                </Match>
              </Switch>
            </div>
          )}
        </Show>
        <div class={styles.actions}>
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
