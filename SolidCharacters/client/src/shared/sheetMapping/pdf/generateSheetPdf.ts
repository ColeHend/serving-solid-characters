import { PDFDocument, PDFFont, PDFPage, RGB, StandardFonts, rgb } from 'pdf-lib';
import templateUrl from '../../../assets/dnd-character-sheet.standard.empty.en.us-letter.pdf';
import { FeatureDetail } from '../../../models/generated';
import { clamp } from '../sheetConstants';
import { AttackCantripConfig, PlacedField, SheetFontName, SheetTemplate, SpellTableConfig } from '../sheetMapping.types';
import {
  ATTACK_CANTRIP_TABLE,
  SPELL_TABLE,
  SpellRow,
  abbrevCastingTime,
  attackCantripBaseline,
  attackCantrips,
  chunkRows,
  rowBaseline,
} from './spellTable';

/**
 * THE single PDF render path — used by both the "Create Character Sheet"
 * download flow and the editor's live preview (`sheetPreview.tsx` consumes these
 * exact bytes). Signature is fixed: `(values, template) => Uint8Array`.
 *
 * Coordinates are drawn verbatim: `(x, y)` is the baseline-left anchor in PDF
 * points (bottom-left origin). The lone Y-flip already happened at capture time
 * (`screenToPdf`), so there is NO second flip here.
 */

const STANDARD: Record<SheetFontName, StandardFonts> = {
  Helvetica: StandardFonts.Helvetica,
  TimesRoman: StandardFonts.TimesRoman,
  Courier: StandardFonts.Courier,
};

/** Bold sibling of each StandardFont, used for `featureList` feature names. */
const BOLD: Record<SheetFontName, StandardFonts> = {
  Helvetica: StandardFonts.HelveticaBold,
  TimesRoman: StandardFonts.TimesRomanBold,
  Courier: StandardFonts.CourierBold,
};

/** `#rrggbb` (or `#rgb`) → pdf-lib `rgb()` in 0–1 space. Falls back to black on bad input. */
function hexToRgb(hex: string | undefined) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex ?? '').trim());
  if (!m) return rgb(0, 0, 0);
  let h = m[1];
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return rgb(((n >> 16) & 0xff) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255);
}

export async function generateSheetPdf(
  values: Record<string, string>,
  template: SheetTemplate,
  spells?: SpellRow[],
  featureLists?: Record<string, FeatureDetail[]>,
): Promise<Uint8Array> {
  const templateBytes = await fetch(templateUrl).then((r) => r.arrayBuffer());
  const doc = await PDFDocument.load(templateBytes);
  const pages = doc.getPages();

  // Embed each StandardFont (regular + bold variants) at most once.
  const fontCache = new Map<string, PDFFont>();
  const loadFont = async (name: SheetFontName, bold: boolean): Promise<PDFFont> => {
    const key = bold ? `${name}|bold` : name;
    let font = fontCache.get(key);
    if (!font) {
      font = await doc.embedFont((bold ? BOLD[name] : STANDARD[name]) ?? StandardFonts.Helvetica);
      fontCache.set(key, font);
    }
    return font;
  };
  const getFont = (name: SheetFontName): Promise<PDFFont> => loadFont(name, false);
  const getBoldFont = (name: SheetFontName): Promise<PDFFont> => loadFont(name, true);

  for (const field of template.fields) {
    if (field.pageIndex < 0 || field.pageIndex >= pages.length) continue; // skip out-of-range
    const page = pages[field.pageIndex];

    // Feature-list placements draw their structured FeatureDetail[] in columns.
    if (field.renderMode === 'featureList') {
      await drawFeatureList(page, field, featureLists?.[field.fieldKey] ?? [], getFont, getBoldFont);
      continue;
    }

    // Static fields draw their own literal text; everything else draws the data value.
    const value = field.renderMode === 'static' ? field.staticText ?? '' : values[field.fieldKey] ?? '';
    if (!value) continue; // skip empties
    const font = await getFont(field.font);

    try {
      let x = field.x;
      // Single-line align offset (full-string width). Wrapped fields stay left-anchored.
      if (field.align !== 'left' && !field.maxWidth) {
        const w = font.widthOfTextAtSize(value, field.fontSize);
        x -= field.align === 'center' ? w / 2 : w;
      }

      page.drawText(value, {
        x,
        y: field.y,
        size: field.fontSize,
        font,
        color: hexToRgb(field.color),
        ...(field.maxWidth ? { maxWidth: field.maxWidth, lineHeight: field.fontSize * 1.15 } : {}),
      });
    } catch (err) {
      // StandardFonts (WinAnsi, no fontkit) can't encode every character; skip the
      // offending field rather than failing the whole document / live preview.
      console.warn(`generateSheetPdf: skipped field "${field.fieldKey}"`, err);
    }
  }

  if (spells && spells.length) {
    // Use the template's persisted (possibly retuned) geometry; fall back to the
    // shipped defaults so callers/tests passing a bare template are unaffected.
    await drawSpellTable(doc, spells, getFont, template.spellTable ?? SPELL_TABLE);
    await drawAttackCantrips(doc, spells, values.spellAttack ?? '', getFont, template.attackCantripTable ?? ATTACK_CANTRIP_TABLE);
  }

  return doc.save();
}

/**
 * Render the sorted spell rows into the printed page-2 table, spilling onto
 * additional copies of page 2 when there are more than `rowsPerPage` spells.
 * Continuation pages are full copies of the original page 2 (their right-side
 * boxes stay blank — no template field targets the new page indices).
 */
async function drawSpellTable(
  doc: PDFDocument,
  spells: SpellRow[],
  getFont: (name: SheetFontName) => Promise<PDFFont>,
  cfg: SpellTableConfig,
): Promise<void> {
  const pages = doc.getPages();
  if (cfg.pageIndex >= pages.length) return; // template missing page 2 → bail safely

  const chunks = chunkRows(spells, cfg.rowsPerPage);
  const font = await getFont(cfg.font);
  const black = rgb(0, 0, 0);

  // Resolve all target pages BEFORE drawing: copy from the still-clean original
  // page 2 each time (drawing on it first would otherwise be copied along).
  const targetPages: PDFPage[] = [pages[cfg.pageIndex]];
  for (let c = 1; c < chunks.length; c++) {
    const [copied] = await doc.copyPages(doc, [cfg.pageIndex]);
    targetPages.push(doc.addPage(copied));
  }

  chunks.forEach((chunk, i) => drawSpellChunk(targetPages[i], chunk, font, black, cfg));
}

/**
 * Part 2 — list the character's attack/damage cantrips in the page-1
 * "WEAPONS & DAMAGE CANTRIPS" box (Name + "{attack bonus} / {damage type}").
 * Weapon attacks are out of scope. Capped at the box's printed row count.
 */
async function drawAttackCantrips(
  doc: PDFDocument,
  spells: SpellRow[],
  attackBonus: string,
  getFont: (name: SheetFontName) => Promise<PDFFont>,
  cfg: AttackCantripConfig,
): Promise<void> {
  const cantrips = attackCantrips(spells);
  if (!cantrips.length) return;

  const pages = doc.getPages();
  const T = cfg;
  if (T.pageIndex >= pages.length) return;
  const page = pages[T.pageIndex];
  const font = await getFont(T.font);
  const black = rgb(0, 0, 0);

  cantrips.slice(0, T.maxRows).forEach((c, r) => {
    const y = attackCantripBaseline(r, cfg);
    const detail = [attackBonus, c.damageType].filter(Boolean).join(' / ');
    drawSpellCell(page, fitText(c.name, T.cols.name.maxWidth, T.fontSize, font), T.cols.name.x, y, T.fontSize, font, black);
    drawSpellCell(page, fitText(detail, T.cols.detail.maxWidth, T.fontSize, font), T.cols.detail.x, y, T.fontSize, font, black);
  });
}

/** Draw up to `rowsPerPage` spell rows onto one page at the configured geometry. */
function drawSpellChunk(page: PDFPage, rows: SpellRow[], font: PDFFont, color: RGB, cfg: SpellTableConfig): void {
  const G = cfg;

  rows.forEach((row, r) => {
    const y = rowBaseline(r, cfg);
    const cell = (text: string, c: { x: number; maxWidth: number }) =>
      drawSpellCell(page, fitText(text, c.maxWidth, G.fontSize, font), c.x, y, G.fontSize, font, color);

    cell(String(row.level), G.cols.level);
    cell(row.name, G.cols.name);
    cell(abbrevCastingTime(row.castingTime), G.cols.castingTime);
    cell(row.range, G.cols.range);

    const mY = y - G.markers.yAdjust;
    if (row.concentration) drawMark(page, G.markers.glyph, G.markers.concentration.x, mY, G.markers.fontSize, font, color);
    if (row.ritual) drawMark(page, G.markers.glyph, G.markers.ritual.x, mY, G.markers.fontSize, font, color);
    if (row.material) drawMark(page, G.markers.glyph, G.markers.material.x, mY, G.markers.fontSize, font, color);
  });
}

/** Draw a glyph horizontally CENTERED on `centerX` (for the ◇ checkbox marks). */
function drawMark(page: PDFPage, glyph: string, centerX: number, y: number, size: number, font: PDFFont, color: RGB): void {
  try {
    const x = centerX - font.widthOfTextAtSize(glyph, size) / 2;
    page.drawText(glyph, { x, y, size, font, color });
  } catch (err) {
    console.warn(`generateSheetPdf: skipped spell marker`, err);
  }
}

/** Left-anchored single cell; mirrors the field loop's skip-on-unencodable guard. */
function drawSpellCell(page: PDFPage, text: string, x: number, y: number, size: number, font: PDFFont, color: RGB): void {
  if (!text) return;
  try {
    page.drawText(text, { x, y, size, font, color });
  } catch (err) {
    console.warn(`generateSheetPdf: skipped spell cell "${text}"`, err);
  }
}

/** Truncate `text` with an ellipsis until it fits `maxWidth` at `size` (one line, no wrap). */
function fitText(text: string, maxWidth: number, size: number, font: PDFFont): string {
  if (!text || font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && font.widthOfTextAtSize(`${t}…`, size) > maxWidth) t = t.slice(0, -1);
  return `${t}…`;
}

/**
 * Greedy word-wrap by measured width: each returned line fits `width` at `size`.
 * A single word wider than `width` gets its own line (the `!cur` guard forces
 * forward progress); pdf-lib clips it at draw — preferable to an infinite loop.
 */
function wrapText(text: string, width: number, size: number, font: PDFFont): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const tryLine = cur ? `${cur} ${w}` : w;
    if (!cur || font.widthOfTextAtSize(tryLine, size) <= width) cur = tryLine;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Truncate `s` to at most `max` characters, appending `…` when cut. `max <= 0` ⇒ `''`. */
function truncateChars(s: string, max: number): string {
  if (max <= 0 || !s) return '';
  return s.length <= max ? s : `${s.slice(0, max).trimEnd()}…`;
}

/** Top pad (≈ one ascent) below the box top where the first glyph row's baseline sits. */
const FEATURE_TOP_PAD_RATIO = 0.8;

/** One positioned line of a `featureList` layout: where and in which weight to draw `text`. */
export interface FeatureLine {
  text: string;
  x: number;
  y: number;
  bold: boolean;
}

/**
 * Pure layout pass for a `featureList` placement — extracted from {@link drawFeatureList}
 * so the geometry is unit-testable without a `PDFPage`. `(field.x, field.y)` is the
 * box TOP-LEFT; the first baseline sits `fontSize * FEATURE_TOP_PAD_RATIO` below the
 * top edge so glyph tops fall inside the box. Each feature is its bold name (wrapped)
 * then — unless `showDescriptions` is false — its ellipsis-truncated description
 * (wrapped). Features flow DOWN a column to `field.y - boxHeight` and spill into the
 * next; once every column is full the remaining features are dropped.
 */
export function layoutFeatureList(field: PlacedField, items: FeatureDetail[], reg: PDFFont, bold: PDFFont): FeatureLine[] {
  const out: FeatureLine[] = [];
  if (!items.length) return out;
  const size = field.fontSize;
  const lineH = size * 1.2;
  const cols = clamp(Math.round(field.columns ?? 2), 1, 3);
  const gap = field.columnGap ?? 12;
  const boxW = field.maxWidth ?? 270;
  const boxH = field.boxHeight ?? 120;
  const colW = Math.max(1, (boxW - gap * (cols - 1)) / cols);
  const showDesc = field.showDescriptions !== false;
  const descMax = field.descMaxChars ?? 80;
  const colTop = field.y - size * FEATURE_TOP_PAD_RATIO; // first baseline, one ascent below the box top
  const bottom = field.y - boxH;
  const colX = (c: number): number => field.x + c * (colW + gap);

  let col = 0;
  let y = colTop;

  for (const item of items) {
    const nameLines = wrapText(item?.name ?? '', colW, size, bold);
    const descLines =
      showDesc && descMax > 0 ? wrapText(truncateChars(item?.description ?? '', descMax), colW, size, reg) : [];
    if (!nameLines.length && !descLines.length) continue;
    const blockH = (nameLines.length + descLines.length) * lineH;

    // Advance to the next column when the block won't fit below the cursor — but
    // never at a fresh column top (`y < colTop`), so an over-tall feature still
    // draws (overflowing) rather than looping columns and dropping everything.
    if (y - blockH < bottom && y < colTop) {
      col++;
      if (col >= cols) return out; // box full — drop the rest
      y = colTop;
    }
    for (const ln of nameLines) {
      out.push({ text: ln, x: colX(col), y, bold: true });
      y -= lineH;
    }
    for (const ln of descLines) {
      out.push({ text: ln, x: colX(col), y, bold: false });
      y -= lineH;
    }
    y -= lineH * 0.25; // small inter-feature gap
  }
  return out;
}

/**
 * Draw a `featureList` placement onto `page` using the positions from
 * {@link layoutFeatureList}. `(field.x, field.y)` is the box top-left.
 */
async function drawFeatureList(
  page: PDFPage,
  field: PlacedField,
  items: FeatureDetail[],
  getFont: (name: SheetFontName) => Promise<PDFFont>,
  getBoldFont: (name: SheetFontName) => Promise<PDFFont>,
): Promise<void> {
  if (!items.length) return;
  const reg = await getFont(field.font);
  const bold = await getBoldFont(field.font);
  const color = hexToRgb(field.color);
  const size = field.fontSize;
  for (const line of layoutFeatureList(field, items, reg, bold)) {
    drawSpellCell(page, line.text, line.x, line.y, size, line.bold ? bold : reg, color);
  }
}
