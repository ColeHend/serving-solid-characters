import { Component, For, Show, createMemo } from 'solid-js';
import { createDroppable } from '../../../shared/dnd';
import { PDF_PAGE_H, PDF_PAGE_W, PlacedField, SheetTemplate } from '../../../shared/sheetMapping';
import { PlacedChip } from './placedChip';
import { FeatureBoxOutline } from './featureBoxOutline';
import { TableGuidesOverlay } from './tableGuidesOverlay';
import { TableSelection } from './tableGuides.shared';
import sheet1 from '../../../assets/sheet/sheet-1.png';
import sheet2 from '../../../assets/sheet/sheet-2.png';
import styles from './characterCreatePDF.module.scss';

const PAGE_IMAGES = [sheet1, sheet2];
// width 0 → `scaleFromRect` falls back to the caller's `fallbackScale` (zoom) when
// the overlay hasn't been measured yet (drop before first paint).
const FALLBACK_RECT = { left: 0, top: 0, width: 0, height: 0 } as DOMRect;

interface SheetCanvasProps {
  activePage: () => number;
  template: () => SheetTemplate;
  zoom: () => number;
  /** Resolved character → sheet values, so chips can show sample/real text. */
  values?: () => Record<string, string>;
  selectedFieldKey: () => string | null;
  onSelect: (key: string) => void;
  onEdit: (key: string) => void;
  onRemove: (key: string) => void;
  /** Current table-guide selection (mutually exclusive with `selectedFieldKey`). */
  selectedTable: () => TableSelection | null;
  onSelectTable: (sel: TableSelection) => void;
}

/**
 * The drag backdrop: the active page PNG behind a full-page droppable overlay.
 * The overlay's measured rect (exposed via the droppable `data.getRect`) is the
 * single source of `scale` for the shell's `screenToPdf` flip on drop.
 */
export const SheetCanvas: Component<SheetCanvasProps> = (props) => {
  let overlayEl: HTMLDivElement | undefined;

  const drop = createDroppable(() => ({
    id: `page:${props.activePage()}`,
    type: 'page',
    data: {
      pageIndex: props.activePage(),
      getRect: () => (overlayEl ? overlayEl.getBoundingClientRect() : FALLBACK_RECT),
    },
  }));

  const pageFields = createMemo<PlacedField[]>(() =>
    props.template().fields.filter((f) => f.pageIndex === props.activePage()),
  );
  const size = createMemo(() => ({ w: PDF_PAGE_W * props.zoom(), h: PDF_PAGE_H * props.zoom() }));

  return (
    <div class={styles.canvasScroll}>
      <div class={styles.canvas} style={{ width: `${size().w}px`, height: `${size().h}px` }}>
        <img
          class={styles.pageImg}
          src={PAGE_IMAGES[props.activePage()] ?? PAGE_IMAGES[0]}
          alt={`Character sheet page ${props.activePage() + 1}`}
          draggable={false}
        />
        <div
          ref={(el) => {
            overlayEl = el;
            drop.ref(el);
          }}
          class={styles.overlay}
          classList={{ [styles.over]: drop.isOver() }}
        >
          {/* Table guides render BEFORE the chips so field chips paint on top. */}
          <Show when={props.activePage() === 1 && props.template().spellTable}>
            {(cfg) => (
              <TableGuidesOverlay
                table="spell"
                cfg={cfg}
                zoom={props.zoom}
                selected={props.selectedTable}
                onSelect={props.onSelectTable}
              />
            )}
          </Show>
          <Show when={props.activePage() === 0 && props.template().attackCantripTable}>
            {(cfg) => (
              <TableGuidesOverlay
                table="attack"
                cfg={cfg}
                zoom={props.zoom}
                selected={props.selectedTable}
                onSelect={props.onSelectTable}
              />
            )}
          </Show>
          {/* Feature-box outlines + column dividers render BEFORE the chips so the
              chips (and their drag targets) paint on top. Non-interactive guides. */}
          <For each={pageFields().filter((f) => f.renderMode === 'featureList')}>
            {(field) => <FeatureBoxOutline field={field} zoom={props.zoom} />}
          </For>
          <For each={pageFields()}>
            {(field) => (
              <PlacedChip
                field={field}
                zoom={props.zoom}
                value={() => props.values?.()[field.fieldKey] ?? ''}
                selected={props.selectedFieldKey() === field.fieldKey}
                onSelect={() => props.onSelect(field.fieldKey)}
                onEdit={() => props.onEdit(field.fieldKey)}
                onRemove={() => props.onRemove(field.fieldKey)}
              />
            )}
          </For>
        </div>
      </div>
    </div>
  );
};
