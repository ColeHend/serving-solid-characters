import { createStore } from "solid-js/store";
import { createMemo, createRoot } from "solid-js";
import type { Race } from "../../../../../models/data/races";
import { homebrewManager } from "../../../../../shared";

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
  blankDraft?: RaceDraft; // new race being created
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
      // Extract first word (strip parentheses etc.)
      const firstWord = (part.match(/^[A-Za-z]+/) || [''])[0];
      const candidate = SIZE_TOKENS.find(sz => sz.toLowerCase() === firstWord.toLowerCase());
      if (candidate && !found.includes(candidate)) found.push(candidate);
    }
    return found;
  }
  return {
    name: r.name || '',
    speed: r.speed || 30,
    sizes: parseSizes(r.size || ''),
    abilityBonuses: (r.abilityBonuses || []).map(a => ({ name: String(a.stat), value: a.value })),
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
    } catch (e: any) {
      setState({ status: 'error', error: e?.message || 'Load failed' });
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

  function updateBlankDraft<K extends keyof RaceDraft>(key: K, value: RaceDraft[K]) {
    if (state.selection.activeName !== '__new__') return;
    setState('blankDraft', draft => ({ ...(draft || blankDraft()), [key]: value }));
  }

  function renameActiveRace(newName: string) {
    if (!state.selection.activeName || state.selection.activeName === '__new__') return;
    const current = state.selection.activeName;
    const trimmed = newName.trim();
    if (!trimmed || trimmed === current) return;
    if (state.entities[trimmed]) return; // avoid collision
    const entity = state.entities[current];
    if (!entity) return;
    const { [current]: _, ...rest } = state.entities;
    const newEntity = { ...entity, name: trimmed } as Race;
    const newEntities = { ...rest, [trimmed]: newEntity };
    const newOrder = state.order.map(o => (o === current ? trimmed : o));
    setState({ entities: newEntities, order: newOrder, selection: { activeName: trimmed } });
  }

  function startFromExisting() {
    // Convert currently selected SRD (non-homebrew) race into a new editable draft
    if (!state.selection.activeName || state.selection.activeName === '__new__') return false;
    const name = state.selection.activeName;
    // Don't overwrite if already in draft mode
    const entity = state.entities[name];
    if (!entity) return false;
    // Seed blank draft from existing entity
    setState({ blankDraft: mapRaceToDraft(entity), selection: { activeName: '__new__' } });
    return true;
  }

  function cloneSelectedToHomebrew(): boolean {
    // Case 1: User is in draft mode (after starting from existing) -> saveNew
    if (state.selection.activeName === '__new__') {
      // If draft name already exists in homebrew, treat as update instead of no-op
      if (state.blankDraft) {
        const draftName = state.blankDraft.name.trim();
        if (!draftName) return false;
        const existingHomebrew = homebrewManager.races().find((r: any) => r.name === draftName);
        if (existingHomebrew) {
          // Build race from draft but preserve existing id
          const updated = { ...draftToRace(state.blankDraft), id: existingHomebrew.id } as Race;
          // Optimistic in-memory replace so tests/UI see change immediately
          try {
            (homebrewManager as any)._setRaces((list: any[]) => list.map(r => r.name === updated.name ? updated : r));
          } catch { /* ignore if private shape changes */ }
          homebrewManager.updateRace(updated as any);
          // Update local entities (overwriting SRD view with homebrew variant)
          const alreadyInOrder = state.order.includes(updated.name);
          setState({ blankDraft: undefined, selection: { activeName: updated.name }, entities: { ...state.entities, [updated.name]: updated }, order: alreadyInOrder ? state.order : [...state.order, updated.name] });
          return true;
        }
      }
      return saveNew();
    }
    // Case 2: Selected SRD race directly (no draft). We should first create a draft (allow modifications?)
    if (!state.selection.activeName) return false;
    const entity = state.entities[state.selection.activeName];
    if (!entity) return false;
    if (homebrewManager.races().some(r => (r as any).name === entity.name)) return true;
    // Direct clone of SRD as-is
    const cloned: Race = { ...entity, id: crypto.randomUUID() };
    homebrewManager.addRace(cloned as any);
    return true;
  }

  function updateExistingField<K extends keyof Race>(key: K, value: Race[K]) {
    if (!state.selection.activeName || state.selection.activeName === '__new__') return;
    if (!state.entities[state.selection.activeName]) return;
    setState('entities', state.selection.activeName, key as any, value as any);
  }

  // ---- Ability Bonuses ----
  function addAbilityBonus(name: string, value: number) {
    if (state.selection.activeName !== '__new__') return;
    if (!name.trim()) return;
    updateBlankDraft('abilityBonuses', [...(state.blankDraft?.abilityBonuses || []), { name: name.trim(), value }]);
  }
  function removeAbilityBonus(name: string) {
    if (state.selection.activeName !== '__new__') return;
    updateBlankDraft('abilityBonuses', (state.blankDraft?.abilityBonuses || []).filter(a => a.name !== name));
  }

  // ---- Languages ----
  function addLanguage(lang: string) {
    if (state.selection.activeName !== '__new__') return;
    if (!lang.trim()) return;
    updateBlankDraft('languages', { ...(state.blankDraft?.languages || { fixed: [], amount: 0, options: [], desc: '' }), fixed: Array.from(new Set([...(state.blankDraft?.languages.fixed || []), lang.trim()])) });
  }
  function removeLanguage(lang: string) {
    if (state.selection.activeName !== '__new__') return;
    updateBlankDraft('languages', { ...(state.blankDraft?.languages || { fixed: [], amount: 0, options: [], desc: '' }), fixed: (state.blankDraft?.languages.fixed || []).filter(l => l !== lang) });
  }
  function setLanguageDesc(desc: string) { if (state.selection.activeName === '__new__') updateBlankDraft('languages', { ...(state.blankDraft?.languages || { fixed: [], amount:0, options: [], desc: '' }), desc }); }
  function setLanguageChoice(amount: number, options: string[]) {
    if (state.selection.activeName !== '__new__') return;
    updateBlankDraft('languages', { ...(state.blankDraft?.languages || { fixed: [], amount:0, options: [], desc: '' }), amount, options });
  }

  // ---- Traits (simplified) ----
  function addTrait(name: string, value: string[]) {
    if (state.selection.activeName !== '__new__') return;
    if (!name.trim()) return;
    updateBlankDraft('traits', [...(state.blankDraft?.traits || []), { name: name.trim(), value }]);
  }
  function removeTrait(name: string) {
    if (state.selection.activeName !== '__new__') return;
    updateBlankDraft('traits', (state.blankDraft?.traits || []).filter(t => t.name !== name));
  }
  function updateTrait(originalName: string, newName: string, value: string[]) {
    if (state.selection.activeName !== '__new__') return;
    const list = state.blankDraft?.traits || [];
    const idx = list.findIndex(t => t.name === originalName);
    if (idx === -1) return;
    const trimmed = newName.trim();
    if (!trimmed) return; // keep original if empty? skip
    const updated = [...list];
    updated[idx] = { name: trimmed, value };
    updateBlankDraft('traits', updated);
  }

  // ---- Proficiencies (basic skills only for now) ----
  function addSkill(skill: string) {
    if (state.selection.activeName !== '__new__') return;
    updateBlankDraft('proficiencies', { ...(state.blankDraft?.proficiencies || { armor: [], weapons: [], tools: [], skills: [] }), skills: Array.from(new Set([...(state.blankDraft?.proficiencies.skills || []), skill])) });
  }
  function removeSkill(skill: string) {
    if (state.selection.activeName !== '__new__') return;
    updateBlankDraft('proficiencies', { ...(state.blankDraft?.proficiencies || { armor: [], weapons: [], tools: [], skills: [] }), skills: (state.blankDraft?.proficiencies.skills || []).filter(s => s !== skill) });
  }

  // ---- Save / Update ----
  function draftToRace(d: RaceDraft): Race {
    return {
      id: crypto.randomUUID(),
      name: d.name,
      size: d.sizes.join(', '),
      speed: d.speed,
      languages: [...d.languages.fixed],
      languageChoice: d.languages.amount ? { amount: d.languages.amount, options: d.languages.options } : undefined,
      abilityBonuses: d.abilityBonuses.map(a => ({ stat: Number(a.name) as any, value: a.value })),
      abilityBonusChoice: undefined,
      traits: d.traits.map(t => ({ details: { name: t.name, description: t.value.join('\n') }, prerequisites: [] })),
      traitChoice: undefined,
  descriptions: { age: d.text.age, alignment: d.text.alignment, size: d.text.sizeDesc, language: d.languages.desc, abilities: d.text.abilitiesDesc }
    } as Race;
  }

  function saveNew(): boolean {
    if (state.selection.activeName !== '__new__' || !state.blankDraft) return false;
    if (!state.blankDraft.name.trim()) return false;
  const race = draftToRace(state.blankDraft);
  homebrewManager.addRace(race as any);
  // after save, exit new mode and select; if race already existed in SRD list, don't duplicate order entry
  const alreadyInOrder = state.order.includes(race.name);
  setState({ blankDraft: undefined, selection: { activeName: race.name }, entities: { ...state.entities, [race.name]: race }, order: alreadyInOrder ? state.order : [...state.order, race.name] });
    return true;
  }
  function updateExisting(): boolean {
    if (!state.selection.activeName || state.selection.activeName === '__new__') return false;
    const original = state.entities[state.selection.activeName];
    if (!original) return false;
    // For now only speed/size changes in existing (others would require diff UI) -> reconstruct from draft mapping
    // Not implementing partial edit yet.
  homebrewManager.updateRace(original as any);
    return true;
  }

  function addSize(size: string) {
    if (!size.trim()) return;
    if (state.selection.activeName === '__new__') {
      updateBlankDraft('sizes', Array.from(new Set([...(state.blankDraft?.sizes || []), size.trim()])));
    } else if (state.selection.activeName) {
      const r = state.entities[state.selection.activeName];
      if (!r) return;
      const sizes = (r.size || '').split(',').map(s => s.trim()).filter(Boolean);
      if (!sizes.includes(size.trim())) {
        const newSizeStr = [...sizes, size.trim()].join(', ');
        setState('entities', state.selection.activeName, 'size', newSizeStr as any);
      }
    }
  }

  function addSizes(sizes: string[]) {
    for (const s of sizes) addSize(s);
  }

  function removeSize(size: string) {
    if (state.selection.activeName === '__new__') {
      updateBlankDraft('sizes', (state.blankDraft?.sizes || []).filter(s => s !== size));
    } else if (state.selection.activeName) {
      const r = state.entities[state.selection.activeName];
      if (!r) return;
      const sizes = (r.size || '').split(',').map(s => s.trim()).filter(Boolean).filter(s => s !== size);
      setState('entities', state.selection.activeName, 'size', sizes.join(', ') as any);
    }
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
    const hb = homebrewManager.races() as unknown as Race[] | undefined;
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
  startFromExisting,
  cloneSelectedToHomebrew,
    updateBlankDraft,
  renameActiveRace,
  updateExistingField,
  addSize,
  addSizes,
  removeSize,
  addAbilityBonus,
  removeAbilityBonus,
  addLanguage,
  removeLanguage,
  setLanguageDesc,
  setLanguageChoice,
  addTrait,
  removeTrait,
  updateTrait,
  addSkill,
  removeSkill,
  saveNew,
  updateExisting,
  activeRace
  };
}

export const racesStore = createRoot(createRacesStore);
