import { Component, For, Show } from 'solid-js';
import { Button, Chip } from 'coles-solid-library';
import styles from '../backgrounds.module.scss';

interface Props {
  collapsed: boolean | undefined;
  toggle: (k: string) => void;
  amount: number;
  options: string[];
  onEdit: () => void;
  error?: boolean;
}

const LanguagesSection: Component<Props> = (p) => (
  <div class={styles.flatSection} data-collapsed={p.collapsed} data-section="langs" data-error={p.error || false}>
    <div class={styles.sectionHeader}>
      <h4>🗣️ Languages</h4>
      <div class={styles.inlineMeta}>
        <span>Allow {p.amount}</span>
        <button class={styles.collapseBtn} onClick={() => p.toggle('langs')}>{p.collapsed ? 'Expand' : 'Collapse'}</button>
        <Button onClick={p.onEdit}>Edit</Button>
      </div>
    </div>
    <div class={!p.collapsed ? styles.chipsRow : styles.collapsedContent}><For each={p.options}>{l => <Chip value={l} />}</For><Show when={!p.options.length}><Chip value="None" /></Show></div>
  </div>
);
export default LanguagesSection;
