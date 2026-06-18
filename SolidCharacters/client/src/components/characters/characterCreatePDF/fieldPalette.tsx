import { Component, For, createMemo } from 'solid-js';
import { Chip, ExpansionPanel } from 'coles-solid-library';
import { createDraggable } from '../../../shared/dnd';
import { SHEET_FIELD_DEFS, SheetFieldDef, SheetFieldGroup } from '../../../shared/sheetMapping';
import styles from './characterCreatePDF.module.scss';

// Pointer travel (px) below which a press counts as a tap, not a drag. Matches the
// pointer sensor's 4px activation distance so a tap never also starts a drag.
const TAP_THRESHOLD = 4;

interface PaletteChipProps {
  def: SheetFieldDef;
  placed: boolean;
  onGrab: (x: number, y: number) => void;
  /** Tap (no drag) → add the field at the page center (mobile-friendly). */
  onAdd: (fieldKey: string) => void;
}

const PaletteChip: Component<PaletteChipProps> = (props) => {
  const drag = createDraggable(() => ({
    id: `palette:${props.def.key}`,
    type: 'field',
    data: { kind: 'palette', fieldKey: props.def.key },
  }));
  let downX = 0;
  let downY = 0;
  let downId = -1;
  return (
    <div
      ref={drag.ref}
      class={styles.paletteChip}
      classList={{ [styles.placed]: props.placed, [styles.dragging]: drag.isActive() }}
      onPointerDown={(e) => {
        props.onGrab(e.clientX, e.clientY);
        downX = e.clientX;
        downY = e.clientY;
        downId = e.pointerId;
      }}
      onPointerUp={(e) => {
        if (e.pointerId !== downId) return;
        const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
        downId = -1;
        if (moved < TAP_THRESHOLD) props.onAdd(props.def.key); // tap, not a drag
      }}
    >
      <Chip value={props.def.label} />
    </div>
  );
};

interface FieldPaletteProps {
  /** Keys already placed on the sheet (rendered dimmed in the palette). */
  placedKeys: () => Set<string>;
  onGrab: (x: number, y: number) => void;
  onAdd: (fieldKey: string) => void;
}

/** Drag-source list of every bindable field, grouped into collapsible panels. */
export const FieldPalette: Component<FieldPaletteProps> = (props) => {
  const groups = createMemo<[SheetFieldGroup, SheetFieldDef[]][]>(() => {
    const map = new Map<SheetFieldGroup, SheetFieldDef[]>();
    for (const def of SHEET_FIELD_DEFS) {
      const list = map.get(def.group) ?? [];
      list.push(def);
      map.set(def.group, list);
    }
    return [...map.entries()];
  });

  return (
    <div class={styles.palette}>
      <For each={groups()}>
        {([group, defs]) => (
          <ExpansionPanel>
            <div class={styles.paletteHeader}>{group}</div>
            <div class={styles.paletteBody}>
              <For each={defs}>
                {(def) => (
                  <PaletteChip
                    def={def}
                    placed={props.placedKeys().has(def.key)}
                    onGrab={props.onGrab}
                    onAdd={props.onAdd}
                  />
                )}
              </For>
            </div>
          </ExpansionPanel>
        )}
      </For>
    </div>
  );
};
