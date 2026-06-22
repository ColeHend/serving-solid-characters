import { AnyTableConfig, SpellTextCol } from '../../../shared/sheetMapping';

/**
 * Shared (non-component) support for the printed-table drag guides: the selection/
 * drag-payload types, the human labels, the column/marker order, and the small
 * geometry/tap helpers. Kept in a leaf module so the guide components
 * (`ColGuide`/`MarkerGuide`/`MoveHandle`/`TableGuidesOverlay`) and the shell/
 * inspector/sidebar can import it without an import cycle.
 */

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
export const COL_ORDER: Record<TableId, string[]> = {
  spell: ['level', 'name', 'castingTime', 'range'],
  attack: ['name', 'detail'],
};
export const MARKER_ORDER = ['concentration', 'ritual', 'material'] as const;

export const rowCount = (c: AnyTableConfig): number => ('rowsPerPage' in c ? c.rowsPerPage : c.maxRows);
export const colOf = (c: AnyTableConfig, key: string): SpellTextCol => (c.cols as Record<string, SpellTextCol>)[key];
export const partKey = (p: TablePart): string => (p.kind === 'move' ? 'move' : `${p.kind}:${p.key}`);

/** 4px tap-vs-drag tracker shared by every guide (mirrors PlacedChip). */
export function tapTracker(onTap: () => void) {
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
