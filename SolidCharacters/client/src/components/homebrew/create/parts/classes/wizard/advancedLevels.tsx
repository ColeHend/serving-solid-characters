import { Component, For, Show, createSignal } from 'solid-js';
import { reconcile, type SetStoreFunction } from 'solid-js/store';
import { Input, Icon } from 'coles-solid-library';
import { Delete, Add } from 'coles-solid-library/icons';
import { FlatCard } from '../../../../../../shared/components/flatCard/flatCard';
import type { WizardLevels } from './wizard.shared';
import sharedStyles from './classesWizard.module.scss';
import styles from './stepFeatures.module.scss';

interface AdvancedLevelsProps {
  levels: WizardLevels;
  setLevels: SetStoreFunction<WizardLevels>;
  selectedLevel: () => number;
}

/**
 * Collapsed-by-default editor for the extra level-table columns (custom class-specific
 * columns and cantrips-known), scoped to the currently selected level. Both render as
 * additional columns in the published class's level table.
 *
 * Deletion rebuilds the record and applies it with `reconcile` — a plain
 * `setLevels('classSpecific', next)` would MERGE (Solid store semantics) and never drop
 * the removed key, so reconcile is required to actually delete a column / cantrip entry.
 */
export const AdvancedLevels: Component<AdvancedLevelsProps> = (props) => {
  const [newCol, setNewCol] = createSignal('');

  const columnKeys = () => Object.keys(props.levels.classSpecific);

  const addColumn = () => {
    const key = newCol().trim();
    if (!key || key in props.levels.classSpecific) return;
    props.setLevels('classSpecific', key, {});
    setNewCol('');
  };

  const removeColumn = (key: string) => {
    const next = Object.fromEntries(
      Object.entries(props.levels.classSpecific).filter(([k]) => k !== key),
    );
    props.setLevels('classSpecific', reconcile(next));
  };

  const cantrips = () => props.levels.cantripsKnown[props.selectedLevel()];

  const setCantrips = (raw: string) => {
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) {
      const next = { ...props.levels.cantripsKnown };
      delete next[props.selectedLevel()];
      props.setLevels('cantripsKnown', reconcile(next));
    } else {
      props.setLevels('cantripsKnown', props.selectedLevel(), n);
    }
  };

  return (
    <FlatCard headerName="Advanced: level table columns & cantrips" startOpen={false} transparent>
      <div class={styles.advanced}>
        <div class={styles.advBlock}>
          <span class={sharedStyles.cardLabel}>Custom columns — level {props.selectedLevel()}</span>
          <Show
            when={columnKeys().length}
            fallback={
              <span class={styles.advHint}>
                No custom columns yet. Add one below (e.g. "Rage", "Sneak Attack").
              </span>
            }
          >
            <For each={columnKeys()}>
              {(key) => (
                <div class={styles.advRow}>
                  <span class={styles.advColName}>{key}</span>
                  <div class={styles.advInput}>
                    <Input
                      value={props.levels.classSpecific[key]?.[props.selectedLevel()] ?? ''}
                      onChange={(e) =>
                        props.setLevels('classSpecific', key, props.selectedLevel(), e.currentTarget.value)
                      }
                    />
                  </div>
                  <button
                    type="button"
                    class={styles.deleteBtn}
                    aria-label={`Delete column ${key}`}
                    onClick={() => removeColumn(key)}
                  >
                    <Icon icon={Delete} size={'small'} />
                  </button>
                </div>
              )}
            </For>
          </Show>
          <div class={styles.advAddRow}>
            <div class={styles.advInput}>
              <Input
                value={newCol()}
                placeholder="New column name"
                onChange={(e) => setNewCol(e.currentTarget.value)}
              />
            </div>
            <button type="button" class={styles.ghostBtn} onClick={addColumn}>
              <Icon icon={Add} size={'small'} /> Add column
            </button>
          </div>
        </div>

        <div class={styles.advBlock}>
          <span class={sharedStyles.cardLabel}>Cantrips known — level {props.selectedLevel()}</span>
          <div class={`${styles.advInput} ${styles.advInputNarrow}`}>
            <Input
              type="number"
              min={0}
              value={cantrips() ?? ''}
              onChange={(e) => setCantrips(e.currentTarget.value)}
            />
          </div>
          <span class={styles.advHint}>
            Cantrips and custom columns render as extra columns in the class's level table.
          </span>
        </div>
      </div>
    </FlatCard>
  );
};
