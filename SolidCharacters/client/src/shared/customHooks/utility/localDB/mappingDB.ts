import Dexie from 'dexie';
import { SheetTemplate } from '../../../sheetMapping/sheetMapping.types';

/**
 * Standalone Dexie DB for sheet-mapping templates. Mirrors `userSettingDB.ts`
 * (a dedicated DB rather than a `LocalDB` version bump). Keyed by `templateId`.
 */
class MappingDB extends Dexie {
  mappings!: Dexie.Table<SheetTemplate, string>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      mappings: 'templateId',
    });
  }
}

const mappingDB = new MappingDB('sheetMappings');

export default mappingDB;
