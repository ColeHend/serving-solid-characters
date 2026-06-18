# Plan — Drag-and-Drop Character-Sheet Field Mapper + pdf-lib Sheet Generation

> Companion reference: [character-sheet-field-catalog.md](character-sheet-field-catalog.md) — the complete enumerated source-field list (access paths + derivations) that feeds Phase 7's default mappings.

## What we're building

1. A **visual drag-and-drop mapping editor** where the user drags Character data fields from a palette onto a preview of the default 2-page D&D sheet PDF and positions them. Each placement binds a `fieldKey → (pageIndex, x, y, fontSize, font, align[, maxWidth])`. The drag backdrop is the pre-rasterized PNG/grid (used only for pointer hit-testing of chips), but the editor ALSO shows a **live, regenerated PDF preview** alongside it: as the user drags/edits placements (and on character selection / page change) the editor debounce-regenerates the real PDF via the same shipped `generateSheetPdf(values, template) → Uint8Array` and renders the bytes in an `<iframe>` (blob object URL, revoked on update/cleanup). That regenerated PDF is the WYSIWYG source of truth.
2. **Persisted mapping config** (a default seeded from code + user edits) stored in IndexedDB via Dexie.
3. **"Create Character Sheet" buttons** on the creator, view, and character-list screens that run the saved mapping against a character and download a filled PDF generated with `pdf-lib`.

### Grounding facts (verified, do not re-litigate)

- Default sheet: `SolidCharacters/dnd-character-sheet.standard.empty.en.us-letter.pdf` — **flat PDF, 0 AcroForm fields, 0 annotations, 2 pages @ 612×792 pt**. So "mapping" = drawing text at coordinates with `pdf-lib` `drawText()`; there are no form fields to fill by name.
- Available packages only (no installs): `pdf-lib@1.17.1` (**no `@pdf-lib/fontkit`** → StandardFonts Helvetica/TimesRoman/Courier only, no custom TTF), `@solidjs/router`, `dexie@4`, `coles-solid-library@0.4.9`, `solid-js@1.9.11`.
- **No `pdfjs-dist`** → cannot rasterize at runtime. But `pdftoppm`, `pdftocairo`, and `gs` are installed on this box → pre-rasterize the 2 pages to PNG at setup time.
- DnD source to vendor: `To_Adapt_And_Delete/SolidDragNDrop/src` — peer-dep only `solid-js`; all cross-file imports relative → a wholesale copy needs **zero rewrites**. `state.ts` is 285 lines (the one justified >200 file).
- Existing wiring to reuse, not reinvent: `src/index.tsx:32` already imports `CreateCharacterPDF`, and `src/index.tsx:86` has a **commented** `<Route path="/pdfCreate" component={CreateCharacterPDF} />` inside `<Route path="/characters">`. The stub is `components/characters/characterCreatePDF/characterCreatePDF.tsx`.
- Persistence pattern to mirror: `src/shared/customHooks/utility/localDB/userSettingDB.ts` (standalone Dexie DB). Blob-download pattern to generalize: `src/shared/customHooks/utility/tools/downloadObjectAsJson.ts`.

### Architecture decisions (these resolve the two design lineages this plan was merged from)

| Concern | Decision |
|---|---|
| **PDF preview (static, drag backdrop)** | Pre-rasterize at setup with `pdftoppm -png -r 150` → `src/assets/sheet/sheet-1.png` / `sheet-2.png`. Render as `<img style="pointer-events:none">` behind an absolutely-positioned droppable overlay. The PNG is the **drag backdrop for pointer hit-testing only** — NOT the WYSIWYG source. **Fallback:** a CSS 612×792 grid backdrop — coordinate model is unchanged because coords are stored in DPI-independent PDF points. |
| **Live generated preview (WYSIWYG source of truth)** | Render the **actual generated PDF** via the shared `generateSheetPdf` bytes → `URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}))` into an `<iframe>`. Debounced (~250ms) on placement / character / page change; revoke the prior object URL on each update and on `onCleanup`. Shown by default (collapsible via a `showPreview` toggle). **Alternative:** a manual `data:application/pdf;base64,…` URI built from the bytes (only if blob: URLs are CSP-blocked in the iframe). **Why:** collapses WYSIWYG and final output onto ONE render path (eliminates PNG-overlay-vs-`drawText` drift); the PNG overlay stays for pointer hit-testing, the regenerated PDF is the source of truth. |
| **Coordinate model** | Store `(x, y)` in **PDF points, bottom-left origin, text baseline-left** (pdf-lib native). The **Y-flip happens exactly once**, in a single shared module consumed by both editor and generator. The **live PDF preview (on by default) validates this single flip while shown** — the chip's baseline-anchor on the PNG overlay must match the `drawText` baseline visible in the regenerated PDF. The preview introduces **no second flip** because it consumes the SAME `generateSheetPdf` bytes. |
| **Editor location & route** | **Reuse** `components/characters/characterCreatePDF/` and **uncomment** the existing `/pdfCreate` route — minimal churn, no dangling import, no stub deletion. The stub `CreateCharacterPDF` becomes the editor shell. |
| **Headless domain module** | Put all framework-agnostic logic (types, coord util, persistence, store, character→values mapper, PDF generator, orchestrator, download) in **`src/shared/sheetMapping/`** so the "Create Sheet" buttons can generate a PDF **without importing the DnD engine or editor**. Editor depends on `shared/dnd` + `shared/sheetMapping`; generator depends on `shared/sheetMapping` only. |
| **Mapping schema** | Versioned, **template-keyed** JSON (`SheetTemplate` with `PlacedField[]`), so more sheet templates can be added later. Default ships as `templateId: 'default'`. |
| **Fonts** | StandardFonts only — `font` is a 3-value enum on each placement. |
| **Persistence** | Standalone versioned `MappingDB` (Dexie, mirrors `userSettingDB.ts`) — **not** a `LocalDB` version bump (avoids touching all 4 LocalDB instances). Reseed/migrate the default on missing record or version mismatch. |
| **Stats into generator** | `characterToSheetValues` + the orchestrator take a **plain `Stats` object** computed in-component by the caller. Never call the `useExportFullStats` hook inside the headless generator. |
| **200-line rule** | Every new file ≤200 lines. One justified exception: vendored `state.ts` (285) gets a header comment. `characterToSheetValues.ts` may approach ~190; split into `.skills.ts` / `.spells.ts` if it exceeds. |

### Data flow

```
[Editor] drag field chip → droppable page <img> overlay
  → screenToPdf() (Y-flip, once) → PlacedField → mappingStore → MappingDB (Dexie)
  ── live preview branch (shell owns values) ──
  char select → useExportFullStats (owner ctx) → characterToSheetValues → values() memo
  placement / character / page change
    → (debounce ~250ms) → generateSheetPdf(values, template)   (SAME node as the button flow below)
    → Uint8Array → URL.createObjectURL(Blob) → <iframe src>   (revoke previous URL; cancel timer on cleanup)

[Create Sheet button] → caller computes fullStats (useExportFullStats in-component)
  → createCharacterSheet(char, fullStats)
     → characterToSheetValues(char, fullStats)  (all D&D derivations)
     → mappingStore default SheetTemplate
     → generateSheetPdf() → pdf-lib drawText (no second flip) → Uint8Array
     → downloadBlob(bytes, `${name}.pdf`, 'application/pdf')
```

---

## Phase 0 — Risk-first posture & build order

Validate the hardest unknowns **before** any UI polish. Spike-first gate: **Phases 1–2 (rasterize PNGs + vendor DnD + shared coord util + its golden test) must be green before Phase 4 editor work.**

| # | Risk | Validated in | Fallback |
|---|---|---|---|
| R1 | No runtime rasterization of the BLANK template (drag backdrop) | Phase 1 (PNG spike) | CSS 612×792 grid (coords unaffected) |
| R2 | Y-flip / baseline math wrong | Phase 1 (shared util + golden test) + **Phase 4 live PDF preview (on by default; continuous while shown)** + Phase 7 visual calibration | numeric x/y fields in editor |
| R3 | No fontkit → StandardFonts only | Phase 5 | 3-font enum in schema + Select |
| R4 | Text overflow / no auto-wrap | Phase 5 | `maxWidth`+`lineHeight` wrap, else binary-search truncate w/ `…` |
| R5 | Derived stats (init/PP/DC/slots) computed nowhere | Phase 3 mapper | leave blank when class/race unresolved |
| R6 | Persistence schema migration | Phase 3 (versioned MappingDB) | reseed default on version mismatch |
| R7 | DnD a11y (keyboard/aria) | Phase 4 + Phase 8 | vendored keyboard sensor + numeric edit always available |
| R8 | Multi-page placement | Phase 4 (`pageIndex` per field) | tab per page |
| R9 | `toCharacter5e` drops AC/Speed/saves + placeholder skills; owner context | Phase 6 | creator button reads live form/signal values; run inside component owner |
| R10 | `'Sleight Of Hand'` casing, `sliverPieces` typo, sparse saves | Phase 3 mapper | canonicalize / exact-key reads / default-false |
| R11 | Portal overlay clipped by `transform`/`overflow` ancestor | Phase 4 | keep editor container out of transformed parents; portal at `document.body` |
| R12 | New assets gitignored / TS rejects `*.pdf` import | Phase 1/5 | verify `.gitignore`; add `declare module '*.pdf'` |
| R13 | Empty character store → stub crashes (`characters[0].name`) | Phase 6 | null-guard + `useSearchParams().name` → `getCharacter` with fallback in a memo |
| R14 | Live-preview regen thrash / object-URL leak | Phase 4 | debounce (~250ms); latest-wins request token; revoke prior object URL **and cancel the pending debounce timer** on each update and `onCleanup`; if `save()` cost is high, raise the debounce / offer manual 'Refresh' (the `showPreview` pane defaults on) |

> **R1 vs the live preview:** R1 concerns rasterizing the **blank template** for the drag backdrop (needs `pdftoppm`; no `pdfjs-dist` at runtime). The Phase 4 live generated-PDF preview renders the **filled output bytes** in an `<iframe>` via the browser's native PDF viewer — it does **not** reintroduce the `pdfjs-dist` constraint.

**Build order:** 1 → 2 → 3 → 5 (headless generator, testable) → 4 (editor; the live preview makes Phase 5's `generateSheetPdf` a hard dependency of the editor, so 5 ships first) → 6 (buttons) → 7 (full default mappings + calibration) → 8 (adversarial review + green gate) → delete `To_Adapt_And_Delete`.

---

## Phase 1 — Preview assets + coordinate single-source-of-truth

1. Rasterize (run once at setup):
   ```
   mkdir -p SolidCharacters/client/src/assets/sheet
   pdftoppm -png -r 150 \
     SolidCharacters/dnd-character-sheet.standard.empty.en.us-letter.pdf \
     SolidCharacters/client/src/assets/sheet/sheet
   # → sheet-1.png, sheet-2.png (≈1275×1650 each). 150dpi → 1pt = 2.0833px.
   ```
2. **Verify** `src/assets/sheet/*.png` and the copied template `*.pdf` are **not** gitignored (`.gitignore` is currently modified — check it).
3. Add to `src/vite-env.d.ts`: `declare module '*.pdf' { const url: string; export default url; }` (PNG already typed by Vite).
4. Create the **single coordinate module** `src/shared/sheetMapping/sheetConstants.ts` (≤60 lines):
   - `PDF_PAGE_W = 612`, `PDF_PAGE_H = 792`, `PAGE_COUNT = 2`, `DEFAULT_FONT_SIZE = 10`.
   - `clamp(n, lo, hi)`.
   - `screenToPdf(px, py, scale) → { x: clamp(px/scale, 0, 612), y: clamp(792 - py/scale, 0, 792) }`.
   - `pdfToScreen(x, y, scale) → { left: x*scale, top: (792 - y)*scale }`.
   - Doc-comment locking the convention: **stored `(x,y)` is the text baseline-left in PDF points, bottom-left origin**; editor chips anchor their bottom-left at `pdfToScreen(x,y)` (CSS `translateY(-100%)`) so WYSIWYG matches `drawText`. The generator does **no** extra flip.
5. **Golden test** `sheetConstants.test.ts`: `screenToPdf`/`pdfToScreen` round-trip; corners (0,0)↔(0,792) and (612,792)↔(612,0); clamp bounds; scale invariance under zoom.

---

## Phase 2 — Vendor SolidDragNDrop into the client

1. Copy wholesale (zero import rewrites — verified all cross-file imports are relative / `solid-js`):
   ```
   cp -R To_Adapt_And_Delete/SolidDragNDrop/src SolidCharacters/client/src/shared/dnd
   ```
2. Consumers import from `'../../../shared/dnd'` (the barrel `index.ts`). **Do not** add `export * from './dnd'` to `src/shared/index.ts` — it would pull the DnD type surface into every `../shared` consumer. Add a 10-line `shared/dnd/README.md` documenting the direct-import convention and provenance.
3. `state.ts` (285 lines): add a header comment — `// EXCEPTION to ≤200-line rule: createDragState closes over many per-drag mutable locals; splitting hurts readability.` No file renames or barrel moves.
4. **Verification gate:** `npx tsc --noEmit` clean; a jsdom smoke test mounts `<DragDropProvider>` + one `createDraggable` + one `createDroppable` without throwing.
5. **Delete `To_Adapt_And_Delete/` only at the very end (Phase 8)**, after the full build is green — not here. (Earlier drafts deleted it in Phase 2; defer it so a failed later phase doesn't lose the source.)

---

## Phase 3 — Domain model, persistence store, character→values mapper

All under `src/shared/sheetMapping/` (headless; no Solid component / DnD imports except the store's reactive signal).

| File | Responsibility | Budget |
|---|---|---|
| `sheetMapping.types.ts` | `SheetFontName` (`'Helvetica'\|'TimesRoman'\|'Courier'`), `TextAlign`, `PlacedField`, `SheetTemplate`, `MAPPING_SCHEMA_VERSION` | ≤55 |
| `sheetConstants.ts` | (Phase 1) coord util + page constants | ≤60 |
| `src/shared/customHooks/utility/localDB/mappingDB.ts` | `class MappingDB extends Dexie { mappings: Table<SheetTemplate,string> }`, `version(1).stores({ mappings: 'templateId' })`, exported singleton. Mirrors `userSettingDB.ts` | ≤35 |
| `mappingStore.ts` | `createRoot` singleton (mirror existing stores): reactive `template()` signal + `loadTemplate(id)`, `saveTemplate(t)`, `upsertField(id,f)`, `removeField(id,key)`, `resetToDefault(id)`. **Reseeds the default on missing record or `version !== MAPPING_SCHEMA_VERSION`.** `addSnackbar` feedback. Plain async/await + try/catch (not the rxjs httpClient wrapper) | ≤150 |
| `characterFields.ts` | `SHEET_FIELD_DEFS: { key, label, group }[]` — the canonical enumeration of bindable fields (palette source). Mirrors the field catalog reference doc | ≤140 |
| `pdf/characterToSheetValues.ts` | **Pure** `characterToSheetValues(char, fullStats, profBonus?) → Record<fieldKey,string>`. All derivations live here | ≤190 (split into `.skills.ts`/`.spells.ts` if exceeded) |
| `index.ts` | barrel | ≤10 |

**Schema** (`sheetMapping.types.ts`):
```ts
export type SheetFontName = 'Helvetica' | 'TimesRoman' | 'Courier';
export type TextAlign = 'left' | 'center' | 'right';
export interface PlacedField {
  fieldKey: string;     // key into characterToSheetValues() output and SHEET_FIELD_DEFS
  pageIndex: number;    // 0 | 1
  x: number; y: number; // PDF points, bottom-left origin, baseline-left
  fontSize: number;     // default 10
  font: SheetFontName;  // default 'Helvetica'
  align: TextAlign;     // default 'left'
  maxWidth?: number;    // optional wrap/truncate width in pts
}
export interface SheetTemplate {
  templateId: string;   // 'default' for the shipped sheet
  name: string;
  version: number;      // === MAPPING_SCHEMA_VERSION
  fields: PlacedField[];
  updatedAt: number;
}
```

**`characterToSheetValues` derivation rules** (see the field-catalog doc for every access path):
- Abilities/mods from **effective** stats (`fullStats` = `useExportFullStats` result, passed in); mod = `getAbilityModifier(fullStats[ability])` (import `getAbilityModifier`/`getProficiencyBonus` by **direct path** from `dndMath.ts` — not exported from the shared barrel).
- `profBonus = getProficiencyBonus(char.level)`.
- 18 skills: canonical key list + stat map (from `stat.tsx getSkills()`); mod = `getAbilityModifier(fullStats[stat]) + (proficient?pb:0) + (expertise?pb:0)`. **Canonicalize `'Sleight Of Hand'` casing** to one form.
- Saves: **iterate all 6 abilities**, default non-proficient when absent from the sparse `char.savingThrows`.
- Derived (computed nowhere else): `initiative = getAbilityModifier(fullStats.dex)`; `passivePerception = 10 + perceptionMod`; `spellSaveDC = 8 + pb + abilityMod`; `spellAttack = pb + abilityMod`.
- Hit dice: group `char.levels` by `hitDie` → `"Nd8"` strings.
- Spell slots: `useDnDClasses()` → `getSpellAndCasterLevel(class5e,'caster',char.level)` → `metadata.slots[casterLevel]`. **Single-class only**; multiclass left blank.
- Features: concat names from `char.features` + `char.race.features` + each `char.levels[i].features`.
- Currency: read the exact **`sliverPieces`** typo key.
- AC/Speed: sourced from form/signals where the live creator provides them (the stored Character keeps both at 0); else blank.

**Add a key-parity test** (Phase 9): every key in `characterToSheetValues` output ⊇ every `SHEET_FIELD_DEFS.key`, so adding a model field forces a corresponding mapper key.

---

## Phase 4 — Mapping editor screen (reuses `characterCreatePDF/` + `/pdfCreate`)

**Route:** uncomment `src/index.tsx:86` → `<Route path="/pdfCreate" component={CreateCharacterPDF} />` (import already present at line 32). **Nav:** add a Characters child entry `{ Name: 'Sheet Mapper', Link: '/characters/pdfCreate' }` to `src/components/sideMenu/SideMenu.tsx` (NOT the deprecated `navMenu.tsx`).

Files in `src/components/characters/characterCreatePDF/`:

| File | Responsibility | Budget |
|---|---|---|
| `characterCreatePDF.tsx` | Editor shell (replaces stub). Owns `zoom`, `activePage`, `selectedFieldKey`, `showPreview` (default on) signals; runs `useExportFullStats(selectedCharacter)` in owner context and derives `values = createMemo(() => characterToSheetValues(char, fullStats()))`; wraps subtree in `<DragDropProvider collisionDetection={pointerWithin}>`; char `<Select>`; page `<TabBar>`; Save/Reset/Generate `<Button>`s + a 'Preview' toggle `<Button>` (`Icon('visibility')`); mounts palette + canvas + config modal + `<SheetPreview/>` (side pane), passing it the `values`, `mappingStore.template()`, and `activePage` accessors. The debounce/object-URL lifecycle is delegated to `sheetPreview.tsx` to keep the shell ≤180. Null-guards empty character store | ≤180 |
| `fieldPalette.tsx` | Drag-source list from `SHEET_FIELD_DEFS`; each chip = `createDraggable`; grouped via coles `ExpansionPanel`/`Chip` | ≤120 |
| `sheetCanvas.tsx` | Active page `<img>` + full-page `createDroppable` overlay; `<For>` placed chips for the current page; `onDragEnd` → `screenToPdf(pointer − overlay rect, scale)` → `mappingStore.upsertField`; click chip → select | ≤180 |
| `placedChip.tsx` | One positioned coles `Chip`, baseline-anchored via `pdfToScreen`; re-draggable (`createDraggable`); delete/select; keyboard-focusable | ≤90 |
| `placementConfigModal.tsx` | coles `Modal`: edit `fontSize`/`x`/`y` (`Input type=number`, parse + clamp), `pageIndex` `<Select>`, `font` `<Select>` (3 fonts), `align`, `maxWidth`. **Numeric x/y always editable = the DnD a11y fallback (R7)** | ≤160 |
| `sheetPreview.tsx` | **Live generated-PDF preview pane.** Receives the `values`, `template` (`mappingStore.template()`), and `activePage` accessors from the shell (it does **not** call `characterToSheetValues` — the shell owns that memo). A `createEffect` reads (template fields, values, activePage), **captures them synchronously**, then schedules a 250ms-debounced regen; each regen captures a monotonic latest-wins token, `await generateSheetPdf(values, template)` (UNCHANGED signature), and — only if still the latest token — builds a `Blob` object URL, revokes the prior URL, and sets it on an `<iframe>` inside a coles `Container` ('Generating preview…' placeholder until first bytes). On `onCleanup`: cancel the pending debounce timer and revoke the current/stale URLs. blob object URL primary; manual `data:application/pdf;base64,…` from the bytes is the CSP fallback. coles `Container` chrome; pdf-lib only makes bytes | ≤130 |
| `characterCreatePDF.module.scss` | relative editor container; `.pageImg{pointer-events:none}`; `.overlay{position:absolute;inset:0}`; chip styles; **side-by-side canvas + preview layout** (`.editorRow{display:flex}`) and the preview pane (`.previewFrame{border:0;width:100%;height:100%}`); `@use 'coles-solid-library/themes/themes.scss'` | ≤80 |

**Editor behavior:** one full-page droppable per page; free `(x,y)` placement from the pointer position inside the overlay rect (not snap). `DragOverlay` token while dragging. **Verify the editor container has no `transform`/`filter`/`overflow:hidden` ancestor** (R11). Save → `mappingStore.saveTemplate`; Reset → `resetToDefault`; both `addSnackbar`. All chrome uses coles components; DnD primitives only for mechanics.

**Live preview loop:** the shell derives `values` via `useExportFullStats` + `characterToSheetValues` in owner context; after every `upsertField`/`removeField`/move, character change, or page change, `sheetPreview.tsx` debounce-regenerates (~250ms) via `generateSheetPdf(values, template)` — the same render path the download button uses — swaps the iframe's blob URL (revoking the previous, and cancelling the pending timer + revoking on `onCleanup`), and the PNG-overlay chips remain the drag affordance. A latest-wins token discards stale `save()` results. The regenerated PDF — not the PNG — is the **WYSIWYG source of truth** (pane shown by default); **drag → see the real PDF update** is the interactive replacement for Phase 7's old 'export → eyeball → nudge' loop, which is what kills PNG-vs-`drawText` drift. Reuse coles components for chrome; pdf-lib only makes bytes.

---

## Phase 5 — Headless PDF generation service (`shared/sheetMapping/pdf/`)

1. Copy the template into the client: `src/assets/dnd-character-sheet.standard.empty.en.us-letter.pdf`; `import templateUrl from '...assets/...pdf'`; `await fetch(templateUrl).then(r => r.arrayBuffer())`.

| File | Responsibility | Budget |
|---|---|---|
| `generateSheetPdf.ts` | `generateSheetPdf(values, template): Promise<Uint8Array>` — `PDFDocument.load`, embed StandardFonts (memoized per font), loop `template.fields`, resolve `values[fieldKey]`, align offset via `widthOfTextAtSize`, draw with Y-flip baseline + wrap/truncate, `save()`. **This exact function is ALSO the editor's live-preview render path** — `sheetPreview.tsx` consumes the returned `Uint8Array` bytes directly (same bytes, **signature unchanged**, returns `Uint8Array`). The download path is untouched; **no new generator file** is required for the preview because it reuses this | ≤160 |
| `createCharacterSheet.ts` | Orchestrator the buttons call: `createCharacterSheet(char, fullStats)` → `characterToSheetValues` → `mappingStore` default template → `generateSheetPdf` → `downloadBlob(`${char.name||'character'}.pdf`)`; `addSnackbar` on success/failure. **Takes plain `Stats`** | ≤70 |
| `downloadBlob.ts` (in `shared/customHooks/utility/tools/`) | Generic `downloadBlob(bytes, filename, mime)` (generalize `downloadObjectAsJson`; no generic exists) | ≤30 |

**Draw loop (the load-bearing rule — flip already done at capture time, so no second flip):**
```ts
const page = doc.getPage(f.pageIndex);
const value = values[f.fieldKey] ?? '';
if (!value) continue;                              // skip empties
const font = fonts[f.font];                        // StandardFonts only
let x = f.x;
const w = font.widthOfTextAtSize(value, f.fontSize);
if (f.align === 'center') x -= w / 2;
else if (f.align === 'right') x -= w;
page.drawText(drawText(value, f, font), {          // wrap/truncate helper
  x, y: f.y, size: f.fontSize, font, color: rgb(0, 0, 0),
  maxWidth: f.maxWidth, lineHeight: f.fontSize * 1.15,
});
```
- **Overflow (R4):** if `maxWidth` set → rely on `drawText` wrap + `lineHeight`; else single-line truncate using `widthOfTextAtSize` binary check, append `…`.
- **Guards:** empty value, page out of range, empty character store → skip safely.
- **Single-flip / live-preview tie:** because the live editor preview (Phase 4 `sheetPreview.tsx`) renders these exact bytes, any second Y-flip / baseline error becomes immediately visible in-editor whenever the preview pane is shown (on by default) — a near-continuous R2 check — reinforcing the no-second-flip rule. The draw loop itself is unchanged.

---

## Phase 6 — Wire "Create Character Sheet" buttons (one shared trigger)

Single reusable component keeps all three sites DRY and identical:

| File | Responsibility | Budget |
|---|---|---|
| `src/components/characters/createSheetButton.tsx` | `<CreateSheetButton character={Character} />` — coles `Button` + `Icon('picture_as_pdf')`; computes `fullStats` via `useExportFullStats` **in-component**; calls `createCharacterSheet(char, fullStats)`; null-guards empty/undefined character | ≤70 |

**Insertion sites:**
1. **Creator** (`create.tsx`): extract the stats-build + `toCharacter5e` recipe out of `handleSubmit` into a local `buildCharacter(): Character`; add the button in the Save `FlatCard`. Generates from the **live unsaved form**. **Caveat (comment it):** `toCharacter5e` emits placeholder skills and drops AC/Speed/saves — for those, pass live `group.get()` / signal values into the values mapper or render blank.
2. **View** (`view.tsx`): `<CreateSheetButton character={currentCharacter()} />` next to the character `<Select>` in `div.baseCharInfoBox`.
3. **List** (`characterMenu.tsx`): a `<MenuItem>` "Create Character Sheet" after "Edit" → calls `createCharacterSheet(character(), …)` directly (inherits the cell's `stopPropagation`; no navigation).
4. **Editor screen** reads `useSearchParams().name` → `characterManager.getCharacter(name)` with fallback to `characters()[0]`, inside a **memo** (Dexie loads async; guard empty).

---

## Phase 7 — Define the FULL default mappings (near-last)

**File:** `src/shared/sheetMapping/defaultSheetTemplate.ts` (pure data; ≤200, justified exception if it exceeds — split per page if so). Produces `DEFAULT_SHEET_TEMPLATE: SheetTemplate` (`templateId: 'default'`) that `mappingStore` seeds on first run / version mismatch.

**Authoring procedure:**
1. Open `sheet-1.png` / `sheet-2.png`; read each labeled region's pixel position.
2. Convert: PDF points = pixel / 2.0833 (150 dpi); baseline `y = 792 − pointsFromTop − fontSize`.
3. Set per-field `fontSize` (8–11), `font`, `align` (center for ability/stat boxes), `maxWidth` for prose blocks (features/equipment/traits).
4. **Coverage checklist** — every entry from [character-sheet-field-catalog.md](character-sheet-field-catalog.md) present or explicitly omitted with a reason: name, class+level, subclass, species/subrace/size/age, background, alignment, XP, inspiration; 6 ability scores + 6 mods; proficiency bonus; 18 skill mods **+ proficiency/expertise dots**; 6 save mods **+ proficiency dots**; AC, initiative, speed; HP max/current/temp; hit dice; passive perception; spell ability/DC/attack; spell slots per level; prepared & known spell lists; features/traits; languages; resistances/vulnerabilities/immunities; equipment (inventory/equipped/attuned); currency (all 5 coins incl. `sliverPieces`).
5. **Calibrate:** run Phase 5 generation on a sample character, diff the output PDF against the template visually, nudge coords. This is the empirical validation of R2.

---

## Phase 8 — FINAL adversarial multi-subagent expert review (THE LAST STEP)

Spawn parallel subagents, each reviewing **only the new/changed code** through ONE lens. Collect findings → **triage real vs false-positive (one-line justification each)** → fix only real findings → green gate.

| Expert role | Focus |
|---|---|
| **SolidJS reactivity** | owner/root context for `useExportFullStats` / `toCharacter5e` (incl. **`useExportFullStats` run in the editor-shell owner per selected character to feed the live preview**); signal-pair wiring (Modal/Menu `show`, anchor getters); memo vs stale `characters()` snapshot; no computations outside root; `createRoot` store disposal; **`sheetPreview.tsx` `createEffect` captures tracked values synchronously before the debounce, `onCleanup` cancels the timer + `URL.revokeObjectURL`** |
| **pdf-lib correctness / coordinate-math** | Y-flip done exactly once; baseline anchor consistency editor↔generator; **live preview reuses `generateSheetPdf` (one render path, no drift) and the PNG-overlay baseline matches the regenerated PDF**; align math; StandardFonts-only; `maxWidth`/overflow; 2-page indexing; empty-string guards; `save()` output |
| **Drag-and-drop UX / a11y** | keyboard sensor; aria-live announcer; focus order; droppable hit area; `DragOverlay` portal not clipped by transformed/overflow ancestor; **new side-by-side canvas+preview flex layout (`.editorRow`) adds no `transform`/`overflow:hidden` ancestor over the drag overlay (R11)**; numeric-edit fallback; touch-action restore |
| **Data-model coverage** | every field mapped; sparse saves default false; `'Sleight Of Hand'` casing; AC/Speed always-0 fallback; multiclass single-class limitation; hit-dice aggregation; `sliverPieces` typo; derived-stat formulas; key-parity test present |
| **Performance** | PNG bundle/precache weight; no drag-time layout thrash; font-embed memoization; `pdfDoc.save()` main-thread cost; **debounced preview regen, prior object URL revoked + pending debounce timer cancelled on each update and `onCleanup` (no blob-URL leak / no post-dispose regen), latest-wins token, `save()` cost under drag**; `<For>` chip re-render scope |
| **Code-cleanliness / 200-line auditor** | per-file budgets; `state.ts` documented exception; coles-library reuse over hand-rolled; no dead `navMenu.tsx` edits; barrel hygiene; naming consistency |

**Green gate (before sign-off):** apply fixes → re-run `vitest` + `npx tsc --noEmit` + `vite build` all green → **then** `rm -rf To_Adapt_And_Delete` → final commit.

---

## Phase 9 — Vitest test plan

| Test file | Asserts |
|---|---|
| `shared/sheetMapping/sheetConstants.test.ts` | **golden** round-trip; Y-flip at corners; clamp; scale invariance |
| `shared/sheetMapping/pdf/characterToSheetValues.test.ts` | ability mod (8→−1,10→0,15→+2); prof bonus per level; skill mod incl. expertise + `'Sleight Of Hand'` casing; **sparse-save default non-proficient**; init/PP/DC/attack; hit-dice grouping; empty/malformed `levels` guard; **key-parity vs `SHEET_FIELD_DEFS`** |
| `shared/sheetMapping/mappingStore.test.ts` | default reseed on missing record; version-mismatch reseed; save→load round-trip (`fake-indexeddb`) |
| `shared/sheetMapping/pdf/generateSheetPdf.test.ts` | non-empty `Uint8Array` starting `%PDF`; align offset uses `widthOfTextAtSize`; only StandardFonts embedded; truncation; missing-value / out-of-range skip; mocked template fetch |
| `shared/customHooks/utility/tools/downloadBlob.test.ts` | anchor created with correct `download`/`type`; `revokeObjectURL` called |
| `characters/characterCreatePDF/sheetCanvas.test.tsx` | mocked drop → correct flipped PDF-point placement stored |
| `characters/characterCreatePDF/sheetPreview.test.tsx` | on placement/character/page change calls `generateSheetPdf` with current (values, template); creates a blob object URL (mock `URL.createObjectURL`) and sets it as the iframe src; revokes the PREVIOUS URL on source change and on `onCleanup`; **latest-wins**: two back-to-back changes resolving out of order end with the LATEST URL and the stale URL revoked; debounce (fake timers, 250ms) coalesces rapid updates; **no regen fires after unmount** (pending timer cancelled). Mock `generateSheetPdf` |
| `characters/createSheetButton.test.tsx` | click → `createCharacterSheet` called with character + computed stats; empty-store guard |
| `shared/dnd/dnd.smoke.test.tsx` | provider + draggable + droppable mount without throw |

Use `src/test/mocks/coles-solid-library` stubs; mock `characterManager`, `useExportFullStats`, `useDnDClasses` in mapper/generator tests; `fake-indexeddb` (already a devDep) for store tests. Each test file ≤200 lines.

---

## File-tree diff summary

```
ADDED
 src/shared/dnd/**                                       (verbatim copy of SolidDragNDrop/src; +README.md)
 src/shared/sheetMapping/
   index.ts  sheetMapping.types.ts  sheetConstants.ts (+test)
   mappingStore.ts (+test)  characterFields.ts  defaultSheetTemplate.ts
   pdf/characterToSheetValues.ts (+test)  pdf/generateSheetPdf.ts (+test)
   pdf/createCharacterSheet.ts
 src/shared/customHooks/utility/localDB/mappingDB.ts
 src/shared/customHooks/utility/tools/downloadBlob.ts (+test)
 src/assets/sheet/sheet-1.png  src/assets/sheet/sheet-2.png
 src/assets/dnd-character-sheet.standard.empty.en.us-letter.pdf
 src/components/characters/createSheetButton.tsx (+test)
 src/components/characters/characterCreatePDF/
   fieldPalette.tsx  sheetCanvas.tsx (+test)  placedChip.tsx
   placementConfigModal.tsx  sheetPreview.tsx (+test)  characterCreatePDF.module.scss

MODIFIED
 src/components/characters/characterCreatePDF/characterCreatePDF.tsx  (stub → editor shell)
 src/index.tsx                                          (uncomment /pdfCreate route)
 src/components/sideMenu/SideMenu.tsx                   (nav entry)
 src/components/characters/characterMenu/characterMenu.tsx  (+ MenuItem)
 src/components/characters/view/view.tsx                (+ CreateSheetButton)
 src/components/characters/create/create.tsx            (extract buildCharacter + button)
 src/vite-env.d.ts                                      (+ declare module '*.pdf')

DELETED
 To_Adapt_And_Delete/                                   (last action of Phase 8, after green gate)
```

### Open questions for the executor
- Confirm whether `view.tsx` / `create.tsx` already wrap content in a transformed ancestor (affects DnD portal — R11).
- Decide the inspiration / proficiency-dot rendering for the default sheet (text glyph `•` vs leave to user) during Phase 7 calibration.
- Multiclass spell slots are out of scope for v1 (left blank); revisit if needed.
- **Live-preview layout:** defaulted to a right-hand `Container` pane beside `sheetCanvas`, shown by default and collapsible via a 'Preview' toggle (`showPreview`). Confirm a TabBar 'Edit | Preview' isn't preferable on small screens, and (R11) that the side-by-side flex layout introduces no transformed/`overflow:hidden` ancestor over the DnD overlay (the iframe itself is R11-unaffected).
- **Live-preview debounce / perf:** defaulted to 250ms with the pane on by default. If `pdfDoc.save()` on every drag proves too costly on large templates, raise the debounce or offer a manual 'Refresh preview' (keep the pane available, not off — see R14).
- **Live-preview iframe source:** defaulted to blob object URL (revoke on update + cleanup; reuses the exact `Uint8Array` with zero re-encoding). Fall back to a manual `data:application/pdf;base64,…` URI built from the bytes only if blob: URLs are CSP-blocked in the target browsers.
