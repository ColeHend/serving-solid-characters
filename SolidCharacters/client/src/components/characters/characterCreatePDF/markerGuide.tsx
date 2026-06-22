import { Component, JSX } from 'solid-js';
import { createDraggable } from '../../../shared/dnd';
import { AnyTableConfig, SpellTableConfig } from '../../../shared/sheetMapping';
import { MARKER_LABELS, TableDragData, TableId, tapTracker } from './tableGuides.shared';
import styles from './characterCreatePDF.module.scss';

/** A checkbox marker: a thin vertical line at its CENTER x; drag to move. */
export const MarkerGuide: Component<{
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
