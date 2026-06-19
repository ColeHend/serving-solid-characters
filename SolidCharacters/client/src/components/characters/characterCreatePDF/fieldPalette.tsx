import { Component, For, Show, createMemo } from 'solid-js';
import { Backpack, Badge, FitnessCenter, Paid, Psychology, Shield, Star, Swords, WandStars } from 'coles-solid-library/icons';
import { FlatCard } from '../../../shared/components/flatCard/flatCard';
import { SHEET_FIELD_DEFS, SheetFieldDef, SheetFieldGroup } from '../../../shared/sheetMapping';
import { FieldCard, StaticFieldCard } from './fieldCard';
import styles from './characterCreatePDF.module.scss';

/** Pre-imported (tree-shakeable) Material Symbol per category, shown in each group's collapsible header. */
const GROUP_ICONS: Record<SheetFieldGroup, string> = {
  Identity: Badge,
  Abilities: FitnessCenter,
  Skills: Psychology,
  Saves: Shield,
  Combat: Swords,
  Spellcasting: WandStars,
  Features: Star,
  Equipment: Backpack,
  Currency: Paid,
};

interface FieldPaletteProps {
  /** Keys already placed on the sheet (rendered dimmed in the palette). */
  placedKeys: () => Set<string>;
  /** Resolved sheet values for the current character, for the cards' sample pills. */
  values: () => Record<string, string>;
  onGrab: (x: number, y: number) => void;
  onAdd: (fieldKey: string) => void;
  /** Add a fresh static-text field (tap on the palette's "Static Text" card). */
  onAddStatic: () => void;
}

/**
 * Drag-source list of every bindable field, grouped into collapsible `FlatCard`
 * sections (the repo's own collapsible — the coles `ExpansionPanel` was buggy).
 * Each field is a wide `FieldCard` (drag handle + label + description + sample),
 * stacked one per row.
 */
export const FieldPalette: Component<FieldPaletteProps> = (props) => {
  const groups = createMemo<[SheetFieldGroup, SheetFieldDef[]][]>(() => {
    const map = new Map<SheetFieldGroup, SheetFieldDef[]>();
    for (const def of SHEET_FIELD_DEFS) {
      const list = map.get(def.group) ?? [];
      list.push(def);
      map.set(def.group, list);
    }
    return [...map.entries()];
  });

  return (
    <div class={styles.palette}>
      <For each={groups()}>
        {([group, defs], i) => (
          <FlatCard headerName={group} icon={GROUP_ICONS[group]} startOpen={i() === 0} transparent>
            <div class={styles.paletteGroupBody}>
              {/* Static text lives in the Features group — it labels the relocated defenses. */}
              <Show when={group === 'Features'}>
                <StaticFieldCard onGrab={props.onGrab} onAdd={props.onAddStatic} />
              </Show>
              <For each={defs}>
                {(def) => (
                  <FieldCard
                    def={def}
                    placed={props.placedKeys().has(def.key)}
                    value={() => props.values()[def.key] ?? ''}
                    onGrab={props.onGrab}
                    onAdd={props.onAdd}
                  />
                )}
              </For>
            </div>
          </FlatCard>
        )}
      </For>
    </div>
  );
};
