import { Component } from 'solid-js';
import { Container, Icon } from 'coles-solid-library';
import { DragIndicator } from 'coles-solid-library/icons';
import { createDraggable } from '../../../shared/dnd';
import { STATIC_FIELD_LABEL } from '../../../shared/sheetMapping';
import { paletteCardTap } from './paletteCardTap';
import styles from './characterCreatePDF.module.scss';

interface StaticFieldCardProps {
  onGrab: (x: number, y: number) => void;
  /** Tap (no drag) → add a fresh static-text field at the page center. */
  onAdd: () => void;
}

/**
 * The Add palette's "Static Text" entry. Unlike a `FieldCard` it binds to no
 * character field — each drag/tap mints a brand-new `static:<id>` placement (drag
 * data `{ kind: 'staticPalette' }`), so several independent labels can coexist.
 */
export const StaticFieldCard: Component<StaticFieldCardProps> = (props) => {
  const drag = createDraggable(() => ({
    id: 'palette:static',
    type: 'field',
    data: { kind: 'staticPalette' },
  }));
  const tap = paletteCardTap((x, y) => props.onGrab(x, y), () => props.onAdd());

  return (
    <Container
      theme="surface"
      ref={drag.ref}
      class={styles.fieldCard}
      classList={{ [styles.dragging]: drag.isActive() }}
      onPointerDown={tap.onPointerDown}
      onPointerUp={tap.onPointerUp}
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
