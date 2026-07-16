import { Component, Accessor, Setter, createSignal, Switch, Match, Show, For } from "solid-js";
import { Clone } from "../../../shared/customHooks/utility/tools/Tools";
import { UserSettings } from "../../../models/userSettings";
import styles from "./settingsPopup.module.scss";
import getUserSettings, { saveUserSettings } from "../../../shared/customHooks/userSettings";
import { Select, Option, addSnackbar, Button } from "coles-solid-library";
import { THEMES, getTheme, applyTheme } from "../../../shared/customHooks/utility/style/themeRegistry";
import { homebrewManager } from "../../../shared";
import FolderTabStrip from "./folderTabStrip";
import { SettingsTab, SETTINGS_TABS } from "./folderTabs.shared";
import AiSettingsTab from "./aiSettingsTab";
import AiReviewSettingsTab from "./aiReviewSettingsTab";
interface Props {
    defaultUserSettings: Accessor<UserSettings>,
    setDefaultUserSettings: Setter<UserSettings>,
    initialTab?: SettingsTab,
}
const SettingsPopup: Component<Props> = (props) => {
  const [currentTab, setCurrentTab] = createSignal<SettingsTab>(props.initialTab ?? "Theme");
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
                    <label for="themeChange">Change Theme : {getTheme(userSettings().theme).label}</label>
                    <Select<string> value={userSettings().theme} onSelect={(e) => {
                      setUserSettings(old => {
                        old.theme = e;
                        applyTheme(e);
                        return Clone(old)
                      });
                    }} >
                      <For each={THEMES}>{(t) => <Option value={t.id}>{t.label}</Option>}</For>
                    </Select>
                  </div>
                </Match>
                <Match when={tab === "Account"}>
                  <div>
                    <h3>Account</h3>
                  </div>
                </Match>
                <Match when={tab === "AI"}>
                  <AiSettingsTab />
                </Match>
                <Match when={tab === "AI Behavior"}>
                  <AiReviewSettingsTab />
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
