import { Component, For } from "solid-js";
import { useLocation } from "@solidjs/router";
import { Icon } from "coles-solid-library";
import { Close } from "coles-solid-library/icons";
import { NavSection } from "./sideMenu.shared";
import { RecentSection } from "./RecentSection";
import styles from "./NavPanel.module.scss";

interface Props {
  section: NavSection;
  onNavigate: (route: string) => void;
  onClose: () => void;
}

/** The wide right panel of the nav drawer: section header, link list, RECENT footer. */
export const NavPanel: Component<Props> = (props) => {
  const location = useLocation();

  return (
    <div class={styles.panel}>
      <div class={styles.header}>
        <div class={styles.headerText}>
          <h2 class={styles.title}>{props.section.label}</h2>
          <span class={styles.subtitle}>{props.section.subtitle}</span>
        </div>
        <button
          type="button"
          class={styles.closeButton}
          title="Close menu"
          aria-label="Close menu"
          onClick={() => props.onClose()}
        >
          <Icon icon={Close} size="small" />
        </button>
      </div>

      <div class={styles.links}>
        <For each={props.section.links}>
          {(link) => (
            <div
              class={`${styles.link} ${location.pathname === link.route ? styles.active : ""}`}
              onClick={() => props.onNavigate(link.route)}
            >
              {link.label}
            </div>
          )}
        </For>
      </div>

      <RecentSection onNavigate={props.onNavigate} />
    </div>
  );
};
