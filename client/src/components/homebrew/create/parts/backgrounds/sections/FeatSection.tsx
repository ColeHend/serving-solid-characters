import { Component, Show, For } from 'solid-js';
import { FormField, Select, Option, Chip } from 'coles-solid-library';
import styles from '../backgrounds.module.scss';

interface Feat { details: { name: string } }
interface Props {
  collapsed: boolean | undefined;
  toggle: (k: string) => void;
  feats: Feat[];
  value: string | undefined;
  onChange: (v: string) => void;
  onClear: () => void;
}

const FeatSection: Component<Props> = (p) => (
  <div class={styles.flatSection} data-collapsed={p.collapsed} data-section="feat">
    <div class={styles.sectionHeader}>
      <h4>✨ Feat</h4>
      <div class={styles.inlineMeta}>
        <button class={styles.collapseBtn} onClick={() => p.toggle('feat')}>{p.collapsed ? 'Expand' : 'Collapse'}</button>
      </div>
    </div>
    <div class={!p.collapsed ? '' : styles.collapsedContent}>
      <FormField name="Select Feat">
        <Select transparent value={p.value || ''} onChange={p.onChange}>
          <Option value="">-- none --</Option>
          <For each={p.feats}>{f => <Option value={f.details.name}>{f.details.name}</Option>}</For>
        </Select>
      </FormField>
      <Show when={p.value}><div class={styles.chipsRow}><Chip value={p.value!} remove={p.onClear} /></div></Show>
    </div>
  </div>
);
export default FeatSection;
