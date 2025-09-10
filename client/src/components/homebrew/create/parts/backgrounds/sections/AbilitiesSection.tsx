import { Component, For, Show, createSignal } from "solid-js";
import {
  Button,
  Chip,
  Modal,
  Select,
  Option,
  FormField,
} from "coles-solid-library";
import styles from "../backgrounds.module.scss";
import { FlatCard } from "../../../../../../shared/components/flatCard/flatCard";

interface Props {
  collapsed: boolean | undefined;
  toggle: (k: string) => void;
  abilityChoices: string[];
  abilityOptions: string[];
  remaining: number;
  onEdit: () => void;
  onReset: () => void;
  onAddAbility: (a: string) => void;
  onRemoveAbility: (idx: number) => void;
}

const AbilitiesSection: Component<Props> = (p) => {
  const [show, setShow] = createSignal(false);
  return (
    <FlatCard
      icon="electric_bolt"
      headerName="Ability Choices"
      startOpen={true}
      extraHeaderJsx={
        <div style={{
          "justify-self":"flex-end"
        }}>
          <span>{p.abilityChoices.length}/3</span>
          <Button onClick={() => setShow(true)}>Edit</Button>
          <Button onClick={p.onReset} disabled={!p.abilityChoices.length}>
            Reset
          </Button>
        </div>
      }
    >
      <div class={!p.collapsed ? styles.chipsRow : styles.collapsedContent}>
        <For each={p.abilityChoices}>{(a) => <Chip value={a} />}</For>
        <Show when={!p.abilityChoices.length}>
          <Chip value="None" />
        </Show>
      </div>
      <Modal title="Edit Ability Choices" show={[show, setShow]}>
        <div class={styles.chipsRow}>
          <Select
            class={styles.tightSelect}
            transparent
            value=""
            onChange={(val) => p.onAddAbility(val)}
          >
            <Option value="">Add Ability...</Option>
            <For each={p.abilityOptions}>
              {(a) => <Option value={a}>{a}</Option>}
            </For>
          </Select>
          <div class={styles.subNote}>Picks remaining: {p.remaining}</div>
        </div>
        <div class={styles.scrollMini}>
          <div class={styles.chipsRow}>
            <For each={p.abilityChoices}>
              {(a, i) => (
                <Chip value={a} remove={() => p.onRemoveAbility(i())} />
              )}
            </For>
            <Show when={!p.abilityChoices.length}>
              <Chip value="None" />
            </Show>
          </div>
        </div>
        <div class={styles.chipsRow}>
          <Button onClick={() => setShow(false)}>Done</Button>
        </div>
      </Modal>
    </FlatCard>
  );
};
export default AbilitiesSection;

/* 
(
    <div class={styles.flatSection} data-collapsed={p.collapsed} data-section="abilities" data-error={false}>
      <div class={styles.sectionHeader}>
        <h4>⚡ Ability Choices</h4>
        <div class={styles.inlineMeta}>
          
          <button class={styles.collapseBtn} onClick={() => p.toggle('abilities')}>{p.collapsed ? 'Expand' : 'Collapse'}</button>

        </div>
      </div>
    
    </div>
  );

*/
