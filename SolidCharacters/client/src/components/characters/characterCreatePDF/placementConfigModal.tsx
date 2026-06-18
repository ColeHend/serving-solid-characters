import { Accessor, Component, Setter, Show } from 'solid-js';
import { Input, Modal, Option, Select } from 'coles-solid-library';
import {
  PAGE_COUNT,
  PDF_PAGE_H,
  PDF_PAGE_W,
  PlacedField,
  SheetFontName,
  TextAlign,
  clamp,
  mappingStore,
} from '../../../shared/sheetMapping';
import styles from './characterCreatePDF.module.scss';

interface PlacementConfigModalProps {
  show: [Accessor<boolean>, Setter<boolean>];
  field: () => PlacedField | null;
  templateId: string;
}

const toNum = (raw: string, fallback: number): number => {
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Numeric/select editor for the selected placement. The always-editable X/Y/size
 * inputs are the drag-and-drop accessibility fallback (keyboard users never need
 * to drag). Every change goes straight to `mappingStore.upsertField`.
 */
export const PlacementConfigModal: Component<PlacementConfigModalProps> = (props) => {
  const update = (patch: Partial<PlacedField>) => {
    const current = props.field();
    if (!current) return;
    mappingStore.upsertField(props.templateId, { ...current, ...patch });
  };

  return (
    <Modal title="Field placement" show={props.show}>
      <Show when={props.field()} fallback={<div>No field selected.</div>}>
        {(field) => (
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
        )}
      </Show>
    </Modal>
  );
};
