import { Component, For, Show } from 'solid-js';
import { Button, Chip } from 'coles-solid-library';
import styles from '../backgrounds.module.scss';
import { FlatCard } from '../../../../../../shared/components/flatCard/flatCard';

interface Profs { armor: string[]; weapons: string[]; skills: string[]; tools: string[] }
interface Props {
  collapsed: boolean | undefined;
  toggle: (k: string) => void;
  profs: Profs;
  onEdit: () => void;
}

const ProficienciesSection: Component<Props> = (p) => {

  return <FlatCard
    icon='shield'
    headerName='Proficiencies'
    transparent
  >
    <div class={!p.collapsed ? styles.accentChipGroup : styles.collapsedContent}>
      <div class={styles.chipsRow}><strong>Armor:</strong><For each={p.profs.armor}>{a => <Chip value={a} />}</For><Show when={!p.profs.armor.length}><Chip value="None" /></Show></div>
      <div class={styles.chipsRow}><strong>Weapons:</strong><For each={p.profs.weapons}>{w => <Chip value={w} />}</For><Show when={!p.profs.weapons.length}><Chip value="None" /></Show></div>
      <div class={styles.chipsRow}><strong>Skills:</strong><For each={p.profs.skills}>{s => <Chip value={s} />}</For><Show when={!p.profs.skills.length}><Chip value="None" /></Show></div>
      <div class={styles.chipsRow}><strong>Tools:</strong><For each={p.profs.tools}>{t => <Chip value={t} />}</For><Show when={!p.profs.tools.length}><Chip value="None" /></Show></div>
    </div>
  </FlatCard>
}
export default ProficienciesSection;

/*
 <div class={styles.flatSection} data-collapsed={p.collapsed} data-section="profs">
    <div class={styles.sectionHeader}>
      <h4>🛡️ Proficiencies</h4>
      <div class={styles.inlineMeta}>
        <button class={styles.collapseBtn} onClick={() => p.toggle('profs')}>{p.collapsed ? 'Expand' : 'Collapse'}</button>
        <Button onClick={p.onEdit}>Edit</Button>
      </div>
    </div>

  </div>
*/