import { Component } from "solid-js";
import styles from "./infoButton.module.scss";

interface InfoButtonProps {
  label: string;
  onClick: () => void;
}

/**
 * Small "view details" affordance. Rendered as a span with button semantics so it can
 * sit inside the picker cards, which are themselves <button> elements (nested buttons
 * are invalid HTML and misfire).
 */
export const InfoButton: Component<InfoButtonProps> = (props) => {
  const activate = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    props.onClick();
  };
  return (
    <span
      role="button"
      tabIndex={0}
      class={styles.infoButton}
      title={props.label}
      aria-label={props.label}
      onClick={activate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") activate(event);
      }}
    >
      ⓘ
    </span>
  );
};
