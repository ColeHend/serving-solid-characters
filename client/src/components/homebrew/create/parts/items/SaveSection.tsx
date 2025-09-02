import { Component, Show } from 'solid-js';
import { Button } from 'coles-solid-library';
import Section from './Section';
import { itemsStore } from './itemsStore';
import styles from './items.module.scss';

interface Props { collapsed?: boolean; toggle(): void; onSave(): void; }

export const SaveSection: Component<Props> = (p) => {
  const store = itemsStore;
  return (
    <Section id="save" title="Save" collapsed={p.collapsed} onToggle={p.toggle} icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 2h11l5 5v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/><path d="M5 7h14"/><path d="M12 2v5"/><rect x="9" y="13" width="6" height="6" rx="1"/></svg>}>
      <div style={{ display:'flex', gap:'0.75rem', 'align-items':'center' }}>
        <Button disabled={!store.canSave()} onClick={p.onSave}>{store.state.selection.activeName !== '__new__' && store.isModified() ? 'Update Homebrew' : 'Save Homebrew'}</Button>
        <Show when={store.isModified()}><span class={styles.modifiedBadge}>Modified</span></Show>
      </div>
    </Section>
  );
};

export default SaveSection;
