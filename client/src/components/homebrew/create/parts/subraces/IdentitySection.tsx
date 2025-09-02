import { Component, For, Show } from 'solid-js';
import { FormField, Input, Select, Option, Chip, TextArea } from 'coles-solid-library';
import styles from './subraces.module.scss';
import { SubraceEditorApi } from './useSubraceEditor';

interface Props { api: SubraceEditorApi; }
export const IdentitySection: Component<Props> = (p) => {
  const { draft, updateDraft, addSize, removeSize, SIZE_TOKENS, collapsed, toggle } = p.api;
  return (
    <div class={styles.flatSection} data-section="identity" data-collapsed={collapsed.identity? 'true':undefined}>
      <div class={styles.sectionHeader}>
        <div class={styles.titleWithIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="7" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>
          <h4>Identity</h4>
        </div>
        <button type="button" class={styles.collapseBtn} onClick={()=> toggle('identity')}>{collapsed.identity? 'Expand':'Collapse'}</button>
      </div>
      <div class={styles.sectionContent}>
        <div class="inlineRow inlineDense">
          <FormField name="Subrace Name"><Input transparent value={draft()!.name} onInput={e=> updateDraft('name', e.currentTarget.value)} /></FormField>
          <FormField name="Speed"><Input type="number" min={0} transparent style={{ width:'90px' }} value={draft()!.speed} onInput={e=> updateDraft('speed', parseInt(e.currentTarget.value||'0'))} /></FormField>
        </div>
        <FormField name="Short Description"><TextArea transparent rows={2} text={() => draft()!.text.desc} setText={v => updateDraft('text', { ...draft()!.text, desc: typeof v === 'function'? v(draft()!.text.desc): v }) as any} /></FormField>
        <div class="inlineRow inlineDense">
          <FormField name="Add Size"><Select transparent value="" onChange={v => { if (v) addSize(v); }}><Option value="">-- size --</Option><For each={SIZE_TOKENS.filter(s=> !draft()!.sizes.includes(s))}>{s => <Option value={s}>{s}</Option>}</For></Select></FormField>
          <div class="chipsRowSingle" aria-label="Sizes"><Show when={draft()!.sizes.length} fallback={<Chip value="None" />}> <For each={draft()!.sizes}>{s => <Chip value={s} remove={() => removeSize(s)} />}</For></Show></div>
        </div>
      </div>
    </div>
  );
};
