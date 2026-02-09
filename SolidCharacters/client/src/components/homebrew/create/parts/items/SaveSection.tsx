import { Component, Show } from "solid-js";
import { Button } from "coles-solid-library";
import { itemsStore } from "./itemsStore";
import styles from "./items.module.scss";
import { FlatCard } from "../../../../../shared/components/flatCard/flatCard";

interface Props {
  collapsed?: boolean;
  toggle(): void;
  onSave(): void;
}

export const SaveSection: Component<Props> = (p) => {
  const store = itemsStore;
  return (
    <FlatCard
      icon="save"
      headerName="Save"
      alwaysOpen
      transparent
    >
      <div style={{ display: "flex", gap: "0.75rem", "align-items": "center" }}>
        <Button disabled={!store.canSave()} onClick={p.onSave}>
          {store.state.selection.activeName !== "__new__" && store.isModified()
            ? "Update Homebrew"
            : "Save Homebrew"}
        </Button>
        <Show when={store.isModified()}>
          <span class={styles.modifiedBadge}>Modified</span>
        </Show>
      </div>
    </FlatCard>
  );
};

export default SaveSection;
