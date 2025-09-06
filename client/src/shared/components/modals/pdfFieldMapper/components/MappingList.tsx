import { For, Component } from 'solid-js';
import { Button } from 'coles-solid-library';
import { UsePdfFieldMapperReturn } from '../usePdfFieldMapper';
import styles from './MappingList.module.scss';

interface Props { state: UsePdfFieldMapperReturn; }

const MappingList: Component<Props> = (p) => {
  const s = p.state;
  return (
    <div data-testid="mapping-list" class={styles.mappingRoot}>
      <h3 class={styles.mappingTitle}>Mapped Fields</h3>
      <For each={s.mappings().filter(m => (m.page ?? 0) === s.pageIndex())}>{(m,i)=>
        <div
          onClick={()=> {
            // Toggle selection: clicking an already selected mapping now deselects it
            const cur = s.selectedId();
            if (cur === i()) s.setSelectedId(null); else s.setSelectedId(i());
          }}
          classList={{ [styles.mappingItem]: true, [styles.selected]: s.selectedId()===i() }}>
          <div class={styles.itemHeader}>
            <strong>{m.key}</strong>
            <Button onClick={()=>s.removeMapping(i())}>x</Button>
          </div>
          <div>llc: ({m.llc.x.toFixed(1)},{m.llc.y.toFixed(1)})</div>
          <div>urc: ({m.urc.x.toFixed(1)},{m.urc.y.toFixed(1)})</div>
          <div>page: {(m.page ?? 0)+1}</div>
          <div>font: {m.format?.fontSize}</div>
        </div>
      }</For>
    </div>
  );
};

export default MappingList;
