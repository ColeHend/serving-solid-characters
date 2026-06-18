import { createRoot, createSignal } from 'solid-js';
import { addSnackbar } from 'coles-solid-library';
import mappingDB from '../customHooks/utility/localDB/mappingDB';
import { MAPPING_SCHEMA_VERSION, PlacedField, SheetTemplate } from './sheetMapping.types';
import { DEFAULT_SHEET_TEMPLATE } from './defaultSheetTemplate';

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

  /** Insert or replace the placement for a field key (one placement per key). */
  function upsertField(id: string, field: PlacedField): void {
    setTemplate((t) =>
      t.templateId !== id
        ? t
        : { ...t, fields: [...t.fields.filter((f) => f.fieldKey !== field.fieldKey), field] },
    );
  }

  function removeField(id: string, key: string): void {
    setTemplate((t) => (t.templateId !== id ? t : { ...t, fields: t.fields.filter((f) => f.fieldKey !== key) }));
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

  return { template, loadTemplate, saveTemplate, upsertField, removeField, resetToDefault };
}

export const mappingStore = createRoot(createMappingStore);
