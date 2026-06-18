import { Component, For, Show, createMemo, createSignal, onCleanup, onMount } from 'solid-js';
import { useSearchParams } from '@solidjs/router';
import { Body, Button, Icon, Modal, Option, Select, TabBar, addSnackbar } from 'coles-solid-library';
import { DragDropProvider, DragOverlay, pointerWithin, type DefaultDataMap, type DragEndEvent } from '../../../shared/dnd';
import { characterManager } from '../../../shared';
import useExportFullStats from '../../../shared/customHooks/dndInfo/useGetFullStats';
import { EXAMPLE_CHARACTER } from '../../../shared/customHooks/dndInfo/useExampleChars';
import { Character } from '../../../models/character.model';
import {
  FIELD_LABELS,
  PAGE_COUNT,
  PlacedField,
  characterToSheetValues,
  clamp,
  mappingStore,
} from '../../../shared/sheetMapping';
import { generateSheetPdf } from '../../../shared/sheetMapping/pdf/generateSheetPdf';
import { DropGeometry, movedPlaced, placedAtCenter, placedFromPalette } from './placement';
import { FieldSidebar } from './fieldSidebar';
import { SheetCanvas } from './sheetCanvas';
import { SheetPreview } from './sheetPreview';
import styles from './characterCreatePDF.module.scss';

const TEMPLATE_ID = 'default';
type DragData = { kind: 'palette'; fieldKey: string } | { kind: 'placed'; field: PlacedField };
type PageData = { pageIndex: number; getRect: () => DOMRect };

function downloadPdf(bytes: Uint8Array, filename: string) {
  const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Defer revoke so the click's download has been initiated first.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Drag-and-drop character-sheet field mapper (the `/characters/pdfCreate` screen). */
export const CreateCharacterPDF: Component = () => {
  const [searchParams] = useSearchParams();
  // Reactive accessor onto the Dexie-backed store so async loads / new characters appear.
  const characters = characterManager.characters;

  // Match the rest of the site: the characters page background behind a themed surface.
  onMount(() => document.body.classList.add('character-create-bg'));
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
  const values = createMemo(() => characterToSheetValues(previewCharacter(), fullStats()));

  const [zoom, setZoom] = createSignal(1);
  const [activePage, setActivePage] = createSignal(0);
  const [selectedFieldKey, setSelectedFieldKey] = createSignal<string | null>(null);
  const [showPreview, setShowPreview] = createSignal(false);
  const [showSidebar, setShowSidebar] = createSignal(false); // mobile sidebar modal
  const [sidebarTab, setSidebarTab] = createSignal(0); // 0 = Add, 1 = Edit
  const [dragStart, setDragStart] = createSignal({ x: 0, y: 0 });

  const template = mappingStore.template;
  const placedKeys = () => new Set(template().fields.map((f) => f.fieldKey));
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
    setSelectedFieldKey(key);
    queueMicrotask(() => {
      setSidebarTab(1);
      if (openModal && isMobile()) setShowSidebar(true);
    });
  };
  const selectField = (key: string) => focusField(key, true);

  /** Tap-to-add (and desktop click): place at page center, or select if already placed. */
  const onAdd = (fieldKey: string) => {
    const existing = template().fields.find((f) => f.fieldKey === fieldKey);
    mappingStore.upsertField(TEMPLATE_ID, placedAtCenter(fieldKey, activePage(), existing));
    focusField(fieldKey, true);
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
    const field =
      data.kind === 'placed'
        ? movedPlaced(data.field, geometry)
        : placedFromPalette(data.fieldKey, template().fields.find((f) => f.fieldKey === data.fieldKey), geometry);
    mappingStore.upsertField(TEMPLATE_ID, field);
    // focusField defers the tab switch to a microtask, so it never restructures
    // the tree inside this drag-end flush. Drag never opens the mobile modal.
    focusField(field.fieldKey, false);
  };

  const onGenerate = async () => {
    const char = selectedCharacter() ?? previewCharacter();
    try {
      downloadPdf(await generateSheetPdf(values(), template()), char.name || 'character');
    } catch {
      addSnackbar({ message: 'Failed to generate sheet', severity: 'error' });
    }
  };

  const overlayLabel = (data: DragData | undefined) => {
    const key = data?.kind === 'placed' ? data.field.fieldKey : data?.fieldKey;
    return key ? FIELD_LABELS[key] ?? key : '';
  };

  const sidebar = () => (
    <FieldSidebar
      tab={sidebarTab}
      setTab={setSidebarTab}
      placedKeys={placedKeys}
      onGrab={(x, y) => setDragStart({ x, y })}
      onAdd={onAdd}
      field={selectedField}
      templateId={TEMPLATE_ID}
      onRemove={onRemove}
    />
  );

  return (
    <Body class={styles.page}>
      <DragDropProvider collisionDetection={pointerWithin} onDragEnd={onDragEnd}>
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
              <Icon name="list" /> Fields
            </Button>
          </Show>
          <Button onClick={() => mappingStore.saveTemplate(template())}>
            <Icon name="save" /> Save
          </Button>
          <Button borderTheme="error" transparent onClick={() => mappingStore.resetToDefault(TEMPLATE_ID)}>
            Reset
          </Button>
          <Button onClick={onGenerate}>
            <Icon name="picture_as_pdf" /> Generate
          </Button>
          <Button transparent onClick={() => setShowPreview(true)}>
            <Icon name="visibility" /> Preview
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
            <SheetPreview values={values} template={template} activePage={activePage} />
          </Show>
        </Modal>

        <DragOverlay>
          {(active) => (
            <Show when={active}>
              <div class={styles.dragChip}>{overlayLabel(active?.data as DragData | undefined)}</div>
            </Show>
          )}
        </DragOverlay>
      </DragDropProvider>
    </Body>
  );
};
