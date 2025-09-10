import { Component, For, Show, createMemo, createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Body, Select, Option, FormField, Button, addSnackbar, Container } from 'coles-solid-library';
import { racesStore } from './racesStore';
import IdentitySection from './sections/IdentitySection';
import AbilityBonusesSection from './sections/AbilityBonusesSection';
import LanguagesSection from './sections/LanguagesSection';
import TraitsSection from './sections/TraitsSection';
import SaveBar from './sections/SaveBar';
import { validateRace } from './validation';
import { homebrewManager } from '../../../../../shared';
import styles from './races.module.scss';
import { FlatCard } from '../../../../../shared/components/flatCard/flatCard';

const Races: Component = () => {
  const store = racesStore;
  const validationErrors = createMemo(() => validateRace({ isNew: store.state.selection.activeName === '__new__', draft: store.activeRace() }));
  const isValid = createMemo(() => validationErrors().length === 0);
  const showSnackbar = (msg: string, type: 'success' | 'error' = 'success') => addSnackbar({ message:msg, severity:type, closeTimeout: 500  });


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
      <Container theme="surface" >
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
              <FlatCard icon='identity_platform' headerName='Identity' startOpen={true}>
                <IdentitySection errors={validationErrors()} />
              </FlatCard>
              <FlatCard icon='electric_bolt' headerName='Ability Bonuses'>
                <AbilityBonusesSection />
              </FlatCard>
              <FlatCard icon='chat' headerName='Languages' >
                <LanguagesSection />
              </FlatCard>
              <FlatCard icon='star' headerName='Traits'>
                <TraitsSection />
              </FlatCard>
              <FlatCard icon='save' headerName='Save' alwaysOpen>
                <SaveBar onNotify={showSnackbar} />
              </FlatCard>
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
        <Show when={store.state.status === 'loading'}>
          <div>Loading races...</div>
        </Show>
        <Show when={store.state.status === 'error'}>
          <div style={{ color: 'red' }}>Failed to load races: {store.state.error}</div>
        </Show>
      </Container>
    </Body>
  );
};

export default Races;
