import { createStore } from 'solid-js/store';
import { createMemo } from 'solid-js';
import { homebrewManager } from '../../../../../shared';
import type { Item as DataItem, ItemType, ItemProperties } from '../../../../../models/data/items';
import { ItemType as DataItemTypeEnum } from '../../../../../models/data/items';
import { Feature } from '../../../../../models/old/core.model';
import { useGetSrdItems } from '../../../../../shared/customHooks/dndInfo/info/srd/items';
import getUserSettings from '../../../../../shared/customHooks/userSettings';

// Unified discriminated draft type
export type DraftKind = 'Item' | 'Weapon' | 'Armor';

export interface DamageEntryDraft { dice: string; type: string; bonus?: number; }
export interface ArmorClassDraft { base: number; dexBonus: boolean; maxBonus: number; }

export interface DraftItem {
  kind: DraftKind;
  name: string;
  desc: string; // single rich text / markdown string (joined for legacy arrays)
  cost: { quantity: number; unit: string };
  weight?: number;
  tags: string[];
  features: Feature<string,string>[];
  // weapon
  weaponCategory?: string;
  weaponRange?: string;
  categoryRange?: string; // derived legacy helper
  damage?: DamageEntryDraft[];
  range?: { normal: number; long?: number };
  // armor
  armorCategory?: string;
  armorClass?: ArmorClassDraft;
  strMin?: number;
  stealthDisadvantage?: boolean;
}

interface ItemsState {
  status: 'idle' | 'loading' | 'error';
  error?: string;
  srd: Record<string, any>; // keep raw SRD (legacy or new)
  homebrew: Record<string, DataItem>; // stored using new data model
  selection: { activeName: string | '__new__' | '' };
  template?: any | null; // original entity when editing (raw or data)
  form: DraftItem | null;
  selectionVersion: number; // increments every successful select() to help UI reset keyed regions
}

const blankDraft = (): DraftItem => ({
  kind: 'Item',
  name: '',
  desc: '',
  cost: { quantity: 0, unit: 'GP' },
  weight: 0,
  tags: [],
  features: []
});

function parseLegacyBlob(entity: any): Partial<DraftItem> | null {
  try {
    const blob = entity?.properties?.__draft;
    if (!blob) return null;
    const parsed = JSON.parse(blob);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch { return null; }
}

function toDraft(entity: any): DraftItem {
  if (!entity) return blankDraft();
  const parsedCost = (() => {
    const raw = entity.cost;
    // legacy object form already OK
    if (raw && typeof raw === 'object' && 'quantity' in raw && 'unit' in raw) return raw as { quantity:number; unit:string };
    if (typeof raw === 'string') {
      // examples: "25 gp", "1 sp", "250GP", "5"
      const match = raw.trim().match(/^(\d+)(?:\s*)([a-zA-Z]{1,3})?/);
      if (match) {
        const qty = parseInt(match[1]);
        const unit = (match[2] || 'GP').toUpperCase();
        return { quantity: isNaN(qty) ? 0 : qty, unit };
      }
    }
    return { quantity: 0, unit: 'GP' };
  })();
  // New data model (items.ts) has: id,name,desc(string),type(enum),weight,cost(string),properties
  // Attempt to restore full draft from serialized __draft blob first
  const blob = parseLegacyBlob(entity);
  if (blob) {
    // merge updated basic fields (name/desc/cost) in case they changed manually
    return {
      ...blankDraft(),
      ...blob,
      name: entity.name || blob.name || '',
      desc: typeof entity.desc === 'string' ? entity.desc : blob.desc || '',
      cost: parsedCost
    } as DraftItem;
  }

  // derive kind from either legacy equipmentCategory or numeric enum type.
  // NOTE: There are TWO enums in the codebase with different ordering:
  // models/data/items.ts -> Weapon=0, Armor=1, Tool=2, Item=3
  // shared/.../itemType.ts -> AdventuringGear=0, Weapon=1, Armor=2
  // Some SRD JSON appears to use the second ordering (1=Weapon, 2=Armor). We therefore
  // try both mappings, then fall back to property heuristics (Damage / AC) which we ALWAYS apply.
  let kind: DraftKind = 'Item';
  if (entity.equipmentCategory) {
    if (entity.equipmentCategory === 'Weapon') kind = 'Weapon';
    else if (entity.equipmentCategory === 'Armor') kind = 'Armor';
  } else if (typeof entity.type === 'number') {
    // Primary enum mapping
    if (entity.type === DataItemTypeEnum.Weapon) kind = 'Weapon';
    else if (entity.type === DataItemTypeEnum.Armor) kind = 'Armor';
    else {
      // Alternate enum mapping (AdventuringGear=0, Weapon=1, Armor=2)
      if (entity.type === 1) kind = 'Weapon';
      else if (entity.type === 2) kind = 'Armor';
    }
  }
  const props = entity.properties || {};
  // Heuristics ALWAYS applied to correct any mis‑classification.
  if (props.Damage) kind = 'Weapon';
  else if (props.AC) kind = 'Armor';
  const base: DraftItem = {
    kind,
    name: entity.name || '',
    desc: Array.isArray(entity.desc) ? (entity.desc[0] || '') : (entity.desc || ''),
    cost: parsedCost,
    weight: entity.weight,
    // Tags: merge any explicit tags plus parsed weapon/armor property keywords
    tags: (() => {
      const explicit = entity.tags || entity.properties?.Tags || [];
      let propsTags: string[] = [];
      const propStr = props?.Properties ? String(props.Properties) : '';
      if (propStr) {
        propsTags = propStr.split(',').map(s => s.trim())
          .filter(s => !!s)
          .map(s => s.replace(/\(.*?\)/g,'').trim()); // remove parenthetical details like (range 80/320)
      }
      const merged = [...explicit, ...propsTags];
      return Array.from(new Set(merged)).filter(Boolean);
    })(),
    features: entity.features || [],
    categoryRange: entity.categoryRange
  };
  if (base.kind === 'Weapon') {
    base.weaponCategory = entity.weaponCategory || (props.Properties ? String(props.Properties).split(',')[0]?.trim().replace(/\(.*?\)/,'').trim() : undefined);
    base.weaponRange = entity.weaponRange;
    // Reconstruct damage: prefer structured damage array else parse properties.Damage
    if (entity.damage) {
      base.damage = (entity.damage || []).map((d: any) => ({ dice: d.damageDice || d.dice, type: d.damageType, bonus: d.damageBonus ?? d.bonus }));
    } else if (entity.properties?.DamageEntries) {
      try { base.damage = JSON.parse(entity.properties.DamageEntries); } catch {}
    } else if (props.Damage) {
      // parse pattern like "1d8 slashing (Versatile 1d10)" -> first token dice, second type
      const txt = String(props.Damage);
      const match = txt.match(/(\d+d\d+)\s+([a-zA-Z]+|bludgeoning|piercing|slashing|fire|cold|acid|poison|psychic|radiant|necrotic|force|thunder|lightning)/i);
      if (match) {
        base.damage = [{ dice: match[1], type: match[2].toLowerCase(), bonus: 0 }];
      }
    }
    base.range = entity.range || (() => {
      // parse range in Properties like "Ammunition (range 80/320)"
      const propStr = String(props.Properties || '');
      const rangeMatch = propStr.match(/range\s+(\d+)(?:\/(\d+))?/i);
      if (rangeMatch) {
        const normal = parseInt(rangeMatch[1]||'0');
        const long = parseInt(rangeMatch[2]||'0');
        return { normal: isNaN(normal)?0:normal, long: isNaN(long)?0:long };
      }
      return undefined;
    })();
    // Fallback: if still no damage parsed, seed minimal so UI shows something (treated like seeded default, not modified)
    if (!base.damage || base.damage.length === 0) {
      base.damage = [{ dice: '1d6', type: 'slashing', bonus: 0 }];
    }
  } else if (base.kind === 'Armor') {
    base.armorCategory = entity.armorCategory || props.ArmorCategory;
    if (entity.armorClass) base.armorClass = entity.armorClass; else if (props.AC) {
      // Attempt to extract base AC number from strings like "11 + Dexterity modifier" or "16"
      const acTxt = String(props.AC);
      const numMatch = acTxt.match(/(\d+)/);
      const baseAc = numMatch ? parseInt(numMatch[1]) : 10;
      const dexBonus = /dexterity modifier/i.test(acTxt) || /dex mod/i.test(acTxt);
      base.armorClass = { base: isNaN(baseAc)?10:baseAc, dexBonus, maxBonus: 0 };
    }
    base.strMin = entity.strMin || (() => {
      const s = props.StrengthReq ? String(props.StrengthReq) : '';
      const m = s.match(/(\d+)/); return m ? parseInt(m[1]) : 0;
    })();
    base.stealthDisadvantage = entity.stealthDisadvantage ?? (/disadvantage/i.test(String(props.Stealth || '')) || undefined);
  }
  // Ensure we don't leak stale fields from a previous selection (Solid store merge safety):
  if (base.kind === 'Weapon') {
    // strip armor-only
    (base as any).armorCategory = undefined;
    (base as any).armorClass = undefined;
    (base as any).strMin = undefined;
    (base as any).stealthDisadvantage = undefined;
  } else if (base.kind === 'Armor') {
    (base as any).weaponCategory = undefined;
    (base as any).weaponRange = undefined;
    (base as any).categoryRange = undefined;
    (base as any).damage = undefined;
    (base as any).range = undefined;
  } else { // generic Item
    (base as any).weaponCategory = undefined;
    (base as any).weaponRange = undefined;
    (base as any).categoryRange = undefined;
    (base as any).damage = undefined;
    (base as any).range = undefined;
    (base as any).armorCategory = undefined;
    (base as any).armorClass = undefined;
    (base as any).strMin = undefined;
    (base as any).stealthDisadvantage = undefined;
  }
  return base;
}

function fromDraftToData(d: DraftItem, existing?: DataItem): DataItem {
  // Build cost string
  const costStr = `${d.cost.quantity} ${d.cost.unit}`.trim();
  // Serialize extended draft for round-trip editing
  const serialized = JSON.stringify({ ...d });
  const properties: ItemProperties = { ...existing?.properties } as any;
  (properties as any).__draft = serialized;
  if (d.tags?.length) (properties as any).Tags = d.tags;
  if (d.kind === 'Weapon' && d.damage) {
    // Structured damage entries JSON (for round-trip editing)
    (properties as any).DamageEntries = JSON.stringify(d.damage);
    // Human-readable display string (primary / first entry + additional entries comma separated)
    const dmgDisplay = d.damage.map(entry => {
      const bonusPart = entry.bonus && entry.bonus !== 0 ? `+${entry.bonus}` : '';
      return `${entry.dice}${bonusPart} ${entry.type}`;
    }).join(', ');
    (properties as any).Damage = dmgDisplay;
  }
  if (d.kind === 'Weapon' && d.range) (properties as any).Range = `${d.range.normal}${d.range.long?`/${d.range.long}`:''}`;
  if (d.kind === 'Armor' && d.armorClass) (properties as any).AC = String(d.armorClass.base);
  if (d.features?.length) (properties as any).Features = d.features.map(f=>f.name);
  // Actual enum type
  let typeEnum = DataItemTypeEnum.Item;
  if (d.kind === 'Weapon') typeEnum = DataItemTypeEnum.Weapon;
  else if (d.kind === 'Armor') typeEnum = DataItemTypeEnum.Armor;
  return {
    id: existing?.id || Date.now(),
    name: d.name,
    desc: d.desc,
    type: typeEnum,
    weight: d.weight || 0,
    cost: costStr,
    properties
  } as DataItem;
}

const [state, setState] = createStore<ItemsState>({
  status: 'idle',
  srd: {},
  homebrew: {},
  selection: { activeName: '' },
  form: null,
  template: null,
  selectionVersion: 0
});

// Helper: ensure kind-specific default structures exist (without overwriting populated values unless seedAll/force)
function ensureKindDefaults(d: DraftItem, opts?: { overwrite?: boolean }): DraftItem {
  const overwrite = !!opts?.overwrite;
  if (d.kind === 'Weapon') {
    if (overwrite || !d.damage || d.damage.length === 0) {
      if (!d.damage || d.damage.length === 0 || overwrite) d.damage = d.damage && !overwrite && d.damage.length ? d.damage : [{ dice: '1d6', type: 'slashing', bonus: 0 }];
    }
    if (overwrite || !d.range) {
      if (!d.range || overwrite) d.range = d.range && !overwrite ? d.range : { normal: 0, long: 0 };
    }
    if (d.weaponCategory === undefined) d.weaponCategory = '';
    if (d.weaponRange === undefined) d.weaponRange = '';
    if (d.categoryRange === undefined) d.categoryRange = '';
    // strip armor fields
    d.armorCategory = undefined;
    d.armorClass = undefined;
    d.strMin = undefined;
    (d as any).stealthDisadvantage = undefined;
  } else if (d.kind === 'Armor') {
    if (overwrite || !d.armorClass) {
      if (!d.armorClass || overwrite) d.armorClass = d.armorClass && !overwrite ? d.armorClass : { base: 10, dexBonus: true, maxBonus: 0 };
    }
    if (d.armorCategory === undefined) d.armorCategory = '';
    if (d.strMin === undefined) d.strMin = 0;
    if (d.stealthDisadvantage === undefined) d.stealthDisadvantage = false;
    // strip weapon fields
    d.weaponCategory = undefined;
    d.weaponRange = undefined;
    d.categoryRange = undefined;
    d.damage = undefined as any;
    d.range = undefined as any;
  } else { // generic Item
    d.weaponCategory = undefined;
    d.weaponRange = undefined;
    d.categoryRange = undefined;
    d.damage = undefined as any;
    d.range = undefined as any;
    d.armorCategory = undefined;
    d.armorClass = undefined;
    d.strMin = undefined;
    (d as any).stealthDisadvantage = undefined;
  }
  return d;
}

// SRD loader: uses existing hooks lazily (keeps store pure for tests)
async function loadSrdOnce(): Promise<void> {
  if (state.status !== 'idle' || Object.keys(state.srd).length) return;
  setState('status', 'loading');
  try {
    const [userSettings] = getUserSettings();
    const version = userSettings().dndSystem || '2024';
    // useGetSrdItems returns a memo; call it once after microtask
    const memo = useGetSrdItems(version);
    // poll until loaded or timeout (basic approach)
    let attempts = 0;
    await new Promise<void>((resolve) => {
      const id = setInterval(() => {
        attempts++;
        const list = memo();
        if (list.length || attempts > 50) {
          clearInterval(id);
          const map: Record<string, any> = {};
            list.forEach(i => { if (i?.name) map[i.name] = i; });
          setState('srd', map);
          resolve();
        }
      }, 40);
    });
    // homebrew snapshot
  const hb: Record<string, DataItem> = {};
  homebrewManager.items().forEach(i => { if (i?.name) hb[i.name] = i as DataItem; });
    setState('homebrew', hb);
    setState('status', 'idle');
  } catch (e: any) {
    setState({ status: 'error', error: e?.message || 'Failed to load SRD items' });
  }
}

function selectNew() {
  const draft = ensureKindDefaults(blankDraft(), { overwrite: true });
  setState(p => ({ selection: { activeName: '__new__' }, template: null, form: draft, selectionVersion: p.selectionVersion + 1 }));
}

function select(name: string) {
  const entity = state.homebrew[name] || state.srd[name];
  if (!entity) return;
  const draft = ensureKindDefaults(toDraft(entity), { overwrite: false });
  setState(p => ({ selection: { activeName: name }, template: entity, form: draft, selectionVersion: p.selectionVersion + 1 }));
}

function updateField<K extends keyof DraftItem>(key: K, value: DraftItem[K]) {
  if (!state.form) return;
  setState('form', key, value);
}

function mutate(mutator: (draft: DraftItem) => void) {
  if (!state.form) return;
  setState('form', d => {
    let copy: DraftItem;
    try {
      // structuredClone preserves nested objects & arrays immutably
      // @ts-ignore structuredClone available in modern environments
      copy = typeof structuredClone === 'function' ? structuredClone(d) : JSON.parse(JSON.stringify(d));
    } catch { copy = JSON.parse(JSON.stringify(d)); }
    mutator(copy);
    return copy;
  });
}

function setKind(kind: DraftKind, opts?: { force?: boolean }) {
  if (!state.form) return;
  const same = state.form.kind === kind;
  if (same && !opts?.force) return; // no-op to avoid unnecessary reactive churn
  // Build new draft preserving shared fields
  const shared: DraftItem = {
    kind,
    name: state.form.name,
    desc: state.form.desc,
    cost: JSON.parse(JSON.stringify(state.form.cost)),
    weight: state.form.weight,
    tags: [...(state.form.tags||[])],
    features: [...(state.form.features||[])]
  } as DraftItem;
  const seeded = ensureKindDefaults(shared, { overwrite: true });
  setState('form', seeded as any);
}

function validate(): string[] {
  const f = state.form; if (!f) return ['No draft'];
  const errs: string[] = [];
  if (!f.name.trim()) errs.push('name: required');
  if (f.name.length > 60) errs.push('name: max 60 chars');
  const existing = state.srd[f.name] || state.homebrew[f.name];
  if (existing && state.selection.activeName !== f.name) errs.push('name: must be unique');
  if (f.cost.quantity < 0) errs.push('cost: cannot be negative');
  if (!f.cost.unit) errs.push('cost.unit: required');
  if (f.kind === 'Weapon') {
    if (!f.damage?.length) errs.push('weapon.damage: at least one entry');
    (f.damage || []).forEach((d, i) => {
      if (!/^\d+d\d+$/.test(d.dice)) errs.push(`weapon.damage[${i}].dice invalid`);
      if (!d.type) errs.push(`weapon.damage[${i}].type required`);
    });
  }
  if (f.kind === 'Armor') {
    if (!f.armorClass?.base) errs.push('armor.armorClass.base required');
  }
  // feature duplicates
  const seen = new Set<string>();
  (f.features || []).forEach(ft => { if (seen.has(ft.name)) errs.push(`features: duplicate ${ft.name}`); else seen.add(ft.name); });
  return errs;
}

function computeModified(): boolean {
  if (!state.form) return false;
  const normalize = (d: DraftItem): DraftItem => {
  const copy = ensureKindDefaults(JSON.parse(JSON.stringify(d)), { overwrite: false });
    Object.keys(copy).forEach(k => { if ((copy as any)[k] === undefined) delete (copy as any)[k]; });
    return copy;
  };
  if (state.selection.activeName === '__new__' && !state.template) {
    return JSON.stringify(normalize(blankDraft())) !== JSON.stringify(normalize(state.form));
  }
  const base = normalize(toDraft(state.template));
  const formNorm = normalize(state.form);
  return JSON.stringify(base) !== JSON.stringify(formNorm);
}

function persist(): { ok: boolean; errs?: string[] } {
  const errs = validate();
  if (errs.length) return { ok: false, errs };
  const activeKey = state.selection.activeName;
  const existing = state.homebrew[activeKey];
  const dataItem = fromDraftToData(state.form!, existing);
  const isNew = !existing || activeKey === '__new__';
  // Perform persistence through homebrewManager
  if (isNew) {
    homebrewManager.addItem(dataItem as any);
  } else {
    homebrewManager.updateItem(dataItem as any);
  }
  // Build new map explicitly to avoid proxy retention issues on deletion order
  if (!isNew && activeKey !== dataItem.name) {
    // Explicitly unset old key so Solid removes it
    if (state.homebrew[activeKey]) setState('homebrew', activeKey as any, undefined as any);
  }
  // Set / overwrite new key
  setState('homebrew', dataItem.name as any, dataItem as any);
  const newDraft = toDraft(dataItem);
  setState({ selection: { activeName: dataItem.name }, template: dataItem as any, form: newDraft });
  return { ok: true };
}

export const itemsStore = {
  state,
  loadSrdOnce,
  selectNew,
  select,
  updateField,
  mutate,
  setKind,
  validate,
  errors: createMemo(() => validate()),
  isModified: createMemo(() => computeModified()),
  canSave: createMemo(() => validate().length === 0),
  persist,
  // test-only util
  _testReset() { setState({ status:'idle', error: undefined, srd:{}, homebrew:{}, selection:{ activeName:'' }, template:null, form:null, selectionVersion:0 }); },
  _testSetSrd(map: Record<string, any>) { setState('srd', map); },
  _testSetHomebrew(map: Record<string, any>) { setState('homebrew', map); }
};

export default itemsStore;