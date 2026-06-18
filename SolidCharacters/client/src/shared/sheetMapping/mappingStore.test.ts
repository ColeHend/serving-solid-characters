import { describe, it, expect, beforeEach } from 'vitest';
import mappingDB from '../customHooks/utility/localDB/mappingDB';
import { mappingStore } from './mappingStore';
import { DEFAULT_SHEET_TEMPLATE } from './defaultSheetTemplate';
import { MAPPING_SCHEMA_VERSION, SheetTemplate } from './sheetMapping.types';

describe('mappingStore persistence (fake-indexeddb)', () => {
  beforeEach(async () => {
    await mappingDB.mappings.clear();
  });

  it('reseeds the default when no record exists', async () => {
    const t = await mappingStore.loadTemplate('default');
    expect(t.version).toBe(MAPPING_SCHEMA_VERSION);
    expect(t.fields.length).toBe(DEFAULT_SHEET_TEMPLATE.fields.length);

    const record = await mappingDB.mappings.get('default');
    expect(record).toBeTruthy();
    expect(record!.fields.length).toBe(DEFAULT_SHEET_TEMPLATE.fields.length);
  });

  it('reseeds on a schema version mismatch', async () => {
    await mappingDB.mappings.put({ templateId: 'default', name: 'stale', version: 999, fields: [], updatedAt: 0 });
    const t = await mappingStore.loadTemplate('default');
    expect(t.version).toBe(MAPPING_SCHEMA_VERSION);
    expect(t.fields.length).toBe(DEFAULT_SHEET_TEMPLATE.fields.length);
  });

  it('round-trips a saved template through the DB', async () => {
    const custom: SheetTemplate = {
      templateId: 'default',
      name: 'Custom',
      version: MAPPING_SCHEMA_VERSION,
      fields: [{ fieldKey: 'name', pageIndex: 0, x: 12, y: 34, fontSize: 9, font: 'Courier', align: 'right' }],
      updatedAt: 0,
    };
    await mappingStore.saveTemplate(custom);
    const loaded = await mappingStore.loadTemplate('default');
    expect(loaded.fields).toHaveLength(1);
    expect(loaded.fields[0]).toMatchObject({ fieldKey: 'name', x: 12, y: 34, font: 'Courier', align: 'right' });
  });

  it('upsertField replaces the placement for a key in memory', () => {
    mappingStore.upsertField('default', { fieldKey: 'name', pageIndex: 0, x: 1, y: 1, fontSize: 10, font: 'Helvetica', align: 'left' });
    mappingStore.upsertField('default', { fieldKey: 'name', pageIndex: 1, x: 5, y: 5, fontSize: 10, font: 'Helvetica', align: 'left' });
    const matches = mappingStore.template().fields.filter((f) => f.fieldKey === 'name');
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ pageIndex: 1, x: 5 });
  });

  // Regression: an identical upsert must NOT emit a new template reference. The coles
  // `Select` calls its `onChange` from a reactive effect tracking `value`; the inspector's
  // onChange writes back here, so a non-idempotent no-op write would churn the reference
  // every tick and spin into an infinite update loop the moment a field is selected.
  it('upsertField is a no-op (same reference) when the placement is unchanged', () => {
    const placement = { fieldKey: 'name', pageIndex: 0, x: 1, y: 1, fontSize: 10, font: 'Helvetica' as const, align: 'left' as const };
    mappingStore.upsertField('default', { ...placement });
    const before = mappingStore.template();
    mappingStore.upsertField('default', { ...placement }); // identical values, new object
    expect(mappingStore.template()).toBe(before); // unchanged → no signal notification
    mappingStore.upsertField('default', { ...placement, x: 2 }); // real change
    expect(mappingStore.template()).not.toBe(before);
  });
});
