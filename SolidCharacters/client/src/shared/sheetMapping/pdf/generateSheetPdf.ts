import { PDFDocument, PDFFont, StandardFonts, rgb } from 'pdf-lib';
import templateUrl from '../../../assets/dnd-character-sheet.standard.empty.en.us-letter.pdf';
import { SheetFontName, SheetTemplate } from '../sheetMapping.types';

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

  return doc.save();
}
