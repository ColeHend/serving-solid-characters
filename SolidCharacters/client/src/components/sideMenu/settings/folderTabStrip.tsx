import { Component, For } from "solid-js";
import styles from "./folderTabStrip.module.scss";
import { SettingsTab } from "./folderTabs.shared";

interface Props {
  tabs: SettingsTab[];
  active: SettingsTab;
  onChange: (tab: SettingsTab) => void;
}

const FolderTabStrip: Component<Props> = (props) => {
  // Roving-tabindex needs DOM focus to follow the active tab on arrow-key navigation.
  const buttons: HTMLButtonElement[] = [];

  const select = (index: number) => {
    const count = props.tabs.length;
    const wrapped = (index + count) % count;
    props.onChange(props.tabs[wrapped]);
    // Defer focus until after the signal update re-renders the new active tabindex.
    queueMicrotask(() => buttons[wrapped]?.focus());
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const current = props.tabs.indexOf(props.active);
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown": e.preventDefault(); select(current + 1); break;
      case "ArrowLeft":
      case "ArrowUp": e.preventDefault(); select(current - 1); break;
      case "Home": e.preventDefault(); select(0); break;
      case "End": e.preventDefault(); select(props.tabs.length - 1); break;
    }
  };

  return (
    <div class={styles.tabStrip} role="tablist" aria-label="Settings sections" onKeyDown={onKeyDown}>
      <For each={props.tabs}>{(tab, i) => {
        const isActive = () => props.active === tab;
        return (
          <button
            type="button"
            role="tab"
            id={`settings-tab-${tab}`}
            aria-controls={`settings-panel-${tab}`}
            aria-selected={isActive()}
            tabindex={isActive() ? 0 : -1}
            ref={(el) => (buttons[i()] = el)}
            class={`${styles.tab} ${isActive() ? styles.active : styles.inactive}`}
            onClick={() => props.onChange(tab)}
          >
            <span class={styles.tabLabel}>{tab}</span>
          </button>
        );
      }}</For>
    </div>
  );
};

export default FolderTabStrip;
