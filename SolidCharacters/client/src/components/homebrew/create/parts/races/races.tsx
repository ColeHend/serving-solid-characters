import { Component, For, Show, createEffect, createMemo, onCleanup, onMount, runWithOwner } from 'solid-js';
import { addSnackbar, Select, Option, FormField, Container } from 'coles-solid-library';
import { Chat, ElectricBolt, IdentityPlatform, Save, Star } from 'coles-solid-library/icons';
import { useSearchParams } from '@solidjs/router';
import { racesStore } from './racesStore';
import { homebrewManager } from '../../../../../shared';
import { FlatCard } from '../../../../../shared/components/flatCard/flatCard';
import { createRaceLikeForm } from '../shared/raceLikeForm.shared';
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
  const raceApi = createRaceLikeForm({ kind: 'race' });

  const homebrewNames = createMemo(() =>
    (homebrewManager.races() || []).map((r: any) => r.name).filter(Boolean).sort()
  );
  const srdNames = createMemo(() =>
    store.state.order.filter(n => !homebrewNames().includes(n))
  );
  const validationErrors = createMemo(() =>
    validateRace({
      isNew: store.state.selection.activeName === '__new__',
      draft: store.state.selection.activeName ? raceApi.formToDraft() : undefined
    })
  );
  const showSnackbar = (msg: string, type: 'success' | 'error' = 'success') =>
    addSnackbar({ message: msg, severity: type, closeTimeout: 500 });

  // The library Select fires onChange from a TRACKED internal effect, not
  // just on user picks. runWithOwner(null) keeps that effect from subscribing
  // to the store reads below — otherwise any selection change re-fires the
  // echo with a stale value and re-selects the previous race. The no-op guard
  // stays for echoed values.
  const handleSelect = (val: string) => runWithOwner(null, () => {
    if (!val || val === '__divider_homebrew__') return;
    if (val === store.state.selection.activeName) return;
    if (val === '__new__') {
      store.selectNew();
      return;
    }
    if (homebrewNames().includes(val)) {
      store.selectHomebrewRace(val);
    } else {
      store.selectSrdRace(val);
    }
  });

  // Sync selection from search params. Each URL target is applied once —
  // without the guard, any homebrew-races emission (e.g. saving) would
  // re-select the URL race and clobber whatever the user navigated to.
  let lastParamTarget: string | undefined;
  createEffect(() => {
    const target = typeof searchParams.name === 'string'
      ? searchParams.name
      : searchParams.name?.join(' ');
    if (!target || target === lastParamTarget) return;
    if (homebrewNames().includes(target)) {
      lastParamTarget = target;
      store.selectHomebrewRace(target);
    } else if (store.state.entities[target]) {
      lastParamTarget = target;
      store.selectSrdRace(target);
    }
    // else: not loaded yet — leave lastParamTarget unset so the effect
    // retries when the catalog or homebrew list updates.
  });

  // Hydrate the form when the selection (or the selected entity itself, e.g.
  // an SRD entry being replaced by its homebrew override) changes. Guarded so
  // form edits — which never touch the store — can't trigger a refill.
  let lastKey: string | undefined;
  let lastSource: unknown;
  createEffect(() => {
    const key = store.state.selection.activeName;
    const draft = store.activeRace();
    const source = key === '__new__' ? draft : key ? store.state.entities[key] : undefined;
    if (!key || (key === lastKey && source === lastSource)) return;
    lastKey = key;
    lastSource = source;
    raceApi.fill(draft ?? {});
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
          <FlatCard icon={IdentityPlatform} headerName="Identity" startOpen={true} transparent>
            <IdentitySection api={raceApi} />
          </FlatCard>
          <FlatCard icon={ElectricBolt} headerName="Ability Bonuses" transparent>
            <AbilityBonusesSection api={raceApi} />
          </FlatCard>
          <FlatCard icon={Chat} headerName="Languages" transparent>
            <LanguagesSection api={raceApi} />
          </FlatCard>
          <FlatCard icon={Star} headerName="Traits" transparent>
            <TraitsSection api={raceApi} />
          </FlatCard>
          <FlatCard icon={Save} headerName="Save" alwaysOpen transparent>
            <SaveBar api={raceApi} errors={validationErrors()} onNotify={showSnackbar} />
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
