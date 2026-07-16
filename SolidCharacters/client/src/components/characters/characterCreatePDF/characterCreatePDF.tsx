import { Component, For, Show, createMemo, createSignal, onCleanup, onMount } from 'solid-js';
import { useSearchParams } from '@solidjs/router';
import { Body, Button, Icon, Modal, Option, Select, TabBar, addSnackbar } from 'coles-solid-library';
import { List, PictureAsPdf, Save, Visibility } from 'coles-solid-library/icons';
import { DragDropProvider, DragOverlay, pointerWithin, type DefaultDataMap, type DragEndEvent } from '../../../shared/dnd';
import { characterManager } from '../../../shared';
import useExportFullStats from '../../../shared/customHooks/dndInfo/useGetFullStats';
import useExportProficiencies from '../../../shared/customHooks/dndInfo/useExportProficiencies';
import { EXAMPLE_CHARACTER } from '../../../shared/customHooks/dndInfo/useExampleChars';
import { Character } from '../../../models/character.model';
import {
  AttackColsPatch,
  FIELD_LABELS,
  PAGE_COUNT,
  PlacedField,
  STATIC_FIELD_DEFAULT_TEXT,
  STATIC_FIELD_LABEL,
  SpellColsPatch,
  SpellTextCol,
  characterToFeatureLists,
  characterToSheetValues,
  clamp,
  mappingStore,
} from '../../../shared/sheetMapping';
import { generateSheetPdf } from '../../../shared/sheetMapping/pdf/generateSheetPdf';
import { spellTableRows } from '../../../shared/sheetMapping/pdf/spellTable';
import { downloadBlob } from '../../../shared/customHooks/utility/tools/downloadBlob';
import { trackRecentItem } from '../../../shared/customHooks/useRecentItems';
import {
  DropGeometry,
  movedPlaced,
  movedTableTop,
  movedTableX,
  newStaticKey,
  placedAtCenter,
  placedFromPalette,
  placedStaticAtCenter,
  resizedTableWidth,
} from './placement';
import { FieldSidebar } from './fieldSidebar';
import { FieldDragPreview } from './fieldDragPreview';
import { SheetCanvas } from './sheetCanvas';
import { SheetPreview } from './sheetPreview';
import { TableDragData, TableSelection } from './tableGuides.shared';
import styles from './characterCreatePDF.module.scss';

const TEMPLATE_ID = 'default';
type DragData =
  | { kind: 'palette'; fieldKey: string }
  | { kind: 'staticPalette' }
  | { kind: 'placed'; field: PlacedField }
  | TableDragData;
type PageData = { pageIndex: number; getRect: () => DOMRect };

/** Drag-and-drop character-sheet field mapper (the `/characters/pdfCreate` screen). */
export const CreateCharacterPDF: Component = () => {
  const [searchParams] = useSearchParams();
  // Reactive accessor onto the Dexie-backed store so async loads / new characters appear.
  const characters = characterManager.characters;

  // Match the rest of the site: the characters page background behind a themed surface.
  onMount(() => document.body.classList.add('character-create-bg'));
  onMount(() => {
    trackRecentItem({ name: 'Sheet Mapper', type: 'tool', route: '/characters/pdfCreate' });
  });
  onCleanup(() => document.body.classList.remove('character-create-bg'));

  // Reactive mobile flag (viewport, not user-agent) — drives the docked-vs-modal sidebar.
  const mq = typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)') : null;
  const [isMobile, setIsMobile] = createSignal(mq?.matches ?? false);
  onMount(() => {
    if (!mq) return;
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    onCleanup(() => mq.removeEventListener('change', handler));
  });

  const initialName = () => {
    const p = searchParams.name;
    return typeof p === 'string' ? p : Array.isArray(p) ? p[0] : undefined;
  };
  const [selectedName, setSelectedName] = createSignal<string | undefined>(initialName());

  // Memo resolves the name (which may be stale/invalid) against the live list,
  // falling back to the first character so the Select and preview stay in sync.
  const selectedCharacter = createMemo<Character | undefined>(() => {
    const list = characters();
    if (!list.length) return undefined;
    return (selectedName() ? characterManager.getCharacter(selectedName()!) : undefined) ?? list[0];
  });

  // When the user has no saved character, fall back to the bundled example so every
  // placed field renders visible sample text for testing placements.
  const previewCharacter = createMemo<Character>(() => selectedCharacter() ?? EXAMPLE_CHARACTER);

  // Effective stats + sheet values for the live preview / canvas, computed in owner context.
  const fullStats = useExportFullStats(() => previewCharacter());
  const profs = useExportProficiencies(() => previewCharacter());
  const values = createMemo(() => characterToSheetValues(previewCharacter(), fullStats(), undefined, profs()));
  // Structured feature lists for the `featureList` placements (drawn as name + description columns).
  const featureLists = createMemo(() => characterToFeatureLists(previewCharacter()));
  // Sorted spell rows for the page-2 table (re-runs when the character or the SRD spell list loads).
  const spellRows = createMemo(() => spellTableRows(previewCharacter()));

  const [zoom, setZoom] = createSignal(1);
  const [activePage, setActivePage] = createSignal(0);
  const [selectedFieldKey, setSelectedFieldKey] = createSignal<string | null>(null);
  // Table-guide selection (spell/attack columns & markers). Mutually exclusive
  // with `selectedFieldKey` — the Edit tab shows one inspector at a time.
  const [selectedTable, setSelectedTable] = createSignal<TableSelection | null>(null);
  const [showPreview, setShowPreview] = createSignal(false);
  const [showSidebar, setShowSidebar] = createSignal(false); // mobile sidebar modal
  const [sidebarTab, setSidebarTab] = createSignal(0); // 0 = Add, 1 = Edit
  const [dragStart, setDragStart] = createSignal({ x: 0, y: 0 });

  const template = mappingStore.template;
  const placedKeys = createMemo(() => new Set(template().fields.map((f) => f.fieldKey)));
  const selectedField = createMemo(() => template().fields.find((f) => f.fieldKey === selectedFieldKey()) ?? null);

  /**
   * Focus a field in the Edit tab. Selection is applied synchronously, but the
   * Add→Edit tab switch (which disposes the docked FieldPalette) and the mobile
   * sidebar modal are DEFERRED to a microtask. This keeps those structural
   * mount/unmounts OUT of the current pointer/drag-end flush — mutating the tree
   * mid-DnD-teardown (e.g. moving a placed chip, which the For is busy disposing)
   * cascades into a "too much recursion" cleanup crash.
   */
  const focusField = (key: string, openModal = false) => {
    // Selection + tab switch are DEFERRED to a microtask so the field↔table
    // inspector swap and the Add→Edit palette dispose never restructure the tree
    // inside the current pointer/drag-end flush (the "too much recursion" guard).
    queueMicrotask(() => {
      setSelectedTable(null);
      setSelectedFieldKey(key);
      setSidebarTab(1);
      if (openModal && isMobile()) setShowSidebar(true);
    });
  };
  const selectField = (key: string) => focusField(key, true);

  /** Select a table guide (clears field selection); mirrors `focusField`'s deferred swap. */
  const focusTable = (sel: TableSelection, openModal = false) => {
    queueMicrotask(() => {
      setSelectedFieldKey(null);
      setSelectedTable(sel);
      setSidebarTab(1);
      if (openModal && isMobile()) setShowSidebar(true);
    });
  };
  const selectTable = (sel: TableSelection) => focusTable(sel, true);

  /** Apply a table-guide drag to the persisted geometry, then select the dragged part. */
  const applyTableDrag = (data: TableDragData, g: DropGeometry) => {
    const t = template();
    const cfg = data.table === 'spell' ? t.spellTable : t.attackCantripTable;
    if (!cfg) return;

    if (data.kind === 'tableMove') {
      const patch = { firstRowTopFromTop: movedTableTop(cfg.firstRowTopFromTop, g) };
      if (data.table === 'spell') mappingStore.updateSpellTable(TEMPLATE_ID, patch);
      else mappingStore.updateAttackCantripTable(TEMPLATE_ID, patch);
      focusTable({ table: data.table, part: { kind: 'move' } });
      return;
    }

    if (data.kind === 'tableMarker') {
      const spell = t.spellTable;
      if (!spell) return;
      const key = data.marker as 'concentration' | 'ritual' | 'material';
      mappingStore.updateSpellTable(TEMPLATE_ID, { markers: { [key]: { x: movedTableX(spell.markers[key].x, g) } } });
      focusTable({ table: 'spell', part: { kind: 'marker', key: data.marker } });
      return;
    }

    // tableCol (move x) / tableColResize (change width; x preserved by the merge).
    const col = (cfg.cols as Record<string, SpellTextCol>)[data.col];
    if (!col) return;
    const patch: Partial<SpellTextCol> =
      data.kind === 'tableColResize'
        ? { maxWidth: resizedTableWidth(col.x, col.maxWidth, g) }
        : { x: movedTableX(col.x, g) };
    if (data.table === 'spell') mappingStore.updateSpellTable(TEMPLATE_ID, { cols: { [data.col]: patch } as SpellColsPatch });
    else mappingStore.updateAttackCantripTable(TEMPLATE_ID, { cols: { [data.col]: patch } as AttackColsPatch });
    focusTable({ table: data.table, part: { kind: 'col', key: data.col } });
  };

  /** Tap-to-add (and desktop click): place at page center, or select if already placed. */
  const onAdd = (fieldKey: string) => {
    const existing = template().fields.find((f) => f.fieldKey === fieldKey);
    mappingStore.upsertField(TEMPLATE_ID, placedAtCenter(fieldKey, activePage(), existing));
    focusField(fieldKey, true);
  };

  /** Tap-to-add a brand-new static-text field (unique key) at the page center. */
  const onAddStatic = () => {
    const field = placedStaticAtCenter(activePage());
    mappingStore.upsertField(TEMPLATE_ID, field);
    focusField(field.fieldKey, true);
  };

  const onRemove = (key: string) => {
    mappingStore.removeField(TEMPLATE_ID, key);
    if (selectedFieldKey() === key) setSelectedFieldKey(null);
  };

  const onDragEnd = (e: DragEndEvent<DefaultDataMap>) => {
    const page = e.over?.data as PageData | undefined;
    if (!page) return;
    const data = e.active.data as DragData;
    const geometry: DropGeometry = {
      rect: page.getRect(),
      dragStart: dragStart(),
      delta: e.delta,
      pageIndex: page.pageIndex,
      fallbackScale: zoom(),
    };
    // Table-guide drags edit the persisted table geometry, not a placed field.
    if (data.kind === 'tableCol' || data.kind === 'tableColResize' || data.kind === 'tableMarker' || data.kind === 'tableMove') {
      applyTableDrag(data, geometry);
      return;
    }
    let field: PlacedField;
    if (data.kind === 'placed') {
      field = movedPlaced(data.field, geometry);
    } else if (data.kind === 'staticPalette') {
      // Each static drop mints a fresh key so multiple labels can coexist.
      field = placedFromPalette(newStaticKey(), undefined, geometry, {
        renderMode: 'static',
        staticText: STATIC_FIELD_DEFAULT_TEXT,
      });
    } else {
      field = placedFromPalette(data.fieldKey, template().fields.find((f) => f.fieldKey === data.fieldKey), geometry);
    }
    mappingStore.upsertField(TEMPLATE_ID, field);
    // focusField defers the tab switch to a microtask, so it never restructures
    // the tree inside this drag-end flush. Drag never opens the mobile modal.
    focusField(field.fieldKey, false);
  };

  const onGenerate = async () => {
    const char = selectedCharacter() ?? previewCharacter();
    try {
      const bytes = await generateSheetPdf(values(), template(), spellRows(), featureLists());
      const name = char.name || 'character';
      // Copy into a fresh ArrayBuffer-backed view so it's a plain BlobPart.
      downloadBlob(new Uint8Array(bytes), name.endsWith('.pdf') ? name : `${name}.pdf`, 'application/pdf');
    } catch {
      addSnackbar({ message: 'Failed to generate sheet', severity: 'error' });
    }
  };

  /** Reset to the shipped default; also clear the now-stale selection (the default's
   *  fields/tables differ, so a lingering selectedFieldKey/selectedTable points at nothing). */
  const onReset = () => {
    mappingStore.resetToDefault(TEMPLATE_ID);
    setSelectedFieldKey(null);
    setSelectedTable(null);
  };

  const overlayLabel = (data: DragData | undefined) => {
    if (!data) return '';
    switch (data.kind) {
      case 'placed':
        return FIELD_LABELS[data.field.fieldKey] ?? data.field.fieldKey;
      case 'palette':
        return FIELD_LABELS[data.fieldKey] ?? data.fieldKey;
      case 'staticPalette':
        return STATIC_FIELD_LABEL;
      case 'tableMove':
        return 'Move table';
      case 'tableMarker':
        return `Marker: ${data.marker}`;
      case 'tableCol':
      case 'tableColResize':
        return `Column: ${data.col}`;
      default:
        return '';
    }
  };

  const sidebar = () => (
    <FieldSidebar
      tab={sidebarTab}
      setTab={setSidebarTab}
      placedKeys={placedKeys}
      values={values}
      onGrab={(x, y) => setDragStart({ x, y })}
      onAdd={onAdd}
      onAddStatic={onAddStatic}
      field={selectedField}
      templateId={TEMPLATE_ID}
      onRemove={onRemove}
      template={template}
      selectedTable={selectedTable}
    />
  );

  return (
    <Body class={styles.page}>
      <DragDropProvider
        collisionDetection={pointerWithin}
        onDragEnd={onDragEnd}
        announcements={{
          // Reuse the same human labels the drag overlay shows, instead of the
          // engine's default internal ids (`placed:armorClass on page:0`).
          onDragStart: (e) => `Picked up ${overlayLabel(e.active.data as DragData)}.`,
          onDragOver: (e) => {
            const p = e.over?.data as PageData | undefined;
            return p ? `Over page ${p.pageIndex + 1}.` : 'Not over a page.';
          },
          onDragEnd: (e) => {
            const label = overlayLabel(e.active.data as DragData);
            const p = e.over?.data as PageData | undefined;
            return p ? `Placed ${label} on page ${p.pageIndex + 1}.` : `Dropped ${label}.`;
          },
          onDragCancel: (e) => `Cancelled moving ${overlayLabel(e.active.data as DragData)}.`,
        }}
      >
        <div class={styles.toolbar}>
          <Show
            when={characters().length}
            fallback={<span class={styles.hint}>No characters yet — showing a sample. Create one to use your own.</span>}
          >
            <Select value={selectedCharacter()?.name ?? ''} onChange={(n: string) => setSelectedName(n)}>
              <For each={characters()}>{(c) => <Option value={c.name}>{c.name}</Option>}</For>
            </Select>
          </Show>
          <TabBar
            tabs={Array.from({ length: PAGE_COUNT }, (_, i) => `Page ${i + 1}`)}
            activeTab={activePage()}
            onTabChange={(_l, i) => setActivePage(i)}
          />
          <Show when={isMobile()}>
            <Button transparent onClick={() => setShowSidebar(true)}>
              <Icon icon={List} /> Fields
            </Button>
          </Show>
          <Button onClick={() => mappingStore.saveTemplate(template())}>
            <Icon icon={Save} /> Save
          </Button>
          <Button borderTheme="error" transparent onClick={onReset}>
            Reset
          </Button>
          <Button onClick={onGenerate}>
            <Icon icon={PictureAsPdf} /> Generate
          </Button>
          <Button transparent onClick={() => setShowPreview(true)}>
            <Icon icon={Visibility} /> Preview
          </Button>
          <Button transparent onClick={() => setZoom((z) => clamp(+(z - 0.1).toFixed(2), 0.5, 2))}>−</Button>
          <Button transparent onClick={() => setZoom((z) => clamp(+(z + 0.1).toFixed(2), 0.5, 2))}>+</Button>
        </div>

        <div class={styles.editorRow}>
          <SheetCanvas
            activePage={activePage}
            template={template}
            zoom={zoom}
            values={values}
            selectedFieldKey={selectedFieldKey}
            onSelect={selectField}
            onEdit={selectField}
            onRemove={onRemove}
            selectedTable={selectedTable}
            onSelectTable={selectTable}
          />
          <Show when={!isMobile()}>
            <div class={styles.sidebar}>{sidebar()}</div>
          </Show>
        </div>

        <Show when={isMobile()}>
          <Modal title="Fields" show={[showSidebar, setShowSidebar]} width="94vw" height="80vh">
            {sidebar()}
          </Modal>
        </Show>

        <Modal title="Sheet preview" show={[showPreview, setShowPreview]} width="90vw" height="92vh">
          <Show when={showPreview()}>
            <SheetPreview
              values={values}
              template={template}
              activePage={activePage}
              spells={spellRows}
              featureLists={featureLists}
            />
          </Show>
        </Modal>

        <DragOverlay>
          {(active) => {
            const data = active?.data as DragData | undefined;
            if (!data) return null;
            // Field drags preview the field as it lands on the sheet; table-guide
            // drags keep the simple moving label.
            if (data.kind === 'palette' || data.kind === 'placed') {
              return <FieldDragPreview data={data} zoom={zoom} values={values} dragStart={dragStart} />;
            }
            return <div class={styles.dragChip}>{overlayLabel(data)}</div>;
          }}
        </DragOverlay>
      </DragDropProvider>
    </Body>
  );
};
