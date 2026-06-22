import { Component, Show } from 'solid-js';
import { Container, Icon } from 'coles-solid-library';
import { DragIndicator } from 'coles-solid-library/icons';
import { createDraggable } from '../../../shared/dnd';
import { SheetFieldDef } from '../../../shared/sheetMapping';
import { paletteCardTap } from './paletteCardTap';
import styles from './characterCreatePDF.module.scss';

interface FieldCardProps {
  def: SheetFieldDef;
  /** True when this field is already on the sheet (rendered dimmed). */
  placed: boolean;
  /** Resolved sample value for the current character — shown as a preview pill. */
  value?: () => string;
  onGrab: (x: number, y: number) => void;
  /** Tap (no drag) → add the field at the page center (mobile-friendly). */
  onAdd: (fieldKey: string) => void;
}

/**
 * One field in the Add palette: a wide, full-width card with a drag handle, the
 * field label, a short description, and (when available) the field's sample
 * value. Dragging is restricted to the handle (`handleRef`); a tap anywhere on
 * the card adds the field at the page center. The drag itself is rendered by the
 * shell's `DragOverlay` (see `fieldDragPreview.tsx`), which previews the field as
 * it lands on the sheet.
 */
export const FieldCard: Component<FieldCardProps> = (props) => {
  const drag = createDraggable(() => ({
    id: `palette:${props.def.key}`,
    type: 'field',
    data: { kind: 'palette', fieldKey: props.def.key },
  }));
  const tap = paletteCardTap((x, y) => props.onGrab(x, y), () => props.onAdd(props.def.key));
  const sample = () => props.value?.() ?? '';

  return (
    <Container
      theme="surface"
      ref={drag.ref}
      class={styles.fieldCard}
      classList={{ [styles.placed]: props.placed, [styles.dragging]: drag.isActive() }}
      onPointerDown={tap.onPointerDown}
      onPointerUp={tap.onPointerUp}
    >
      <span ref={drag.handleRef} class={styles.fieldCardHandle} aria-label="Drag to place">
        <Icon icon={DragIndicator} />
      </span>
      <div class={styles.fieldCardText}>
        <div class={styles.fieldCardLabel}>{props.def.label}</div>
        <div class={styles.fieldCardDesc}>{props.def.description}</div>
      </div>
      <Show when={sample()}>
        <span class={styles.fieldCardValue} title="Sample value">
          {sample()}
        </span>
      </Show>
    </Container>
  );
};
