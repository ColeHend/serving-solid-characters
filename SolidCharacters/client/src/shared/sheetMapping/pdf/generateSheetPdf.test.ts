import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { PDFDocument } from 'pdf-lib';
import { SheetTemplate } from '../sheetMapping.types';
import { generateSheetPdf } from './generateSheetPdf';
import { SpellRow, defaultAttackCantripConfig, defaultSpellTableConfig } from './spellTable';

// Serve the real template bytes to `generateSheetPdf`'s internal fetch().
beforeAll(() => {
  const bytes = new Uint8Array(
    readFileSync(resolve(process.cwd(), 'src/assets/dnd-character-sheet.standard.empty.en.us-letter.pdf')),
  );
  vi.stubGlobal('fetch', vi.fn(async () => ({ arrayBuffer: async () => bytes })));
});

afterAll(() => vi.unstubAllGlobals());

const template = (fields: SheetTemplate['fields']): SheetTemplate => ({
  templateId: 'default',
  name: 't',
  version: 1,
  fields,
  updatedAt: 0,
});

const startsWithPdf = (bytes: Uint8Array) =>
  bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46; // %PDF

describe('generateSheetPdf', () => {
  it('returns a non-empty Uint8Array starting with %PDF', async () => {
    const bytes = await generateSheetPdf(
      { name: 'Gandalf' },
      template([{ fieldKey: 'name', pageIndex: 0, x: 40, y: 730, fontSize: 12, font: 'Helvetica', align: 'left' }]),
    );
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
    expect(startsWithPdf(bytes)).toBe(true);
  });

  it('draws the WinAnsi-safe proficiency bullets without throwing', async () => {
    const bytes = await generateSheetPdf(
      { acrobaticsProf: '•', stealthProf: '••' },
      template([
        { fieldKey: 'acrobaticsProf', pageIndex: 0, x: 150, y: 500, fontSize: 9, font: 'Helvetica', align: 'center' },
        { fieldKey: 'stealthProf', pageIndex: 0, x: 150, y: 480, fontSize: 9, font: 'TimesRoman', align: 'left' },
      ]),
    );
    expect(startsWithPdf(bytes)).toBe(true);
  });

  it('skips un-encodable text (no fontkit) instead of failing the whole document', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const bytes = await generateSheetPdf(
      { name: '日本語' }, // not representable in WinAnsi
      template([{ fieldKey: 'name', pageIndex: 0, x: 40, y: 730, fontSize: 12, font: 'Helvetica', align: 'left' }]),
    );
    expect(startsWithPdf(bytes)).toBe(true); // still a valid PDF
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('skips empty values and out-of-range pages', async () => {
    const bytes = await generateSheetPdf(
      { name: '', species: 'Elf' },
      template([
        { fieldKey: 'name', pageIndex: 0, x: 40, y: 730, fontSize: 12, font: 'Helvetica', align: 'left' }, // empty → skip
        { fieldKey: 'species', pageIndex: 9, x: 40, y: 700, fontSize: 12, font: 'Helvetica', align: 'left' }, // page OOR → skip
      ]),
    );
    expect(startsWithPdf(bytes)).toBe(true);
  });

  it('draws fields with an explicit color and tolerates a malformed hex (falls back to black)', async () => {
    const bytes = await generateSheetPdf(
      { name: 'Red', species: 'Bad' },
      template([
        { fieldKey: 'name', pageIndex: 0, x: 40, y: 730, fontSize: 12, font: 'Helvetica', align: 'left', color: '#ff0000' },
        { fieldKey: 'species', pageIndex: 0, x: 40, y: 700, fontSize: 12, font: 'Helvetica', align: 'left', color: 'not-a-color' },
      ]),
    );
    expect(startsWithPdf(bytes)).toBe(true);
  });

  it('honours a maxWidth wrap field', async () => {
    const long = 'Darkvision, Keen Senses, Fey Ancestry, Trance, Elf Weapon Training, Cantrip';
    const bytes = await generateSheetPdf(
      { features: long },
      template([{ fieldKey: 'features', pageIndex: 0, x: 415, y: 560, fontSize: 8, font: 'Helvetica', align: 'left', maxWidth: 170 }]),
    );
    expect(startsWithPdf(bytes)).toBe(true);
  });
});

describe('generateSheetPdf — spell table overflow', () => {
  const spellRow = (i: number, over: Partial<SpellRow> = {}): SpellRow => ({
    level: i % 10,
    name: `Spell ${i}`,
    castingTime: '1 action',
    range: '60 feet',
    concentration: false,
    ritual: false,
    material: false,
    damageType: '',
    ...over,
  });
  const rows = (n: number) => Array.from({ length: n }, (_, i) => spellRow(i));
  const pageCount = async (bytes: Uint8Array) => (await PDFDocument.load(bytes)).getPageCount();

  it('keeps the 2-page template when spells fit on one table page (≤30)', async () => {
    expect(await pageCount(await generateSheetPdf({}, template([]), rows(30)))).toBe(2);
  });

  it('appends one continuation page at 31 spells', async () => {
    expect(await pageCount(await generateSheetPdf({}, template([]), rows(31)))).toBe(3);
  });

  it('appends two continuation pages at 61 spells', async () => {
    expect(await pageCount(await generateSheetPdf({}, template([]), rows(61)))).toBe(4);
  });

  it('draws no table (page count unchanged) for an empty spell list', async () => {
    expect(await pageCount(await generateSheetPdf({}, template([]), []))).toBe(2);
    expect(await pageCount(await generateSheetPdf({}, template([])))).toBe(2);
  });

  it('renders markers, a long name, and an attack cantrip without throwing', async () => {
    const bytes = await generateSheetPdf(
      { spellAttack: '+7' },
      template([]),
      [
        spellRow(0, { name: 'A Spell With An Extremely Long Name That Must Be Truncated To One Line', concentration: true, ritual: true, material: true }),
        spellRow(1, { level: 0, name: 'Fire Bolt', damageType: 'fire' }),
      ],
    );
    expect(startsWithPdf(bytes)).toBe(true);
  });

  // ── persisted (editable) table geometry ──
  it('honours a persisted spellTable config and keeps overflow behavior', async () => {
    const spellTable = defaultSpellTableConfig();
    spellTable.cols.name.x = 80; // user-retuned column
    spellTable.firstRowTopFromTop = 220;
    const t: SheetTemplate = { ...template([]), spellTable };
    const bytes = await generateSheetPdf({}, t, rows(31));
    expect(startsWithPdf(bytes)).toBe(true);
    expect(await pageCount(bytes)).toBe(3); // 31 spells still overflows to 1 continuation page
  });

  it('honours a custom rowsPerPage when paginating', async () => {
    const spellTable = defaultSpellTableConfig();
    spellTable.rowsPerPage = 10;
    const t: SheetTemplate = { ...template([]), spellTable };
    // 21 rows → chunks [10,10,1] → 2 base pages + 2 continuation pages.
    expect(await pageCount(await generateSheetPdf({}, t, rows(21)))).toBe(4);
  });

  it('honours a persisted attackCantripTable config', async () => {
    const attackCantripTable = defaultAttackCantripConfig();
    attackCantripTable.cols.detail.x = 300;
    const t: SheetTemplate = { ...template([]), attackCantripTable };
    const bytes = await generateSheetPdf({ spellAttack: '+5' }, t, [spellRow(0, { level: 0, name: 'Fire Bolt', damageType: 'fire' })]);
    expect(startsWithPdf(bytes)).toBe(true);
  });
});
