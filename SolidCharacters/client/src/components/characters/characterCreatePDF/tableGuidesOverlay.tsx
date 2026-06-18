import { Component, For, JSX, Show, createMemo } from 'solid-js';
import { createDraggable } from '../../../shared/dnd';
import { AttackCantripConfig, SpellTableConfig, SpellTextCol } from '../../../shared/sheetMapping';
import styles from './characterCreatePDF.module.scss';

/** Which printed table a guide belongs to. */
export type TableId = 'spell' | 'attack';

/** A specific draggable/selectable part of a table. */
export type TablePart =
  | { kind: 'col'; key: string }
  | { kind: 'marker'; key: string }
  | { kind: 'move' };

/** The shell's current table selection (mutually exclusive with field selection). */
export interface TableSelection {
  table: TableId;
  part: TablePart;
}

/** Drag payloads emitted by the guides; merged into the shell's `DragData` union. */
export type TableDragData =
  | { kind: 'tableCol'; table: TableId; col: string }
  | { kind: 'tableColResize'; table: TableId; col: string }
  | { kind: 'tableMarker'; table: TableId; marker: string }
  | { kind: 'tableMove'; table: TableId };

export const COL_LABELS: Record<string, string> = {
  level: 'Level',
  name: 'Name',
  castingTime: 'Casting Time',
  range: 'Range',
  detail: 'Detail',
};
export const MARKER_LABELS: Record<string, string> = {
  concentration: 'Conc.',
  ritual: 'Ritual',
  material: 'Material',
};
/** Full marker names for the inspector title (the canvas uses the short forms above). */
export const MARKER_FULL_LABELS: Record<string, string> = {
  concentration: 'Concentration',
  ritual: 'Ritual',
  material: 'Material',
};
/** Stable column order per table (object key order, made explicit). */
const COL_ORDER: Record<TableId, string[]> = {
  spell: ['level', 'name', 'castingTime', 'range'],
  attack: ['name', 'detail'],
};
const MARKER_ORDER = ['concentration', 'ritual', 'material'] as const;

type AnyTableConfig = SpellTableConfig | AttackCantripConfig;
const rowCount = (c: AnyTableConfig): number => ('rowsPerPage' in c ? c.rowsPerPage : c.maxRows);
const colOf = (c: AnyTableConfig, key: string): SpellTextCol => (c.cols as Record<string, SpellTextCol>)[key];
const partKey = (p: TablePart): string => (p.kind === 'move' ? 'move' : `${p.kind}:${p.key}`);

interface OverlayProps {
  table: TableId;
  cfg: () => AnyTableConfig;
  zoom: () => number;
  selected: () => TableSelection | null;
  onSelect: (sel: TableSelection) => void;
}

/** 4px tap-vs-drag tracker shared by every guide (mirrors PlacedChip). */
function tapTracker(onTap: () => void) {
  const down = { x: 0, y: 0, id: -1 };
  return {
    onPointerDown(e: PointerEvent) {
      down.x = e.clientX;
      down.y = e.clientY;
      down.id = e.pointerId;
    },
    onPointerUp(e: PointerEvent) {
      if (e.pointerId !== down.id) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down.id = -1;
      if (moved < 4) onTap();
    },
  };
}

/** A left-anchored text column: drag the box to move x, the right edge to resize width. */
const ColGuide: Component<{
  table: TableId;
  col: string;
  cfg: () => AnyTableConfig;
  zoom: () => number;
  extent: () => { top: number; height: number };
  selected: boolean;
  onSelect: () => void;
}> = (p) => {
  const drag = createDraggable(() => ({
    id: `${p.table}:col:${p.col}`,
    type: 'table',
    data: { kind: 'tableCol', table: p.table, col: p.col } as TableDragData,
  }));
  const resize = createDraggable(() => ({
    id: `${p.table}:colResize:${p.col}`,
    type: 'table',
    data: { kind: 'tableColResize', table: p.table, col: p.col } as TableDragData,
  }));
  const tap = tapTracker(() => p.onSelect());
  const style = (): JSX.CSSProperties => {
    const c = colOf(p.cfg(), p.col);
    const z = p.zoom();
    const e = p.extent();
    return { left: `${c.x * z}px`, top: `${e.top}px`, width: `${c.maxWidth * z}px`, height: `${e.height}px` };
  };
  return (
    <div
      ref={drag.ref}
      class={styles.tableColGuide}
      classList={{ [styles.selected]: p.selected, [styles.dragging]: drag.isActive() }}
      style={style()}
      role="button"
      aria-label={`${COL_LABELS[p.col] ?? p.col} column`}
      onPointerDown={tap.onPointerDown}
      onPointerUp={tap.onPointerUp}
    >
      <span class={styles.tableGuideLabel}>{COL_LABELS[p.col] ?? p.col}</span>
      <div
        ref={resize.ref}
        class={styles.tableColResizeHandle}
        classList={{ [styles.dragging]: resize.isActive() }}
        title="Drag to resize width"
        // Keep the parent column-move drag (and tap-select) from also firing.
        onPointerDown={(e) => e.stopPropagation()}
      />
    </div>
  );
};

/** A checkbox marker: a thin vertical line at its CENTER x; drag to move. */
const MarkerGuide: Component<{
  table: TableId;
  marker: string;
  cfg: () => AnyTableConfig;
  zoom: () => number;
  extent: () => { top: number; height: number };
  selected: boolean;
  onSelect: () => void;
}> = (p) => {
  const drag = createDraggable(() => ({
    id: `${p.table}:marker:${p.marker}`,
    type: 'table',
    data: { kind: 'tableMarker', table: p.table, marker: p.marker } as TableDragData,
  }));
  const tap = tapTracker(() => p.onSelect());
  const style = (): JSX.CSSProperties => {
    const c = p.cfg() as SpellTableConfig;
    const m = c.markers[p.marker as 'concentration' | 'ritual' | 'material'];
    const z = p.zoom();
    const e = p.extent();
    return { left: `${m.x * z}px`, top: `${e.top}px`, height: `${e.height}px` };
  };
  return (
    <div
      ref={drag.ref}
      class={styles.tableMarkerGuide}
      classList={{ [styles.selected]: p.selected, [styles.dragging]: drag.isActive() }}
      style={style()}
      role="button"
      aria-label={`${MARKER_LABELS[p.marker] ?? p.marker} marker`}
      onPointerDown={tap.onPointerDown}
      onPointerUp={tap.onPointerUp}
    >
      <span class={styles.tableMarkerLabel}>{MARKER_LABELS[p.marker] ?? p.marker}</span>
    </div>
  );
};

/** A grip bar across the table top; vertical drag moves the whole table. */
const MoveHandle: Component<{
  table: TableId;
  span: () => { left: number; width: number };
  top: () => number;
  selected: boolean;
  onSelect: () => void;
}> = (p) => {
  const drag = createDraggable(() => ({
    id: `${p.table}:move`,
    type: 'table',
    data: { kind: 'tableMove', table: p.table } as TableDragData,
  }));
  const tap = tapTracker(() => p.onSelect());
  const style = (): JSX.CSSProperties => ({
    left: `${p.span().left}px`,
    top: `${p.top()}px`,
    width: `${p.span().width}px`,
  });
  return (
    <div
      ref={drag.ref}
      class={styles.tableMoveHandle}
      classList={{ [styles.selected]: p.selected, [styles.dragging]: drag.isActive() }}
      style={style()}
      role="button"
      aria-label="Move table vertically"
      title="Drag up/down to move the whole table"
      onPointerDown={tap.onPointerDown}
      onPointerUp={tap.onPointerUp}
    >
      <span class={styles.tableMoveLabel}>⠿ move</span>
    </div>
  );
};

/**
 * Visualizes one printed table's column / marker geometry as draggable guides on
 * the mapping canvas. Columns drag horizontally (right edge resizes width),
 * markers drag horizontally, and a top grip drags the whole table vertically.
 * All edits flow back to the shell's `onSelect` + drag-end handler, which writes
 * the persisted `spellTable` / `attackCantripTable` config.
 */
export const TableGuidesOverlay: Component<OverlayProps> = (props) => {
  // Vertical extent in screen px, derived in TOP-DOWN points (no flip needed —
  // `firstRowTopFromTop` is already measured from the page top, so px = pt*zoom).
  const extent = createMemo(() => {
    const c = props.cfg();
    const z = props.zoom();
    const pad = c.rowPitch * 0.5;
    const top = (c.firstRowTopFromTop - pad) * z;
    const height = (c.rowPitch * (rowCount(c) - 1) + 2 * pad) * z;
    return { top, height: Math.max(height, 0) };
  });
  const moveTop = () => extent().top - 14;
  const span = createMemo(() => {
    const c = props.cfg();
    const z = props.zoom();
    let left = Infinity;
    let right = -Infinity;
    for (const key of COL_ORDER[props.table]) {
      const col = colOf(c, key);
      left = Math.min(left, col.x);
      right = Math.max(right, col.x + col.maxWidth);
    }
    if ('markers' in c) {
      for (const m of MARKER_ORDER) {
        left = Math.min(left, c.markers[m].x);
        right = Math.max(right, c.markers[m].x);
      }
    }
    return { left: left * z, width: (right - left) * z };
  });

  const selectedPartKey = () => {
    const s = props.selected();
    return s && s.table === props.table ? partKey(s.part) : null;
  };
  const markers = () => ('markers' in props.cfg() ? MARKER_ORDER : []);

  return (
    <>
      <MoveHandle
        table={props.table}
        span={span}
        top={moveTop}
        selected={selectedPartKey() === 'move'}
        onSelect={() => props.onSelect({ table: props.table, part: { kind: 'move' } })}
      />
      <For each={COL_ORDER[props.table]}>
        {(col) => (
          <ColGuide
            table={props.table}
            col={col}
            cfg={props.cfg}
            zoom={props.zoom}
            extent={extent}
            selected={selectedPartKey() === `col:${col}`}
            onSelect={() => props.onSelect({ table: props.table, part: { kind: 'col', key: col } })}
          />
        )}
      </For>
      <Show when={markers().length}>
        <For each={markers()}>
          {(marker) => (
            <MarkerGuide
              table={props.table}
              marker={marker}
              cfg={props.cfg}
              zoom={props.zoom}
              extent={extent}
              selected={selectedPartKey() === `marker:${marker}`}
              onSelect={() => props.onSelect({ table: props.table, part: { kind: 'marker', key: marker } })}
            />
          )}
        </For>
      </Show>
    </>
  );
};
