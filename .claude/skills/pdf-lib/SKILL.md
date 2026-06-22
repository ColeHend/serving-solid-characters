---
name: pdf-lib
description: >-
  Create, modify, fill, and export PDFs in the browser with pdf-lib (the
  `pdf-lib` package, v1.17.1, already a dependency in SolidCharacters/client).
  Use when generating or filling a D&D character sheet PDF, exporting character
  data to PDF, drawing text/images/shapes onto a PDF, reading or writing PDF
  form fields, flattening forms, embedding fonts/images, or downloading/previewing
  a generated PDF in the SolidJS app. Covers both fillable AcroForm PDFs and flat
  (no-field) sheets that require coordinate-based drawing.
---

# pdf-lib

JavaScript/TypeScript library to **create and modify PDFs** entirely client-side
(no server, no native deps). Already installed in `SolidCharacters/client`
(`pdf-lib@^1.17.1`). All examples below run unchanged in the SolidJS frontend.

Everything is async because document/font/image loading returns Promises.

## ⚠️ Project-specific facts (read first)

- **The bundled sheet `SolidCharacters/dnd-character-sheet.standard.empty.en.us-letter.pdf`
  has ZERO form fields.** It is a flat, 2-page, US-Letter (612 × 792 pt) PDF.
  You **cannot** fill it with `form.getTextField(...)` — there are no fields.
  To put character data on it you must **draw text at coordinates** (see
  [Drawing onto a flat sheet](#drawing-onto-a-flat-sheet)).
- The official WotC *fillable* sheet (e.g. pdf-lib's `dod_character.pdf` demo) DOES
  have named fields like `CharacterName 2`, `Age`, `Height`, `STR`, `CHA`, etc. If the
  project ever switches to a fillable template, use [Form filling](#filling-an-existing-form).
- **Always inspect an unknown PDF first** to learn its fields, page count, and sizes:
  `node .claude/skills/pdf-lib/scripts/inspect-pdf.mjs <path-to.pdf>`
  (run from `SolidCharacters/client/` so it resolves the installed `pdf-lib`).
- **Custom fonts need `@pdf-lib/fontkit`, which is NOT installed.** Standard fonts
  (Helvetica, Times-Roman, Courier, etc.) work out of the box. Only `npm i @pdf-lib/fontkit`
  if you genuinely need a non-standard typeface (see [Custom fonts](#custom-fonts-fontkit)).
- The stub component lives at
  `SolidCharacters/client/src/components/characters/characterCreatePDF/characterCreatePDF.tsx`.
  Character data comes from `characterManager` in `../../../shared`.

## Coordinate system (the #1 gotcha)

The origin `(0, 0)` is the **bottom-left** corner. Y increases **upward**.
For `drawText`, `(x, y)` is the **baseline** of the first line, not the top.
To place text measured from the top: `y = page.getHeight() - distanceFromTop`.
Units are PostScript points (72 pt = 1 inch). US-Letter = 612 × 792.

## Imports

```ts
import {
  PDFDocument, StandardFonts, rgb, grayscale, cmyk,
  degrees, TextAlignment, PageSizes,
} from 'pdf-lib';
```

## The five core recipes

### 1. Create a PDF from scratch

```ts
const pdfDoc = await PDFDocument.create();
const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
const page = pdfDoc.addPage(PageSizes.Letter); // or addPage([612, 792])
const { width, height } = page.getSize();

page.drawText('Hello from SolidCharacters!', {
  x: 50,
  y: height - 50,          // 50pt down from the top
  size: 24,
  font,
  color: rgb(0, 0.53, 0.71),
});

const bytes = await pdfDoc.save(); // Uint8Array
```

### 2. Load and modify an existing PDF

```ts
const existing = await fetch(url).then(r => r.arrayBuffer());
const pdfDoc = await PDFDocument.load(existing);
const page = pdfDoc.getPages()[0];
page.drawText('Stamped on top', { x: 5, y: 300, size: 50, rotate: degrees(-45) });
const bytes = await pdfDoc.save();
```

### 3. Drawing onto a flat sheet

This is what the **bundled empty D&D sheet** needs (no form fields). Import the
asset, load it, draw text at measured coordinates, save.

```ts
// Vite: append ?url to get the asset URL, or put the PDF in /public.
import sheetUrl from '../../assets/dnd-character-sheet.standard.empty.en.us-letter.pdf?url';

async function buildSheet(character) {
  const bytes = await fetch(sheetUrl).then(r => r.arrayBuffer());
  const pdfDoc = await PDFDocument.load(bytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const [page1] = pdfDoc.getPages();           // 612 x 792
  const top = (fromTop: number) => 792 - fromTop;

  const put = (text: string, x: number, fromTop: number, size = 10) =>
    page1.drawText(String(text ?? ''), { x, y: top(fromTop), size, font });

  put(character.name, 60, 70, 14);
  put(character.race, 280, 60);
  put(character.class, 280, 75);
  // ...calibrate x / fromTop against the printed labels.

  return pdfDoc.save();
}
```

> Calibrating coordinates is iterative: draw, export, eyeball, nudge. A faint
> `page.drawRectangle({ x, y, width, height, borderColor: rgb(1,0,0), borderWidth: 0.5 })`
> grid overlay speeds this up; remove it before shipping.

### 4. Filling an existing form

Use only when the template actually has fields (verify with the inspector script).

```ts
const pdfDoc = await PDFDocument.load(formBytes);
const form = pdfDoc.getForm();

form.getTextField('CharacterName 2').setText('Mario');
form.getTextField('Age').setText('24');
form.getCheckBox('Inspiration').check();
form.getDropdown('Class').select('Fighter');
form.getRadioGroup('Alignment').select('LawfulGood');
form.getOptionList('Languages').select('Common');

// Optional: embed an image into a button/image field.
const png = await pdfDoc.embedPng(pngBytes);
form.getButton('CHARACTER IMAGE').setImage(png);

const bytes = await pdfDoc.save();
```

- `form.getFieldMaybe(name)` returns `undefined` instead of throwing — use it when a
  field may be absent.
- Use `getTextField` / `getCheckBox` / `getRadioGroup` / `getDropdown` / `getOptionList`
  / `getButton` for type-safe access; `getField` returns the base `PDFField`.

### 5. Flatten a form (make it non-editable)

Bakes field appearances into page content so values can't be changed and render
identically everywhere. Do this for a final, read-only export.

```ts
const form = pdfDoc.getForm();
form.getTextField('Text1').setText('Some Text');
form.flatten();
const bytes = await pdfDoc.save();
```

## Saving / downloading / previewing in the browser

`save()` → `Promise<Uint8Array>`. Turn it into a download or preview:

```ts
// Trigger a download
function download(bytes: Uint8Array, filename = 'character.pdf') {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// Inline preview (e.g. an <iframe> or <object> src) without a Blob
const dataUri = await pdfDoc.saveAsBase64({ dataUri: true });
// -> "data:application/pdf;base64,...."  set as iframe.src
```

`save()` options (all optional): `{ useObjectStreams = true, addDefaultPage = true,
objectsPerTick = 50, updateFieldAppearances = true }`. Set `useObjectStreams: false`
only if a downstream tool can't read object streams.

`load()` options: `{ ignoreEncryption, parseSpeed, throwOnInvalidObject,
updateMetadata, capNumbers }`. Pass `{ updateMetadata: false }` to preserve original
ModDate when only reading metadata.

## Drawing reference (`PDFPage`)

All take an options object; coordinates are bottom-left origin.

| Method | Key options |
|---|---|
| `drawText(text, opts)` | `x, y, size, font, color, lineHeight, maxWidth, wordBreaks, rotate, opacity` |
| `drawImage(image, opts)` | `x, y, width, height, rotate, opacity` |
| `drawRectangle(opts)` | `x, y, width, height, color, borderColor, borderWidth, opacity, rotate` |
| `drawLine(opts)` | `start:{x,y}, end:{x,y}, thickness, color, opacity` |
| `drawCircle(opts)` | `x, y, size, color, borderColor, borderWidth` |
| `drawEllipse(opts)` | `x, y, xScale, yScale, color, borderColor, borderWidth` |
| `drawSvgPath(path, opts)` | `x, y, scale, color, borderColor, borderWidth` |

Helpers: `getSize()`, `getWidth()`, `getHeight()`, `getRotation()`,
`setFont(f)`, `setFontSize(n)`, `setFontColor(c)`, `moveTo(x,y)`, `moveUp(n)`, `moveDown(n)`.

`maxWidth` + `lineHeight` make `drawText` wrap automatically — handy for backstory/notes boxes.

## Colors

`rgb(r, g, b)`, `grayscale(v)`, `cmyk(c, m, y, k)` — **all channels are 0–1**, not 0–255.
Rotation: `degrees(n)` or `radians(n)`.

## Fonts

### Standard fonts (no extra deps)

`StandardFonts.Helvetica` (+ `-Bold`, `-Oblique`, `-BoldOblique`), `TimesRoman`
(+ `-Bold`, `-Italic`, `-BoldItalic`), `Courier` (+ variants), `Symbol`,
`ZapfDingbats`. These are WinAnsi-only (no emoji / non-Latin).

```ts
const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
const w = font.widthOfTextAtSize('Gandalf', 12);  // for centering / fitting
const h = font.heightAtSize(12);
```

Center text: `x = (page.getWidth() - font.widthOfTextAtSize(t, size)) / 2`.

### Custom fonts (fontkit)

Requires `npm i @pdf-lib/fontkit` (not currently installed). Needed for TTF/OTF,
non-Latin scripts, or emoji.

```ts
import fontkit from '@pdf-lib/fontkit';
pdfDoc.registerFontkit(fontkit);
const ttf = await fetch(fontUrl).then(r => r.arrayBuffer());
const custom = await pdfDoc.embedFont(ttf, { subset: true }); // subset = smaller file
```

> **Form fields + custom fonts:** after `setText`, the field repaints with the default
> font. To render fields in an embedded font call
> `form.updateFieldAppearances(custom)` (all fields) or
> `field.defaultUpdateAppearances(custom)` (one field) before `save()`.

## Images

```ts
const png = await pdfDoc.embedPng(pngBytes);   // supports alpha
const jpg = await pdfDoc.embedJpg(jpgBytes);
const dims = png.scale(0.5);                    // {width, height} at 50%
page.drawImage(png, { x: 50, y: 50, width: dims.width, height: dims.height });
```

Accepts `ArrayBuffer | Uint8Array | base64 string`.

## Pages

- `addPage(size?)` / `insertPage(index, size?)` / `removePage(index)`
- `getPages()`, `getPageCount()`
- Copy across documents (must `copyPages` first — you can't move a page object directly):
  ```ts
  const [p] = await targetDoc.copyPages(sourceDoc, [0]);
  targetDoc.addPage(p);
  ```
- `PageSizes.Letter` = `[612, 792]`, `.Legal`, `.A4`, `.Tabloid`, `A0–A10`, `B0–B10`, etc.

## Form field types (quick reference)

| Field | Read | Write |
|---|---|---|
| Text | `getText()` | `setText(v)`, `setAlignment(TextAlignment.Center)`, `setFontSize(n)`, `enableMultiline()`, `setMaxLength(n)` |
| CheckBox | `isChecked()` | `check()`, `uncheck()` |
| RadioGroup | `getSelected()` | `select(option)`, `getOptions()` |
| Dropdown | `getSelected()` | `select(v)`, `addOptions([...])`, `setOptions([...])` |
| OptionList | `getSelected()` | `select(v)`, `addOptions([...])` |
| Button | — | `setImage(img)` |

Common modifiers on most fields: `enableReadOnly()`, `enableRequired()`.

To **create** fields programmatically (rarely needed here):
`form.createTextField('name')` then `field.addToPage(page, { x, y, width, height, font,
backgroundColor, borderColor, borderWidth, textColor })`.

## Metadata

```ts
pdfDoc.setTitle('Gandalf — Level 5 Wizard');
pdfDoc.setAuthor('SolidCharacters');
pdfDoc.setSubject('D&D 5e Character Sheet');
pdfDoc.setKeywords(['dnd', 'character', 'wizard']);
pdfDoc.setCreator('SolidCharacters (pdf-lib)');
pdfDoc.setCreationDate(new Date());
// getTitle(), getAuthor(), ... to read.
```

## Gotchas checklist

- **0 fields ≠ broken.** The bundled sheet is flat — draw, don't fill. Inspect first.
- **Y is from the bottom; drawText y is the baseline.** Use `height - fromTop`.
- **Colors are 0–1.** `rgb(255,0,0)` is wrong; use `rgb(1,0,0)`.
- **Everything is async.** `await` `create`, `load`, `embedFont`, `embedPng/Jpg`, `save`.
- **Custom font in a form field?** Call `form.updateFieldAppearances(font)` before saving.
- **`save()` returns `Uint8Array`,** not a Blob/string — wrap it for download, or use
  `saveAsBase64({ dataUri: true })` for inline preview.
- **Reuse `coles-solid-library`** for the surrounding UI (buttons, modals, snackbars per
  CLAUDE.md); pdf-lib only produces the bytes.
- **Vite asset import:** `import url from './file.pdf?url'` then `fetch(url)`, or place the
  PDF in `/public` and fetch by path.

## Inspecting any PDF

```bash
cd SolidCharacters/client
node ../../.claude/skills/pdf-lib/scripts/inspect-pdf.mjs <path-to.pdf>
```
Prints page count, each page's size, and every form field with its type and (for
dropdowns/lists) its options — the fastest way to learn how to fill or draw on a template.

## Full API docs

`https://pdf-lib.js.org/docs/api/` and runnable examples at `https://pdf-lib.js.org/`.
