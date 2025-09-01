import { Component, For, createSignal, createMemo, Show, createEffect } from "solid-js";
import { Body, Input, Select, Option, Button, FormField } from "coles-solid-library";
import styles from './backgrounds.module.scss';
import HomebrewManager, { homebrewManager } from "../../../../../shared/customHooks/homebrewManager";
import { createStore } from "solid-js/store";
import { Background } from "../../../../../models/data";
import type { FeatureDetail } from "../../../../../models/data/features";
import { useDnDBackgrounds } from "../../../../../shared/customHooks/dndInfo/info/all/backgrounds";
import { useDnDFeats } from "../../../../../shared/customHooks/dndInfo/info/all/feats";
import { backgroundsStore } from "../../../../../shared/stores/backgroundsStore";
import { candidateEquipmentItems } from './constants';
import AbilitiesSection from './sections/AbilitiesSection';
import EquipmentSection from './sections/EquipmentSection';
import FeatSection from './sections/FeatSection';
import ProficienciesSection from './sections/ProficienciesSection';
import ProficienciesModal from './sections/ProficienciesModal';
import LanguagesModal from './sections/LanguagesModal';
import LanguagesSection from './sections/LanguagesSection';
import FeaturesSection from './sections/FeaturesSection';
import { validate, fieldError as fieldErrHelper } from './validation';

const Backgrounds: Component = () => {
  const allBackgrounds = useDnDBackgrounds();
  const allFeats = useDnDFeats();

  // ---------------- NEW DATA FORMAT SECTION (incremental migration) ----------------
  const bStore = backgroundsStore; // alias
  const selectedFeat = createMemo(() => bStore.state.form.feat);

  const canAddAbility = createMemo(() => bStore.state.form.abilityChoices.length < 3);
  const remainingAbilityPicks = createMemo(() => 3 - bStore.state.form.abilityChoices.length);

  function handleAddAbility(a: string) {
    if (!a) return;
    bStore.addAbilityChoice(a);
  }

  function handleSelectBackground(name: string) {
    bStore.selectBackground(name);
  }

  function handleSelectFeat(feat: string) {
    bStore.setFeat(feat);
  }

  function saveNewFormat(update = false) {
    const active = bStore.activeBackground();
    if (!active) return;
  if (!isValid()) { showSnackbar('Cannot save: fix validation errors', 'error'); return; }
    const draft: Background = { ...active } as Background;
    if (bStore.state.form.abilityChoices.length) draft.abilityOptions = [...bStore.state.form.abilityChoices];
    draft.feat = bStore.state.form.feat || undefined;
    // apply any staged edits from edit buffers
    if (editedProfs.armor.length || editedProfs.weapons.length || editedProfs.skills.length || editedProfs.tools.length) {
      draft.proficiencies = { ...editedProfs };
    }
    draft.languages = { amount: languageAmount(), options: [...languageOptions()] };
  draft.startEquipment = [...equipmentGroups()];
  draft.features = [...featuresList()];
  if (update) { HomebrewManager.updateBackground(draft); showSnackbar('Background updated','success'); }
  else { HomebrewManager.addBackground(draft); showSnackbar('Background saved','success'); }
  }

  // ----- Editing state for new panel additions -----
  const [editedProfs, setEditedProfs] = createStore({ armor: [] as string[], weapons: [] as string[], tools: [] as string[], skills: [] as string[] });
  const [languageAmount, setLanguageAmount] = createSignal(0);
  const [languageOptions, setLanguageOptions] = createSignal<string[]>([]);
  const [equipmentGroups, setEquipmentGroups] = createSignal<{ optionKeys?: string[]; items?: string[] }[]>([]);
  // pending equipment items (controlled external state for EquipmentSection)
  const [pendingEquipItems, setPendingEquipItems] = createSignal<string[]>([]);
  const addPendingEquipItem = (it: string) => { const v = it.trim(); if (!v) return; setPendingEquipItems(list => list.includes(v) ? list : [...list, v]); };
  const removePendingEquipItem = (it: string) => setPendingEquipItems(list => list.filter(v => v !== it));
  const clearPendingEquip = () => setPendingEquipItems([]);
  // equipment group editing (modal logic moved into EquipmentSection)
  // section collapse state
  const [collapsed, setCollapsed] = createStore<Record<string, boolean>>({});
  const toggle = (k: string) => setCollapsed(k, v => !v);
  const [featuresList, setFeaturesList] = createSignal<FeatureDetail[]>([]);

  function syncActiveToEditors() {
    const active = bStore.activeBackground();
    if (!active) return;
    setEditedProfs({ ...active.proficiencies });
    setLanguageAmount(active.languages?.amount || 0);
    setLanguageOptions([...(active.languages?.options || [])]);
  setEquipmentGroups([...(active.startEquipment || [])]);
  setFeaturesList([...(active.features || [])]);
  }

  createMemo(() => { // run when selection changes
    bStore.state.selection.activeName; // dependency
    syncActiveToEditors();
  });

  function removeLanguage(lang: string) { setLanguageOptions(o => o.filter(l => l !== lang)); }

  function pushProf(category: keyof typeof editedProfs, value: string) {
    if (!value) return; setEditedProfs(category, arr => arr.includes(value) ? arr : [...arr, value]); }
  function removeProf(category: keyof typeof editedProfs, value: string) { setEditedProfs(category, arr => arr.filter(v => v !== value)); }

  const existsInHomebrew = createMemo(() => {
    const active = bStore.activeBackground();
    if (!active) return false;
    if (bStore.state.selection.activeName === '__new__') return false;
    return homebrewManager.backgrounds().some(b => b.name === active.name);
  });

  // change detection for polish
  const isModified = createMemo(() => {
    const active = bStore.activeBackground();
    if (!active) return false;
    const abilityChanged = JSON.stringify(active.abilityOptions || []) !== JSON.stringify(bStore.state.form.abilityChoices);
    const featChanged = (active.feat || '') !== (bStore.state.form.feat || '');
    const profChanged = JSON.stringify(active.proficiencies || {}) !== JSON.stringify(editedProfs);
    const langChanged = JSON.stringify(active.languages || { amount:0, options:[] }) !== JSON.stringify({ amount: languageAmount(), options: languageOptions() });
  const equipChanged = JSON.stringify(active.startEquipment || []) !== JSON.stringify(equipmentGroups());
  const featuresChanged = JSON.stringify(active.features || []) !== JSON.stringify(featuresList());
  return abilityChanged || featChanged || profChanged || langChanged || equipChanged || featuresChanged;
  });

  // Validation rules
  const validationErrors = createMemo(() => {
    const active = bStore.activeBackground();
    if (!active) return [] as string[];
    return validate({
      isNew: bStore.state.selection.activeName === '__new__',
      name: active.name || '',
      languageAmount: languageAmount(),
      languageOptions: languageOptions(),
      features: featuresList(),
      abilityChoices: bStore.state.form.abilityChoices,
      abilityBaseline: active.abilityOptions?.length || 0,
      equipmentGroups: equipmentGroups()
    });
  });
  const isValid = createMemo(() => validationErrors().length === 0);

  // Inline error helpers: map field -> first relevant error
  const fieldError = (field: string) => fieldErrHelper(validationErrors(), field);

  // Snackbar state
  const [snackbar, setSnackbar] = createSignal<{ msg: string; type: 'success' | 'error'; ts: number } | null>(null);
  function showSnackbar(msg: string, type: 'success'|'error'='success') { setSnackbar({ msg, type, ts: Date.now() }); }
  createEffect(() => { if (snackbar()) { const t = setTimeout(()=> setSnackbar(null), SNACKBAR_TIMEOUT_MS); return () => clearTimeout(t); } });

  return (
    <>
      <Body>
        <h1>Backgrounds</h1>
        <div class={styles.newPanel}>
          <h2>SRD / Homebrew Background Editor</h2>
          <div class={styles.rowWrap}>
            <FormField name="Select Background (2024)">
              <Select transparent value={bStore.state.selection.activeName || ''} onChange={(val) => { if (val === '__new__') bStore.selectNew(); else handleSelectBackground(val); }}>
                <Option value="">-- choose --</Option>
                <Option value="__new__">+ New Background</Option>
                <For each={bStore.state.order}>{name => <Option value={name}>{name}</Option>}</For>
              </Select>
            </FormField>
            <Show when={bStore.activeBackground()}>
              <div class={styles.description} style={{ width: '100%' }}>
                <Show
                  when={bStore.state.selection.activeName === '__new__'}
                  fallback={<div>
                    <h3>{bStore.activeBackground()?.name}</h3>
                    <p>{bStore.activeBackground()?.desc}</p>
                  </div>}
                >
                  <div>
                    <FormField name="Name">
                      <Input transparent value={bStore.activeBackground()?.name || ''} onInput={e => bStore.updateBlankDraft('name', e.currentTarget.value)} />
                    </FormField>
                    <FormField name="Description">
                      <Input transparent value={bStore.activeBackground()?.desc || ''} onInput={e => bStore.updateBlankDraft('desc', e.currentTarget.value)} />
                    </FormField>
                  </div>
                </Show>
              </div>
            </Show>
          </div>
          <Show when={bStore.activeBackground()}>
            <div class={styles.sectionList}>
              <AbilitiesSection
                collapsed={collapsed.abilities}
                toggle={toggle}
                abilityChoices={bStore.state.form.abilityChoices}
                abilityOptions={bStore.abilityOptions()}
                remaining={remainingAbilityPicks()}
                onAddAbility={(val) => handleAddAbility(val)}
                onRemoveAbility={(i) => bStore.removeAbilityChoice(i)}
                onEdit={() => {}}
                onReset={() => { bStore.state.form.abilityChoices.slice().forEach((_,i)=>bStore.removeAbilityChoice(0)); }}
              />
              <EquipmentSection
                collapsed={collapsed.equipment}
                toggle={toggle}
                groups={equipmentGroups()}
                activeKey={bStore.state.form.equipmentOptionKey}
                optionKeys={bStore.equipmentOptionKeys()}
                selectedItems={bStore.selectedEquipmentItems()}
                onSelectKey={(k) => bStore.setEquipmentOptionKey(k)}
                onCommitGroup={(keys, items) => setEquipmentGroups(list => [...list, { optionKeys: keys, items }])}
                candidateItems={candidateEquipmentItems(backgroundsStore.state.entities as any)}
                addPendingItem={addPendingEquipItem}
                pendingItems={pendingEquipItems()}
                removePendingItem={removePendingEquipItem}
                clearPending={clearPendingEquip}
                error={!!fieldError('equipment')}
              />
              <FeatSection
                collapsed={collapsed.feat}
                toggle={toggle}
                feats={allFeats()}
                value={selectedFeat() || ''}
                onChange={handleSelectFeat}
                onClear={() => bStore.setFeat(undefined as unknown as string)}
              />
              <ProficienciesSection
                collapsed={collapsed.profs}
                toggle={toggle}
                profs={editedProfs as any}
                onEdit={() => {}}
              />
              <ProficienciesModal
                profs={editedProfs as any}
                push={(cat,val)=> pushProf(cat,val)}
                remove={(cat,val)=> removeProf(cat,val)}
              />
              <LanguagesSection
                collapsed={collapsed.langs}
                toggle={toggle}
                amount={languageAmount()}
                options={languageOptions()}
                onEdit={() => {}}
                error={!!fieldError('languages')}
              />
              <LanguagesModal
                amount={languageAmount()}
                setAmount={(n)=> setLanguageAmount(n)}
                options={languageOptions()}
                addLanguage={(l)=> setLanguageOptions(o => [...o, l])}
                removeLanguage={(l)=> removeLanguage(l)}
              />
              <FeaturesSection
                collapsed={collapsed.features}
                toggle={toggle}
                features={featuresList()}
                onChange={(fs)=> setFeaturesList(fs)}
                error={!!fieldError('features')}
              />
              {/* Validation Messages */}
              <Show when={validationErrors().length}>
                <div class={styles.validationBox}>
                  <For each={validationErrors()}>{e => <div class={styles.validationItem}>{e}</div>}</For>
                </div>
              </Show>
              {/* Persist */}
              <div class={styles.flatSection}>
                <div class={styles.sectionHeader}><h4>💾 Persist</h4></div>
                <div class={styles.chipsRow}>
                  <Button disabled={!bStore.activeBackground() || !isValid()} onClick={() => saveNewFormat(false)}>Save As Homebrew</Button>
                  <Show when={existsInHomebrew()}>
                    <Button disabled={!bStore.activeBackground() || !isModified() || !isValid()} onClick={() => saveNewFormat(true)}>Update Homebrew</Button>
                  </Show>
                  <Show when={isModified()}><span class={styles.modifiedBadge}>Modified</span></Show>
                </div>
              </div>
            </div>
          </Show>
          <Show when={snackbar()}>
            <div class={styles.snackbar} data-type={snackbar()!.type}>{snackbar()!.msg}</div>
          </Show>
          <Show when={bStore.state.status === 'loading'}>
            <div>Loading backgrounds...</div>
          </Show>
          <Show when={bStore.state.status === 'error'}>
            <div style={{ color: 'red' }}>Failed to load backgrounds: {bStore.state.error}</div>
          </Show>
        </div>
        </Body> 
      
    </>
  );
}
export const SNACKBAR_TIMEOUT_MS = 3200; // exported for tests
export default Backgrounds;