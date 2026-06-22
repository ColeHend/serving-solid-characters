import { Component, For, JSX, Show, createMemo } from 'solid-js';
import { PlacedField, clamp, pdfToScreen } from '../../../shared/sheetMapping';
import styles from './characterCreatePDF.module.scss';

interface FeatureBoxOutlineProps {
  /** A `renderMode: 'featureList'` placement; `(x, y)` is the box top-left. */
  field: PlacedField;
  zoom: () => number;
}

/**
 * A non-interactive overlay that draws a `featureList` field's box rectangle and
 * its inter-column divider(s) on the mapping canvas — a true mirror of the region
 * `drawFeatureList` fills, so the user can see exactly where each column lands and
 * that species/feats fall inside their printed boxes. `pointer-events: none` so it
 * never blocks dragging/selecting the chip beneath it. Geometry mirrors
 * `layoutFeatureList`: `colW = (maxWidth - gap*(cols-1)) / cols`, columns flow
 * left→right from `field.x`; each divider sits in the CENTER of a column gap.
 */
export const FeatureBoxOutline: Component<FeatureBoxOutlineProps> = (props) => {
  const geom = createMemo(() => {
    const f = props.field;
    const z = props.zoom();
    const { left, top } = pdfToScreen(f.x, f.y, z); // box top-left (y = box top edge)
    const boxW = f.maxWidth ?? 270;
    const boxH = f.boxHeight ?? 120;
    const cols = clamp(Math.round(f.columns ?? 2), 1, 3);
    const gap = f.columnGap ?? 12;
    const colW = Math.max(1, (boxW - gap * (cols - 1)) / cols);
    // Divider i (1..cols-1) sits in the middle of the gap after column i-1, in points.
    const dividers = Array.from({ length: cols - 1 }, (_, i) => (colW * (i + 1) + gap * i + gap / 2) * z);
    return { left, top, width: boxW * z, height: boxH * z, dividers };
  });

  const boxStyle = (): JSX.CSSProperties => ({
    left: `${geom().left}px`,
    top: `${geom().top}px`,
    width: `${geom().width}px`,
    height: `${geom().height}px`,
  });

  return (
    <div class={styles.featureBox} style={boxStyle()} aria-hidden="true">
      <Show when={geom().dividers.length}>
        <For each={geom().dividers}>
          {(leftPx) => <div class={styles.featureBoxDivider} style={{ left: `${leftPx}px` }} />}
        </For>
      </Show>
    </div>
  );
};
