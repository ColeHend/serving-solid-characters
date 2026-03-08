import { Component, For, Show, createEffect, createMemo, onCleanup, onMount } from 'solid-js';
import { addSnackbar, Select, Option, FormField, Container } from 'coles-solid-library';
import { useSearchParams } from '@solidjs/router';
import { racesStore } from './racesStore';
import { homebrewManager } from '../../../../../shared';
import { FlatCard } from '../../../../../shared/components/flatCard/flatCard';
import IdentitySection from './sections/IdentitySection';
import AbilityBonusesSection from './sections/AbilityBonusesSection';
import LanguagesSection from './sections/LanguagesSection';
import TraitsSection from './sections/TraitsSection';
import SaveBar from './sections/SaveBar';
import { validateRace } from './validation';
import styles from './races.module.scss';

const Races: Component = () => {
  const store = racesStore;
  const [searchParams] = useSearchParams();

  const homebrewNames = createMemo(() =>
    (homebrewManager.races() || []).map((r: any) => r.name).filter(Boolean).sort()
  );
  const srdNames = createMemo(() =>
    store.state.order.filter(n => !homebrewNames().includes(n))
  );
  const validationErrors = createMemo(() =>
    validateRace({ isNew: store.state.selection.activeName === '__new__', draft: store.activeRace() })
  );
  const showSnackbar = (msg: string, type: 'success' | 'error' = 'success') =>
    addSnackbar({ message: msg, severity: type, closeTimeout: 500 });

  const handleSelect = (val: string) => {
    if (!val || val === '__divider_homebrew__') return;
    if (val === '__new__') {
      store.selectNew();
      return;
    }
    if (homebrewNames().includes(val)) {
      store.selectHomebrewRace(val);
    } else {
      store.selectSrdRace(val);
    }
  };

  // Sync selection from search params
  createEffect(() => {
    const target = typeof searchParams.name === 'string'
      ? searchParams.name
      : searchParams.name?.join(' ');
    if (!target) return;
    if (homebrewNames().includes(target)) {
      store.selectHomebrewRace(target);
    } else {
      store.selectSrdRace(target);
    }
  });

  onMount(() => document.body.classList.add('race-bg'));
  onCleanup(() => document.body.classList.remove('race-bg'));

  return (
    <Container
      theme="surface"
      class={styles.container}
      data-testid="race-form"
    >
      <h2>Race Creator</h2>

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
        <div class={styles.sectionList}>
          <FlatCard icon="identity_platform" headerName="Identity" startOpen={true} transparent>
            <IdentitySection errors={validationErrors()} />
          </FlatCard>
          <FlatCard icon="electric_bolt" headerName="Ability Bonuses" transparent>
            <AbilityBonusesSection />
          </FlatCard>
          <FlatCard icon="chat" headerName="Languages" transparent>
            <LanguagesSection />
          </FlatCard>
          <FlatCard icon="star" headerName="Traits" transparent>
            <TraitsSection />
          </FlatCard>
          <FlatCard icon="save" headerName="Save" alwaysOpen transparent>
            <SaveBar onNotify={showSnackbar} />
          </FlatCard>
        </div>
      </Show>

      <Show when={store.state.status === 'loading'}>
        <p class={styles.statusMessage}>Loading races...</p>
      </Show>
      <Show when={store.state.status === 'error'}>
        <p class={styles.errorMessage}>Failed to load races: {store.state.error}</p>
      </Show>
    </Container>
  );
};

export default Races;
