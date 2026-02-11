import { Component, For, Show, createEffect, createMemo, createSignal, onCleanup, onMount } from 'solid-js';
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
import { useSearchParams } from '@solidjs/router';

const Races: Component = () => {
  const store = racesStore;
  const validationErrors = createMemo(() => validateRace({ isNew: store.state.selection.activeName === '__new__', draft: store.activeRace() }));
  const isValid = createMemo(() => validationErrors().length === 0);
  const showSnackbar = (msg: string, type: 'success' | 'error' = 'success') => addSnackbar({ message:msg, severity:type, closeTimeout: 500  });

  const [searchParams,setSearchParams] = useSearchParams();

  const homebrewNames = createMemo(() => (homebrewManager.races() || []).map((r: any) => r.name).filter(Boolean).sort());
  const srdNames = createMemo(() => store.state.order.filter(n => !homebrewNames().includes(n)));
  let runOnce = true;
  const handleSelect = (val: string) => {
    if (runOnce) {
      if (!val || val === '__divider_homebrew__') return;
      if (val === '__new__') { 
        store.selectNew(); 
        runOnce = false;
        return; 
      }
      if (homebrewNames().includes(val)) {
        store.selectHomebrewRace(val);
      } else {
        store.selectSrdRace(val);
      }
     

    }
  };

  // search Params

  if (searchParams.name === "" && store.activeRace()) {
    setSearchParams({ name: store.activeRace()?.name})
  } else {
    setSearchParams({ name: store.state.order[0]})
  }

  createEffect(() => {
    const target = typeof searchParams.name === "string" ? searchParams.name : searchParams.name?.join(" ")
    if (searchParams.name !== "" && homebrewNames().includes(searchParams.name)) {
      store.selectHomebrewRace(target ?? "")
    } else {
      store.selectSrdRace(target ?? "")
    }
    store.state.selection.activeName == target
  })

  onMount(()=>{
      document.body.classList.add('race-bg');
  })

  onCleanup(()=>{
    document.body.classList.remove('race-bg');
  })

  return (
    <Body class={`${styles.body}`}>
      <h1>Races</h1>
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
            <FlatCard icon='identity_platform' headerName='Identity' startOpen={true} transparent>
              <IdentitySection errors={validationErrors()} />
            </FlatCard>
            <FlatCard icon='electric_bolt' headerName='Ability Bonuses' transparent>
              <AbilityBonusesSection />
            </FlatCard>
            <FlatCard icon='chat' headerName='Languages' transparent >
              <LanguagesSection />
            </FlatCard>
            <FlatCard icon='star' headerName='Traits' transparent>
              <TraitsSection />
            </FlatCard>
            <FlatCard icon='save' headerName='Save' alwaysOpen transparent>
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
    </Body>
  );
};

export default Races;
