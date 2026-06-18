import { PDFDocument, PDFFont, PDFPage, RGB, StandardFonts, rgb } from 'pdf-lib';
import templateUrl from '../../../assets/dnd-character-sheet.standard.empty.en.us-letter.pdf';
import { AttackCantripConfig, SheetFontName, SheetTemplate, SpellTableConfig } from '../sheetMapping.types';
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
): Promise<Uint8Array> {
  const templateBytes = await fetch(templateUrl).then((r) => r.arrayBuffer());
  const doc = await PDFDocument.load(templateBytes);
  const pages = doc.getPages();

  // Embed each StandardFont at most once.
  const fontCache = new Map<SheetFontName, PDFFont>();
  const getFont = async (name: SheetFontName): Promise<PDFFont> => {
    let font = fontCache.get(name);
    if (!font) {
      font = await doc.embedFont(STANDARD[name] ?? StandardFonts.Helvetica);
      fontCache.set(name, font);
    }
    return font;
  };

  for (const field of template.fields) {
    const value = values[field.fieldKey] ?? '';
    if (!value) continue; // skip empties
    if (field.pageIndex < 0 || field.pageIndex >= pages.length) continue; // skip out-of-range
    const page = pages[field.pageIndex];
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
