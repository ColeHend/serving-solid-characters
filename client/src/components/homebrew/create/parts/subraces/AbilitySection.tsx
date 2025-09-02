import { Component, For } from 'solid-js';
import { FormField, Select, Option, Chip, Input } from 'coles-solid-library';
import styles from './subraces.module.scss';
import { SubraceEditorApi } from './useSubraceEditor';

interface Props { api: SubraceEditorApi; }
export const AbilitySection: Component<Props> = (p) => {
  const { draft, addAbility, removeAbility, setAbilityValue, ABILITIES, collapsed, toggle } = p.api;
  return (
    <div class={styles.flatSection} data-section="abilities" data-collapsed={collapsed.abilities? 'true':undefined}>
      <div class={styles.sectionHeader}>
        <div class={styles.titleWithIcon}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="10" width="4" height="11" rx="1"/><rect x="10" y="3" width="4" height="18" rx="1"/><rect x="17" y="7" width="4" height="14" rx="1"/></svg><h4>Ability Bonuses</h4></div>
        <button type="button" class={styles.collapseBtn} onClick={()=> toggle('abilities')}>{collapsed.abilities? 'Expand':'Collapse'}</button>
      </div>
      <div class={styles.sectionContent} data-wide="true">
        <div class="inlineRow inlineDense" style={{ 'margin-top':'.25rem' }}><FormField name="Ability"><Select transparent value="" onChange={v => { if (!v) return; addAbility(v,1); }}><Option value="">-- ability --</Option><For each={ABILITIES.filter(a=> !draft()!.abilityBonuses.some(b=>b.name===a))}>{a => <Option value={a}>{a}</Option>}</For></Select></FormField></div>
        <div class="chipsRowSingle" style={{ 'align-items':'center', gap:'.35rem' }}><For each={draft()!.abilityBonuses}>{b => <span style={{ display:'inline-flex', 'align-items':'center', gap:'.25rem' }}><Chip value={`${b.name}+${b.value}`} remove={() => removeAbility(b.name)} /><Input type="number" min={1} max={4} transparent style={{ width:'60px' }} value={b.value} onInput={e=> { const v = parseInt(e.currentTarget.value||'0'); if (v>0) setAbilityValue(b.name, v); }} /></span>}</For></div>
      </div>
    </div>
  );
};
