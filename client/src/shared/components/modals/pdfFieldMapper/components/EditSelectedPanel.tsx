import { Component, Show } from 'solid-js';
import { Input } from 'coles-solid-library';
import { UsePdfFieldMapperReturn } from '../usePdfFieldMapper';
import styles from './EditSelectedPanel.module.scss';

interface Props { state: UsePdfFieldMapperReturn; }

const EditSelectedPanel: Component<Props> = (p) => {
  const s = p.state;
  return (
    <Show when={s.selectedMapping()}>
      <div class={styles.editPanel}>
        <h4 class={styles.editTitle}>Edit Selected</h4>
        <div class={styles.editFields}>
          <label>Value<Input value={s.selectedMapping()!.value} onInput={e=>s.updateSelectedBox({ value: e.currentTarget.value })} /></label>
          <label>X<Input type='number' value={s.selectedMapping()!.llc.x} onInput={e=>s.updateSelectedBox({ llc:{ x: parseFloat(e.currentTarget.value)||0, y: s.selectedMapping()!.llc.y } })} /></label>
          <label>Y<Input type='number' value={s.selectedMapping()!.llc.y} onInput={e=>s.updateSelectedBox({ llc:{ x: s.selectedMapping()!.llc.x, y: parseFloat(e.currentTarget.value)||0 } })} /></label>
          <label>Width<Input type='number' value={(s.selectedMapping()!.urc.x - s.selectedMapping()!.llc.x)} onInput={e=>s.updateSelectedBox({ width: parseFloat(e.currentTarget.value)||1 })} /></label>
          <label>Height<Input type='number' value={(s.selectedMapping()!.urc.y - s.selectedMapping()!.llc.y)} onInput={e=>s.updateSelectedBox({ height: parseFloat(e.currentTarget.value)||1 })} /></label>
          <label>Page<Input type='number' min='1' max={s.pageCount()} value={(s.selectedMapping()!.page ?? 0)+1} onInput={e=>s.updateSelectedBox({ page: Math.min(s.pageCount()-1, Math.max(0, (parseInt(e.currentTarget.value)||1)-1)) })} /></label>
          <label>Font Size<Input type='number' value={s.selectedMapping()!.format?.fontSize || 12} onInput={e=>s.updateSelectedBox({ fontSize: parseInt(e.currentTarget.value)||12 })} /></label>
          <label>Color<Input type='color' value={s.fontColor()} onInput={e=>{ s.setFontColor(e.currentTarget.value); s.updateSelectedBox({ color: e.currentTarget.value }); }} /></label>
        </div>
      </div>
    </Show>
  );
};

export default EditSelectedPanel;
