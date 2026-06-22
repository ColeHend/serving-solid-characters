import { Component, JSX } from 'solid-js';
import { createDraggable } from '../../../shared/dnd';
import { TableDragData, TableId, tapTracker } from './tableGuides.shared';
import styles from './characterCreatePDF.module.scss';

/** A grip bar across the table top; vertical drag moves the whole table. */
export const MoveHandle: Component<{
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
