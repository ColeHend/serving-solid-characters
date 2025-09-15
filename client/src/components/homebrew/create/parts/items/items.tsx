import { Component, For, Show, Switch, Match, createSignal, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Body, FormField, Select, Option } from 'coles-solid-library';
import styles from './items.module.scss';
import { itemsStore } from './itemsStore';
import { useSearchParams } from '@solidjs/router';
import IdentitySection from './IdentitySection';
import WeaponSection from './WeaponSection';
import ArmorSection from './ArmorSection';
import TagsSection from './TagsSection';
import FeaturesSection from './FeaturesSection';
import SaveSection from './SaveSection';

const Items: Component = () => {
  const store = itemsStore;
  const [searchParams, setSearchParams] = useSearchParams();
  const [snackbar, setSnackbar] = createSignal<{ msg: string; type: 'success' | 'error'; ts: number } | null>(null);
  const notify = (msg: string, type: 'success' | 'error' = 'success') => setSnackbar({ msg, type, ts: Date.now() });

  // initial load
  store.loadSrdOnce();

  // One-time deep link selection (avoid continuous effect causing re-select loops)
  onMount(() => {
    const initial = typeof searchParams.name === "string" ? searchParams.name : searchParams.name?.join(" ");
    if (initial && initial !== store.state.selection.activeName) {
      store.select(initial);
      if ((window as any)?.DEBUG_ITEMS) console.debug('[items] mount select param', initial);
    }
  });

  // collapsed section state (mirrors races/backgrounds UX)
  const [collapsed, setCollapsed] = createStore<Record<string, boolean>>({});
  const toggle = (k: string) => setCollapsed(k, v => !v);

  // Option building
  const srdNames = () => Object.keys(store.state.srd).sort();
  const homebrewNames = () => Object.keys(store.state.homebrew).sort();
  (window as any).DEBUG_ITEMS = true;
  function handleSelect(val: string) {
    
    if (!val) return;
    if (val === '__new__') { store.selectNew(); return; }
    if (val === '__divider_homebrew__') return; // inert
  // Update URL param first so auto-select effect (if it fires) reinforces new selection, not the previous one.
  if (searchParams.name !== val) setSearchParams({ name: val });
  if (searchParams.name && typeof searchParams.name === "string") {
    store.select(searchParams.name);
  }
  store.select(val);
  }

  // Tag and weapon helpers moved into section components

  // Feature modal moved into FeaturesSection

  function save() {
    const res = store.persist();
    if (!res.ok) { notify(res.errs![0] || 'Validation failed', 'error'); return; }
    notify('Saved','success');
  }

  // Built-in tags now encapsulated in TagsSection

  return (
    <Body>
      <h1>Items</h1>
      <div class={styles.newPanel || ''}>
        <FormField name="Select Item (SRD 2024/Homebrew)">
          <Select transparent value={store.state.selection.activeName || ''} onChange={handleSelect}>
            <Option value="">-- choose --</Option>
            <Option value="__new__">+ New Item</Option>
            <For each={srdNames()}>{n => <Option value={n}>{n}</Option>}</For>
            <Show when={homebrewNames().length}>
              <Option value="__divider_homebrew__">-- Homebrew --</Option>
              <For each={homebrewNames()}>{n => <Option value={n}>{n} [HB]</Option>}</For>
            </Show>
          </Select>
        </FormField>

    <Show when={store.state.form} keyed>
      <div class={styles.sectionList} data-selver={store.state.selectionVersion} data-kind={store.state.form?.kind}>
            <IdentitySection collapsed={collapsed.identity} toggle={() => toggle('identity')} />

            <Switch>
              <Match when={store.state.form!.kind === 'Weapon'}>
                <WeaponSection collapsed={collapsed.weapon} toggle={() => toggle('weapon')} selectionVersion={store.state.selectionVersion} />
              </Match>
              <Match when={store.state.form!.kind === 'Armor'}>
                <ArmorSection collapsed={collapsed.armor} toggle={() => toggle('armor')} selectionVersion={store.state.selectionVersion} />
              </Match>
            </Switch>

            <TagsSection collapsed={collapsed.tags} toggle={() => toggle('tags')} />

            <FeaturesSection collapsed={collapsed.features} toggle={() => toggle('features')} />

            {/* Validation */}
            <Show when={store.errors().length}>
              <div class={styles.validationBox}>
                <For each={store.errors()}>{e => <div>{e}</div>}</For>
              </div>
            </Show>

            <SaveSection collapsed={collapsed.save} toggle={() => toggle('save')} onSave={save} />
          </div>
        </Show>

        <Show when={store.state.status === 'loading'}><div>Loading SRD items...</div></Show>
        <Show when={store.state.status === 'error'}><div style={{ color:'red' }}>Failed to load items: {store.state.error}</div></Show>
      </div>
  <Show when={snackbar()}><div class={styles.snackbar} data-type={snackbar()!.type}>{snackbar()!.msg}</div></Show>
    </Body>
  );
};

export default Items;