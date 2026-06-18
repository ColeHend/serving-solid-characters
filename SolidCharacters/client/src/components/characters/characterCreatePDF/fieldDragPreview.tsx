import { Component, JSX } from 'solid-js';
import { useDragDropContext } from '../../../shared/dnd';
import { DEFAULT_FONT_SIZE, FIELD_LABELS, PlacedField } from '../../../shared/sheetMapping';
import { DEFAULT_FIELD_COLOR } from './placement';
import styles from './characterCreatePDF.module.scss';

/** The two field-drag kinds this preview renders (table guides keep the label pill). */
export type FieldDragData = { kind: 'palette'; fieldKey: string } | { kind: 'placed'; field: PlacedField };

interface FieldDragPreviewProps {
  data: FieldDragData;
  zoom: () => number;
  values: () => Record<string, string>;
  /** Client pointer position captured at grab — anchors the palette preview at the drop point. */
  dragStart: () => { x: number; y: number };
}

/**
 * The moving drag image, rendered inside the engine's `DragOverlay` (a fixed
 * portal already positioned at `activeRect.topLeft + transform`). Instead of a
 * generic label pill it draws the field the way it lands on the sheet — the
 * resolved value in its color at on-sheet (zoom-scaled) size, baseline-anchored,
 * with a thin underline guide — so it's easy to line up with the printed blanks.
 *
 *  - `placed`: re-homing an existing chip; uses the field's own font/size/color
 *    and anchors at the source chip's baseline so it tracks 1:1.
 *  - `palette`: a brand-new field; uses the new-field defaults (10pt black) and
 *    anchors its baseline-left at the pointer (the exact point `placedFromPalette`
 *    maps to the field's baseline), so the preview shows precisely where text lands.
 */
export const FieldDragPreview: Component<FieldDragPreviewProps> = (props) => {
  const { state } = useDragDropContext();

  const fieldKey = () => (props.data.kind === 'placed' ? props.data.field.fieldKey : props.data.fieldKey);
  const value = () => props.values()[fieldKey()] ?? '';
  const isPlaceholder = () => value() === '';
  const display = () => (isPlaceholder() ? FIELD_LABELS[fieldKey()] ?? fieldKey() : value());
  const fontSize = () =>
    (props.data.kind === 'placed' ? props.data.field.fontSize : DEFAULT_FONT_SIZE) * props.zoom();
  const color = () => (props.data.kind === 'placed' ? props.data.field.color ?? DEFAULT_FIELD_COLOR : DEFAULT_FIELD_COLOR);

  // Offset (within the overlay div) that places the text's baseline-left where
  // the field will actually be drawn. The overlay div top-left already sits at
  // `activeRect.topLeft + delta`, so:
  //  - placed: baseline = box bottom → offset (0, rect.height).
  //  - palette: baseline = pointer → offset (dragStart - rect.topLeft).
  const offset = (): { x: number; y: number } => {
    const rect = state.activeRect();
    if (!rect) return { x: 0, y: 0 };
    if (props.data.kind === 'placed') return { x: 0, y: rect.height };
    const ds = props.dragStart();
    return { x: ds.x - rect.x, y: ds.y - rect.y };
  };

  const style = (): JSX.CSSProperties => {
    const o = offset();
    const s: JSX.CSSProperties = {
      left: `${o.x}px`,
      top: `${o.y}px`,
      color: color(),
      'font-size': `${fontSize()}px`,
    };
    if (props.data.kind === 'placed' && props.data.field.maxWidth) {
      s.width = `${props.data.field.maxWidth * props.zoom()}px`;
      s['white-space'] = 'normal';
    }
    return s;
  };

  return (
    <span class={styles.dragFieldPreview} classList={{ [styles.placeholder]: isPlaceholder() }} style={style()}>
      {display()}
    </span>
  );
};
