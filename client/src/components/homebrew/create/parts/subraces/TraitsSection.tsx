import { Component, For, Show } from 'solid-js';
import { FormField, Input, Button, Chip, TextArea } from 'coles-solid-library';
import styles from './subraces.module.scss';
import { SubraceEditorApi } from './useSubraceEditor';

interface Props { api: SubraceEditorApi; }
export const TraitsSection: Component<Props> = (p) => {
  const { draft, addTrait, removeTrait, updateTraitText, editingTrait, setEditingTrait, collapsed, toggle } = p.api;
  return (
    <div class={styles.flatSection} data-section="traits" data-collapsed={collapsed.traits? 'true':undefined}>
      <div class={styles.sectionHeader}><div class={styles.titleWithIcon}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.2 22 12 18.56 5.8 22 7 14.14l-5-4.87 7.1-1.01z"/></svg><h4>Traits</h4></div><button type="button" class={styles.collapseBtn} onClick={()=> toggle('traits')}>{collapsed.traits? 'Expand':'Collapse'}</button></div>
      <div class={styles.sectionContent} data-wide="true">
        <div class="inlineRow inlineDense" style={{ 'margin-top':'.25rem' }}><FormField name="Trait Name"><Input transparent value="" placeholder="Trait name" onKeyDown={e => { if (e.key==='Enter') { const v = (e.currentTarget as HTMLInputElement).value.trim(); if (v) { addTrait(v, ''); (e.currentTarget as HTMLInputElement).value=''; } } }} /></FormField></div>
        <div class="chipsRowSingle" style={{ 'margin-top':'.25rem' }}><Show when={draft()!.traits.length} fallback={<Chip value="None" />}> <For each={draft()!.traits}>{t => <span style={{ display:'inline-flex', 'align-items':'stretch' }}><Button onClick={()=> setEditingTrait(t.name)} style={{ padding:0 }}><Chip value={t.name} remove={() => removeTrait(t.name)} /></Button></span>}</For></Show></div>
        <Show when={editingTrait()}>
          <div style={{ 'margin-top':'.5rem' }}>
            <FormField name={`Editing: ${editingTrait()}`}><TextArea rows={4} transparent text={() => draft()!.traits.find(t=>t.name===editingTrait())?.value.join('\n') || ''} setText={v => { const txt = typeof v === 'function'? v(draft()!.traits.find(t=>t.name===editingTrait())?.value.join('\n') || ''): v; updateTraitText(editingTrait()!, txt); }} /></FormField>
            <div class="inlineRow" style={{ 'margin-top':'.35rem' }}><Button onClick={()=> setEditingTrait(null)}>Done</Button></div>
          </div>
        </Show>
      </div>
    </div>
  );
};
