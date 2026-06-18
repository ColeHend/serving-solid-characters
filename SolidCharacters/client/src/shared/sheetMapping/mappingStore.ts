import { createRoot, createSignal } from 'solid-js';
import { addSnackbar } from 'coles-solid-library';
import mappingDB from '../customHooks/utility/localDB/mappingDB';
import { AttackCantripConfig, MAPPING_SCHEMA_VERSION, PlacedField, SheetTemplate, SpellTableConfig } from './sheetMapping.types';
import { DEFAULT_SHEET_TEMPLATE } from './defaultSheetTemplate';
import { defaultAttackCantripConfig, defaultSpellTableConfig } from './pdf/spellTable';

/** Recursive partial — table updaters take a sparse patch (e.g. `{ cols: { name: { x } } }`). */
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

/** Merge a sparse patch onto a spell-table config (cols/markers merged per sub-object). */
function mergeSpellTable(base: SpellTableConfig, patch: DeepPartial<SpellTableConfig>): SpellTableConfig {
  return {
    ...base,
    ...patch,
    cols: {
      level: { ...base.cols.level, ...patch.cols?.level },
      name: { ...base.cols.name, ...patch.cols?.name },
      castingTime: { ...base.cols.castingTime, ...patch.cols?.castingTime },
      range: { ...base.cols.range, ...patch.cols?.range },
    },
    markers: {
      ...base.markers,
      ...patch.markers,
      concentration: { ...base.markers.concentration, ...patch.markers?.concentration },
      ritual: { ...base.markers.ritual, ...patch.markers?.ritual },
      material: { ...base.markers.material, ...patch.markers?.material },
    },
  };
}

/** Merge a sparse patch onto an attack-cantrip config (cols merged per sub-object). */
function mergeAttackCantrip(base: AttackCantripConfig, patch: DeepPartial<AttackCantripConfig>): AttackCantripConfig {
  return {
    ...base,
    ...patch,
    cols: {
      name: { ...base.cols.name, ...patch.cols?.name },
      detail: { ...base.cols.detail, ...patch.cols?.detail },
    },
  };
}

/**
 * Every field of a placement that defines its identity, for cheap change
 * detection. EVERY persisted prop must be listed: a missing key makes
 * `samePlacement` treat a real edit as a no-op (silent stale render) — and for a
 * prop the inspector edits, lets the reactive `Select`/`Input` onChange churn the
 * reference into the documented infinite update loop. All values are primitives,
 * so the strict `===` per key in `samePlacement` is correct.
 */
const PLACEMENT_KEYS: (keyof PlacedField)[] = [
  'fieldKey',
  'pageIndex',
  'x',
  'y',
  'fontSize',
  'font',
  'align',
  'maxWidth',
  'color',
  'renderMode',
  'boxHeight',
  'columns',
  'columnGap',
  'descMaxChars',
  'showDescriptions',
  'staticText',
];

/** True when two placements are field-for-field equal (so an upsert is a no-op). */
function samePlacement(a: PlacedField, b: PlacedField): boolean {
  return PLACEMENT_KEYS.every((k) => a[k] === b[k]);
}

/**
 * Reactive singleton store for the active {@link SheetTemplate}, backed by
 * `MappingDB` (Dexie). Mirrors the `createRoot` store pattern used elsewhere
 * (e.g. `backgroundsStore`). Reseeds the default template on a missing record or
 * a `version` mismatch. Drag edits mutate the in-memory `template()` signal (so
 * the live preview updates immediately); `saveTemplate`/`resetToDefault` persist.
 */
function createMappingStore() {
  const [template, setTemplate] = createSignal<SheetTemplate>(freshDefault());

  function freshDefault(): SheetTemplate {
    return {
      ...DEFAULT_SHEET_TEMPLATE,
      version: MAPPING_SCHEMA_VERSION,
      fields: DEFAULT_SHEET_TEMPLATE.fields.map((field) => ({ ...field })),
      // Fresh copies so the reactive store never shares the default's nested objects.
      spellTable: defaultSpellTableConfig(),
      attackCantripTable: defaultAttackCantripConfig(),
      updatedAt: Date.now(),
    };
  }

  /** Deep-ish copy so stored records never share the reactive store's arrays. */
  function persist(t: SheetTemplate): Promise<string> {
    return mappingDB.mappings.put({ ...t, fields: t.fields.map((field) => ({ ...field })) });
  }

  async function loadTemplate(id = 'default'): Promise<SheetTemplate> {
    try {
      const record = await mappingDB.mappings.get(id);
      if (!record || record.version !== MAPPING_SCHEMA_VERSION) {
        const seeded = freshDefault();
        seeded.templateId = id;
        await persist(seeded);
        setTemplate(seeded);
        return seeded;
      }
      // Defensive backfill: a version-matched record missing a table config (e.g.
      // a partial write) still gets defaults so the canvas/inspector can assume
      // `spellTable`/`attackCantripTable` are always defined.
      if (!record.spellTable) record.spellTable = defaultSpellTableConfig();
      if (!record.attackCantripTable) record.attackCantripTable = defaultAttackCantripConfig();
      setTemplate(record);
      return record;
    } catch {
      addSnackbar({ message: 'Failed to load sheet mapping', severity: 'error' });
      return template();
    }
  }

  async function saveTemplate(t: SheetTemplate): Promise<void> {
    const next: SheetTemplate = { ...t, version: MAPPING_SCHEMA_VERSION, updatedAt: Date.now() };
    setTemplate(next);
    try {
      await persist(next);
      addSnackbar({ message: 'Sheet mapping saved', severity: 'success' });
    } catch {
      addSnackbar({ message: 'Failed to save sheet mapping', severity: 'error' });
    }
  }

  /**
   * Insert or replace the placement for a field key (one placement per key).
   *
   * Idempotent: if the incoming placement is identical to the stored one, the
   * same template reference is returned so the signal does NOT notify. This is
   * essential — `coles` `Select` calls its `onChange` from a reactive effect
   * tracking `value` (not just on user input). The inspector's `onChange` writes
   * here, so a non-idempotent write would emit a new object every time, re-deriving
   * the Select's `value` and re-firing that effect: an infinite update loop
   * ("Maximum call stack size exceeded") the moment a field is selected.
   */
  function upsertField(id: string, field: PlacedField): void {
    setTemplate((t) => {
      if (t.templateId !== id) return t;
      const existing = t.fields.find((f) => f.fieldKey === field.fieldKey);
      if (existing && samePlacement(existing, field)) return t;
      return { ...t, fields: [...t.fields.filter((f) => f.fieldKey !== field.fieldKey), field] };
    });
  }

  function removeField(id: string, key: string): void {
    setTemplate((t) => (t.templateId !== id ? t : { ...t, fields: t.fields.filter((f) => f.fieldKey !== key) }));
  }

  /**
   * Merge a sparse patch into the page-2 spell table geometry (in memory only;
   * `saveTemplate` persists). Idempotent like {@link upsertField}: an unchanged
   * result returns the same template reference so the signal does NOT notify —
   * essential because the inspector's `Input`/`Select` re-emit `onChange` from a
   * reactive effect, so a churning reference would spin into an update loop.
   */
  function updateSpellTable(id: string, patch: DeepPartial<SpellTableConfig>): void {
    setTemplate((t) => {
      if (t.templateId !== id) return t;
      const next = mergeSpellTable(t.spellTable ?? defaultSpellTableConfig(), patch);
      if (t.spellTable && JSON.stringify(t.spellTable) === JSON.stringify(next)) return t;
      return { ...t, spellTable: next };
    });
  }

  /** As {@link updateSpellTable} but for the page-1 attack-cantrip box geometry. */
  function updateAttackCantripTable(id: string, patch: DeepPartial<AttackCantripConfig>): void {
    setTemplate((t) => {
      if (t.templateId !== id) return t;
      const next = mergeAttackCantrip(t.attackCantripTable ?? defaultAttackCantripConfig(), patch);
      if (t.attackCantripTable && JSON.stringify(t.attackCantripTable) === JSON.stringify(next)) return t;
      return { ...t, attackCantripTable: next };
    });
  }

  async function resetToDefault(id = 'default'): Promise<SheetTemplate> {
    const seeded = freshDefault();
    seeded.templateId = id;
    setTemplate(seeded);
    try {
      await persist(seeded);
      addSnackbar({ message: 'Sheet mapping reset to default', severity: 'success' });
    } catch {
      addSnackbar({ message: 'Failed to reset sheet mapping', severity: 'error' });
    }
    return seeded;
  }

  // Eager-load the default template (reseeds on first run / version mismatch).
  void loadTemplate('default');

  return {
    template,
    loadTemplate,
    saveTemplate,
    upsertField,
    removeField,
    resetToDefault,
    updateSpellTable,
    updateAttackCantripTable,
  };
}

export const mappingStore = createRoot(createMappingStore);
