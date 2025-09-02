import { Component, Show } from 'solid-js';
import { Button } from 'coles-solid-library';
import styles from './subraces.module.scss';
import { SubraceEditorApi } from './useSubraceEditor';

interface Props { api: SubraceEditorApi; }
export const SaveSection: Component<Props> = (p) => {
  const { validationErrors, save, state, deleteCurrent } = p.api;
  return (
    <div class={styles.flatSection} data-section="save">
      <div class={styles.sectionHeader}><div class={styles.titleWithIcon}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 2h11l5 5v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/><path d="M5 7h14"/><path d="M12 2v5"/><rect x="9" y="13" width="6" height="6" rx="1"/></svg><h4>Save</h4></div></div>
      <div class={styles.sectionContent}><div class="inlineRow" style={{ 'margin-top':'.5rem' }}><Button disabled={!!validationErrors().length} onClick={save}>{state.editingExisting? 'Update Subrace':'Save Subrace'}</Button><Show when={state.editingExisting}><Button onClick={deleteCurrent}>Delete</Button></Show><Show when={validationErrors().length}><span style={{ color:'orangered', 'font-size':'.8rem' }}>{validationErrors().join(' | ')}</span></Show></div></div>
    </div>
  );
};
