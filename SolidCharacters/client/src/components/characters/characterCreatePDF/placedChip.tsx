import { Component, createMemo } from 'solid-js';
import { Chip } from 'coles-solid-library';
import { createDraggable } from '../../../shared/dnd';
import { FIELD_LABELS, PlacedField, pdfToScreen } from '../../../shared/sheetMapping';
import styles from './characterCreatePDF.module.scss';

interface PlacedChipProps {
  field: PlacedField;
  zoom: () => number;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

/**
 * A single placed field, baseline-anchored on the page overlay. The chip's
 * bottom-left sits at `pdfToScreen(x, y)` (CSS `translateY(-100%)`) so its
 * on-screen baseline matches `drawText` in the generated PDF. Re-draggable;
 * the engine's `DragOverlay` shows the moving preview while this stays put.
 */
export const PlacedChip: Component<PlacedChipProps> = (props) => {
  const drag = createDraggable(() => ({
    id: `placed:${props.field.fieldKey}`,
    type: 'field',
    data: { kind: 'placed', field: props.field },
  }));

  const pos = createMemo(() => pdfToScreen(props.field.x, props.field.y, props.zoom()));
  const label = () => FIELD_LABELS[props.field.fieldKey] ?? props.field.fieldKey;

  return (
    <div
      ref={drag.ref}
      class={styles.placedChip}
      classList={{ [styles.selected]: props.selected, [styles.dragging]: drag.isActive() }}
      style={{ left: `${pos().left}px`, top: `${pos().top}px` }}
      tabindex="0"
      role="button"
      aria-label={`${label()} placement`}
      onClick={(e) => {
        e.stopPropagation();
        props.onSelect();
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
      <Chip value={label()} remove={() => props.onRemove()} />
    </div>
  );
};
