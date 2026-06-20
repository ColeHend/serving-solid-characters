import { Component, For, Show, createMemo } from 'solid-js';
import { AnyTableConfig } from '../../../shared/sheetMapping';
import { ColGuide } from './colGuide';
import { MarkerGuide } from './markerGuide';
import { MoveHandle } from './moveHandle';
import { COL_ORDER, MARKER_ORDER, TableId, TableSelection, colOf, partKey, rowCount } from './tableGuides.shared';

interface OverlayProps {
  table: TableId;
  cfg: () => AnyTableConfig;
  zoom: () => number;
  selected: () => TableSelection | null;
  onSelect: (sel: TableSelection) => void;
}

/**
 * Visualizes one printed table's column / marker geometry as draggable guides on
 * the mapping canvas. Columns drag horizontally (right edge resizes width),
 * markers drag horizontally, and a top grip drags the whole table vertically.
 * All edits flow back to the shell's `onSelect` + drag-end handler, which writes
 * the persisted `spellTable` / `attackCantripTable` config. The individual guides
 * live in `colGuide.tsx` / `markerGuide.tsx` / `moveHandle.tsx`; shared types and
 * helpers live in `tableGuides.shared.ts`.
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
