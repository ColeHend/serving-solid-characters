import { Component, Show } from 'solid-js';
import { Container, Icon } from 'coles-solid-library';
import { DragIndicator } from 'coles-solid-library/icons';
import { createDraggable } from '../../../shared/dnd';
import { SheetFieldDef, STATIC_FIELD_LABEL } from '../../../shared/sheetMapping';
import styles from './characterCreatePDF.module.scss';

// Pointer travel (px) below which a press counts as a tap, not a drag. Matches the
// pointer sensor's 4px activation distance so a tap never also starts a drag.
const TAP_THRESHOLD = 4;

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
  // Mutable object so the prefer-const autofix can't break the reassignments.
  const down = { x: 0, y: 0, id: -1 };
  const sample = () => props.value?.() ?? '';

  return (
    <Container
      theme="surface"
      ref={drag.ref}
      class={styles.fieldCard}
      classList={{ [styles.placed]: props.placed, [styles.dragging]: drag.isActive() }}
      onPointerDown={(e: PointerEvent) => {
        props.onGrab(e.clientX, e.clientY);
        down.x = e.clientX;
        down.y = e.clientY;
        down.id = e.pointerId;
      }}
      onPointerUp={(e: PointerEvent) => {
        if (e.pointerId !== down.id) return;
        const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
        down.id = -1;
        if (moved < TAP_THRESHOLD) props.onAdd(props.def.key); // tap, not a drag
      }}
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

interface StaticFieldCardProps {
  onGrab: (x: number, y: number) => void;
  /** Tap (no drag) → add a fresh static-text field at the page center. */
  onAdd: () => void;
}

/**
 * The Add palette's "Static Text" entry. Unlike a {@link FieldCard} it binds to no
 * character field — each drag/tap mints a brand-new `static:<id>` placement (drag
 * data `{ kind: 'staticPalette' }`), so several independent labels can coexist.
 */
export const StaticFieldCard: Component<StaticFieldCardProps> = (props) => {
  const drag = createDraggable(() => ({
    id: 'palette:static',
    type: 'field',
    data: { kind: 'staticPalette' },
  }));
  const down = { x: 0, y: 0, id: -1 };

  return (
    <Container
      theme="surface"
      ref={drag.ref}
      class={styles.fieldCard}
      classList={{ [styles.dragging]: drag.isActive() }}
      onPointerDown={(e: PointerEvent) => {
        props.onGrab(e.clientX, e.clientY);
        down.x = e.clientX;
        down.y = e.clientY;
        down.id = e.pointerId;
      }}
      onPointerUp={(e: PointerEvent) => {
        if (e.pointerId !== down.id) return;
        const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
        down.id = -1;
        if (moved < TAP_THRESHOLD) props.onAdd(); // tap, not a drag
      }}
    >
      <span ref={drag.handleRef} class={styles.fieldCardHandle} aria-label="Drag to place">
        <Icon icon={DragIndicator} />
      </span>
      <div class={styles.fieldCardText}>
        <div class={styles.fieldCardLabel}>{STATIC_FIELD_LABEL}</div>
        <div class={styles.fieldCardDesc}>Custom title/label text you type in.</div>
      </div>
    </Container>
  );
};
