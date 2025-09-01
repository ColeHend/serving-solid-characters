import { createStore } from "solid-js/store";
import { createMemo, createRoot } from "solid-js";
import type { Background } from "../../models/data/background";

interface BackgroundsState {
  entities: Record<string, Background>;
  order: string[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error?: string;
  selection: { activeName?: string };
  form: {
    abilityChoices: string[]; // up to 3, duplicates allowed
    equipmentOptionKey?: string; // one of A-D or others
  feat?: string;
  };
  blankDraft?: Background; // ephemeral new background
}

function createBackgroundsStore() {
  const [state, setState] = createStore<BackgroundsState>({
    entities: {},
    order: [],
    status: 'idle',
    selection: {},
    form: { abilityChoices: [] },
    blankDraft: undefined
  });

  async function load(version: '2014' | '2024' = '2024') {
    if (state.status === 'loading') return;
    setState({ status: 'loading', error: undefined });
    try {
      const res = await fetch(`/api/${version}/Backgrounds`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const list: Background[] = await res.json();
      const entities: Record<string, Background> = {};
      const order: string[] = [];
      for (const b of list) {
        if (!b?.name || entities[b.name]) continue;
        entities[b.name] = b;
        order.push(b.name);
      }
      setState({ entities, order, status: 'ready' });
    } catch (e: any) {
      setState({ status: 'error', error: e?.message || 'Load failed' });
    }
  }

  function selectBackground(name: string) {
    if (!state.entities[name]) return;
    setState('selection', { activeName: name });
    // leaving new mode
    if (state.blankDraft) setState({ blankDraft: undefined });
    const firstKey = uniqueEquipmentOptionKeysFor(name)[0];
    setState('form', f => ({ ...f, equipmentOptionKey: firstKey, abilityChoices: [], feat: state.entities[name].feat || undefined }));
  }

  function selectNew() {
    const draft: Background = {
      name: '',
      desc: '',
      proficiencies: { armor: [], weapons: [], tools: [], skills: [] },
      startEquipment: [],
      abilityOptions: [],
      feat: undefined,
      languages: { amount: 0, options: [] },
      features: []
    };
    setState({ selection: { activeName: '__new__' }, blankDraft: draft, form: { abilityChoices: [], equipmentOptionKey: undefined, feat: undefined } });
  }

  function updateBlankDraft<K extends keyof Background>(key: K, value: Background[K]) {
    if (state.selection.activeName !== '__new__') return;
    setState('blankDraft', draft => ({ ...(draft || {} as Background), [key]: value }));
  }

  function addAbilityChoice(ability: string) {
    if (!ability) return;
    setState('form', 'abilityChoices', (arr) => {
      if (arr.length >= 3) return arr; // cap
      return [...arr, ability]; // duplicates allowed
    });
  }

  function removeAbilityChoice(index: number) {
    setState('form', 'abilityChoices', (arr) => arr.filter((_, i) => i !== index));
  }

  function setEquipmentOptionKey(key: string) {
    setState('form', { ...state.form, equipmentOptionKey: key });
  }

  function setFeat(feat?: string) {
    setState('form', { ...state.form, feat });
  }

  const activeBackground = createMemo(() => {
    if (state.selection.activeName === '__new__') return state.blankDraft;
    return state.selection.activeName ? state.entities[state.selection.activeName] : undefined;
  });
  const abilityOptions = createMemo(() => activeBackground()?.abilityOptions || []);
  const equipmentGroups = createMemo(() => activeBackground()?.startEquipment || []);
  const uniqueEquipmentOptionKeysFor = (name?: string) => {
    const bg = name ? state.entities[name] : activeBackground();
    if (!bg) return [] as string[];
    const keys = new Set<string>();
    for (const g of bg.startEquipment) {
      (g.optionKeys || []).forEach(k => keys.add(k));
    }
    return Array.from(keys).sort();
  };
  const equipmentOptionKeys = createMemo(() => uniqueEquipmentOptionKeysFor());
  const selectedEquipmentItems = createMemo(() => {
    const key = state.form.equipmentOptionKey;
    if (!key) return [] as string[];
    const groups = equipmentGroups();
    const items: string[] = [];
    for (const g of groups) {
      if (g.optionKeys?.includes(key)) {
        (g.items || []).forEach(i => items.push(i));
      }
    }
    return items;
  });

  // eager load 2024 by default
  if (state.status === 'idle') {
    // fire and forget
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    load('2024');
  }

  return {
    state,
    load,
    selectBackground,
  selectNew,
  updateBlankDraft,
    addAbilityChoice,
    removeAbilityChoice,
    setEquipmentOptionKey,
    setFeat,
    activeBackground,
    abilityOptions,
    equipmentOptionKeys,
    selectedEquipmentItems
  };
}

// Export singleton instance (sufficient for app scope)
export const backgroundsStore = createRoot(createBackgroundsStore);
