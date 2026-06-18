import { Component, createMemo, JSX } from 'solid-js';
import { createDraggable } from '../../../shared/dnd';
import { FIELD_LABELS, PlacedField, pdfToScreen } from '../../../shared/sheetMapping';
import { DEFAULT_FIELD_COLOR } from './placement';
import styles from './characterCreatePDF.module.scss';

interface PlacedChipProps {
  field: PlacedField;
  zoom: () => number;
  /** Resolved sheet value for this field (sample/real). Empty → label placeholder. */
  value?: () => string;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

/**
 * A single placed field, baseline-anchored on the page overlay. The chip's
 * bottom-left sits at `pdfToScreen(x, y)` (CSS `translateY(-100%)`) so its
 * on-screen baseline matches `drawText` in the generated PDF. It renders the
 * field's resolved VALUE in its chosen color and (zoom-scaled) font size — a
 * WYSIWYG preview — falling back to the field label (dimmed) when the value is
 * empty so the chip stays visible and grabbable. Re-draggable; the engine's
 * `DragOverlay` shows the moving preview while this stays put.
 */
export const PlacedChip: Component<PlacedChipProps> = (props) => {
  const drag = createDraggable(() => ({
    id: `placed:${props.field.fieldKey}`,
    type: 'field',
    data: { kind: 'placed', field: props.field },
  }));

  // Tap vs. drag discrimination (matches the pointer sensor's 4px activation):
  // a press that moves < 4px is a tap → select; a real drag never selects (so it
  // never opens the mobile inspector modal mid-move). Mutable object so the
  // prefer-const autofix can't break the reassignments.
  const down = { x: 0, y: 0, id: -1 };

  const pos = createMemo(() => pdfToScreen(props.field.x, props.field.y, props.zoom()));
  const label = () => FIELD_LABELS[props.field.fieldKey] ?? props.field.fieldKey;
  const value = () => props.value?.() ?? '';
  const isPlaceholder = () => value() === '';
  const display = () => (isPlaceholder() ? label() : value());

  const style = (): JSX.CSSProperties => {
    const s: JSX.CSSProperties = {
      left: `${pos().left}px`,
      top: `${pos().top}px`,
      color: props.field.color ?? DEFAULT_FIELD_COLOR,
      'font-size': `${props.field.fontSize * props.zoom()}px`,
    };
    if (props.field.maxWidth) {
      s.width = `${props.field.maxWidth * props.zoom()}px`;
      s['white-space'] = 'normal';
    }
    return s;
  };

  return (
    <div
      ref={drag.ref}
      class={styles.placedChip}
      classList={{
        [styles.selected]: props.selected,
        [styles.dragging]: drag.isActive(),
        [styles.placeholder]: isPlaceholder(),
      }}
      style={style()}
      tabindex="0"
      role="button"
      aria-label={`${label()} placement`}
      onPointerDown={(e) => {
        down.x = e.clientX;
        down.y = e.clientY;
        down.id = e.pointerId;
      }}
      onPointerUp={(e) => {
        if (e.pointerId !== down.id) return;
        const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
        down.id = -1;
        if (moved < 4) props.onSelect(); // tap, not a drag
      }}
      onDblClick={(e) => {
        e.stopPropagation();
        props.onEdit();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          props.onRemove();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          props.onEdit();
        }
      }}
    >
      <span class={styles.placedChipText}>{display()}</span>
      <button
        class={styles.placedChipRemove}
        aria-label={`Remove ${label()}`}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          props.onRemove();
        }}
      >
        ×
      </button>
    </div>
  );
};
