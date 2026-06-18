import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { FeatureDetail } from '../../../models/generated';
import { PlacedField, SheetTemplate } from '../sheetMapping.types';
import { generateSheetPdf, layoutFeatureList } from './generateSheetPdf';
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

describe('generateSheetPdf — feature lists & static text', () => {
  const feat = (name: string, description = ''): FeatureDetail => ({ name, description });

  it('renders a two-column featureList (name + truncated description) as a valid PDF', async () => {
    const items = [
      feat('Darkvision', 'You can see in dim light within 60 feet as if it were bright light.'),
      feat('Spellcasting', 'You can cast wizard spells using Intelligence as your spellcasting ability.'),
      feat('Arcane Recovery', 'Once per day on a short rest you regain expended spell slots.'),
    ];
    const bytes = await generateSheetPdf(
      {},
      template([
        {
          fieldKey: 'classFeatures', pageIndex: 0, x: 320, y: 440, fontSize: 8, font: 'Helvetica', align: 'left',
          maxWidth: 272, renderMode: 'featureList', columns: 2, boxHeight: 180, descMaxChars: 60,
        },
      ]),
      undefined,
      { classFeatures: items },
    );
    expect(startsWithPdf(bytes)).toBe(true);
  });

  it('tolerates empty descriptions, descriptions-off, columns=3 and a giant single word', async () => {
    const items = [feat('NoDesc', ''), feat('LongWord', 'a'.repeat(400)), feat('X'.repeat(120), 'short')];
    const bytes = await generateSheetPdf(
      {},
      template([
        {
          fieldKey: 'feats', pageIndex: 0, x: 30, y: 400, fontSize: 7, font: 'TimesRoman', align: 'left',
          maxWidth: 200, renderMode: 'featureList', columns: 3, boxHeight: 100, descMaxChars: 50, showDescriptions: false,
        },
      ]),
      undefined,
      { feats: items },
    );
    expect(startsWithPdf(bytes)).toBe(true);
  });

  it('draws a static field from staticText and ignores values[fieldKey]', async () => {
    const bytes = await generateSheetPdf(
      { 'static:1': 'IGNORED' },
      template([
        { fieldKey: 'static:1', pageIndex: 0, x: 40, y: 700, fontSize: 10, font: 'Helvetica', align: 'left', renderMode: 'static', staticText: 'Resistances:' },
      ]),
    );
    expect(startsWithPdf(bytes)).toBe(true);
  });

  it('skips a featureList with no items and an empty static field', async () => {
    const bytes = await generateSheetPdf(
      {},
      template([
        { fieldKey: 'classFeatures', pageIndex: 0, x: 320, y: 440, fontSize: 8, font: 'Helvetica', align: 'left', renderMode: 'featureList' },
        { fieldKey: 'static:2', pageIndex: 0, x: 40, y: 680, fontSize: 10, font: 'Helvetica', align: 'left', renderMode: 'static', staticText: '' },
      ]),
      undefined,
      {},
    );
    expect(startsWithPdf(bytes)).toBe(true);
  });

  it('embeds bold feature-name fonts for every StandardFont without throwing', async () => {
    for (const font of ['Helvetica', 'TimesRoman', 'Courier'] as const) {
      const bytes = await generateSheetPdf(
        {},
        template([
          { fieldKey: 'speciesTraits', pageIndex: 0, x: 200, y: 300, fontSize: 8, font, align: 'left', maxWidth: 180, renderMode: 'featureList', columns: 1, boxHeight: 100 },
        ]),
        undefined,
        { speciesTraits: [feat('Bold Name', 'a description')] },
      );
      expect(startsWithPdf(bytes)).toBe(true);
    }
  });
});

describe('layoutFeatureList — box-top-left geometry', () => {
  const feat = (name: string, description = ''): FeatureDetail => ({ name, description });

  // `(x, y)` is the box top-left; box spans [y - boxHeight, y]. fontSize 8 → topPad 6.4.
  const box: PlacedField = {
    fieldKey: 'classFeatures', pageIndex: 0, x: 320, y: 440, fontSize: 8, font: 'Helvetica', align: 'left',
    maxWidth: 272, renderMode: 'featureList', columns: 2, columnGap: 12, boxHeight: 40, showDescriptions: false,
  };

  it('starts the first baseline one ascent below the box top and flows down inside the box', async () => {
    const doc = await PDFDocument.create();
    const reg = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const lines = layoutFeatureList(box, [feat('Alpha'), feat('Beta'), feat('Gamma'), feat('Delta')], reg, bold);

    const colTop = box.y - box.fontSize * 0.8; // 433.6
    const bottom = box.y - (box.boxHeight ?? 0); // 400
    expect(lines[0]).toMatchObject({ text: 'Alpha', x: 320, bold: true });
    expect(lines[0].y).toBeCloseTo(colTop, 5); // first baseline = box top − ascent
    // Every baseline sits inside the box (between the bottom edge and the first-line top).
    for (const ln of lines) {
      expect(ln.y).toBeLessThanOrEqual(colTop + 1e-6);
      expect(ln.y).toBeGreaterThanOrEqual(bottom - 1e-6);
    }
  });

  it('spills into column 2 at x = x + colW + gap and resets to the column top', async () => {
    const doc = await PDFDocument.create();
    const reg = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const lines = layoutFeatureList(box, [feat('Alpha'), feat('Beta'), feat('Gamma'), feat('Delta')], reg, bold);

    const colW = ((box.maxWidth ?? 0) - (box.columnGap ?? 0)) / 2; // 130
    const col2X = box.x + colW + (box.columnGap ?? 0); // 462
    const colTop = box.y - box.fontSize * 0.8;
    const col2 = lines.find((l) => l.x === col2X);
    expect(col2).toBeTruthy();
    expect(col2!.y).toBeCloseTo(colTop, 5); // column 2 restarts at the box top
  });

  it('drops features once every column is full (returns no items past the box)', async () => {
    const doc = await PDFDocument.create();
    const reg = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const tiny: PlacedField = { ...box, columns: 1, boxHeight: 12 }; // ~1 line tall
    const lines = layoutFeatureList(tiny, [feat('One'), feat('Two'), feat('Three')], reg, bold);
    // First feature draws (never dropped at a fresh column top); the rest spill past
    // the single column and are dropped.
    expect(lines.map((l) => l.text)).toEqual(['One']);
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
