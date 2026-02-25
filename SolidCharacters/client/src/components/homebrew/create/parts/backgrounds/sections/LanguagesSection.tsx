import { Component, For, Show } from "solid-js";
import { Button, Chip } from "coles-solid-library";
import styles from "../backgrounds.module.scss";
import { FlatCard } from "../../../../../../shared/components/flatCard/flatCard";

interface Props {
  collapsed: boolean | undefined;
  toggle: (k: string) => void;
  amount: number;
  options: string[];
  onEdit: () => void;
  error?: boolean;
}

const LanguagesSection: Component<Props> = (p) => {
  return (
    <FlatCard
      icon="chat"
      headerName="Languages"
      extraHeaderJsx={
        <div class={styles.inlineMeta}>
          <div><span>Allow</span> <span>{p.amount}</span></div>
          <Button onClick={p.onEdit}>Edit</Button>
        </div>
      }
    transparent>
      <div class={!p.collapsed ? styles.chipsRow : styles.collapsedContent}>
        <For each={p.options}>{(l) => <Chip value={l} />}</For>
        <Show when={!p.options.length}>
          <Chip value="None" />
        </Show>
      </div>
    </FlatCard>
  );
};
export default LanguagesSection;