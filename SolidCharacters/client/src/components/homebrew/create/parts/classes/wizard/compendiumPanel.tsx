import { Component, For, Show, createMemo, createSignal } from 'solid-js';
import { Input, Icon } from 'coles-solid-library';
import { Search } from 'coles-solid-library/icons';
import { useDnDItems } from '../../../../../../shared/customHooks/dndInfo/info/all/items';
import { ItemType } from '../../../../../../models/generated';
import type { srdItem } from '../../../../../../models/data/generated';
import { ToggleChip } from './toggleChip';
import wiz from './classesWizard.module.scss';
import styles from './stepEquipment.module.scss';

type CompFilter = 'armor' | 'weapons' | 'tools';

interface CompendiumPanelProps {
  /** Adds the named item to the fixed kit (parent dedupes against itemStart). */
  onAdd: (name: string) => void;
}

// Right-hand compendium picker: name search + single-select category filter over the
// SRD/homebrew item list. Each row surfaces a compact stat line and a "+" that pushes the
// item name up to the fixed kit. Visible list is capped at 50 matches for perf.
export const CompendiumPanel: Component<CompendiumPanelProps> = (props) => {
  const items = useDnDItems();
  const [search, setSearch] = createSignal('');
  const [filter, setFilter] = createSignal<CompFilter | null>(null);

  const matchesFilter = (item: srdItem): boolean => {
    const active = filter();
    if (!active) return true;
    const p = item.properties ?? {};
    if (active === 'armor') return 'AC' in p;
    if (active === 'weapons') return 'Damage' in p;
    return item.type === ItemType.Tool;
  };

  const filtered = createMemo<srdItem[]>(() => {
    const q = search().trim().toLowerCase();
    return items()
      .filter((it) => matchesFilter(it) && (!q || (it.name ?? '').toLowerCase().includes(q)))
      .slice(0, 50);
  });

  const statLine = (item: srdItem): string => {
    const parts: string[] = [];
    if (item.cost) parts.push(item.cost);
    if (item.weight) parts.push(`${item.weight} lb`);
    const p = item.properties ?? {};
    if (p.AC) parts.push(`AC ${p.AC}`);
    else if (p.Damage) parts.push(p.Damage);
    return parts.join(' · ');
  };

  const tagFor = (item: srdItem): string => ItemType[item.type] ?? 'Item';

  const toggleFilter = (f: CompFilter) => setFilter((prev) => (prev === f ? null : f));

  return (
    <div class={wiz.card}>
      <div class={styles.searchField}>
        <Icon icon={Search} size="small" />
        <Input
          value={search()}
          placeholder="Search the compendium"
          onInput={(e) => setSearch(e.currentTarget.value)}
        />
      </div>

      <div class={wiz.chipRow}>
        <ToggleChip label="Armor" selected={filter() === 'armor'} onToggle={() => toggleFilter('armor')} />
        <ToggleChip label="Weapons" selected={filter() === 'weapons'} onToggle={() => toggleFilter('weapons')} />
        <ToggleChip label="Tools" selected={filter() === 'tools'} onToggle={() => toggleFilter('tools')} />
      </div>

      <div class={styles.itemList}>
        <Show when={filtered().length} fallback={<div class={styles.emptyList}>No matching items.</div>}>
          <For each={filtered()}>{(item) => (
            <div class={styles.itemRow}>
              <div class={styles.itemInfo}>
                <span class={styles.itemName}>{item.name}</span>
                <Show when={statLine(item)}>
                  <span class={styles.itemStats}>{statLine(item)}</span>
                </Show>
              </div>
              <span class={styles.itemTag}>{tagFor(item)}</span>
              <button
                type="button"
                class={styles.itemAdd}
                aria-label={`Add ${item.name} to fixed kit`}
                onClick={() => props.onAdd(item.name)}
              >
                +
              </button>
            </div>
          )}</For>
        </Show>
      </div>
    </div>
  );
};
