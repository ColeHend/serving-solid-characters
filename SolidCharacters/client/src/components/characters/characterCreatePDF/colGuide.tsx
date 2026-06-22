import { Component, JSX } from 'solid-js';
import { createDraggable } from '../../../shared/dnd';
import { AnyTableConfig } from '../../../shared/sheetMapping';
import { COL_LABELS, TableDragData, TableId, colOf, tapTracker } from './tableGuides.shared';
import styles from './characterCreatePDF.module.scss';

/** A left-anchored text column: drag the box to move x, the right edge to resize width. */
export const ColGuide: Component<{
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
