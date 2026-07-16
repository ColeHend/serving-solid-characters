import { Component, Show } from "solid-js";
import { Icon } from "coles-solid-library";
import { Person } from "coles-solid-library/icons";
import styles from "./UserAvatar.module.scss";

interface Props {
  username: string;
  onClick: () => void;
}

/** Circular initial avatar at the bottom of the nav rail; opens Account settings. */
export const UserAvatar: Component<Props> = (props) => {
  const initial = () => props.username.trim().slice(0, 1).toUpperCase();

  return (
    <button
      type="button"
      class={styles.avatar}
      title="Account"
      aria-label="Account settings"
      onClick={() => props.onClick()}
    >
      <Show when={initial()} fallback={<Icon icon={Person} size="small" />}>
        {initial()}
      </Show>
    </button>
  );
};
