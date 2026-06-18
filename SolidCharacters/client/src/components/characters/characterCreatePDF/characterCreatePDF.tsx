import { Component, For, Show, createMemo, createSignal } from 'solid-js';
import { useSearchParams } from '@solidjs/router';
import { Body, Button, Icon, Option, Select, TabBar, addSnackbar } from 'coles-solid-library';
import { DragDropProvider, DragOverlay, pointerWithin, type DefaultDataMap, type DragEndEvent } from '../../../shared/dnd';
import { characterManager } from '../../../shared';
import useExportFullStats from '../../../shared/customHooks/dndInfo/useGetFullStats';
import { Character } from '../../../models/character.model';
import {
  FIELD_LABELS,
  PAGE_COUNT,
  PlacedField,
  characterToSheetValues,
  clamp,
  generateSheetPdf,
  mappingStore,
} from '../../../shared/sheetMapping';
import { DropGeometry, movedPlaced, placedFromPalette } from './placement';
import { FieldPalette } from './fieldPalette';
import { SheetCanvas } from './sheetCanvas';
import { PlacementConfigModal } from './placementConfigModal';
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
  URL.revokeObjectURL(url);
}

/** Drag-and-drop character-sheet field mapper (the `/characters/pdfCreate` screen). */
export const CreateCharacterPDF: Component = () => {
  const [searchParams] = useSearchParams();
  const [characters] = createSignal<Character[]>(characterManager.characters());

  const initialName = () => {
    const p = searchParams.name;
    return typeof p === 'string' ? p : Array.isArray(p) ? p[0] : undefined;
  };
  const [selectedName, setSelectedName] = createSignal<string | undefined>(initialName());

  // Memo so the Dexie-backed character store can resolve async without crashing.
  const selectedCharacter = createMemo<Character | undefined>(() => {
    const list = characters();
    if (!list.length) return undefined;
    return (selectedName() ? characterManager.getCharacter(selectedName()!) : undefined) ?? list[0];
  });

  // Effective stats + sheet values for the live preview, computed in owner context.
  const fullStats = useExportFullStats(() => selectedCharacter() as Character);
  const values = createMemo(() => characterToSheetValues(selectedCharacter(), fullStats()));

  const [zoom, setZoom] = createSignal(1);
  const [activePage, setActivePage] = createSignal(0);
  const [selectedFieldKey, setSelectedFieldKey] = createSignal<string | null>(null);
  const [showPreview, setShowPreview] = createSignal(true);
  const [showConfig, setShowConfig] = createSignal(false);
  const [dragStart, setDragStart] = createSignal({ x: 0, y: 0 });

  const template = mappingStore.template;
  const placedKeys = () => new Set(template().fields.map((f) => f.fieldKey));
  const selectedField = createMemo(() => template().fields.find((f) => f.fieldKey === selectedFieldKey()) ?? null);

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
    setSelectedFieldKey(field.fieldKey);
  };

  const onGenerate = async () => {
    const char = selectedCharacter();
    if (!char) {
      addSnackbar({ message: 'No character selected', severity: 'warning' });
      return;
    }
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

  return (
    <Body>
      <DragDropProvider collisionDetection={pointerWithin} onDragEnd={onDragEnd}>
        <div class={styles.toolbar}>
          <Show when={characters().length} fallback={<span>No characters yet — create one first.</span>}>
            <Select value={selectedName() ?? characters()[0]?.name} onChange={(n: string) => setSelectedName(n)}>
              <For each={characters()}>{(c) => <Option value={c.name}>{c.name}</Option>}</For>
            </Select>
          </Show>
          <TabBar
            tabs={Array.from({ length: PAGE_COUNT }, (_, i) => `Page ${i + 1}`)}
            activeTab={activePage()}
            onTabChange={(_l, i) => setActivePage(i)}
          />
          <Button onClick={() => mappingStore.saveTemplate(template())}>Save</Button>
          <Button borderTheme="error" transparent onClick={() => mappingStore.resetToDefault(TEMPLATE_ID)}>
            Reset
          </Button>
          <Button onClick={onGenerate}>
            <Icon name="picture_as_pdf" /> Generate
          </Button>
          <Button transparent onClick={() => setShowPreview((p) => !p)}>
            <Icon name="visibility" /> Preview
          </Button>
          <Button transparent onClick={() => setZoom((z) => clamp(+(z - 0.1).toFixed(2), 0.5, 2))}>−</Button>
          <Button transparent onClick={() => setZoom((z) => clamp(+(z + 0.1).toFixed(2), 0.5, 2))}>+</Button>
        </div>
        <div class={styles.editorRow}>
          <FieldPalette placedKeys={placedKeys} onGrab={(x, y) => setDragStart({ x, y })} />
          <SheetCanvas
            activePage={activePage}
            template={template}
            zoom={zoom}
            selectedFieldKey={selectedFieldKey}
            onSelect={setSelectedFieldKey}
            onEdit={(key) => {
              setSelectedFieldKey(key);
              setShowConfig(true);
            }}
            onRemove={(key) => mappingStore.removeField(TEMPLATE_ID, key)}
          />
          <Show when={showPreview()}>
            <SheetPreview values={values} template={template} activePage={activePage} />
          </Show>
        </div>
        <DragOverlay>
          {(active) => (
            <Show when={active}>
              <div class={styles.dragChip}>{overlayLabel(active?.data as DragData | undefined)}</div>
            </Show>
          )}
        </DragOverlay>

        <PlacementConfigModal show={[showConfig, setShowConfig]} field={selectedField} templateId={TEMPLATE_ID} />
      </DragDropProvider>
    </Body>
  );
};
