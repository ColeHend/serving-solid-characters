import { Component, For } from 'solid-js';
import { FormField, Input, Chip, TextArea } from 'coles-solid-library';
import styles from './subraces.module.scss';
import { SubraceEditorApi } from './useSubraceEditor';

interface Props { api: SubraceEditorApi; }
export const LanguageSection: Component<Props> = (p) => {
  const { draft, addLanguageFixed, removeLanguageFixed, setLanguageChoice, removeLanguageOption, setLangDesc, collapsed, toggle } = p.api;
  return (
    <div class={styles.flatSection} data-section="langs" data-collapsed={collapsed.langs? 'true':undefined}>
      <div class={styles.sectionHeader}><div class={styles.titleWithIcon}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 4h16v9H5.5L4 14.5V4z"/><path d="M9 8h6"/><path d="M12 21c4.5 0 8-3 8-7v-1"/></svg><h4>Languages</h4></div><button type="button" class={styles.collapseBtn} onClick={()=> toggle('langs')}>{collapsed.langs? 'Expand':'Collapse'}</button></div>
      <div class={styles.sectionContent}>
        <div class="inlineRow inlineDense" style={{ 'margin-top':'.25rem' }}>
          <FormField name="Add Lang"><Input transparent value="" placeholder="e.g. Common" onKeyDown={e => { if (e.key==='Enter') { const v = (e.currentTarget as HTMLInputElement).value.trim(); if (v) { addLanguageFixed(v); (e.currentTarget as HTMLInputElement).value=''; } } }} /></FormField>
          <FormField name="Choice Amt"><Input type="number" min={0} transparent style={{ width:'70px' }} value={draft()!.languages.amount} onInput={e => setLanguageChoice(parseInt(e.currentTarget.value||'0'), draft()!.languages.options)} /></FormField>
          <FormField name="Choice Opt"><Input transparent value="" placeholder="Optional Lang" onKeyDown={e => { if (e.key==='Enter') { const v = (e.currentTarget as HTMLInputElement).value.trim(); if (!v) return; const opts = Array.from(new Set([...draft()!.languages.options, v])); setLanguageChoice(draft()!.languages.amount, opts); (e.currentTarget as HTMLInputElement).value=''; } }} /></FormField>
        </div>
        <div class="chipsRowSingle" style={{ 'margin-top':'.25rem' }}><For each={draft()!.languages.fixed}>{l => <Chip value={l} remove={() => removeLanguageFixed(l)} />}</For></div>
        <div class="chipsRowSingle" style={{ 'margin-top':'.25rem' }}><For each={draft()!.languages.options}>{l => <Chip value={l} remove={() => removeLanguageOption(l)} />}</For></div>
        <FormField name="Language Description"><TextArea transparent rows={2} text={() => draft()!.languages.desc} setText={v => setLangDesc(typeof v === 'function'? v(draft()!.languages.desc): v)} /></FormField>
      </div>
    </div>
  );
};
