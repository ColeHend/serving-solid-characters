import { createStore } from "solid-js/store";
import { createMemo, createRoot } from "solid-js";
import type { Race } from "../../../../../models/generated";
import { homebrewManager } from "../../../../../shared";
import { decodeStat } from "../shared/raceLikeForm.shared";

// Catalog + selection store for the race editor. Editing state lives in the
// FormGroup/FormArray trio created by races.tsx (see raceLikeForm.shared.ts);
// this store only tracks the SRD/homebrew entity catalog, the current
// selection, and maps entities into the draft shape used to hydrate the form.

export interface RaceDraft {
  name: string;
  speed: number;
  sizes: string[]; // normalized size options
  abilityBonuses: { name: string; value: number }[];
  languages: { fixed: string[]; amount: number; options: string[]; desc: string };
  proficiencies: { armor: string[]; weapons: string[]; tools: string[]; skills: string[] };
  traits: { name: string; value: string[] }[]; // simplified for now
  text: { age: string; alignment: string; sizeDesc: string; abilitiesDesc: string };
}

interface RacesState {
  entities: Record<string, Race>;
  order: string[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error?: string;
  selection: { activeName?: string; prevName?: string };
  blankDraft?: RaceDraft; // seed for the form when creating a new race
}

const blankDraft = (): RaceDraft => ({
  name: '',
  speed: 30,
  sizes: [],
  abilityBonuses: [],
  languages: { fixed: [], amount: 0, options: [], desc: '' },
  proficiencies: { armor: [], weapons: [], tools: [], skills: [] },
  traits: [],
  text: { age: '', alignment: '', sizeDesc: '', abilitiesDesc: '' }
});

function mapRaceToDraft(r: Race): RaceDraft {
  const descs = r.descriptions || {};
  const pick = (...candidates: string[]) => {
    for (const c of candidates) {
      // direct key
      if (typeof (descs as any)[c] === 'string') return (descs as any)[c] as string;
      // ci match inside descriptions
      const foundKey = Object.keys(descs).find(k => k.toLowerCase() === c.toLowerCase());
      if (foundKey && typeof (descs as any)[foundKey] === 'string') return (descs as any)[foundKey] as string;
      // top-level race field direct
      if (typeof (r as any)[c] === 'string') return (r as any)[c] as string;
      // top-level ci match
      const topFound = Object.keys(r as any).find(k => k.toLowerCase() === c.toLowerCase());
      if (topFound && typeof (r as any)[topFound] === 'string') return (r as any)[topFound] as string;
    }
    return '';
  };
  // Robust size extraction: only keep known size tokens to avoid carrying descriptive text accidentally saved into size
  const SIZE_TOKENS = ['Tiny','Small','Medium','Large','Huge','Gargantuan'];
  function parseSizes(raw: string): string[] {
    if (!raw) return [];
    // Normalize separators (commas, slashes, 'or')
  const replaced = raw.replace(/\bor\b/gi, ',').replace(/\//g, ',');
    const parts = replaced.split(',').map(p => p.trim());
    const found: string[] = [];
    for (const part of parts) {
      if (!part) continue;
      // Extract first word (strip parentheses etc.)
      const firstWord = (part.match(/^[A-Za-z]+/) || [''])[0];
      const canonical = SIZE_TOKENS.find(sz => sz.toLowerCase() === firstWord.toLowerCase());
      // Keep custom sizes (an explicit editor feature) while still dropping
      // long descriptive fragments accidentally saved into the size field.
      const value = canonical ?? (part.length <= 30 && !/[.()]/.test(part) ? part : undefined);
      if (value && !found.includes(value)) found.push(value);
    }
    return found;
  }
  return {
    name: r.name || '',
    speed: r.speed || 30,
    sizes: parseSizes(r.size || ''),
    abilityBonuses: (r.abilityBonuses || []).map(a => ({ name: decodeStat(a.stat as unknown as number | string), value: a.value })),
    languages: {
      fixed: [...(r.languages || [])],
      amount: r.languageChoice?.amount || 0,
      options: [...(r.languageChoice?.options || [])],
      desc: pick('language','languages','languageDesc','lang')
    },
    proficiencies: { armor: [], weapons: [], tools: [], skills: [] },
    traits: (r.traits || []).map(t => ({ name: t.details.name, value: t.details.description.split('\n') })),
  text: { age: pick('age','ages'), alignment: pick('alignment','align'), sizeDesc: pick('physical','size','sizeDescription','sizeDesc'), abilitiesDesc: pick('abilities','ability','abilityDescription','abilitiesDesc') }
  };
}

function createRacesStore() {
  const [state, setState] = createStore<RacesState>({
    entities: {},
    order: [],
    status: 'idle',
    selection: {}
  });

  async function load(version: '2014' | '2024' = '2024') {
    if (state.status === 'loading') return;
    setState({ status: 'loading', error: undefined });
    try {
      const res = await fetch(`/api/${version}/Races`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const list: Race[] = await res.json();
      const entities: Record<string, Race> = {};
      const order: string[] = [];
      for (const r of list) {
        if (!r?.name || entities[r.name]) continue;
        entities[r.name] = r;
        order.push(r.name);
      }
      setState({ entities, order, status: 'ready' });
    } catch (e: unknown) {
      setState({ status: 'error', error: (e instanceof Error ? e.message : undefined) || 'Load failed' });
    }
  }

  // Select SRD race (already in entities from initial load)
  function selectSrdRace(name: string) {
    if (!state.entities[name]) return;
    if (state.blankDraft) setState({ blankDraft: undefined });
    setState('selection', sel => ({ prevName: sel.activeName, activeName: name }));
  }

  // Select Homebrew race (may not yet be merged into entities)
  function selectHomebrewRace(name: string) {
    const hb = homebrewManager.races().find((r: any) => (r.name || '').toLowerCase() === name.toLowerCase()) as Race | undefined;
    if (!hb) return; // nothing to select
    // Always replace/inject so we override SRD with homebrew definition (same visible key)
    setState(old => {
      const entities = { ...old.entities, [hb.name]: hb };
      const order = old.order.includes(hb.name) ? old.order : [...old.order, hb.name];
      return { ...old, entities, order, selection: { prevName: old.selection.activeName, activeName: hb.name }, blankDraft: old.blankDraft && old.selection.activeName !== '__new__' ? undefined : old.blankDraft };
    });
  }

  // Backwards-compatible generic select (detect source)
  function selectRace(name: string) {
    if (!name) return;
    // Prefer homebrew override if exists
    const lower = name.toLowerCase();
    const hasHomebrew = homebrewManager.races().some(r => (r.name || '').toLowerCase() === lower);
    if (hasHomebrew) return selectHomebrewRace(name);
    return selectSrdRace(name);
  }

  function selectNew() {
    // If a previous non-new selection exists, seed draft from it (prefill descriptions & core fields)
    const prev = state.selection.activeName && state.selection.activeName !== '__new__' ? state.selection.activeName : state.selection.prevName;
    if (prev && state.entities[prev]) {
      setState({ selection: { activeName: '__new__', prevName: prev }, blankDraft: mapRaceToDraft(state.entities[prev]) });
    } else {
      setState({ selection: { activeName: '__new__', prevName: state.selection.activeName }, blankDraft: blankDraft() });
    }
  }

  // Record a race that was just persisted to homebrew: inject it into the
  // catalog immediately (the homebrewManager signal updates asynchronously)
  // and select it, leaving create mode.
  function noteSaved(race: Race) {
    const alreadyInOrder = state.order.includes(race.name);
    setState({
      blankDraft: undefined,
      selection: { activeName: race.name, prevName: state.selection.activeName },
      entities: { ...state.entities, [race.name]: race },
      order: alreadyInOrder ? state.order : [...state.order, race.name]
    });
  }

  // Clone the currently selected SRD race into homebrew as-is.
  function cloneSelectedToHomebrew(): boolean {
    if (!state.selection.activeName || state.selection.activeName === '__new__') return false;
    const entity = state.entities[state.selection.activeName];
    if (!entity) return false;
    if (homebrewManager.races().some(r => (r as any).name === entity.name)) return true;
    const cloned: Race = { ...entity, id: crypto.randomUUID() };
    homebrewManager.addRace(cloned);
    return true;
  }

  const activeRace = createMemo<RaceDraft | undefined>(() => {
    if (state.selection.activeName === '__new__') return state.blankDraft;
    if (!state.selection.activeName) return undefined;
    return mapRaceToDraft(state.entities[state.selection.activeName]);
  });

  // eager load
  if (state.status === 'idle') {

    load('2024');
  }

  // Merge existing homebrew races (reactive to changes)
  createMemo(() => {
    const hb = homebrewManager.races() as Race[] | undefined;
    if (!hb || !Array.isArray(hb)) return hb;
    if (hb.length === 0) return hb;
    const newEntities: Record<string, Race> = {};
    let changed = false;
    for (const r of hb) {
      if (!r?.name) continue;
      if (!state.entities[r.name]) {
        newEntities[r.name] = r as Race;
        changed = true;
      }
    }
    if (changed) {
      setState(old => {
        const entities = { ...old.entities, ...newEntities };
        const orderAdditions = Object.keys(newEntities).filter(n => !old.order.includes(n));
        return { ...old, entities, order: [...old.order, ...orderAdditions] };
      });
    }
    return hb;
  });

  return {
    state,
    load,
    selectRace, // legacy
    selectSrdRace,
    selectHomebrewRace,
    selectNew,
    cloneSelectedToHomebrew,
    noteSaved,
    activeRace
  };
}

export const racesStore = createRoot(createRacesStore);
