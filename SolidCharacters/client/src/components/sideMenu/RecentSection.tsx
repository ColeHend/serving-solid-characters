import { Component, For, Show } from "solid-js";
import { Icon } from "coles-solid-library";
import { History } from "coles-solid-library/icons";
import { recentTop3 } from "../../shared/customHooks/useRecentItems";
import styles from "./RecentSection.module.scss";

interface Props {
  onNavigate: (route: string) => void;
}

/** The "RECENT" block pinned to the bottom of the nav panel: last 3 viewed entities/tools. */
export const RecentSection: Component<Props> = (props) => {
  return (
    <Show when={recentTop3().length > 0}>
      <div class={styles.recent}>
        <div class={styles.label}>
          <Icon icon={History} size="small" />
          <span>Recent</span>
        </div>
        <For each={recentTop3()}>
          {(item) => (
            <div class={styles.row} onClick={() => props.onNavigate(item.route)}>
              <span class={styles.name}>{item.name}</span>
              <span class={`${styles.typeTag} ${styles[`type_${item.type}`] ?? ""}`}>
                {item.type}
              </span>
            </div>
          )}
        </For>
      </div>
    </Show>
  );
};
