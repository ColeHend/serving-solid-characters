import { Component, For, Show, createMemo, createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Body, Select, Option, FormField, Button } from 'coles-solid-library';
import { racesStore } from './racesStore';
import IdentitySection from './sections/IdentitySection';
import AbilityBonusesSection from './sections/AbilityBonusesSection';
import LanguagesSection from './sections/LanguagesSection';
import TraitsSection from './sections/TraitsSection';
import SaveBar from './sections/SaveBar';
import { validateRace } from './validation';
import { homebrewManager } from '../../../../../shared';
import styles from './races.module.scss';

const Races: Component = () => {
  const store = racesStore;
  const validationErrors = createMemo(() => validateRace({ isNew: store.state.selection.activeName === '__new__', draft: store.activeRace() }));
  const isValid = createMemo(() => validationErrors().length === 0);
  const [snackbar, setSnackbar] = createSignal<{ msg: string; type: 'success' | 'error'; ts: number } | null>(null);
  const showSnackbar = (msg: string, type: 'success' | 'error' = 'success') => setSnackbar({ msg, type, ts: Date.now() });
  // collapsed section state (mirrors backgrounds UX)
  const [collapsed, setCollapsed] = createStore<Record<string, boolean>>({});
  const toggle = (k: string) => setCollapsed(k, v => !v);
  const homebrewNames = createMemo(() => (homebrewManager.races() || []).map((r: any) => r.name).filter(Boolean).sort());
  const srdNames = createMemo(() => store.state.order.filter(n => !homebrewNames().includes(n)));
  const handleSelect = (val: string) => {
    if (!val || val === '__divider_homebrew__') return;
    if (val === '__new__') { store.selectNew(); return; }
    if (homebrewNames().includes(val)) store.selectHomebrewRace(val); else store.selectSrdRace(val);
  };

  return (
    <Body>
      <h1>Races</h1>
      <div class={styles.newPanel || ''}>
        <div style={{ display: 'flex', gap: '1rem', 'flex-wrap': 'wrap' }}>
            <FormField name="Select Race (2024)">
            <Select transparent value={store.state.selection.activeName || ''} onChange={handleSelect}>
              <Option value="">-- choose --</Option>
              <Option value="__new__">+ New Race</Option>
              <For each={srdNames()}>{name => <Option value={name}>{name}</Option>}</For>
              <Show when={homebrewNames().length}>
                <Option value="__divider_homebrew__">-- Homebrew --</Option>
                <For each={homebrewNames()}>{name => <Option value={name}>{`${name} [HB]`}</Option>}</For>
              </Show>
            </Select>
          </FormField>
          <Show when={store.activeRace()}>
            <div class={styles.sectionList} style={{ flex: 1, 'min-width': '320px' }}>
              <div class={styles.flatSection} data-section="identity" data-collapsed={collapsed.identity ? 'true' : undefined}>
                <div class={styles.sectionHeader}>
                  <div class={styles.titleWithIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="7" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>
                    <h4>Identity</h4>
                  </div>
                  <button type="button" class={styles.collapseBtn} onClick={() => toggle('identity')}>{collapsed.identity ? 'Expand' : 'Collapse'}</button>
                </div>
                <div class={styles.sectionContent}><IdentitySection errors={validationErrors()} /></div>
              </div>
              <div class={styles.flatSection} data-section="abilities" data-collapsed={collapsed.abilities ? 'true' : undefined}>
                <div class={styles.sectionHeader}>
                  <div class={styles.titleWithIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="10" width="4" height="11" rx="1"/><rect x="10" y="3" width="4" height="18" rx="1"/><rect x="17" y="7" width="4" height="14" rx="1"/></svg>
                    <h4>Ability Bonuses</h4>
                  </div>
                  <button type="button" class={styles.collapseBtn} onClick={() => toggle('abilities')}>{collapsed.abilities ? 'Expand' : 'Collapse'}</button>
                </div>
                <div class={styles.sectionContent} data-wide="true"><AbilityBonusesSection /></div>
              </div>
              <div class={styles.flatSection} data-section="langs" data-collapsed={collapsed.langs ? 'true' : undefined}>
                <div class={styles.sectionHeader}>
                  <div class={styles.titleWithIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 4h16v9H5.5L4 14.5V4z"/><path d="M9 8h6"/><path d="M12 21c4.5 0 8-3 8-7v-1"/></svg>
                    <h4>Languages</h4>
                  </div>
                  <button type="button" class={styles.collapseBtn} onClick={() => toggle('langs')}>{collapsed.langs ? 'Expand' : 'Collapse'}</button>
                </div>
                <div class={styles.sectionContent}><LanguagesSection /></div>
              </div>
              <div class={styles.flatSection} data-section="traits" data-collapsed={collapsed.traits ? 'true' : undefined}>
                <div class={styles.sectionHeader}>
                  <div class={styles.titleWithIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.2 22 12 18.56 5.8 22 7 14.14l-5-4.87 7.1-1.01z"/></svg>
                    <h4>Traits</h4>
                  </div>
                  <button type="button" class={styles.collapseBtn} onClick={() => toggle('traits')}>{collapsed.traits ? 'Expand' : 'Collapse'}</button>
                </div>
                <div class={styles.sectionContent} data-wide="true"><TraitsSection /></div>
              </div>
              <div class={styles.flatSection} data-section="save">
                <div class={styles.sectionHeader}>
                  <div class={styles.titleWithIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 2h11l5 5v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/><path d="M5 7h14"/><path d="M12 2v5"/><rect x="9" y="13" width="6" height="6" rx="1"/></svg>
                    <h4>Save</h4>
                  </div>
                </div>
                <div class={styles.sectionContent}><SaveBar onNotify={showSnackbar} /></div>
              </div>
            </div>
          </Show>
        </div>
        <Show when={validationErrors().length}>
          <div style={{ 'margin-top': '1rem', 'background': 'rgba(255,0,0,0.1)', padding: '0.5rem 0.75rem', 'border-radius': '4px', 'font-size': '0.9rem' }}>
            <For each={validationErrors()}>{e => <div>{e}</div>}</For>
          </div>
        </Show>
        <Show when={store.state.selection.activeName === '__new__'}>
          <div style={{ 'margin-top': '1rem' }}>
            <Button disabled={!isValid()} onClick={() => { if (!isValid()) { showSnackbar('Fix validation errors','error'); return; } showSnackbar('Save not yet implemented'); }}>Save (WIP)</Button>
          </div>
        </Show>
        <Show when={snackbar()}>
          <div style={{ position: 'fixed', bottom: '1rem', right: '1rem', padding: '0.75rem 1rem', 'border-radius': '6px', background: snackbar()!.type === 'success' ? '#2d7' : '#d55', color: '#111', 'box-shadow': '0 2px 6px rgba(0,0,0,0.3)' }}>{snackbar()!.msg}</div>
        </Show>
        <Show when={store.state.status === 'loading'}>
          <div>Loading races...</div>
        </Show>
        <Show when={store.state.status === 'error'}>
          <div style={{ color: 'red' }}>Failed to load races: {store.state.error}</div>
        </Show>
      </div>
    </Body>
  );
};

export default Races;
