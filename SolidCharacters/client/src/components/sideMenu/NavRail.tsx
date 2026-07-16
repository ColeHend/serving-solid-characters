import { Component, For } from "solid-js";
import { Icon } from "coles-solid-library";
import { Settings } from "coles-solid-library/icons";
import { SECTIONS, SectionId } from "./sideMenu.shared";
import { SettingsTab } from "./settings/folderTabs.shared";
import { UserAvatar } from "./UserAvatar";
import styles from "./NavRail.module.scss";

interface Props {
  activeSection: SectionId;
  onSelectSection: (id: SectionId) => void;
  username: string;
  onOpenSettings: (tab?: SettingsTab) => void;
}

/** The narrow icon rail on the left of the nav drawer. */
export const NavRail: Component<Props> = (props) => {
  return (
    <div class={styles.rail}>
      <For each={SECTIONS}>
        {(section) => (
          <button
            type="button"
            class={`${styles.railButton} ${props.activeSection === section.id ? styles.active : ""}`}
            onClick={() => props.onSelectSection(section.id)}
          >
            <Icon icon={section.icon} size="medium" />
            <span class={styles.railLabel}>{section.label}</span>
          </button>
        )}
      </For>

      <div class={styles.bottom}>
        <button
          type="button"
          class={styles.railButton}
          title="Settings"
          aria-label="Settings"
          onClick={() => props.onOpenSettings()}
        >
          <Icon icon={Settings} size="medium" />
        </button>
        <UserAvatar
          username={props.username}
          onClick={() => props.onOpenSettings("Account")}
        />
      </div>
    </div>
  );
};
