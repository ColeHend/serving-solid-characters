import { Component, Show } from 'solid-js';
import { Button, Checkbox, Icon, Input, Option, Select } from 'coles-solid-library';
import { Delete, KeyboardArrowDown, KeyboardArrowLeft, KeyboardArrowRight, KeyboardArrowUp } from 'coles-solid-library/icons';
import {
  FIELD_LABELS,
  PAGE_COUNT,
  PDF_PAGE_H,
  PDF_PAGE_W,
  PlacedField,
  STATIC_FIELD_LABEL,
  SheetFontName,
  TextAlign,
  clamp,
  mappingStore,
  toNum,
} from '../../../shared/sheetMapping';
import { DEFAULT_FIELD_COLOR } from './placement';
import styles from './characterCreatePDF.module.scss';

interface FieldInspectorProps {
  /** The currently-selected placement, or null when nothing is selected. */
  field: () => PlacedField | null;
  templateId: string;
  /** Remove the selected field from the sheet. */
  onRemove: (key: string) => void;
}

/**
 * Docked metadata editor for the selected placement (replaces the old
 * double-click `PlacementConfigModal`). Always-editable numeric X/Y plus nudge
 * arrows are the drag-and-drop / touch accessibility fallback; the color picker
 * drives both the canvas chip and the generated-PDF text color. Every change
 * goes straight to `mappingStore.upsertField`.
 */
export const FieldInspector: Component<FieldInspectorProps> = (props) => {
  const update = (patch: Partial<PlacedField>) => {
    const current = props.field();
    if (!current) return;
    mappingStore.upsertField(props.templateId, { ...current, ...patch });
  };

  // Nudge by points; hold Shift for a coarse 10pt step. Up = +y (PDF bottom-left origin).
  const nudge = (dx: number, dy: number, shift: boolean) => {
    const f = props.field();
    if (!f) return;
    const step = shift ? 10 : 1;
    update({
      x: clamp(f.x + dx * step, 0, PDF_PAGE_W),
      y: clamp(f.y + dy * step, 0, PDF_PAGE_H),
    });
  };

  return (
    <Show
      when={props.field()}
      fallback={<div class={styles.inspectorEmpty}>Select a field on the sheet, or add one from the Add tab.</div>}
    >
      {(field) => (
        <div class={styles.inspector}>
          <div class={styles.inspectorTitle}>
            {FIELD_LABELS[field().fieldKey] ??
              (field().renderMode === 'static' ? field().staticText || STATIC_FIELD_LABEL : field().fieldKey)}
          </div>

          <label class={styles.colorRow}>
            Color
            <span class={styles.colorControls}>
              <input
                type="color"
                class={styles.colorSwatch}
                value={field().color ?? DEFAULT_FIELD_COLOR}
                onInput={(e) => update({ color: e.currentTarget.value })}
              />
              <Input
                value={field().color ?? DEFAULT_FIELD_COLOR}
                onChange={(e) => {
                  const v = e.currentTarget.value.trim();
                  if (/^#?[0-9a-f]{6}$/i.test(v)) update({ color: v.startsWith('#') ? v : `#${v}` });
                }}
              />
            </span>
          </label>

          <div class={styles.nudgeRow}>
            <span>Position</span>
            <div class={styles.nudgePad}>
              <Button transparent class={styles.nudgeUp} onClick={(e) => nudge(0, 1, e.shiftKey)} title="Move up (Shift = 10pt)">
                <Icon icon={KeyboardArrowUp} />
              </Button>
              <Button transparent class={styles.nudgeLeft} onClick={(e) => nudge(-1, 0, e.shiftKey)} title="Move left">
                <Icon icon={KeyboardArrowLeft} />
              </Button>
              <Button transparent class={styles.nudgeRight} onClick={(e) => nudge(1, 0, e.shiftKey)} title="Move right">
                <Icon icon={KeyboardArrowRight} />
              </Button>
              <Button transparent class={styles.nudgeDown} onClick={(e) => nudge(0, -1, e.shiftKey)} title="Move down">
                <Icon icon={KeyboardArrowDown} />
              </Button>
            </div>
          </div>

          <div class={styles.configGrid}>
            <label>
              X (pt)
              <Input
                type="number"
                value={field().x}
                onChange={(e) => update({ x: clamp(toNum(e.currentTarget.value, field().x), 0, PDF_PAGE_W) })}
              />
            </label>
            <label>
              Y (pt)
              <Input
                type="number"
                value={field().y}
                onChange={(e) => update({ y: clamp(toNum(e.currentTarget.value, field().y), 0, PDF_PAGE_H) })}
              />
            </label>
            <label>
              Font size
              <Input
                type="number"
                value={field().fontSize}
                onChange={(e) => update({ fontSize: clamp(toNum(e.currentTarget.value, field().fontSize), 4, 48) })}
              />
            </label>
            <label>
              Page
              <Select
                value={String(field().pageIndex)}
                onChange={(v: string) => update({ pageIndex: clamp(parseInt(v, 10) || 0, 0, PAGE_COUNT - 1) })}
              >
                <Option value="0">Page 1</Option>
                <Option value="1">Page 2</Option>
              </Select>
            </label>
            <label>
              Font
              <Select value={field().font} onChange={(v: string) => update({ font: v as SheetFontName })}>
                <Option value="Helvetica">Helvetica</Option>
                <Option value="TimesRoman">Times Roman</Option>
                <Option value="Courier">Courier</Option>
              </Select>
            </label>
            <label>
              Align
              <Select value={field().align} onChange={(v: string) => update({ align: v as TextAlign })}>
                <Option value="left">Left</Option>
                <Option value="center">Center</Option>
                <Option value="right">Right</Option>
              </Select>
            </label>
            <label>
              Max width (pt)
              <Input
                type="number"
                value={field().maxWidth ?? ''}
                onChange={(e) => {
                  const raw = e.currentTarget.value;
                  update({ maxWidth: raw === '' ? undefined : clamp(toNum(raw, 0), 1, PDF_PAGE_W) });
                }}
              />
            </label>
          </div>

          {/* Static-text content. */}
          <Show when={field().renderMode === 'static'}>
            <label class={styles.colorRow}>
              Text
              <Input
                value={field().staticText ?? ''}
                onChange={(e) => update({ staticText: e.currentTarget.value })}
              />
            </label>
          </Show>

          {/* Feature-list layout (columns / truncation). */}
          <Show when={field().renderMode === 'featureList'}>
            <div class={styles.configGrid}>
              <label>
                Columns
                <Select
                  value={String(field().columns ?? 2)}
                  onChange={(v: string) => update({ columns: clamp(parseInt(v, 10) || 1, 1, 3) })}
                >
                  <Option value="1">1</Option>
                  <Option value="2">2</Option>
                  <Option value="3">3</Option>
                </Select>
              </label>
              <label>
                Column gap (pt)
                <Input
                  type="number"
                  value={field().columnGap ?? 12}
                  onChange={(e) => update({ columnGap: clamp(toNum(e.currentTarget.value, 12), 0, 100) })}
                />
              </label>
              <label>
                Box height (pt)
                <Input
                  type="number"
                  value={field().boxHeight ?? 120}
                  onChange={(e) => update({ boxHeight: clamp(toNum(e.currentTarget.value, 120), 10, PDF_PAGE_H) })}
                />
              </label>
              <label>
                Description max chars
                <Input
                  type="number"
                  value={field().descMaxChars ?? 80}
                  onChange={(e) => update({ descMaxChars: clamp(toNum(e.currentTarget.value, 80), 0, 400) })}
                />
              </label>
            </div>
            <label class={styles.colorRow}>
              Show descriptions
              <Checkbox
                checked={field().showDescriptions !== false}
                onChange={(checked: boolean) => update({ showDescriptions: checked })}
              />
            </label>
          </Show>

          <Button borderTheme="error" transparent onClick={() => props.onRemove(field().fieldKey)}>
            <Icon icon={Delete} /> Remove field
          </Button>
        </div>
      )}
    </Show>
  );
};
